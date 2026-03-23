const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/coupons (Admin only)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) { next(err); }
});

// @POST /api/coupons/validate (Public)
router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) return res.status(404).json({ message: 'Invalid or inactive coupon' });
    if (new Date() > new Date(coupon.expiryDate)) return res.status(400).json({ message: 'Coupon expired' });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    
    // Prevent discount > subtotal
    if (discountAmount > subtotal) discountAmount = subtotal;

    res.json({
      _id: coupon._id,
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (err) { next(err); }
});

// @POST /api/coupons (Admin only)
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    // Check if code exists
    const exists = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) { next(err); }
});

// @PUT /api/coupons/:id (Admin only)
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (req.body.code) req.body.code = req.body.code.toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) { next(err); }
});

// @DELETE /api/coupons/:id (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
