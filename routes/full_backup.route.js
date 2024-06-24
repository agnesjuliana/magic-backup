const express = require('express');
const router = express.Router();
const backupController = require('../controllers/full_backup.controller');

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Operations related to database backup
 */

/**
 * @swagger
 * /backup:
 *   post:
 *     summary: Perform a full database backup
 *     description: Initiates a full backup of the specified database.
 *     responses:
 *       200:
 *         description: Backup completed successfully.
 *       500:
 *         description: Error during database backup.
 */
router.post('/', backupController.performBackup);

/**
 * @swagger
 * /backup:
 *   get:
 *     summary: Check if backup service is running
 *     responses:
 *       200:
 *         description: Backup Service Running
 */
router.get('/', backupController.checkService);

module.exports = router;
