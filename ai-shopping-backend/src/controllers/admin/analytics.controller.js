import mongoose from 'mongoose';
import AffiliateClick from '../../models/AffiliateClick.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import SearchQuery from '../../models/SearchQuery.js'
import Wishlist from '../../models/Wishlist.js'
import Category from '../../models/Category.js'
import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import config from '../../config/env.js';

// Lazy-load json2csv and pdfkit to avoid startup cost
let Parser;
let PDFDocument;

//Helper: get start of day N days ago 
const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * @route   GET /api/v1/admin/analytics/revenue-by-category
 * @desc    Real affiliate clicks grouped by product category
 */
export const getRevenueByCategory = asyncHandler(async (req, res) => {
  const result = await AffiliateClick.aggregate([
    // Join with products
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmpty: false } },
    // Join with categories
    {
      $lookup: {
        from: 'categories',
        localField: 'product.categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmpty: false } },
    // Group by category
    {
      $group: {
        _id: '$category._id',
        category: { $first: '$category.name' },
        clicks: { $sum: 1 },
        revenue: {
          $sum: {
            $multiply: [
              '$product.currentPrice',
              parseFloat(config.COMMISSION_RATE_DEFAULT || 0.03),
            ],
          },
        },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        category: 1,
        clicks: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ])

  // If no affiliate click data yet, return category names with 0s
  if (result.length === 0) {
    const categories = await Category.find({})
      .select('name')
      .limit(6)
      .lean()
    return successResponse(res, 200, 'Revenue by category retrieved.', {
      data: categories.map(c => ({ category: c.name, clicks: 0, revenue: 0 })),
    })
  }

  return successResponse(res, 200, 'Revenue by category retrieved.', { data: result })
})

/**
 * @route   GET /api/v1/admin/analytics/traffic-channels
 * @desc    Real search query sources + direct traffic breakdown
 */
export const getTrafficChannels = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = daysAgo(30)

  const [totalSearches, totalUsers, totalClicks] = await Promise.all([
    SearchQuery.countDocuments({ searchedAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    AffiliateClick.countDocuments({ clickedAt: { $gte: thirtyDaysAgo } }),
  ])

  const total = totalSearches + totalUsers + totalClicks

  let channels
  if (total === 0) {
    // Fallback placeholder when no data
    channels = [
      { channel: 'AI Search', percentage: 45, count: 0, color: '#6366f1' },
      { channel: 'Direct', percentage: 25, count: 0, color: '#8b5cf6' },
      { channel: 'Affiliate', percentage: 20, count: 0, color: '#f59e0b' },
      { channel: 'New Users', percentage: 10, count: 0, color: '#10b981' },
    ]
  } else {
    const pct = (n) => Math.round((n / total) * 100)
    channels = [
      { channel: 'AI Search', percentage: pct(totalSearches), count: totalSearches, color: '#6366f1' },
      { channel: 'Affiliate Clicks', percentage: pct(totalClicks), count: totalClicks, color: '#f59e0b' },
      { channel: 'New Registrations', percentage: pct(totalUsers), count: totalUsers, color: '#10b981' },
    ]
    // Normalize to 100%
    const sum = channels.reduce((a, c) => a + c.percentage, 0)
    if (sum !== 100 && channels.length > 0) {
      channels[0].percentage += (100 - sum)
    }
  }

  return successResponse(res, 200, 'Traffic channels retrieved.', { data: channels });
})

/**
 * @route   GET /api/v1/admin/analytics/affiliate-milestone
 * @desc    Current month affiliate clicks vs monthly goal
 */
export const getAffiliateMilestone = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const currentClicks = await AffiliateClick.countDocuments({
    clickedAt: { $gte: startOfMonth },
  })

  const goalClicks = parseInt(config.MONTHLY_AFFILIATE_GOAL || 50000, 10)
  const percentage = Math.min(Math.round((currentClicks / goalClicks) * 100), 100)

  return successResponse(res, 200, 'Affiliate milestone retrieved.', {
    currentClicks,
    goalClicks,
    percentage,
    message: percentage >= 100 ? 'Monthly goal achieved!'
      : `${goalClicks - currentClicks} more clicks to reach your monthly goal.`,
  })
})

/**
 * @route   GET /api/v1/admin/analytics/search-trends
 * @desc    Top 10 most searched queries in last 30 days
 */
export const getSearchTrends = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = daysAgo(30)

  const trends = await SearchQuery.aggregate([
    { $match: { searchedAt: { $gte: thirtyDaysAgo }, rawQuery: { $exists: true, $ne: '' } } },
    {
      $group: {
        _id: { $toLower: '$rawQuery' },
        count: { $sum: 1 },
        avgResults: { $avg: '$resultsCount' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        query: '$_id',
        count: 1,
        avgResults: { $round: ['$avgResults', 0] },
      },
    },
  ])

  return successResponse(res, 200, 'Search trends retrieved.', { data: trends })
})

/**
 * @route   GET /api/v1/admin/analytics/user-registrations
 * @desc    User registrations per day for last 30 days
 */
export const getUserRegistrations = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = daysAgo(30)

  const result = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ])

  // Fill missing days with 0
  const filledData = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const found = result.find(r => r.date === dateStr)
    filledData.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: found ? found.count : 0,
    })
  }

  return successResponse(res, 200, 'User registrations retrieved.', { data: filledData })
})

/**
 * @route   GET /api/v1/admin/analytics/most-wishlisted
 * @desc    Top 5 most wishlisted products
 */
export const getMostWishlisted = asyncHandler(async (req, res) => {
  const result = await Wishlist.aggregate([
    {
      $group: {
        _id: '$productId',
        wishlistCount: { $sum: 1 },
      },
    },
    { $sort: { wishlistCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmpty: false } },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        brand: '$product.brand',
        currentPrice: '$product.currentPrice',
        image: { $arrayElemAt: ['$product.images', 0] },
        wishlistCount: 1,
      },
    },
  ])

  return successResponse(res, 200, 'Most wishlisted products retrieved.', { data: result })
})

/**
 * @route   GET /api/v1/admin/analytics/products-over-time
 * @desc    Products added per day for last 30 days
 */
export const getProductsOverTime = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = daysAgo(30)

  const result = await Product.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ])

  const filledData = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const found = result.find(r => r.date === dateStr)
    filledData.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: found ? found.count : 0,
    })
  }

  return successResponse(res, 200, 'Products over time retrieved.', { data: filledData })
})

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
        const line = `${row.Name} | ${row.Brand} | ${row.SKU} | $${row.Price} | ⭐${row.Rating} | Stock: ${row.Stock} | ${row.Status}`
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
              { $multiply: ['$Clicks', parseFloat(config.COMMISSION_RATE_DEFAULT || 0.03), '$AvgPrice'] },
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
