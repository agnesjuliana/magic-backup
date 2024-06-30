const sql = require('mssql');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const { logError } = require('./error_report');

const backupLogFilePath = path.join(__dirname, 'backup_log.json');

/**
 * Log the backup status
 * @param {string} timestamp Timestamp of the backup event
 * @param {string} backupType Type of backup ('full' or 'diff')
 * @param {boolean} success Whether the backup was successful
 * @param {string} message Additional message or error information
 */
const logBackupStatus = (timestamp, backupType, success, message) => {
    const logEntry = { timestamp, backupType, success, message };
    let logs = [];

    if (fs.existsSync(backupLogFilePath)) {
        const logData = fs.readFileSync(backupLogFilePath);
        logs = JSON.parse(logData);
    }

    logs.push(logEntry);
    fs.writeFileSync(backupLogFilePath, JSON.stringify(logs, null, 2));
};

/**
 * Get backup logs
 * @returns {Array} Array of backup log entries
 */
const getBackupLog = async () => {
    if (fs.existsSync(backupLogFilePath)) {
        const logData = fs.readFileSync(backupLogFilePath);
        return JSON.parse(logData);
    } else {
        return [];
    }
};

/**
 * Perform a database backup (full or differential)
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {string} backupType Type of backup ('full' or 'diff')
 */
const performBackup = async (req, res, backupType) => {
    const { password, database, backupPath } = req.body;

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
            return res.status(400).send('Invalid backup type. Use "full" or "diff".');
        }

        console.log(backupQuery);
        await request.query(backupQuery);
        console.log(`Database ${backupType} backup completed successfully.`);
        logBackupStatus(new Date().toISOString(), backupType, true, `Database ${backupType} backup completed successfully.`);
        res.status(200).send(`${backupType} backup completed successfully.`);
    } catch (err) {
        console.error(`Error during ${backupType} database backup: ${err.message}`);
        logBackupStatus(new Date().toISOString(), backupType, false, `Error during ${backupType} database backup: ${err.message}`);
        logError(err);
        res.status(500).send(`Error during ${backupType} database backup: ${err.message}`);
    } finally {
        sql.close();
    }
};

/**
 * Schedule a backup job
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {string} backupType Type of backup ('full' or 'diff')
 */
const scheduleBackup = async (req, res, backupType) => {
    const { localTime, timeZone } = req.body;

    try {
        const scheduledTime = moment.tz(localTime, timeZone);
        const now = moment();
        const delay = scheduledTime.diff(now);

        if (delay <= 0) {
            return res.status(400).send('Scheduled time must be in the future.');
        }

        setTimeout(async () => {
            console.log(`Scheduled ${backupType} backup running at ${scheduledTime.format()}`);
            await performBackup(req, res, backupType);
        }, delay);

        return Promise.resolve(); // Resolve the promise after scheduling
    } catch (err) {
        console.error('Error scheduling backup:', err);
        logError(err);
        throw new Error(`Error scheduling backup: ${err.message}`);
    }
};

module.exports = {
    performBackup,
    scheduleBackup,
    getBackupLog
};
