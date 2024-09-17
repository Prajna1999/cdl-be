const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const drimsApiRoutes = require('./routes/drimsApiRoutes');
const bmaApiRoutes = require('./routes/bmaApiRoutes');
const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
// app.use(metricsMiddleware);
app.use(morgan('combined', { stream: logger.stream }));

// health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Mic check. All systems narmal'
    })
});

// Routes
app.use('/api/v1', drimsApiRoutes);
app.use('/api/v1', bmaApiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;