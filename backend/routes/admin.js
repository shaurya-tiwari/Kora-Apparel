const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res, next) => {
  try {
    const [totalOrders, totalUsers, totalProducts, revenueData, pendingOrders] = await Promise.all([
      Order.countDocuments({ isPaid: true }),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ status: 'pending' }),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    
    // Derived values
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
    // Assuming 'visits' don't exist yet, mock conversion rate against total users broadly or static mock
    const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : 0;

    res.json({ totalRevenue, totalOrders, totalUsers, totalProducts, pendingOrders, averageOrderValue, conversionRate });
  } catch (err) { next(err); }
});

// @GET /api/admin/analytics
router.get('/analytics', protect, adminOnly, async (req, res, next) => {
  try {
    // Sales by last 7 months
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: sevenMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top products by revenue
    const topProducts = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 8 },
    ]);

    // Orders vs Revenue Bar Chart Data (Orders by day/month)
    // Category distribution for Pie Chart
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily sales last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesByDay = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ monthlySales, topProducts, categoryDistribution, salesByDay });
  } catch (err) { next(err); }
});

// @GET /api/admin/customers — Customer intelligence
router.get('/customers', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const customers = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$user',
          totalSpend: { $sum: '$total' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { totalSpend: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 1,
          totalSpend: 1,
          orderCount: 1,
          lastOrderDate: 1,
          firstOrderDate: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
        },
      },
    ]);

    const total = await Order.distinct('user', { isPaid: true, user: { $ne: null } });
    res.json({ customers, total: total.length, page: Number(page), pages: Math.ceil(total.length / Number(limit)) });
  } catch (err) { next(err); }
});

// @GET /api/admin/page-builder
router.get('/page-builder', protect, adminOnly, async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    res.json({ pageSections: settings.pageSections });
  } catch (err) { next(err); }
});

// @PUT /api/admin/page-builder
router.put('/page-builder', protect, adminOnly, async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    settings.pageSections = req.body.pageSections;
    await settings.save();
    res.json({ pageSections: settings.pageSections });
  } catch (err) { next(err); }
});

module.exports = router;
