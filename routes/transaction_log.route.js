const express = require('express');
const router = express.Router();
const transactionLogController = require('../controllers/transaction_log.controller');

/**
 * @swagger
 * /transaction-log/start:
 *   post:
 *     summary: Start logging transactions
 *     description: Start logging transactions with a specified interval in minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password for database connection.
 *                 example: your_password
 *               database:
 *                 type: string
 *                 description: Database name for transaction log backup.
 *                 example: your_database
 *               backupPath:
 *                 type: string
 *                 description: Path for storing transaction log backups.
 *                 example: C:/ABD A/Tes/coba_keamanan.bak
 *               interval:
 *                 type: number
 *                 description: Interval in minutes for logging transactions.
 *                 example: 15
 *     responses:
 *       200:
 *         description: Logging started with the specified interval.
 *       400:
 *         description: Invalid request or logging already running.
 */
router.post('/start', transactionLogController.startLogging);

/**
 * @swagger
 * /transaction-log/stop:
 *   post:
 *     summary: Stop logging transactions
 *     description: Stop the logging of transactions.
 *     responses:
 *       200:
 *         description: Logging stopped.
 *       400:
 *         description: Logging is not running.
 */
router.post('/stop', transactionLogController.stopLogging);

module.exports = router;
