const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  ctaText: { type: String, default: 'Shop Now' },
  ctaLink: { type: String, default: '/shop' },
  image: { type: String }, // Optional, can be null for minimal text banners
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
