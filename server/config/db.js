const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!uri) {
      logger.error('MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }
    if (!dbName) {
      logger.error('DB_NAME is not defined in environment variables');
      process.exit(1);
    }

    await mongoose.connect(uri, { dbName });
    logger.info(`MongoDB connected to database: ${dbName}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
