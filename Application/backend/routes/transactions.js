const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.put('/:id/flag', authenticateToken, requireAdmin, transactionController.flagTransaction);

module.exports = router;
