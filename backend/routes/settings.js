const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const Category = require('../models/Category');
const { getCache, setCache, invalidateCache } = require('../utils/cache');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');

// Helper to auto-register categories from menu items
const registerCategories = async (items) => {
  if (!items || !Array.isArray(items)) return;
  for (const item of items) {
    if (item.href && typeof item.href === 'string' && item.href.startsWith('/category/')) {
      const slug = item.href.replace('/category/', '').trim().toLowerCase();
      if (slug) {
        const existing = await Category.findOne({ slug });
        if (!existing) {
          await Category.create({
            name: item.label || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            slug: slug,
            isVisible: true,
            showInNav: true,
            showInShop: true
          });
          console.log(`[Auto-Category] Registered: ${slug}`);
        }
      }
    }
    if (item.children && item.children.length > 0) {
      await registerCategories(item.children);
    }
  }
};

// @GET /api/settings (Public)
router.get('/', async (req, res, next) => {
  try {
    const cached = await getCache('global:settings');
    if (cached) return res.json(cached);

    let settings = await Setting.findOne().select('-razorpayKeySecret');
    if (!settings) {
      settings = await Setting.create({});
    }

    await setCache('global:settings', settings, 3600); // cache for 1 hour
    res.json(settings);
  } catch (err) { next(err); }
});

// @GET /api/settings/admin (Admin ONLY)
router.get('/admin', protect, adminOnly, async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    res.json(settings);
  } catch (err) { next(err); }
});

// @PUT /api/settings (Admin ONLY)
router.put('/', protect, adminOnly, upload.array('images', 1), processImages, async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    // Parse JSON data if it comes in a multipart field
    let updateData = req.body;
    if (req.body.data) {
      try {
        updateData = JSON.parse(req.body.data);
      } catch (e) {
        // Fallback or handle error
      }
    }

    if (req.processedImages && req.processedImages.length > 0) {
      updateData.logo = req.processedImages[0];
    }

    console.log('[SettingsUpdate] Received update data keys:', Object.keys(updateData));
    if (updateData.pageSections) {
      console.log('[SettingsUpdate] pageSections count:', updateData.pageSections.length);
    }

    // Clean up pageSections to prevent Mongoose casting errors (e.g., stripping 'temp-*' IDs)
    if (updateData.pageSections && Array.isArray(updateData.pageSections)) {
      updateData.pageSections = updateData.pageSections.map(s => {
        if (typeof s._id === 'string' && !/^[0-9a-fA-F]{24}$/.test(s._id)) {
          const { _id, ...rest } = s;
          return rest;
        }
        return s;
      });
    }

    // Strip MongoDB internal fields to prevent update errors (cannot change _id)
    delete updateData._id;
    delete updateData.__v;

    // Auto-register any new categories found in the menu structure
    if (updateData.navMenuItems) await registerCategories(updateData.navMenuItems);
    if (updateData.footerMenuItems) await registerCategories(updateData.footerMenuItems);

    // Use findOneAndUpdate for a more robust singleton update
    const updatedSettings = await Setting.findOneAndUpdate(
      {}, 
      { $set: updateData }, 
      { new: true, upsert: true, runValidators: false, lean: true }
    );

    if (!updatedSettings) {
      throw new Error('Failed to update or create settings document');
    }
    
    await invalidateCache('global:settings');
    res.json(updatedSettings);
  } catch (err) { 
    console.error('SETTINGS_UPDATE_CRITICAL_ERROR:', err);
    if (err.stack) console.error('ERROR_STACK:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error during settings update', 
      error: err.message, 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

module.exports = router;
