const mongoose = require('mongoose');
const Setting = require('./models/Setting');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/koraapparel');
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      isCodEnabled: true,
      shippingThreshold: 5000,
      shippingCharge: 150,
      taxRate: 18,
      pageSections: {}
    });
    console.log('Settings Seeded:', settings);
  } else {
    settings.isCodEnabled = true;
    await settings.save();
    console.log('Settings Updated:', settings);
  }
  process.exit();
}
seed();
