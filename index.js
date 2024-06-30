const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const transactionLogRouter = require('./routes/transaction_log.route');
const backupRouter = require('./routes/full_backup.route');
const logShipRouter = require('./routes/logShippingRoutes');
const autoBackupRouter = require('./routes/auto_backup.route');
const errorRouter = require('./routes/error.route');

const app = express();
const port = 3000;

console.log("This is index");

// Swagger configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Database Backup API',
            version: '1.0.0',
            description: 'API for performing database backups',
            contact: {
                name: 'Your Name',
                email: 'your_email@example.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}`
            }
        ]
    },
    apis: ['./routes/*.js'] // Path to the router files
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware to parse JSON bodies
app.use(express.json());

// Mount routers
app.use('/backup', backupRouter);
app.use('/log-shipping', logShipRouter);
app.use('/transaction-log', transactionLogRouter);
app.use('/auto-backup', autoBackupRouter);
app.use('/error-report', errorRouter);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
