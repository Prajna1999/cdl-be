
const express = require('express');
const drimsApiController = require('../controllers/drimsApiController');
const { authHandler } = require('../middleware/authMiddleware')

const router = express.Router();

router.post('/login', drimsApiController.login);
router.get('/flood/district/consolidated', authHandler, drimsApiController.getStateCumulativeFloodData);
router.get('/flood/revenue-circle/consolidated', authHandler, drimsApiController.getRevenueCircleData);
// router.get('/flood/download/:filename', authHandler, drimsApiController.downloadRevenueCircleData)
module.exports = router;
