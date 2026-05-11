const express = require('express');
const router = express.Router();
 const { authenticateToken } = require('../middleware/auth');
 const { requireAdmin } = require('../middleware/roleCheck');

const dashboardController = require('../controllers/dashboardController');

 router.get('/stats', dashboardController.getStats);
 router.get('/risk-distribution', dashboardController.getRiskDistribution);
 router.get('/transaction-trend', dashboardController.getTransactionTrend);

module.exports = router;
