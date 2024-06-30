const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const { logError } = require('./error_report'); // Import the logError function

const createSecondaryDatabase = async (password, primary_database) => {
    let pool;
    console.log(password)
    try {
        const config = {
            user: 'sa',
            password: password,
            server: 'localhost',
            database: primary_database,
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        };

        const destinationConfig = {
            user: 'sa',
            password: password,
            server: 'localhost',
            database: `${primary_database}_Secondary`,
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        };
        
        pool = await sql.connect(config);
        console.log("success config")

        const request = pool.request();

        const createDbQuery = `
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${destinationConfig.database}')
            BEGIN
                CREATE DATABASE [${destinationConfig.database}]
            END
        `;

        await request.query(createDbQuery);
        console.log('Secondary database created successfully or already exists.');
    } catch (err) {
        console.error('Error creating secondary database:', err.message);
        logError(err);
        throw err;
    } finally {
        if (pool) await pool.close();
    }
};

async function backupLogs( password, primary_database, backup_database_path, backup_log_path) {
    const config = {
        user: 'sa',
        password: password,
        server: 'localhost',
        database: primary_database,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    const destinationConfig = {
        user: 'sa',
        password: password,
        server: 'localhost',
        database: `${primary_database}_Secondary`,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
    
    let pool;
    try {
        pool = await sql.connect(config);
        // const backupDir = path.join(__dirname, '..', 'backups');
        // if (!fs.existsSync(backupDir)) {
        //     fs.mkdirSync(backupDir);
        // }

        // console.log("backup directory", backupDir)
        // Backup full database
        const backupDatabasePath = backup_database_path;
        const backupDatabaseQuery = `
            BACKUP DATABASE [${config.database}] TO DISK='${backupDatabasePath}'
        `;
        await pool.request().query(backupDatabaseQuery);

        // Backup transaction log
        const backupPath = backup_log_path;
        const backupQuery = `BACKUP LOG [${config.database}] TO DISK='${backupPath}'`;
        await pool.request().query(backupQuery);

        console.log(`Log backup successful: ${backupPath}`);
        return { backupPath, backupDatabasePath };
    } catch (err) {
        console.error('Error during log backup:', err);
        throw err;
    } finally {
        if (pool) await pool.close();
    }
}

async function restoreLogs(req, res) {
    const { password, primary_database, backup_database_path, backup_log_path } = req.body

    const database = `${primary_database}_Secondary`
    console.log(database)

    const destinationConfig = {
        user: 'sa',
        password: password,
        server: 'localhost',
        database: database,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    let pool;
    try {
        // Create secondary database if not already existing
        await createSecondaryDatabase(password, primary_database);

        // Backup transaction logs
        const backupPaths = await backupLogs(password, primary_database, backup_database_path, backup_log_path);

        // Connect to the destination SQL Server
        pool = await sql.connect(destinationConfig);

        // Retrieve logical file names from the backup file
        const logicalFileNames = await retrieveLogicalFileNames(destinationConfig.database, backupPaths.backupDatabasePath, password);
        console.log('Logical file names:', logicalFileNames);

        let mdfDestinationPath, ldfDestinationPath;

        // Assuming the format is consistent, handle based on the known naming convention
        logicalFileNames.forEach(file => {
            if (file.includes('_log' || '_Log')) {
                ldfDestinationPath = `D:/perSI/4th/ABD/New folder/MSSQL16.MSSQLSERVER/MSSQL/DATA/${destinationConfig.database}_log.ldf`;
            } else {
                mdfDestinationPath = `D:/perSI/4th/ABD/New folder/MSSQL16.MSSQLSERVER/MSSQL/DATA/${destinationConfig.database}.mdf`;
            }
        });

        console.log(mdfDestinationPath)
        console.log(ldfDestinationPath)

        const moveStatements = logicalFileNames.map(file => {
            if (file.includes('_log' || '_Log')) {
                // console.log("if is log", file)
                return `MOVE '${file}' TO '${ldfDestinationPath}'`;
            } else {
                // console.log("not log", file)
                return `MOVE '${file}' TO '${mdfDestinationPath}'`;
            }
        }).join(',\n');

        console.log(moveStatements)

        // Restore full database backup with NORECOVERY
        const restoreFullQuery = `
            USE master;
            RESTORE DATABASE [${destinationConfig.database}] 
            FROM DISK='${backupPaths.backupDatabasePath}' 
            WITH REPLACE, NORECOVERY, REPLACE,
            ${moveStatements}
        `;

        await pool.request().query(restoreFullQuery);
        console.log("Full database restore completed.");

        // Restore transaction log backups with NORECOVERY
        const restoreLogQuery = `
            USE master;
            RESTORE LOG [${destinationConfig.database}] 
            FROM DISK='${backupPaths.backupPath}' 
            WITH NORECOVERY, STATS = 10;
        `;
        await pool.request().query(restoreLogQuery);
        console.log(`Transaction log restore completed: ${backupPaths.backupPath}`);

        // Finalize with RECOVERY to bring the database online
        const finalizeQuery = `
            USE master;
            RESTORE DATABASE [${destinationConfig.database}]
            WITH RECOVERY;
        `;
        await pool.request().query(finalizeQuery);
        console.log(`Database ${destinationConfig.database} restored and recovered successfully.`);
        return res.status(200).send('Log Shipping completed successfully')
    } catch (err) {
        console.error('Error during log restore:', err);
        logError(err); // Assuming you have a function to log errors
        throw err;
    // }
    } finally {
        if (pool) await pool.close();
        sql.close(); // Ensure all connections are closed
    }
}

async function retrieveLogicalFileNames(primary_database, backupFilePath, password) {
    const destinationConfig = {
        user: 'sa',
        password: password,
        server: 'localhost',
        database: `${primary_database}_Secondary`,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
    let pool;
    try {
        // Connect to SQL Server
        pool = await sql.connect(destinationConfig);

        // Query to retrieve logical file names
        const getFileListQuery = `
            RESTORE FILELISTONLY
            FROM DISK='${backupFilePath}';
        `;

        // Execute query and retrieve results
        const result = await pool.request().query(getFileListQuery);

        // Extract logical file names
        const logicalFileNames = result.recordset.map(row => row.LogicalName);
        console.log(logicalFileNames);
        return logicalFileNames;
    } catch (err) {
        console.error('Error retrieving logical file names:', err);
        throw err; 
    }
}

// Function to check log shipping service status (GET endpoint)
const checkLogShippingService = (req, res) => {
    console.log('Using the GET endpoint for log shipping service');
    res.send('Log Shipping Service Running');
};

module.exports = {
    restoreLogs,
    checkLogShippingService
}