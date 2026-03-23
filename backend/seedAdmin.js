require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  try {
    const existing = await User.findOne({ email: 'admin@kora.com' });
    if (existing) {
      console.log('✅ Admin already exists: admin@kora.com / admin123');
      process.exit(0);
    }
    await User.create({
      name: 'Kora Admin',
      email: 'admin@kora.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin seeded successfully!');
    console.log('   Email: admin@kora.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Change password after first login!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  }
  process.exit(0);
};

seed();
