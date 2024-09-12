// src/services/youtubeService.js
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');

class DrimsAPiService {
    constructor() {
        this.drimsApiClient = axios.create({
            baseURL: config.drimsApiUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async login(username, password) {

        try {
            const response = await this.drimsApiClient.post(
                '/api/auth/local',
                {
                    identifier: username,
                    password: password
                }
            );

            return response.data
        } catch (error) {
            logger.error('Login Falied', error.message);
            throw error;
        }
    }

    async getStateCumulativeFloodData(fromDate, toDate, token) {
        try {
            const response = await this.drimsApiClient.get(
                '/api/reports/flood/getStateCumulativeData',
                {
                    params: { fromDate, toDate },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch cumulative state flood data', error.message);
            throw error;
        }
    }


}

const drimsApiService = new DrimsAPiService();
module.exports = drimsApiService;