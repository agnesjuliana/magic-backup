const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { logError } = require('./error_report'); // Import the logError function

const config = {
    user: 'sa2',
    password: '0123',
    server: '127.0.0.1',
    database: 'WideWorldImporters',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const backupLogPath = path.join(__dirname, 'backup_log.json');

/**
 * Log the backup status
 * @param {string} backupType Type of backup: 'full' or 'diff'
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
 * @param {string} backupType Type of backup: 'full' or 'diff'
 */
const performBackup = async (backupType) => {
    let backupPath;
    let backupDescription;

    if (backupType === 'full') {
        backupPath = 'D:\FP ABD\WideWorldImporters-Full.bak';
        backupDescription = `${config.database}-Full Backup`;
    } else if (backupType === 'diff') {
        backupPath = 'D:\FP ABD\WideWorldImporters-Full.bak';
        backupDescription = `${config.database}-Diff Backup`;
    } else {
        console.error('Invalid backup type. Use "full" or "diff".');
        return;
    }

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        let backupQuery;

        if (backupType === 'full') {
            backupQuery = `
                BACKUP DATABASE [${config.database}]
                TO DISK = '${backupPath}'
                WITH NOFORMAT, NOINIT, NAME = '${backupDenscription}', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
            `;
        } else if (backupType === 'diff') {
            backupQuery = `
                BACKUP DATABASE [${config.database}]
                TO DISK = '${backupPath}'
                WITH DIFFERENTIAL, NOFORMAT, NOINIT, NAME = '${backupDescription}', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
            `;
        }

        console.log(backupQuery);
        await request.query(backupQuery);
        console.log(`Database ${backupType} backup completed successfully.`);
        logBackupStatus(new Date().toISOString(), backupType, true, `Database ${backupType} backup completed successfully.`);
    } catch (err) {
        console.error(`Error during ${backupType} database backup:`, err);
        logBackupStatus(new Date().toISOString(), backupType, false, `Error during ${backupType} database backup: ${err.message}`);
        logError(err); // Log the error to file
    } finally {
        sql.close();
    }
};

/**
 * Schedule a backup job
 * @param {string} date_start_temp Temporary start date string in any format
 * @param {string} backupType Type of backup: 'full' or 'diff'
 * @param {string} timeZone Time zone for scheduling (e.g., "Asia/Jakarta")
 */
const scheduleBackup = (date_start_temp, backupType, timeZone) => {
    try {
        // Convert date_start_temp to UTC
        const scheduledTimeUTC = moment.utc(date_start_temp).format("ddd MMM DD YYYY HH:mm:ss");

        // Convert UTC time to Asia/Jakarta time zone
        const scheduledTimeJakarta = moment.tz(scheduledTimeUTC, "Asia/Jakarta");

        // Calculate delay in milliseconds
        const now = moment();
        const delay = scheduledTimeJakarta.diff(now);

        setTimeout(() => {
            console.log(`Scheduled ${backupType} backup running at ${scheduledTimeJakarta.format()}`);
            performBackup(backupType);
        }, delay);
        
    } catch (err) {
        console.error('Error scheduling backup:', err);
        logError(err); // Log the error to file
    }
};

module.exports = {
    performBackup,
    scheduleBackup,
    getBackupLog
};