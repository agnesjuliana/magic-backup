const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const logDirPath = path.join(__dirname, '..', 'error_log');
const logFilePath = path.join(logDirPath, 'error_report.log');

// Endpoint to get error logs
/**
 * @swagger
 * /error-report:
 *   get:
 *     summary: Get error logs
 *     description: Retrieve error logs from the server.
 *     responses:
 *       200:
 *         description: Logs retrieved successfully.
 *       500:
 *         description: Failed to read log file.
 */
router.get('/', (req, res) => {
    if (!fs.existsSync(logDirPath)) {
        console.log('Log directory does not exist.');
        return res.send('No errors found.');
    }

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log('Log file does not exist.');
                return res.status(404).send('No errors found.');
            }
            console.error('Failed to read log file:', err);
            return res.status(500).send('Failed to read log file.');
        }
        res.send(`<pre>${data}</pre>`); // Fixed template literal formatting
    });
});

module.exports = router;
