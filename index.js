const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const backupRouter = require('./routes/full_backup.route');

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

// Mount backup router
app.use('/backup', backupRouter);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
