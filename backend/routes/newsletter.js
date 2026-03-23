const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// @POST /api/newsletter
router.post('/', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    await Subscriber.create({ email });
    res.status(201).json({ message: 'Subscription successful. Welcome to the club.' });
  } catch (err) { next(err); }
});

module.exports = router;
