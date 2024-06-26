const sql = require('mssql');
const { logError } = require('./error_report'); // Import the logError function

const config = {
    user: 'sa',
    password: 'Mawar1189',
    server: 'localhost',
    database: 'WideWorldImporters',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

/**
 * Perform a full database backup
 * @param {*} req Express request object
 * @param {*} res Express response object
 */
const performBackup = async (req, res) => {
    console.log('Using the POST endpoint');

    const backupPath = 'D:/advanced query/wideworldimporters.bak';

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        const backupQuery = `
            BACKUP DATABASE [${config.database}]
            TO DISK = '${backupPath}'
            WITH NOFORMAT, NOINIT, NAME = '${config.database}-Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
        `;
        const err = "test"
        logError(err); // contoh penggunaan

        console.log(backupQuery);
        await request.query(backupQuery);
        console.log('Database backup completed successfully.');
        res.status(200).send('Backup completed successfully.');
    } catch (err) {
        console.error('Error during database backup:', err);
        logError(err); // Log the error to file, ini penggunaannya
        res.status(500).send('Error during database backup.');
    } finally {
        sql.close();
    }
};

/**
 * Check if backup service is running
 * @param {*} req Express request object
 * @param {*} res Express response object
 */
const checkService = (req, res) => {
    console.log('Using the GET endpoint');
    res.send('Backup Service Running');
};

module.exports = {
    performBackup,
    checkService
};
