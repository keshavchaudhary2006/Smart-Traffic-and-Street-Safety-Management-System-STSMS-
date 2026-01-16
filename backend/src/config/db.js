/**
 * ============================================
 * STSMS — MongoDB Connection
 * ============================================
 * Connects to MongoDB with retry logic and event listeners.
 */

const mongoose = require('mongoose');
const { MONGO_URI, NODE_ENV } = require('./env');

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

/**
 * Connect to MongoDB with exponential backoff
 * @param {number} retryCount — current attempt number
 */
async function connectDB(retryCount = 0) {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(
      `❌ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`
    );

    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    console.error('💀 All MongoDB connection attempts failed. Exiting.');
    process.exit(1);
  }
}

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

// Enable query logging in development
if (NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query) => {
    console.log(`Mongoose: ${collectionName}.${method}(${JSON.stringify(query)})`);
  });
}

module.exports = connectDB;
