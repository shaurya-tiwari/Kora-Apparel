const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @POST /api/auth/send-otp
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Create user if they don't exist
      user = await User.create({ email, otp, otpExpires, name: email.split('@')[0] });
      isNewUser = true;

      await Notification.create({
        title: 'New Customer Registered via OTP',
        message: `${user.email} has just created an account.`,
        type: 'user',
        link: '/admin/users'
      });
    } else {
      if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // Send OTP email
    await sendEmail({
      email: user.email,
      subject: 'Your Kora Apparel Login Code',
      message: `Your login code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 40px; border-radius: 8px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">KORA APPAREL</h1>
          <p style="font-size: 16px; color: #333;">Your login code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #C46A3C; margin: 20px 0;">${otp}</div>
          <p style="font-size: 14px; color: #666;">This code is valid for 10 minutes. Please do not share it with anyone.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to email', isNewUser });
  } catch (err) { next(err); }
});

// @POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, localCart } = req.body;
    
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ message: 'OTP has expired' });

    // Clear OTP logic
    user.otp = undefined;
    user.otpExpires = undefined;

    // Handle Cart Merge Flow
    if (localCart && Array.isArray(localCart)) {
      const dbCart = user.cart || [];
      const mergedCartMap = new Map();

      dbCart.forEach(item => mergedCartMap.set(`${item.product}-${item.size}-${item.color}`, item));

      localCart.forEach(localItem => {
        const id = `${localItem.product._id || localItem.product}-${localItem.size}-${localItem.color}`;
        if (mergedCartMap.has(id)) {
          const existing = mergedCartMap.get(id);
          existing.qty += localItem.qty;
        } else {
          mergedCartMap.set(id, {
            product: localItem.product._id || localItem.product,
            name: localItem.name,
            price: localItem.price,
            image: localItem.image,
            size: localItem.size,
            color: localItem.color,
            qty: localItem.qty
          });
        }
      });

      user.cart = Array.from(mergedCartMap.values());
    }

    await user.save();

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role, cart: user.cart,
      token: generateToken(user._id),
    });
  } catch (err) { next(err); }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { next(err); }
});

// @PUT /api/auth/me
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, addresses } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (addresses) user.addresses = addresses;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, addresses: user.addresses });
  } catch (err) { next(err); }
});

// @PUT /api/auth/cart
router.put('/cart', protect, async (req, res, next) => {
  try {
    const { cart } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Map frontend structure to DB structure
    user.cart = cart.map(item => ({
      product: item.product._id || item.product,
      name: item.name,
      price: item.price,
      image: item.image,
      size: item.size,
      color: item.color,
      qty: item.qty
    }));
    await user.save();
    res.json({ cart: user.cart });
  } catch (err) { next(err); }
});

// @PUT /api/auth/me/wishlist
router.put('/me/wishlist', protect, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.wishlist.indexOf(productId);
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    
    // Populate the wishlist for the frontend response
    const populatedUser = await User.findById(req.user._id).populate('wishlist', 'name images price comparePrice slug status');
    res.json({ wishlist: populatedUser.wishlist });
  } catch (err) { next(err); }
});

module.exports = router;
