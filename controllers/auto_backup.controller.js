const sql = require('mssql');
const cron = require('node-cron');
const shell = require ('shelljs')
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
        backupPath = 'C:\Users\Aulia H\FP ABD\WideWorldImporters-Full.bak';
        backupDescription = `${config.database}-Full Backup`;
    } else if (backupType === 'diff') {
        backupPath = 'C:\Users\Aulia H\FP ABD\WideWorldImporters-Full.bak';
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
 * @param {string} scheduleTime Optional. Cron schedule string for scheduling the backup.
 * @param {string} localTime Local time string for scheduling backup at a specific time.
 * @param {string} timeZone Time zone for the local time (e.g., "Asia/Jakarta").
 * @param {string} backupType Type of backup: 'full' or 'diff'
 */
const scheduleBackup = (scheduleTime, localTime, timeZone, backupType) => {
    if (scheduleTime) {
        // Schedule based on cron schedule
        cron.schedule(scheduleTime, () => {
            console.log(`Scheduled ${backupType} backup running at ${new Date().toISOString()}`);
            performBackup(backupType);
        });
    } else if (localTime && timeZone) {
        // Schedule based on specific local time and time zone
        try {
            const asiaJakartaTime = moment.tz(localTime, timeZone);
            const now = moment();

            if (asiaJakartaTime > now) {
                const delay = asiaJakartaTime.diff(now);
                setTimeout(() => {
                    console.log(`Scheduled ${backupType} backup running at ${asiaJakartaTime.format()}`);
                    performBackup(backupType);
                }, delay);
            } else {
                console.error('Backup time should be in the future.');
            }
        } catch (err) {
            console.error('Error parsing time:', err);
            logError(err); // Log the error to file
        }
    } else {
        // Perform immediate backup
        performBackup(backupType);
    }
};

module.exports = {
    performBackup,
    scheduleBackup,
    getBackupLog
};