const sql = require('mssql');
const { logError } = require('./error_report'); // Import the logError function

/**
 * Perform a differential database backup
 * @param {*} req Express request object
 * @param {*} res Express response object
 */
const performDiffBackup = async (req, res) => {
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

    console.log('Using the POST endpoint for differential backup');

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        const backupQuery = `
            BACKUP DATABASE [${database}]
            TO DISK = '${backupPath}'
            WITH DIFFERENTIAL, NOFORMAT, NOINIT, NAME = '${database}-Differential Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
        `;

        console.log(backupQuery);
        await request.query(backupQuery);
        console.log('Database differential backup completed successfully.');
        res.status(200).send('Differential backup completed successfully.');
    } catch (err) {
        console.error('Error during differential database backup:', err);
        logError(err); // Log the error to file
        res.status(500).send('Error during differential database backup.');
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
    performDiffBackup,
    checkService,
};
