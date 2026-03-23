const express = require('express');
const router = express.Router();
const Drop = require('../models/Drop');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');

// @GET /api/drops
router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active === 'true') {
      filter.isActive = true;
      const now = new Date();
      filter.startTime = { $lte: now };
      filter.endTime = { $gt: now };
    }
    const drops = await Drop.find(filter).sort({ startTime: 1 }).populate('products', 'name price images slug stock');
    res.json(drops);
  } catch(err) { next(err); }
});

// @POST /api/drops
router.post('/', protect, adminOnly, upload.single('images'), processImages, async (req, res, next) => {
  try {
    const { title, description, products, startTime, endTime, isActive } = req.body;
    const drop = await Drop.create({
      title, description,
      products: products ? (Array.isArray(products) ? products : products.split(',').map(s=>s.trim())) : [],
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isActive: isActive !== 'false',
      image: req.processedImages && req.processedImages[0] ? req.processedImages[0] : null
    });
    res.status(201).json(drop);
  } catch(err) { next(err); }
});

// @PUT /api/drops/:id
router.put('/:id', protect, adminOnly, upload.single('images'), processImages, async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.products && typeof updateData.products === 'string') {
      updateData.products = updateData.products.split(',').map(s=>s.trim());
    }
    if (req.processedImages && req.processedImages[0]) {
      updateData.image = req.processedImages[0];
    }
    const drop = await Drop.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('products');
    if (!drop) return res.status(404).json({ message: 'Drop not found' });
    res.json(drop);
  } catch(err) { next(err); }
});

// @DELETE /api/drops/:id
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const drop = await Drop.findByIdAndDelete(req.params.id);
    if (!drop) return res.status(404).json({ message: 'Drop not found' });
    res.json({ message: 'Deleted drop' });
  } catch(err) { next(err); }
});

module.exports = router;
