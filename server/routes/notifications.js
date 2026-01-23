import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to normalize rows
const normalize = (rows) => {
    if (!rows) return rows;
    if (Array.isArray(rows)) return rows.map(r => normalize(r));
    const entry = {};
    for (const key in rows) {
        entry[key.toLowerCase()] = rows[key];
    }
    return entry;
};

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await db.all(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [req.user.id]);
        res.json(normalize(notifications));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.run(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.id]);
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all as read
router.patch('/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await db.run(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = ?
        `, [req.user.id]);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Get unread count
router.get('/notifications/unread-count', authenticateToken, async (req, res) => {
    try {
        const result = await db.get(`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = ? AND is_read = 0
        `, [req.user.id]);
        res.json({ count: result.count || result.COUNT || 0 });
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ error: 'Failed to fetch notification count' });
    }
});

export default router;
