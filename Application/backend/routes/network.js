const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

router.get('/fraud-network', networkController.getFraudNetwork);
router.get('/connections/:accountId', networkController.getAccountConnections);

module.exports = router;
