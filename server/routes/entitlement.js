const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { checkEntitlement } = require('../services/entitlementService');

/**
 * GET /api/entitlement — Check current user's entitlement for this product.
 * Frontend uses this to gate premium features.
 */
router.get('/entitlement', requireAuth, async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  const result = await checkEntitlement(token, req.user.userId);

  res.json({
    success: true,
    hasAccess: result.hasAccess,
    reason: result.reason,
  });
});

module.exports = router;
