const sql = require('mssql');
const path = require('path');

let intervalId = null;
let backupInterval = 60000; // Default to 1 minute

/**
 * Function to log transaction at specified interval
 * @param {Object} options Options object containing password, database, and backupPath
 */
const logTransaction = async (options) => {
    const { password, database, backupPath } = options;

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

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const timestamp = `${year}${month}${day}${hours}${minutes}`;
    const logFileName = `${database}_${timestamp}_log.bak`;
    const logFilePath = path.join(path.dirname(backupPath), logFileName);

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        const backupLogQuery = `
            BACKUP LOG [${database}]
            TO DISK = '${logFilePath}'
            WITH NOFORMAT, NOINIT, NAME = '${database}-Log Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
        `;

        await request.query(backupLogQuery);
        console.log(`Transaction log backup completed successfully at ${now}`);
    } catch (err) {
        console.error('Error during transaction log backup:', err);
    } finally {
        sql.close();
    }
};

/**
 * Start the logging process with a specified interval
 * @param {*} req Express request object containing options in the body
 * @param {*} res Express response object
 */
const startLogging = (req, res) => {
    const { password, database, backupPath, interval } = req.body;

    // Validate input
    if (!password || !database || !backupPath || !interval) {
        return res.status(400).send('Missing required fields.');
    }

    // Clear previous interval if exists
    if (intervalId) {
        clearInterval(intervalId);
    }

    backupInterval = interval * 60000; // Convert minutes to milliseconds

    // Start logging with the specified interval
    intervalId = setInterval(() => {
        logTransaction({ password, database, backupPath });
    }, backupInterval);

    res.status(200).send(`Logging started with an interval of ${interval} minutes.`);
};

/**
 * Stop the logging process
 * @param {*} req Express request object
 * @param {*} res Express response object
 */
const stopLogging = (req, res) => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        res.status(200).send('Logging stopped.');
    } else {
        res.status(400).send('Logging is not running.');
    }
};

module.exports = {
    startLogging,
    stopLogging
};
