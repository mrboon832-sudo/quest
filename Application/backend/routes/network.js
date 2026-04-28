const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

router.get('/fraud-graph', networkController.getFraudNetwork);
router.get('/account/:accountId/connections', networkController.getAccountConnections);

module.exports = router;
