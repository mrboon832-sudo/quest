const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');


router.get('/:id/analysis', authenticateToken, requireAdmin, transactionController.getTransactionAnalysis);

router.get('/', authenticateToken, transactionController.getAll);
router.get('/:id', authenticateToken, transactionController.getById);
router.post('/create', authenticateToken, transactionController.createTransaction);
router.put('/:id/flag', authenticateToken, requireAdmin, transactionController.flagTransaction);

module.exports = router;
