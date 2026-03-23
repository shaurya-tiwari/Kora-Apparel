const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// @POST /api/orders/create-razorpay-order
router.post('/create-razorpay-order', protect, async (req, res, next) => {
  try {
    const { amount, items } = req.body; // amount in paise, items array to check stock

    // 1. Precise Stock Validation before accepting money
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) return res.status(400).json({ message: `Product ${item.name} no longer exists.` });
        
        // Variant check vs Global check
        let availableStock = product.stock;
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find(v => v.size === item.size && v.color === item.color);
          availableStock = variant ? variant.stock : product.stock;
        }

        if (availableStock < item.qty) {
          return res.status(400).json({ message: `Insufficient stock for ${item.name} (${item.size || ''} ${item.color || ''}). Only ${availableStock} left.` });
        }
      }
    }

    const settings = await Setting.findOne();
    const rzpKeyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const rzpKeySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!rzpKeyId || !rzpKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    const razorpay = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `kora_${Date.now()}`,
    };
    const razorpayOrder = await razorpay.orders.create(options);
    res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency });
  } catch (err) { next(err); }
});

// @POST /api/orders/verify-payment
router.post('/verify-payment', protect, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderData } = req.body;
    
    const settings = await Setting.findOne();
    const rzpKeySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!rzpKeySecret) {
      return res.status(500).json({ message: 'Payment gateway holds no secret.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', rzpKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature)
      return res.status(400).json({ message: 'Payment verification failed' });

    const order = await Order.create({
      ...orderData,
      user: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isPaid: true,
      paidAt: new Date(),
      status: 'processing',
    });

    // Deduct exact stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        let variantUpdated = false;
        let newStockLevel = 0;
        if (product.variants && product.variants.length > 0) {
          const variantIdx = product.variants.findIndex(v => v.size === item.size && v.color === item.color);
          if (variantIdx !== -1) {
            product.variants[variantIdx].stock = Math.max(0, product.variants[variantIdx].stock - item.qty);
            newStockLevel = product.variants[variantIdx].stock;
            variantUpdated = true;
          }
        }
        
        // Deduct from global stock regardless, as a master tally
        product.stock = Math.max(0, product.stock - item.qty);
        if (!variantUpdated) newStockLevel = product.stock;
        
        await product.save();

        // Low stock notification
        if (newStockLevel <= 5) {
          await Notification.create({
            title: 'Low Stock Alert',
            message: `${product.name} ${item.size ? `(${item.size} ${item.color})` : ''} has dropped to ${newStockLevel} units!`,
            type: 'stock',
            link: '/admin/inventory'
          });
        }
      }
    }

    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    if (order.user) {
      await User.findByIdAndUpdate(order.user, { $inc: { totalSpend: order.total } });
    }

    // New Order Notification
    await Notification.create({
      title: 'New Order Placed',
      message: `Order #${order._id.toString().slice(-6)} received for ₹${order.total}.`,
      type: 'order',
      link: '/admin/orders'
    });

    try {
      const buyerInfo = await User.findById(req.user._id);
      if (buyerInfo && buyerInfo.email) {
        await sendEmail({
          email: buyerInfo.email,
          subject: 'Kora Apparel - Order Confirmation',
          message: `Thank you for your order!\n\nOrder ID: ${order._id}\nTotal: ₹${order.total}\nStatus: Processing\n\nYou can track your order status in your account dashboard.`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 40px; border-radius: 8px;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">KORA APPAREL</h1>
              <p style="font-size: 16px; color: #333;">Thank you for your purchase!</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
                <p><strong>Total Amount:</strong> ₹${order.total}</p>
                <p><strong>Status:</strong> Processing</p>
              </div>
              <p style="font-size: 14px; color: #666;">We will notify you once your order has shipped. You can track your order status in your Kora Apparel account dashboard.</p>
            </div>
          `
        });
      }
    } catch(emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    res.status(201).json({ message: 'Payment verified', order });
  } catch (err) { next(err); }
});

// @GET /api/orders/my
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
    res.json(orders);
  } catch (err) { next(err); }
});

// @PUT /api/orders/:id/cancel (user)
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    await order.save();

    // Mathematically restore exact stock levels across variations
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        let variantUpdated = false;
        if (product.variants && product.variants.length > 0) {
          const variantIdx = product.variants.findIndex(v => v.size === item.size && v.color === item.color);
          if (variantIdx !== -1) {
            product.variants[variantIdx].stock += item.qty;
            variantUpdated = true;
          }
        }
        
        // Restore global stock sum
        product.stock += item.qty;
        await product.save();
      }
    }

    // Optionally notify admin
    await Notification.create({
      title: 'Order Cancelled',
      message: `User cancelled Order #${order._id.toString().slice(-6)}. Stock restored.`,
      type: 'order',
      link: '/admin/orders'
    });

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) { next(err); }
});

// @GET /api/orders (admin)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit))
        .populate('user', 'name email'),
      Order.countDocuments(query),
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// @PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
});

// @GET /api/orders/export (admin) — CSV export
router.get('/export', protect, adminOnly, async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');

    const rows = [
      ['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Status', 'Payment', 'Total (₹)', 'Items', 'Shipping City', 'Coupon'],
      ...orders.map(o => [
        o._id.toString(),
        o.user?.name || o.shippingAddress?.name || 'Guest',
        o.user?.email || '',
        new Date(o.createdAt).toLocaleDateString('en-IN'),
        o.status,
        o.isPaid ? 'Paid' : 'Unpaid',
        o.total,
        o.items?.map(i => `${i.name} x${i.qty}`).join(' | '),
        o.shippingAddress?.city || '',
        o.couponCode || '',
      ])
    ];

    const csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="kora-orders-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

module.exports = router;

