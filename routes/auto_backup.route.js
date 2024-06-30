const express = require('express');
const router = express.Router();
const autoBackupController = require('../controllers/auto_backup.controller');

/**
 * @swagger
 * /backup/set-schedule/full:
 *   post:
 *     summary: Set schedule for full backup
 *     description: Allows users to set the schedule time for full database backup.
 *     tags: [Backup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_time:
 *                 type: string
 *                 description: Scheduled date and time for backup (e.g., "2024-07-01T12:00:00").
 *               timeZone:
 *                 type: string
 *                 description: Time zone for the scheduled time (e.g., "Asia/Jakarta").
 *     responses:
 *       200:
 *         description: Full backup schedule time set successfully.
 *       500:
 *         description: Invalid request body or schedule time.
 */
router.post('/set-schedule/full', autoBackupController.scheduleBackup);

/**
 * @swagger
 * /backup/set-schedule/diff:
 *   post:
 *     summary: Set schedule for differential backup
 *     description: Allows users to set the schedule time for differential database backup.
 *     tags: [Backup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_time:
 *                 type: string
 *                 description: Scheduled date and time for backup (e.g., "2024-07-01T12:00:00").
 *               timeZone:
 *                 type: string
 *                 description: Time zone for the scheduled time (e.g., "Asia/Jakarta").
 *     responses:
 *       200:
 *         description: Differential backup schedule time set successfully.
 *       500:
 *         description: Invalid request body or schedule time.
 */
router.post('/set-schedule/diff', autoBackupController.scheduleBackup);

/**
 * @swagger
 * /backup/status:
 *   get:
 *     summary: Get backup status
 *     description: Retrieve the status of the latest backups.
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Successfully retrieved backup status.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                     description: The time when the backup was performed.
 *                   backupType:
 *                     type: string
 *                     description: The type of backup (full or diff).
 *                   success:
 *                     type: boolean
 *                     description: Whether the backup was successful.
 *                   message:
 *                     type: string
 *                     description: Additional information or error message.
 *       500:
 *         description: Error retrieving backup status.
 */
router.get('/status', autoBackupController.getBackupLog);

module.exports = router;
