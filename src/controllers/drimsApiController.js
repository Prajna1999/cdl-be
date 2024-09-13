const logger = require('../utils/logger');
const drimsApiService = require('../services/drimsApiService');
const path = require('path');
class DrimsApiController {
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            const loginData = await drimsApiService.login(username, password);

            logger.info(`login details fetched for drims`);
            res.json(loginData);
        } catch (error) {
            logger.error(`Error fetching login details: ${error.message}`);
            next(error);
        }
    }

    async getStateCumulativeFloodData(req, res, next) {
        try {
            const { fromDate, toDate } = req.query;
            const token = req.token;
            const data = await drimsApiService.getStateCumulativeFloodData(fromDate, toDate, token);
            res.json(data);
        } catch (error) {
            logger.error(`Error ftching login flood details: ${error.message}`);
            next(error)
        }
    }

    async getRevenueCircleData(req, res, next) {
        try {
            const { fromDate, toDate } = req.query;
            const token = req.token;
            const data = await drimsApiService.getRevenueCircleData(fromDate, toDate, token);
            res.json(data);
        } catch (error) {
            logger.error(`Error fetching revenue flood details: ${error.message}`);
            next(error);
        }
    }

    async downloadRevenueCircleData(req, res, next) {
        try {
            const { filename } = req.params;
            const filePath = path.join('stored_data', 'revenue_circle_csvs', filename);
            res.download(filePath);
        } catch (error) {
            logger.error(`Error download revenue circle details: ${error.message}`);
            next(error);
        }
    }
}

const drimsApiController = new DrimsApiController();
module.exports = drimsApiController;