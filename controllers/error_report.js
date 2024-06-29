const fs = require('fs');
const path = require('path');

/**
 * Log error to file
 * @param {Error} error Error object
 */
const logError = (error) => {
    const logDirPath = path.join(__dirname, '..', 'error_log');
    const logFilePath = path.join(logDirPath, 'error_report.log');
    
    if (!fs.existsSync(logDirPath)) {
        fs.mkdirSync(logDirPath, { recursive: true }); 
    }

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
