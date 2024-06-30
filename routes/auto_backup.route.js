const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const backupController = require('../controllers/auto_backup.controller');

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Operations related to database backup
 */

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
 *               localTime:
 *                 type: string
 *                 description: Local time for backup (e.g., "2024-07-01T00:00:00").
 *               timeZone:
 *                 type: string
 *                 description: Time zone for the local time (e.g., "Asia/Jakarta").
 *               password:
 *                 type: string
 *                 description: Password for the database user.
 *               database:
 *                 type: string
 *                 description: Name of the database to backup.
 *               backupPath:
 *                 type: string
 *                 description: Path where the backup file will be saved.
 *     responses:
 *       200:
 *         description: Full backup schedule time set successfully.
 *       400:
 *         description: Invalid request body or schedule time.
 *       500:
 *         description: Internal server error.
 */
router.post('/set-schedule/full', async (req, res) => {
    const { localTime, timeZone, password, database, backupPath } = req.body;

    if (!localTime || !timeZone || !password || !database || !backupPath) {
        return res.status(400).send('All fields (local time, time zone, password, database name, backup path) are required.');
    }

    try {
        await backupController.scheduleBackup(req, res, 'full');
    } catch (err) {
        res.status(400).send(`Error setting full backup schedule time: ${err.message}`);
    }
});

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
 *               localTime:
 *                 type: string
 *                 description: Local time for backup (e.g., "2024-07-01T00:00:00").
 *               timeZone:
 *                 type: string
 *                 description: Time zone for the local time (e.g., "Asia/Jakarta").
 *               password:
 *                 type: string
 *                 description: Password for the database user.
 *               database:
 *                 type: string
 *                 description: Name of the database to backup.
 *               backupPath:
 *                 type: string
 *                 description: Path where the backup file will be saved.
 *     responses:
 *       200:
 *         description: Differential backup schedule time set successfully.
 *       400:
 *         description: Invalid request body or schedule time.
 *       500:
 *         description: Internal server error.
 */
router.post('/set-schedule/diff', async (req, res) => {
    const { localTime, timeZone, password, database, backupPath } = req.body;

    if (!localTime || !timeZone || !password || !database || !backupPath) {
        return res.status(400).send('All fields (local time, time zone, password, database name, backup path) are required.');
    }

    try {
        await backupController.scheduleBackup(req, res, 'diff');
    } catch (err) {
        res.status(400).send(`Error setting differential backup schedule time: ${err.message}`);
    }
});

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
router.get('/status', async (req, res) => {
    try {
        const logs = await backupController.getBackupLog();
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).send(`Error retrieving backup status: ${err.message}`);
    }
});

module.exports = router;
