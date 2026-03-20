const logger = require('../utils/logger');

const requiredVars = ['MONGODB_URI', 'DB_NAME'];
const optionalVars = ['ANTHROPIC_API_KEY', 'CLIENT_URL'];

const validateEnv = () => {
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
