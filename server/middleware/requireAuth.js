const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT auth middleware — verifies MBS Platform tokens.
 * Extracts: userId, email, name, avatar, isAdmin
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      avatar: decoded.avatar,
      isAdmin: decoded.isAdmin || false,
    };
    next();
  } catch (err) {
    logger.warn('JWT verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
