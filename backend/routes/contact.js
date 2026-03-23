const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

// @POST /api/contact
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }
    
    await sendEmail({
      // We send it to the exact configured SMTP user, assuming that is the store owner's address
      email: process.env.SMTP_USER || 'admin@koraapparel.com',
      subject: `New Contact Form: ${subject || 'General Inquiry'}`,
      message: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    res.json({ message: 'Message sent successfully. We will get back to you shortly.' });
  } catch (err) { next(err); }
});

module.exports = router;
