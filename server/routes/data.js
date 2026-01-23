import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to normalize rows (handles case sensitivity in results)
const normalize = (rows) => {
    if (!rows) return rows;
    if (Array.isArray(rows)) {
        return rows.map(r => normalize(r));
    }
    const entry = {};
    for (const key in rows) {
        entry[key.toLowerCase()] = rows[key];
    }
    return entry;
};

// Get all services
router.get('/services', async (req, res) => {
    try {
        const services = await db.all('SELECT * FROM services WHERE is_active = 1 ORDER BY name');
        res.json(normalize(services));
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Get all barbers
router.get('/barbers', async (req, res) => {
    try {
        const barbers = await db.all('SELECT * FROM barbers WHERE is_active = 1 ORDER BY name');
        res.json(normalize(barbers));
    } catch (error) {
        console.error('Error fetching barbers:', error);
        res.status(500).json({ error: 'Failed to fetch barbers' });
    }
});

// Create service (admin only)
router.post('/services', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, price, duration } = req.body;

        if (!name || !price || !duration) {
            return res.status(400).json({ error: 'Name, price, and duration are required' });
        }

        const result = await db.run(`
            INSERT INTO services (name, description, price, duration)
            VALUES (?, ?, ?, ?)
        `, [name, description || null, price, duration]);

        res.status(201).json({
            message: 'Service created successfully',
            serviceId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Update service (admin only)
router.patch('/services/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, duration, isActive } = req.body;

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            params.push(price);
        }
        if (duration !== undefined) {
            updates.push('duration = ?');
            params.push(duration);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        params.push(id);

        await db.run(`
            UPDATE services
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);

        res.json({ message: 'Service updated successfully' });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// Create barber (admin only)
router.post('/barbers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, bio, imageUrl, specialty } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await db.run(`
            INSERT INTO barbers (name, bio, image_url, specialty)
            VALUES (?, ?, ?, ?)
        `, [name, bio || null, imageUrl || null, specialty || null]);

        res.status(201).json({
            message: 'Barber created successfully',
            barberId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error creating barber:', error);
        res.status(500).json({ error: 'Failed to create barber' });
    }
});

// Update barber (admin only)
router.patch('/barbers/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, bio, imageUrl, specialty, isActive } = req.body;

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            params.push(bio);
        }
        if (imageUrl !== undefined) {
            updates.push('image_url = ?');
            params.push(imageUrl);
        }
        if (specialty !== undefined) {
            updates.push('specialty = ?');
            params.push(specialty);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        params.push(id);

        await db.run(`
            UPDATE barbers
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);

        res.json({ message: 'Barber updated successfully' });
    } catch (error) {
        console.error('Error updating barber:', error);
        res.status(500).json({ error: 'Failed to update barber' });
    }
});

// Get working hours
router.get('/working-hours', async (req, res) => {
    try {
        const hours = await db.all('SELECT * FROM working_hours ORDER BY day_of_week');
        res.json(normalize(hours));
    } catch (error) {
        console.error('Error fetching working hours:', error);
        res.status(500).json({ error: 'Failed to fetch working hours' });
    }
});

// Update working hours (admin only)
router.patch('/working-hours/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime, isActive } = req.body;

        const updates = [];
        const params = [];

        if (startTime !== undefined) {
            updates.push('start_time = ?');
            params.push(startTime);
        }
        if (endTime !== undefined) {
            updates.push('end_time = ?');
            params.push(endTime);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        params.push(id);

        await db.run(`
            UPDATE working_hours
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);

        res.json({ message: 'Working hours updated successfully' });
    } catch (error) {
        console.error('Error updating working hours:', error);
        res.status(500).json({ error: 'Failed to update working hours' });
    }
});

export default router;
