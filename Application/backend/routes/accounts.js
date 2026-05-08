const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/auth');

// All account routes require authentication
router.use(authenticateToken);

// GET: /accounts/balance - Get account balance
router.get('/balance', accountController.getBalance);

// GET: /accounts/transactions - Get recent transactions
router.get('/transactions', accountController.getRecentTransactions);

// POST: /accounts/deposit - Make a deposit
router.post('/deposit', accountController.deposit);

// POST: /accounts/withdraw - Make a withdrawal
router.post('/withdraw', accountController.withdraw);

// POST: /accounts/transfer - Transfer to another account
router.post('/transfer', accountController.transfer);

module.exports = router;
