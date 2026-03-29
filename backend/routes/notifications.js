const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/notifications
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// @PUT /api/notifications/read-all
router.put('/read-all', protect, adminOnly, async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'Read all' });
  } catch (err) { next(err); }
});

module.exports = router;
