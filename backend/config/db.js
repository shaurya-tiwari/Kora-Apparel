const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.error(`\n❌ MongoDB Connection Error`);
      console.error(`   Is MongoDB running locally on port 27017?`);
      console.error(`   Please start your local MongoDB server to run the Kora Apparel backend.\n`);
    } else {
      console.error(`❌ MongoDB Error: ${error.message}`);
    }
    process.exit(1);
  }
};

module.exports = connectDB;
