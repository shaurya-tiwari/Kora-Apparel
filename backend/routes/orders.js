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
const { adjustStock } = require('../utils/stockManager');

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
      console.error('Razorpay Error: Key ID or Secret missing in settings/env');
      return res.status(500).json({ message: 'Payment gateway is not configured on the server side.' });
    }

    const razorpay = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `kora_${Date.now()}`,
    };
    
    try {
      const razorpayOrder = await razorpay.orders.create(options);
      res.json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency });
    } catch (rzpErr) {
      console.error('Razorpay Order Creation Failed:', rzpErr);
      res.status(500).json({ message: 'Failed to initialize payment with Razorpay. Please try again later.' });
    }
  } catch (err) { next(err); }
});

// @POST /api/orders/place-cod-order
router.post('/place-cod-order', protect, async (req, res, next) => {
  try {
    const { items, shippingAddress, itemsTotal, shippingCost, total, couponCode, discountAmount } = req.body;

    const settings = await Setting.findOne();
    if (!settings?.isCodEnabled) {
      return res.status(400).json({ message: 'Cash on Delivery is currently disabled.' });
    }

    // 1. Stock Validation
    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: `Product ${item.name} no longer exists.` });
      
      let availableStock = product.stock;
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.size === item.size && v.color === item.color);
        availableStock = variant ? variant.stock : product.stock;
      }

      if (availableStock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}. Only ${availableStock} left.` });
      }
    }

    // 2. Create Order
    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      itemsTotal,
      shippingCost,
      total,
      couponCode,
      discountAmount,
      paymentMethod: 'cod',
      isPaid: false,
      status: 'pending',
    });

    // 3. Deduct Stock
    await adjustStock(order.items, 'deduct');

    // 4. Update Coupon if used
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    // 5. Update User Stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalSpend: order.total } });

    // 6. Notifications
    await Notification.create({
      title: 'New COD Order',
      message: `New Cash on Delivery order #${order._id.toString().slice(-6)} Received!`,
      type: 'order',
      link: '/admin/orders'
    });

    // 7. Confirmation Email
    try {
      if (req.user.email) {
        await sendEmail({
          email: req.user.email,
          subject: 'Kora Apparel - COD Order Confirmation',
          message: `Your Order #${order._id} has been placed via Cash on Delivery. Content: ₹${order.total}.`,
          html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #C46A3C;">KORA APPAREL</h2>
            <p>Your COD order has been received successfully!</p>
            <p><strong>Order ID:</strong> #${order._id}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            <p>Payment will be collected at delivery.</p>
          </div>`
        });
      }
    } catch (e) {}

    res.status(201).json({ message: 'Order placed successfully (COD)', order });
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
    await adjustStock(order.items, 'deduct');

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
    const { page = 1, limit = 20 } = req.query;
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('items.product', 'name images'),
      Order.countDocuments({ user: req.user._id })
    ]);
    
    console.log(`[DEBUG] /orders/my found ${orders.length} orders for ${req.user.email}`);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
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

    // Restore exact stock levels
    await adjustStock(order.items, 'restore');

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
    console.log(`[DEBUG] Fetching orders for user ${req.user._id}. Found: ${orders.length}`);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// @PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus === newStatus) return res.json(order);
    if (oldStatus === 'cancelled') return res.status(400).json({ message: 'Cancelled orders are terminal and cannot be modified.' });

    // 1. Stock Reconciliation
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
       await adjustStock(order.items, 'restore');
    } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
       // Validate stock first (manual logic remains as it needs validation check)
       for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (!product) return res.status(400).json({ message: `Product ${item.name} no longer exists.` });
          let available = product.stock;
          if (product.variants && product.variants.length > 0) {
             const v = product.variants.find(v => v.size === item.size && v.color === item.color);
             available = v ? v.stock : product.stock;
          }
          if (available < item.qty) return res.status(400).json({ message: `Insufficient stock to restore order for ${item.name}` });
       }
       await adjustStock(order.items, 'deduct');
    }

    order.status = newStatus;
    await order.save();
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

// @GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images slug')
      .populate('user', 'name email');
      
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Authorization check: Only owner or admin can see it
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.json(order);
  } catch (err) { next(err); }
});

module.exports = router;

