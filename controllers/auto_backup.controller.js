const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { logError } = require('./error_report'); // Import the logError function

const backupLogFilePath = path.join(__dirname, 'backup_log.json'); // Define backup log file path

/**
 * Log the backup status
 * @param {string} timestamp Timestamp of the backup event
 * @param {string} backupType Type of backup: 'full' or 'diff'
 * @param {boolean} success Whether the backup was successful
 * @param {string} message Additional message or error information
 */
const logBackupStatus = (timestamp, backupType, success, message) => {
    const logEntry = { timestamp, backupType, success, message };
    let logs = [];

    try {
        if (fs.existsSync(backupLogFilePath)) {
            const logData = fs.readFileSync(backupLogFilePath, 'utf8');
            logs = JSON.parse(logData);
        }
        
        logs.push(logEntry);
        fs.writeFileSync(backupLogFilePath, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error('Error writing backup log:', err);
        logError(err); // Log the error to file
    }
};

/**
 * Retrieve backup log from file
 * @returns {Array} Array of backup log entries
 */
const getBackupLog = async () => {
    try {
        if (fs.existsSync(backupLogFilePath)) {
            const logData = fs.readFileSync(backupLogFilePath, 'utf8');
            return JSON.parse(logData);
        } else {
            return [];
        }
    } catch (err) {
        console.error('Error reading backup log:', err);
        logError(err); // Log the error to file
        return [];
    }
};

/**
 * Perform database backup
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const performBackup = async (req, res) => {
    const { password, database, backupPath, backupType } = req.body;

    const config = {
        user: 'sa',
        password: password,
        server: 'localhost',
        database: database,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        let backupQuery;
        if (backupType === 'full') {
            backupQuery = `
                BACKUP DATABASE [${database}]
                TO DISK = '${backupPath}'
                WITH NOFORMAT, NOINIT, NAME = '${database}-Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
            `;
        } else if (backupType === 'diff') {
            backupQuery = `
                BACKUP DATABASE [${database}]
                TO DISK = '${backupPath}'
                WITH DIFFERENTIAL, NOFORMAT, NOINIT, NAME = '${database}-Diff Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
            `;
        } else {
            res.status(400).send('Invalid backup type. Use "full" or "diff".');
            return;
        }

        console.log(backupQuery);
        await request.query(backupQuery);
        console.log('Database backup completed successfully.');
        res.status(200).send('Backup completed successfully.');
        logBackupStatus(new Date().toISOString(), backupType, true, 'Database backup completed successfully.');
    } catch (err) {
        console.error('Error during database backup:', err);
        logError(err); // Log the error to file
        res.status(500).send('Error during database backup.');
        logBackupStatus(new Date().toISOString(), backupType, false, `Error during database backup: ${err.message}`);
    } finally {
        try {
            await sql.close();
        } catch (err) {
            console.error('Error closing SQL connection:', err);
            logError(err); // Log the error to file
        }
    }
};

/**
 * Schedule a backup job
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const scheduleBackup = async (req, res) => {
    const { localTime, timeZone, backupType } = req.body;

    try {
        const scheduledTime = moment.tz(localTime, timeZone);
        const now = moment();
        const delay = scheduledTime.diff(now);

        if (delay <= 0) {
            return res.status(400).send('Scheduled time must be in the future.');
        }

        setTimeout(async () => {
            console.log(`Scheduled ${backupType} backup running at ${scheduledTime.format()}`);
            await performBackup(req, res);
        }, delay);

        res.status(200).send(`Backup scheduled successfully for ${scheduledTime.format()}.`);
    } catch (err) {
        console.error('Error scheduling backup:', err);
        logError(err); // Log the error to file
        res.status(500).send(`Error scheduling backup: ${err.message}`);
    }
};

module.exports = {
    performBackup,
    scheduleBackup,
    getBackupLog
};
