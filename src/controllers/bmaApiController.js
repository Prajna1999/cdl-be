const logger = require('../utils/logger');
const bmaApiService = require('../services/bmaApiService');
const csv = require('csv-stringify');
class BmaApiController {
    async getFloodDetails(req, res, next) {
        try {
            const { limit } = req.query;
            if (!limit) {
                logger.info('limit is not given')
            }
            const floodData = await bmaApiService.getFloodData(limit);
            logger.info(`Successfully fetched and sent flood data as CSV`);
            res.json(floodData);
        } catch (error) {
            logger.error(`Error fetching flood complaint details: ${error.message}`);
            next(error);
        }
    }
}
const bmaApiController = new BmaApiController();
module.exports = bmaApiController;