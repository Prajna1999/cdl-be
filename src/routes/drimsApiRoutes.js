
const express = require('express');
const drimsApiController = require('../controllers/drimsApiController');
const { authHandler } = require('../middleware/authMiddleware')

const router = express.Router();

router.post('/login', drimsApiController.login);
router.get('/flood/consolidated', authHandler, drimsApiController.getStateCumulativeFloodData)

module.exports = router;
