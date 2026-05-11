const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const networkController = require('../controllers/networkController');

// Get fraud network visualization (admin only)
router.get('/fraud-network', authenticateToken, requireAdmin, networkController.getFraudNetwork);

// Get account connections (admin only)
router.get('/connections/:accountId', authenticateToken, requireAdmin, networkController.getAccountConnections);

module.exports = router;
