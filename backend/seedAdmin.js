require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  try {
    const email = 'admin@kora.com';
    const password = 'admin123';

    let admin = await User.findOne({ email });

    if (admin) {
      admin.password = password;
      admin.isVerified = true;
      await admin.save();
      console.log(`✅ Admin password RESET to: ${password}`);
    } else {
      await User.create({
        name: 'Kora Admin',
        email,
        password,
        role: 'admin',
        isVerified: true,
      });
      console.log('✅ Admin created successfully!');
    }
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  Change password after first login!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  }
  process.exit(0);
};

seed();
