const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { getCache, setCache, invalidateCache } = require('../utils/cache');
const { protect, adminOnly } = require('../middleware/auth');

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
router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    
    await invalidateCache('global:settings');
    res.json(settings);
  } catch (err) { next(err); }
});

module.exports = router;
