require('dotenv').config();

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    drimsApiUrl: process.env.DRIMS_API_URL,
    traffyApiUrl: process.env.TRAFFY_API_URL,
}
