const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.put('/:id/flag', authenticateToken, transactionController.flagTransaction);

module.exports = router;
