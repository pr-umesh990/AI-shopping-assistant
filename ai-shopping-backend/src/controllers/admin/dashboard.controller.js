import AffiliateClick from '../../models/AffiliateClick.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import config from '../../config/env.js';

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get dashboard KPIs with month-over-month change percentages
 */
export const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // ── Affiliate Clicks ──
  const currentMonthClicks = await AffiliateClick.countDocuments({
    clickedAt: { $gte: currentMonthStart },
  });
  const previousMonthClicks = await AffiliateClick.countDocuments({
    clickedAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
  });
  const clicksChange = previousMonthClicks > 0
    ? Math.round(((currentMonthClicks - previousMonthClicks) / previousMonthClicks) * 100)
    : currentMonthClicks > 0 ? 100 : 0;

  // ── Revenue Estimation ──
  // Revenue = clicks × commission rate × average product price
  const avgPriceResult = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, avgPrice: { $avg: '$currentPrice' } } },
  ]);
  const avgPrice = avgPriceResult[0]?.avgPrice || 0;
  const totalRevenue = Math.round(currentMonthClicks * config.COMMISSION_RATE_DEFAULT * avgPrice * 100) / 100;

  const previousRevenue = Math.round(previousMonthClicks * config.COMMISSION_RATE_DEFAULT * avgPrice * 100) / 100;
  const revenueChange = previousRevenue > 0
    ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
    : totalRevenue > 0 ? 100 : 0;

  // ── Active Users ──
  const activeUsers = await User.countDocuments();
  const usersLastMonth = await User.countDocuments({
    createdAt: { $lte: previousMonthEnd },
  });
  const newUsersThisMonth = activeUsers - usersLastMonth;
  const usersChange = usersLastMonth > 0
    ? Math.round((newUsersThisMonth / usersLastMonth) * 100)
    : activeUsers > 0 ? 100 : 0;

  // ── Catalog Size ──
  const catalogSize = await Product.countDocuments();
  const catalogLastMonth = await Product.countDocuments({
    createdAt: { $lte: previousMonthEnd },
  });
  const newProducts = catalogSize - catalogLastMonth;
  const catalogChange = catalogLastMonth > 0
    ? Math.round((newProducts / catalogLastMonth) * 100)
    : catalogSize > 0 ? 100 : 0;

  return successResponse(res, 200, 'Dashboard stats retrieved.', {
    totalRevenue,
    revenueChange,
    totalClicks: currentMonthClicks,
    clicksChange,
    activeUsers,
    usersChange,
    totalProducts: catalogSize,
    productsChange: catalogChange,
    affiliateMilestone: {
      current: totalRevenue,
      target: config.MONTHLY_AFFILIATE_GOAL,
    },
  });
});
