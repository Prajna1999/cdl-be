const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
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

    // revenue circledata fetching
    async getRevenueCircleData(fromDate, toDate, token) {
        try {
            const response = await this.drimsApiClient.get(
                '/api/reports/flood/getStateCumulativeData',
                {
                    params: { fromDate, toDate },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            const result = {
                affectedPopulation: this.processAffectedPopulation(response.data.affectedPopulation),
                livesLostConfirmed: this.processLivesLost(response.data.hllDetails?.confirmed),
                emabankmentBreached: this.processInfrastructureDamage(response.data.infDamageDetails?.embBreached, 'embankmentBreached'),
                embankmentAffected: this.processInfrastructureDamage(response.data.infDamageDetails?.embAffected, 'embankmentAffected'),
                roadAffected: this.processInfrastructureDamage(response.data.infDamageDetails?.roadAffected, 'roadAffected'),
                bridgeAffected: this.processInfrastructureDamage(response.data.infDamageDetails?.bridgeAffected, 'bridgeAffected')
            };

            // Generate and save CSV files
            const csvFiles = await this.generateCSVs(result, fromDate, toDate);

            return csvFiles;
        } catch (error) {
            logger.error('Failed to fetch revenue circle flood data', error.message);
            throw error;
        }
    }

    processAffectedPopulation(data) {
        return data?.flatMap(item =>
            item.details.split('),').map(detail => {
                const [name, population, cropArea] = detail.replace(/[()]/g, '').split('|').map(s => s.trim());
                return {
                    district: item.district,
                    revenue_circle: name,
                    populationAffected: parseInt(population.split(':')[1]),
                    cropArea: parseFloat(cropArea.split(':')[1])
                };
            })
        ) || [];
    }

    processLivesLost(data) {
        return data?.flatMap(item =>
            item.details.split('),').map(detail => {
                const [name, count] = detail.replace(/[()]/g, '').split('|').map(s => s.trim());
                return {
                    district: item.district,
                    revenue_circle: name,
                    livesLost: parseInt(count)
                };
            })
        ) || [];
    }

    processInfrastructureDamage(data, damageType) {
        return data?.flatMap(item =>
            item.details.flatMap(block => {
                const [name, count] = block.block.replace(/[()]/g, '').split('|').map(s => s.trim());
                return {
                    district: item.district,
                    revenue_circle: name,
                    [damageType]: parseInt(count)
                };
            })
        ) || [];
    }

    async generateCSVs(data, fromDate, toDate) {
        const baseFolder = path.join('stored-data', 'revenue_circle_csvs', `${fromDate}_${toDate}`);
        await this.createFolder(baseFolder);

        const csvFiles = [];

        for (const [key, value] of Object.entries(data)) {
            if (value.length > 0) {
                const filePath = await this.writeCSV(baseFolder, key, value);
                csvFiles.push({ key, filePath });
            }
        }

        return csvFiles;
    }

    async createFolder(folder) {
        try {
            await fs.promises.mkdir(folder, { recursive: true });
            logger.info(`Created directory: ${folder}`);
        } catch (error) {
            logger.error(`Error creating directory ${folder}: ${error.message}`);
            throw error;
        }
    }

    async writeCSV(folder, filename, data) {
        const filePath = path.join(folder, `${filename}.csv`);
        const csvWriter = createCsvWriter({
            path: filePath,
            header: Object.keys(data[0]).map(id => ({ id, title: id }))
        });

        try {
            await csvWriter.writeRecords(data);
            logger.info(`CSV file generated: ${filePath}`);
            return filePath;
        } catch (error) {
            logger.error(`Error generating CSV file ${filePath}: ${error.message}`);
            throw error;
        }
    }

}

const drimsApiService = new DrimsAPiService();
module.exports = drimsApiService;