import mongoose from 'mongoose';
import AffiliateClick from '../../models/AffiliateClick.js';
import Product from '../../models/Product.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import config from '../../config/env.js';

// Lazy-load json2csv and pdfkit to avoid startup cost
let Parser;
let PDFDocument;

/**
 * @route   GET /api/v1/admin/analytics/revenue-by-category
 * @desc    Aggregate affiliate clicks → products → categories → revenue by category
 */
export const getRevenueByCategory = asyncHandler(async (req, res) => {
  const results = await AffiliateClick.aggregate([
    // Join with products
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    // Join with categories
    {
      $lookup: {
        from: 'categories',
        localField: 'product.categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    // Group by category
    {
      $group: {
        _id: '$category._id',
        category: { $first: '$category.name' },
        clicks: { $sum: 1 },
        avgPrice: { $avg: '$product.currentPrice' },
      },
    },
    // Calculate revenue
    {
      $project: {
        _id: 0,
        category: 1,
        clicks: 1,
        revenue: {
          $round: [
            { $multiply: ['$clicks', config.COMMISSION_RATE_DEFAULT, '$avgPrice'] },
            2,
          ],
        },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return successResponse(res, 200, 'Revenue by category retrieved.', { categories: results });
});

/**
 * @route   GET /api/v1/admin/analytics/traffic-channels
 * @desc    Return mock traffic channel distribution (placeholder for MVP)
 */
export const getTrafficChannels = asyncHandler(async (req, res) => {
  const data = [
    { channel: 'Organic Search', percentage: 42 },
    { channel: 'Direct', percentage: 28 },
    { channel: 'Social Media', percentage: 18 },
    { channel: 'Referral', percentage: 8 },
    { channel: 'Email', percentage: 4 },
  ];

  return successResponse(res, 200, 'Traffic channels retrieved.', { channels: data });
});

/**
 * @route   GET /api/v1/admin/analytics/affiliate-milestone
 * @desc    Calculate current month clicks vs monthly goal
 */
export const getAffiliateMilestone = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all clicks for the current month with product currentPrice
  const clicks = await AffiliateClick.find({
    clickedAt: { $gte: monthStart },
  })
    .populate('productId', 'currentPrice')
    .lean();

  const totalRevenue = clicks.reduce((sum, c) => {
    const price = c.productId?.currentPrice || 0;
    return sum + (price * config.COMMISSION_RATE_DEFAULT);
  }, 0);

  // Construct retailer breakdown
  const breakdownMap = {};
  for (const c of clicks) {
    const price = c.productId?.currentPrice || 0;
    const rev = price * config.COMMISSION_RATE_DEFAULT;
    const retailerName = c.retailer || 'Unknown';
    if (!breakdownMap[retailerName]) {
      breakdownMap[retailerName] = { retailer: retailerName, revenue: 0 };
    }
    breakdownMap[retailerName].revenue += rev;
  }
  const breakdown = Object.values(breakdownMap).map(b => ({
    retailer: b.retailer,
    revenue: Math.round(b.revenue * 100) / 100
  }));

  const target = config.MONTHLY_AFFILIATE_GOAL;
  const percentage = Math.min(100, Math.round((totalRevenue / target) * 100)) || 0;

  return successResponse(res, 200, 'Affiliate milestone retrieved.', {
    current: Math.round(totalRevenue * 100) / 100,
    target,
    percentage,
    breakdown,
  });
});

/**
 * @route   GET /api/v1/admin/reports/export
 * @desc    Export report as CSV or PDF
 * @query   format (csv|pdf), type (products|revenue)
 */
export const exportReport = asyncHandler(async (req, res) => {
  const { format = 'csv', type = 'products' } = req.query;

  if (!['csv', 'pdf'].includes(format)) {
    return errorResponse(res, 400, 'Format must be "csv" or "pdf".');
  }

  if (!['products', 'revenue'].includes(type)) {
    return errorResponse(res, 400, 'Type must be "products" or "revenue".');
  }

  if (type === 'products') {
    const products = await Product.find()
      .populate('categoryId', 'name')
      .select('name brand sku currentPrice originalPrice rating reviewCount stock status')
      .lean();

    const rows = products.map((p) => ({
      Name: p.name,
      Brand: p.brand,
      SKU: p.sku,
      Category: p.categoryId?.name || 'N/A',
      Price: p.currentPrice,
      'Original Price': p.originalPrice || 'N/A',
      Rating: p.rating,
      Reviews: p.reviewCount,
      Stock: p.stock,
      Status: p.status,
    }));

    if (format === 'csv') {
      if (!Parser) {
        const json2csvModule = await import('json2csv');
        Parser = json2csvModule.Parser;
      }
      const parser = new Parser();
      const csv = parser.parse(rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=products-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      if (!PDFDocument) {
        const pdfkitModule = await import('pdfkit');
        PDFDocument = pdfkitModule.default;
      }

      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=products-report-${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text('SmartShop AI — Products Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(2);

      for (const row of rows) {
        const line = `${row.Name} | ${row.Brand} | ${row.SKU} | $${row.Price} | ⭐${row.Rating} | Stock: ${row.Stock} | ${row.Status}`;
        doc.fontSize(9).text(line);
        doc.moveDown(0.3);

        if (doc.y > 750) {
          doc.addPage();
        }
      }

      doc.end();
      return;
    }
  }

  if (type === 'revenue') {
    const revenueData = await AffiliateClick.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          Category: { $first: '$category.name' },
          Clicks: { $sum: 1 },
          AvgPrice: { $avg: '$product.currentPrice' },
        },
      },
      {
        $project: {
          _id: 0,
          Category: 1,
          Clicks: 1,
          Revenue: {
            $round: [
              { $multiply: ['$Clicks', config.COMMISSION_RATE_DEFAULT, '$AvgPrice'] },
              2,
            ],
          },
        },
      },
      { $sort: { Revenue: -1 } },
    ]);

    const rows = revenueData.map((r) => ({
      Category: r.Category,
      Clicks: r.Clicks,
      Revenue: `$${r.Revenue}`,
    }));

    if (format === 'csv') {
      if (!Parser) {
        const json2csvModule = await import('json2csv');
        Parser = json2csvModule.Parser;
      }
      const parser = new Parser();
      const csv = parser.parse(rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      if (!PDFDocument) {
        const pdfkitModule = await import('pdfkit');
        PDFDocument = pdfkitModule.default;
      }

      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text('SmartShop AI — Revenue Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(2);

      for (const row of rows) {
        doc.fontSize(11).text(`${row.Category}: ${row.Clicks} clicks — ${row.Revenue}`);
        doc.moveDown(0.5);
      }

      doc.end();
      return;
    }
  }
});
