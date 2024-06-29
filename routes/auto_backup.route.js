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
 *     responses:
 *       200:
 *         description: Full backup schedule time set successfully.
 *       500:
 *         description: Invalid request body or schedule time.
 */
router.post('/set-schedule/full', (req, res) => {
    const { localTime, timeZone } = req.body;

    if (!localTime || !timeZone) {
        return res.status(400).send('Local time and time zone are required.');
    }

    try {
        const utcTime = moment.tz(localTime, timeZone).utc().format();
        backupController.scheduleBackup(null, utcTime, 'full')
            .then(() => res.status(200).send('Full backup schedule time set successfully.'))
            .catch(err => res.status(500).send(`Error setting full backup schedule time: ${err}`));
    } catch (err) {
        res.status(400).send(`Invalid time or time zone: ${err.message}`);
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
 *     responses:
 *       200:
 *         description: Differential backup schedule time set successfully.
 *       500:
 *         description: Invalid request body or schedule time.
 */
router.post('/set-schedule/diff', (req, res) => {
    const { localTime, timeZone } = req.body;

    if (!localTime || !timeZone) {
        return res.status(400).send('Local time and time zone are required.');
    }

    try {
        const utcTime = moment.tz(localTime, timeZone).utc().format();
        backupController.scheduleBackup(null, utcTime, 'diff')
            .then(() => res.status(200).send('Differential backup schedule time set successfully.'))
            .catch(err => res.status(500).send(`Error setting differential backup schedule time: ${err}`));
    } catch (err) {
        res.status(400).send(`Invalid time or time zone: ${err.message}`);
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
