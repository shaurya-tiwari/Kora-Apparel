require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

// Connect to MongoDB, then start listening
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Kora Apparel API running at http://localhost:${PORT}`);
});

module.exports = app;
