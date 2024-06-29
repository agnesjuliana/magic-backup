const express = require('express');
const router = express.Router();
const fullBackupController = require('../controllers/full_backup.controller');

/**
 * @swagger
 * /backup/full:
 *   post:
 *     summary: Perform a full database backup
 *     description: Perform a full database backup by specifying the password, database, and backup path.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password for the database user.
 *                 example: your_password
 *               database:
 *                 type: string
 *                 description: Name of the database to backup.
 *                 example: your_database
 *               backupPath:
 *                 type: string
 *                 description: Path to save the backup file.
 *                 example: C:/ABD A/Tes/coba_keamanan.bak
 *     responses:
 *       200:
 *         description: Backup completed successfully.
 *       500:
 *         description: Error during database backup.
 */
// Perform a full database backup
router.post('/full', fullBackupController.performBackup);

/**
 * @swagger
 * /backup/check:
 *   get:
 *     summary: Check if backup service is running
 *     description: Check if the backup service is running.
 *     responses:
 *       200:
 *         description: Backup service is running.
 */
// Check if backup service is running
router.get('/check', fullBackupController.checkService);

module.exports = router;
