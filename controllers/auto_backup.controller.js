const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123',
    server: '127.0.0.1',
    database: 'WideWorldImporters',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

/**
 * Perform a full database backup
 */
const performFullBackup = async () => {
    const backupPath = 'C:\WideWorldImporters-Full.bak';

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        const backupQuery = `
            BACKUP DATABASE [${config.database}]
            TO DISK = '${backupPath}'
            WITH NOFORMAT, NOINIT, NAME = '${config.database}-FullBackup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
        `;

        await request.query(backupQuery);
        console.log('Full database backup completed successfully.');
    } catch (err) {
        console.error('Error during full database backup:', err);
    } finally {
        sql.close();
    }
};

/**
 * Perform a differential database backup
 */
const performDiffBackup = async () => {
    const backupPath = 'C:\WideWorldImporters-Full.bak';  // Replace with your desired backup path

    try {
        let pool = await sql.connect(config);
        let request = pool.request();

        const backupQuery = `
            BACKUP DATABASE [${config.database}]
            TO DISK = '${backupPath}'
            WITH DIFFERENTIAL, NOFORMAT, NOINIT, NAME = '${config.database}-DiffBackup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
        `;

        await request.query(backupQuery);
        console.log('Differential database backup completed successfully.');
    } catch (err) {
        console.error('Error during differential database backup:', err);
    } finally {
        sql.close();
    }
};

/**
 * API endpoint to trigger full database backup
 * Usage: Send a POST request to this endpoint
 */
const backupFullDatabase = async (req, res) => {
    try {
        await performFullBackup();
        res.status(200).send('Full database backup completed successfully.');
    } catch (err) {
        console.error('Error during full database backup:', err);
        res.status(500).send('Error during full database backup.');
    }
};

/**
 * API endpoint to trigger differential database backup
 * Usage: Send a POST request to this endpoint
 */
const backupDiffDatabase = async (req, res) => {
    try {
        await performDiffBackup();
        res.status(200).send('Differential database backup completed successfully.');
    } catch (err) {
        console.error('Error during differential database backup:', err);
        res.status(500).send('Error during differential database backup.');
    }
};

module.exports = {
    backupFullDatabase,
    backupDiffDatabase
};
