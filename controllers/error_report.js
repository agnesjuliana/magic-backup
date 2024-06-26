const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'error_log', 'error_report.log'); // Change path to root directory

/**
 * Log error to file
 * @param {Error} error Error object
 */
const logError = (error) => {
    const errorMessage = `${new Date().toISOString()} - Error: ${error.message}\nStack: ${error.stack}\n\n`;
    fs.appendFile(logFilePath, errorMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
};

module.exports = {
    logError
};
