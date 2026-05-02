const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.post('/generate', authenticateToken, reportController.generateReport);
router.get('/', reportController.getReportHistory);

module.exports = router;
