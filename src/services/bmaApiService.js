const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

class BmaApiService {
    constructor() {
        this.traffyClient = axios.create({
            baseURL: config.traffyApiUrl,

        });
    }

    async getFloodData(limit = 100) {
        try {
            const response = await this.traffyClient.get(
                '',
                {
                    params: { limit },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return {
                "type": response.data.type,
                "features": response.data.features,

            }
        } catch (error) {
            logger.error('Failed to fetch flood data');
            throw error;
        }
    }

}
const bmaApiService = new BmaApiService();
module.exports = bmaApiService;