const express = require('express');
const router = express.Router();
const diffBackupController = require('../controllers/diff_backup.controller');

/**
 * @swagger
 * /backup/differential:
 *   post:
 *     summary: Perform a differential database backup
 *     description: Perform a differential database backup by specifying the password, database, and backup path.
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
 *                 example: C:/ABD A/Tes/coba_keamanan_diff.bak
 *     responses:
 *       200:
 *         description: Differential backup completed successfully.
 *       500:
 *         description: Error during differential database backup.
 */
// Perform a differential database backup
router.post('/differential', diffBackupController.performDiffBackup);

module.exports = router;
