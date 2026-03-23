const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');

// @GET /api/banners/active (Public)
router.get('/active', async (req, res, next) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json(banner || null);
  } catch (err) { next(err); }
});

// @GET /api/banners (Admin)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) { next(err); }
});

// @POST /api/banners (Admin)
router.post('/', protect, adminOnly, upload.array('images', 1), processImages, async (req, res, next) => {
  try {
    const { title, subtitle, ctaText, ctaLink, isActive } = req.body;
    let imageUrl;
    if (req.processedImages && req.processedImages.length > 0) {
      imageUrl = req.processedImages[0];
    }
    
    if (isActive === 'true' || isActive === true) {
      await Banner.updateMany({}, { isActive: false });
    }

    const banner = await Banner.create({
      title, subtitle, ctaText, ctaLink, 
      isActive: isActive === 'true' || isActive === true,
      ...(imageUrl && { image: imageUrl })
    });
    res.status(201).json(banner);
  } catch (err) { next(err); }
});

// @PUT /api/banners/:id (Admin)
router.put('/:id', protect, adminOnly, upload.array('images', 1), processImages, async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    const fields = ['title', 'subtitle', 'ctaText', 'ctaLink'];
    fields.forEach(f => { if (req.body[f] !== undefined) banner[f] = req.body[f]; });

    if (req.body.isActive !== undefined) {
      const active = req.body.isActive === 'true' || req.body.isActive === true;
      banner.isActive = active;
      if (active) {
        await Banner.updateMany({ _id: { $ne: banner._id } }, { isActive: false });
      }
    }
    
    if (req.processedImages && req.processedImages.length > 0) {
      banner.image = req.processedImages[0];
    }

    await banner.save();
    res.json(banner);
  } catch (err) { next(err); }
});

// @DELETE /api/banners/:id (Admin)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
