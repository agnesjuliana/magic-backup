const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { logError } = require('./error_report'); // Import the logError function

let backupLogFilePath = path.join(__dirname, 'backup_log.json'); // Ensure correct variable name

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
 * Schedule a backup job
 * @param {*} req Express request object
 * @param {*} res Express response object
 */
const scheduleBackup = async (req, res) => {
    const { date_time, timeZone, backupType } = req.body;

    try {
        // Convert date_time to Asia/Jakarta time zone
        const scheduledTimeJakarta = moment.tz(date_time, timeZone);

        // Calculate delay in milliseconds
        const now = moment();
        const delay = scheduledTimeJakarta.diff(now);

        setTimeout(async () => {
            console.log(`Scheduled ${backupType} backup running at ${scheduledTimeJakarta.format()}`);
            await performBackup(req, res);
        }, delay);
        
        res.status(200).send(`Backup scheduled successfully for ${scheduledTimeJakarta.format()}.`);
    } catch (err) {
        console.error('Error scheduling backup:', err);
        logError(err); // Log the error to file
        res.status(500).send(`Error scheduling backup: ${err.message}`);
    }
};

/**
 * Perform a database backup (full or differential)
 * @param {*} req Express request object
 * @param {*} res Express response object
 */
const performBackup = async (req, res) => {
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

        const backupQuery = `
            BACKUP DATABASE [${database}]
            TO DISK = '${backupPath}'
            WITH NOFORMAT, NOINIT, NAME = '${database}-Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
        `;

        console.log(backupQuery);
        await request.query(backupQuery);
        console.log('Database backup completed successfully.');
        logBackupStatus(new Date().toISOString(), 'full', true, `Database ${database} backup completed successfully.`);
        res.status(200).send('Backup completed successfully.');
    } catch (err) {
        console.error(`Error during database backup: ${err.message}`);
        logBackupStatus(new Date().toISOString(), 'full', false, `Error during database backup: ${err.message}`);
        logError(err); // Log the error to file
        res.status(500).send(`Error during database backup: ${err.message}`);
    } finally {
        sql.close();
    }
};

module.exports = {
    performBackup,
    scheduleBackup,
    getBackupLog
};
