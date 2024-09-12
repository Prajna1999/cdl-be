const logger = require('../utils/logger');
const drimsApiService = require('../services/drimsApiService');
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
}

const drimsApiController = new DrimsApiController();
module.exports = drimsApiController;