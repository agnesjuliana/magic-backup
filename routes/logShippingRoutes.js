const express = require('express');
const router = express.Router();
const logShippingController = require('../controllers/logShippingController');

/**
 * @swagger
 * /log-shipping:
 *   post:
 *     summary: Perform log shipping
 *     description: Backup and restore log files for the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: The password for the SQL Server user.
 *                 example: your_db_password
 *               primary_database:
 *                 type: string
 *                 description: The name of the destination database.
 *                 example: AdventureWorks2022_Third
 *               backup_database_path:
 *                 type: string
 *                 description: The path to the full backup file.
 *                 example: path_to_full_backup.bak
 *               backup_log_path:
 *                 type: string
 *                 description: The path to the log backup file.
 *                 example: path_to_log_backup.trn
 *     responses:
 *       200:
 *         description: Log shipping completed successfully.
 *       500:
 *         description: Error during log shipping.
 */
router.post('/', logShippingController.restoreLogs);

/**
 * @swagger 
 * /log-shipping:
 *   get:
 *     summary: Check log shipping service status
 *     description: Check if the log shipping service is running.
 *     responses:
 *       200:
 *         description: Log Shipping Service Running.
 */
router.get('/', logShippingController.checkLogShippingService);

module.exports = router;
