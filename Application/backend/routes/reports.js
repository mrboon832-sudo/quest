const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const reportController = require('../controllers/reportController');

// All report endpoints require authentication and admin role
router.post('/generate', authenticateToken, requireAdmin, reportController.generateReport);
router.get('/', authenticateToken, requireAdmin, reportController.getReportHistory);
router.get('/:id/download', authenticateToken, requireAdmin, reportController.downloadReport);

module.exports = router;
