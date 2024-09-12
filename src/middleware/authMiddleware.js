// src/middlewares/authMiddleware.js
const logger = require('../utils/logger');

const authHandler = (req, res, next) => {
    const header = req.headers['authorization'];
    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        logger.warn('No token provided');
        const error = new Error('A token is required for authentication');
        error.statusCode = 403;
        next(error);
    }
};

module.exports = { authHandler };