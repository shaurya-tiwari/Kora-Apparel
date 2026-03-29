const mongoose = require('mongoose');
require('dotenv').config();

const ProductSchema = new mongoose.Schema({
  name: String,
  images: [String]
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kora-apparel');
    console.log('Connected to DB');
    
    const products = await Product.find({}).limit(5);
    console.log('--- Product Images ---');
    products.forEach(p => {
      console.log(`Product: ${p.name}`);
      console.log(`Images: ${JSON.stringify(p.images)}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkImages();
