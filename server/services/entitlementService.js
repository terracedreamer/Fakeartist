const logger = require('../utils/logger');

// In-memory cache: { [userId]: { data, expiresAt } }
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://api.magicbusstudios.com';
const PRODUCT_SLUG = process.env.PRODUCT_SLUG || 'fakeartist';

/**
 * Check user entitlement against MBS Platform.
 * Returns { success, hasAccess, reason }
 * Caches results for 5 minutes per user.
 */
async function checkEntitlement(token, userId) {
  // Check cache first
  const cached = cache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `${PLATFORM_URL}/api/entitlements/${PRODUCT_SLUG}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      logger.warn(`Entitlement check failed with status ${response.status} for user ${userId}`);
      // On failure, default to allowing access (graceful degradation)
      return { success: false, hasAccess: true, reason: 'entitlement_check_failed' };
    }

    const data = await response.json();

    // Cache the result
    cache.set(userId, {
      data,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return data;
  } catch (err) {
    logger.error('Entitlement check error:', err.message);
    // Graceful degradation — allow access if platform is unreachable
    return { success: false, hasAccess: true, reason: 'entitlement_check_error' };
  }
}

/**
 * Clear cache for a specific user (e.g., after subscription change)
 */
function clearEntitlementCache(userId) {
  cache.delete(userId);
}

module.exports = { checkEntitlement, clearEntitlementCache };
