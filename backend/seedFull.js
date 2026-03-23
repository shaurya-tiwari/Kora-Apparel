require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Banner = require('./models/Banner');
const Drop = require('./models/Drop');
const connectDB = require('./config/db');

const importData = async () => {
  try {
    await connectDB();
    
    // Clear all existing data
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
      Banner.deleteMany(),
      Drop.deleteMany()
    ]);
    console.log('🗑️  Data Cleared');

    // 1. Create Admins and Users
    const createdUsers = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@kora.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'Regular Buyer 1',
        email: 'buyer1@kora.com',
        password: 'password',
        role: 'user',
        addresses: [{
          label: 'Home',
          line1: '123 Minimal St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '9876543210'
        }]
      },
      {
        name: 'Regular Buyer 2',
        email: 'buyer2@kora.com',
        password: 'password',
        role: 'user',
      }
    ]);
    const adminUserId = createdUsers[0]._id;
    const buyer1Id = createdUsers[1]._id;
    const buyer2Id = createdUsers[2]._id;
    console.log('👥 Users Created');

    // 2. Create Banner
    await Banner.create({
      title: 'the autumn minimal collection',
      subtitle: 'AW 2026',
      ctaText: 'explore now',
      ctaLink: '/shop',
      isActive: true
    });
    console.log('🖼️  Banner Created');

    // 3. Create Products
    const products = [
      {
        name: 'Essential Oversized Tee',
        slug: 'essential-oversized-tee-1',
        description: 'A heavyweight, perfectly structured 100% cotton tee designed for an effortless, minimal drape.',
        price: 2499,
        comparePrice: 3499,
        category: 'T-Shirts',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Charcoal'],
        stock: 50,
        isFeatured: true,
      },
      {
        name: 'Structured Wide Leg Trousers',
        slug: 'structured-wide-leg-trousers-2',
        description: 'Tailored wide leg trousers with a clean double pleat for sharp silhouettes.',
        price: 4999,
        category: 'Bottoms',
        sizes: ['28', '30', '32', '34'],
        colors: ['Navy', 'Taupe'],
        stock: 20,
        isFeatured: true,
      },
      {
        name: 'Monolith Knit Sweater',
        slug: 'monolith-knit-sweater-3',
        description: 'Ultra-soft minimal knitwear featuring dropped shoulders and a muted tone.',
        price: 6499,
        category: 'Knitwear',
        sizes: ['M', 'L'],
        colors: ['Oatmeal', 'Jet Black'],
        stock: 15,
        isFeatured: true,
      },
      {
        name: 'Core Heavyweight Hoodie',
        slug: 'core-heavyweight-hoodie-4',
        description: 'No drawstrings, no logos. Just the perfect volume and weight.',
        price: 5299,
        comparePrice: 5999,
        category: 'Hoodies',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Ash Grey', 'Washed Black'],
        stock: 0, // Testing sold out
        isFeatured: true,
      },
      {
        name: 'Utility Cargo Pant',
        slug: 'utility-cargo-pant-5',
        description: 'Refined utility. Matte black hardware with concealed pockets.',
        price: 5499,
        category: 'Bottoms',
        sizes: ['30', '32'],
        colors: ['Olive', 'Black'],
        stock: 10,
        isFeatured: false,
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log('👕 Products Created');

    // 4. Create Mock Orders to populate Analytics
    const numDays = 14;
    for (let i = 0; i < 30; i++) {
      const isBuyer1 = Math.random() > 0.5;
      const user = isBuyer1 ? buyer1Id : buyer2Id;
      
      // Select 1-3 random products
      const orderItems = [];
      const numItems = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;
      
      for(let j = 0; j < numItems; j++) {
        const prod = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        orderItems.push({
          product: prod._id,
          name: prod.name,
          qty,
          price: prod.price,
          size: prod.sizes[0],
          color: prod.colors[0],
        });
        totalAmount += prod.price * qty;
      }

      // Generate a date within the last 'numDays'
      const randomDaysAgo = Math.floor(Math.random() * numDays);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - randomDaysAgo);

      await Order.create({
        user,
        items: orderItems,
        shippingAddress: {
          line1: '123 St', city: 'City', state: 'State', pincode: '123456', phone: '9999'
        },
        paymentMethod: 'razorpay',
        isPaid: true,
        paidAt: createdAt,
        status: ['processing', 'shipped', 'delivered'][Math.floor(Math.random() * 3)],
        itemsTotal: totalAmount,
        shippingCost: 0,
        total: totalAmount,
        createdAt
      });
    }
    console.log('📦 Mock Orders Created for Analytics');

    // 5. Create a Drop
    await Drop.create({
      title: 'Project 01: Silence',
      description: 'The inaugural collection. Focus on cut, shape, and shadow.',
      startTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endTime: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isActive: true
    });
    console.log('⏳ Upcoming Drop Created');

    console.log('✅ ALL DATA SEEDED SUCCESSFULLY!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
