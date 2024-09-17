const express = require('express');
const bmaApiController = require('../controllers/bmaApiController');

const router = express.Router();

router.get('/bma/flood-complaints', bmaApiController.getFloodDetails);

module.exports = router;