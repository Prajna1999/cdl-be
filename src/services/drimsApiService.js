// src/services/youtubeService.js
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
// const { generate } = require('csv-generate');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

            const result = {
                affectedPopulation: this.mapData(response.data.affectedPopulation, ['district', 'districtCode', 'totalPopulation', 'totalCropArea']),
                livesLostConfirmed: this.mapData(response.data.hllDetails?.confirmed, ['district', 'total']),
                livestockDetails: this.mapData(response.data.livestocksDetails?.affected, ['district', 'total']),
                houseDamagedDetails: this.mapData(response.data.houseDamagedDetails?.damage, ['district', 'totalHousesFullyDamaged']),
                emabankmentBreached: this.mapData(response.data.infDamageDetails?.embBreached, ['district', 'total']),
                embankmentAffected: this.mapData(response.data.infDamageDetails?.embAffected, ['district', 'total']),
                roadAffected: this.mapData(response.data.infDamageDetails?.roadAffected, ['district', 'total']),
                bridgeAffected: this.mapData(response.data.infDamageDetails?.bridgeAffected, ['district', 'total'])
            };

            // generate the csvs
            await this.generateAndSaveCSVs(result, fromDate, toDate);
            return {
                "message": "Succesfully mapped and generated csvs",
                "result": result
            };


        } catch (error) {
            logger.error('Failed to fetch cumulative state flood data', error.message);
            throw error;
        }
    }

    // helper function to map data
    // generate csv
    async generateAndSaveCSVs(data, fromDate, toDate) {
        const csvFolder = path.join('stored-data', 'master_csvs', `${fromDate}_${toDate}`);

        try {
            // Create the entire directory path if it doesn't exist
            fs.mkdirSync(csvFolder, { recursive: true });
            logger.info(`Created directory: ${csvFolder}`);
        } catch (error) {
            logger.error(`Error creating directory ${csvFolder}: ${error.message}`);
            throw error;
        }

        for (const [key, value] of Object.entries(data)) {
            if (value.length > 0) {
                const filename = `${key}_${fromDate}_${toDate}.csv`;
                const filePath = path.join(csvFolder, filename);

                const csvWriter = createCsvWriter({
                    path: filePath,
                    header: Object.keys(value[0]).map(id => ({ id, title: id }))
                });

                try {
                    await csvWriter.writeRecords(value);
                    logger.info(`CSV file generated: ${filename}`);
                } catch (error) {
                    logger.error(`Error generating CSV file ${filename}: ${error.message}`);
                }
            }
        }
    }
    // map into csv format
    mapData(data, keys) {
        return data?.map(item => {
            const mappedItem = {};
            keys.forEach(key => {
                if (key === 'totalPopulation') {
                    mappedItem[key] = item.total;
                } else if (key === 'totalCropArea') {
                    mappedItem[key] = Number(parseInt(item[key]));

                } else if (key === 'totalHousesFullyDamaged') {
                    mappedItem[key] = item.totalFully
                } else {
                    mappedItem[key] = item[key];
                }
            });
            return mappedItem;
        }) || []
    }

}

const drimsApiService = new DrimsAPiService();
module.exports = drimsApiService;