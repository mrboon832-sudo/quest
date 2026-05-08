const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

router.get('/summary', authenticateToken, requireAdmin, adminCtrl.getSummary);

module.exports = router;
