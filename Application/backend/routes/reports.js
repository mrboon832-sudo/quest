const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

router.post('/generate', authenticateToken, requireAdmin, reportController.generateReport);
router.get('/', reportController.getReportHistory);
router.get('/:id/download', reportController.downloadReport);

module.exports = router;
