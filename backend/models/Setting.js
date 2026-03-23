const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  href: { type: String, required: true },
  isVisible: { type: Boolean, default: true },
  openInNewTab: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { _id: true });

const settingSchema = new mongoose.Schema({
  brandName: { type: String, default: 'Kora Apparel' },
  razorpayKeyId: { type: String, default: '' },
  razorpayKeySecret: { type: String, default: '' },
  socialLinks: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
  },
  shippingThreshold: { type: Number, default: 5000 },
  shippingCharge: { type: Number, default: 100 },
  taxRate: { type: Number, default: 18 },
  isCodEnabled: { type: Boolean, default: true },
  heroHeading: { type: String, default: 'Redefining Basics' },
  heroSubtext: { type: String, default: 'Elevate your everyday wardrobe with our premium minimalist collection.' },
  heroButtonText: { type: String, default: 'Shop the Drop' },
  announcementText: { type: String, default: 'Free shipping on orders over ₹5,000' },
  showFeatured: { type: Boolean, default: true },
  showTestimonials: { type: Boolean, default: true },
  showDrops: { type: Boolean, default: true },
  aboutPageText: { type: String, default: 'We are Kora Apparel. Redefining essentials with purpose.' },
  deliveryPolicy: { type: String, default: 'On orders over ₹5000' },
  returnPolicy: { type: String, default: '14-day return policy' },
  exitPopupEnabled: { type: Boolean, default: false },
  exitPopupText: { type: String, default: 'Wait! Get 10% off your first order.' },

  // ─── Tracking Pixels ───────────────────────────────────────────
  fbPixelId: { type: String, default: '' },
  fbPixelEnabled: { type: Boolean, default: false },
  gaId: { type: String, default: '' },
  gaEnabled: { type: Boolean, default: false },
  gtmId: { type: String, default: '' },
  gtmEnabled: { type: Boolean, default: false },

  // ─── Dynamic Navigation ────────────────────────────────────────
  navMenuItems: { type: [menuItemSchema], default: [
    { label: 'Shop All', href: '/shop', isVisible: true, openInNewTab: false, sortOrder: 0 },
    { label: 'Drops', href: '/drops', isVisible: true, openInNewTab: false, sortOrder: 1 },
    { label: 'About', href: '/about', isVisible: true, openInNewTab: false, sortOrder: 2 },
  ]},
  footerMenuItems: { type: [menuItemSchema], default: [
    { label: 'Shop', href: '/shop', isVisible: true, openInNewTab: false, sortOrder: 0 },
    { label: 'About', href: '/about', isVisible: true, openInNewTab: false, sortOrder: 1 },
    { label: 'Contact', href: '/contact', isVisible: true, openInNewTab: false, sortOrder: 2 },
  ]},

  // ─── Page Builder Sections ─────────────────────────────────────
  pageSections: { type: [{ 
    type: { type: String }, 
    label: String, 
    isVisible: { type: Boolean, default: true }, 
    sortOrder: { type: Number, default: 0 },
    content: { type: mongoose.Schema.Types.Mixed, default: {} }
  }], default: [
    { type: 'hero', label: 'Hero Section', isVisible: true, sortOrder: 0, content: {} },
    { type: 'drops', label: 'Active Drops', isVisible: true, sortOrder: 1, content: {} },
    { type: 'featured', label: 'Featured Products', isVisible: true, sortOrder: 2, content: {} },
    { type: 'testimonials', label: 'Testimonials', isVisible: true, sortOrder: 3, content: {} },
    { type: 'editorial', label: 'Editorial / Philosophy', isVisible: true, sortOrder: 4, content: {} },
  ]},
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
