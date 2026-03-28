const logger = require('../utils/logger');

const validateEnv = () => {
  // Support MONGO_URL / MONGODB_URI / MONGO_URI fallbacks (Coolify services vary)
  if (!process.env.MONGODB_URI) {
    if (process.env.MONGO_URL) {
      process.env.MONGODB_URI = process.env.MONGO_URL;
      logger.info('Using MONGO_URL as MONGODB_URI');
    } else if (process.env.MONGO_URI) {
      process.env.MONGODB_URI = process.env.MONGO_URI;
      logger.info('Using MONGO_URI as MONGODB_URI');
    }
  }

  const requiredVars = ['MONGODB_URI', 'DB_NAME', 'JWT_SECRET'];
  const optionalVars = ['OPENAI_API_KEY', 'CLIENT_URL', 'PLATFORM_URL', 'PRODUCT_SLUG'];

  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const missingOptional = optionalVars.filter((v) => !process.env[v]);
  if (missingOptional.length > 0) {
    logger.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
};

module.exports = validateEnv;
