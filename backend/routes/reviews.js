const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// @POST /api/reviews (auth)
router.post('/', protect, async (req, res, next) => {
  try {
    const { product, rating, comment } = req.body;
    const exists = await Review.findOne({ user: req.user._id, product });
    if (exists) return res.status(400).json({ message: 'Review already submitted' });
    const review = await Review.create({ user: req.user._id, product, rating: Number(rating), comment });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

// @GET /api/reviews/:productId (public - approved only)
router.get('/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { next(err); }
});

// @GET /api/reviews (admin)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })
      .populate('user', 'name email').populate('product', 'name');
    res.json(reviews);
  } catch (err) { next(err); }
});

// @PUT /api/reviews/:id/approve (admin)
router.put('/:id/approve', protect, adminOnly, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Recalculate product rating
    const allReviews = await Review.find({ product: review.product, isApproved: true });
    const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(review.product, { averageRating: avg.toFixed(1), numReviews: allReviews.length });

    res.json(review);
  } catch (err) { next(err); }
});

// @DELETE /api/reviews/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Recalculate product rating
    const allReviews = await Review.find({ product: review.product, isApproved: true });
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      await Product.findByIdAndUpdate(review.product, { averageRating: avg.toFixed(1), numReviews: allReviews.length });
    } else {
      await Product.findByIdAndUpdate(review.product, { averageRating: 0, numReviews: 0 });
    }

    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
