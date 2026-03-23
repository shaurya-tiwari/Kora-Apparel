const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/testimonials
router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = active === 'true' ? { isActive: true } : {};
    const testimonials = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch(err) { next(err); }
});

// @POST /api/testimonials
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json(testimonial);
  } catch(err) { next(err); }
});

// @PUT /api/testimonials/:id
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!testimonial) return res.status(404).json({ message: 'Not found' });
    res.json(testimonial);
  } catch(err) { next(err); }
});

// @DELETE /api/testimonials/:id
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch(err) { next(err); }
});

module.exports = router;
