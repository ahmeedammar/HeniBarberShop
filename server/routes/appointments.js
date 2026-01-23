import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

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

// Get all appointments (admin only)
router.get('/admin/appointments', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = `
      SELECT 
        a.*,
        u.full_name as client_name,
        u.email as client_email,
        u.phone as client_phone,
        s.name as service_name,
        s.duration as service_duration,
        s.price as service_price,
        b.name as barber_name
      FROM appointments a
      JOIN users u ON a.client_id = u.id
      JOIN services s ON a.service_id = s.id
      LEFT JOIN barbers b ON a.barber_id = b.id
    `;

        const conditions = [];
        const params = [];

        if (status) {
            conditions.push('a.status = ?');
            params.push(status);
        }

        if (date) {
            conditions.push('a.appointment_date = ?');
            params.push(date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

        const appointments = await db.all(query, params);
        res.json(normalize(appointments));
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get client appointments
router.get('/client/appointments', authenticateToken, async (req, res) => {
    try {
        const appointments = await db.all(`
      SELECT 
        a.*,
        s.name as service_name,
        s.duration as service_duration,
        s.price as service_price,
        b.name as barber_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      LEFT JOIN barbers b ON a.barber_id = b.id
      WHERE a.client_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.user.id]);

        res.json(normalize(appointments));
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Create appointment
router.post('/appointments', authenticateToken, async (req, res) => {
    try {
        const { serviceId, barberId, appointmentDate, appointmentTime, notes } = req.body;

        if (!serviceId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ error: 'Service, date, and time are required' });
        }

        // Check availability
        let isBooked = false;
        if (barberId) {
            const booked = await db.get(`
                SELECT id FROM appointments
                WHERE appointment_date = ? AND appointment_time = ?
                AND barber_id = ?
                AND status IN ('pending', 'accepted')
            `, [appointmentDate, appointmentTime, barberId]);
            isBooked = !!booked;
        } else {
            const activeBarbers = await db.get('SELECT COUNT(*) as count FROM barbers WHERE is_active = 1');
            const activeBarbersCount = activeBarbers.count || activeBarbers.COUNT || 0;

            const bookedBarbers = await db.get(`
                SELECT COUNT(DISTINCT barber_id) as count FROM appointments
                WHERE appointment_date = ? AND appointment_time = ?
                AND barber_id IS NOT NULL
                AND status IN ('pending', 'accepted')
            `, [appointmentDate, appointmentTime]);
            const bookedBarbersCount = bookedBarbers.count || bookedBarbers.COUNT || 0;

            const anyBarberBooked = await db.get(`
                SELECT COUNT(*) as count FROM appointments
                WHERE appointment_date = ? AND appointment_time = ?
                AND barber_id IS NULL
                AND status IN ('pending', 'accepted')
            `, [appointmentDate, appointmentTime]);
            const anyBarberBookedCount = anyBarberBooked.count || anyBarberBooked.COUNT || 0;

            isBooked = (bookedBarbersCount + anyBarberBookedCount) >= activeBarbersCount;
        }

        if (isBooked) {
            return res.status(409).json({ error: 'This time slot is no longer available' });
        }

        const result = await db.run(`
            INSERT INTO appointments (client_id, service_id, barber_id, appointment_date, appointment_time, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [req.user.id, serviceId, barberId || null, appointmentDate, appointmentTime, notes || null]);

        // Notifications
        const admins = await db.all('SELECT id FROM users WHERE role = ?', ['admin']);
        for (const admin of admins) {
            await db.run(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, ?)
            `, [admin.id || admin.ID, 'New Appointment Request', `New booking request for ${appointmentDate} at ${appointmentTime}`, 'appointment']);
        }

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointmentId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// Update appointment status (admin only)
router.patch('/appointments/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        if (!['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const appointment = await db.get(`
            SELECT a.*, u.id as client_id, u.full_name as client_name
            FROM appointments a
            JOIN users u ON a.client_id = u.id
            WHERE a.id = ?
        `, [id]);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const appId = appointment.id || appointment.ID;
        const clientId = appointment.client_id || appointment.CLIENT_ID;

        await db.run(`
            UPDATE appointments
            SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, adminNotes || null, appId]);

        let notificationTitle = 'Appointment Update';
        let notificationMessage = '';
        const appDate = appointment.appointment_date || appointment.APPOINTMENT_DATE;
        const appTime = appointment.appointment_time || appointment.APPOINTMENT_TIME;

        switch (status) {
            case 'accepted':
                notificationTitle = 'Appointment Confirmed!';
                notificationMessage = `Your appointment on ${appDate} at ${appTime} has been confirmed.`;
                break;
            case 'rejected':
                notificationTitle = 'Appointment Declined';
                notificationMessage = `Unfortunately, your appointment request for ${appDate} at ${appTime} could not be accommodated.`;
                break;
            case 'cancelled':
                notificationTitle = 'Appointment Cancelled';
                notificationMessage = `Your appointment on ${appDate} at ${appTime} has been cancelled.`;
                break;
        }

        if (notificationMessage) {
            await db.run(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, ?)
            `, [clientId, notificationTitle, notificationMessage, 'appointment']);
        }

        res.json({ message: 'Appointment status updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Get available time slots
router.get('/available-slots', async (req, res) => {
    try {
        const { date, barberId } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        const workingHours = await db.get(`
            SELECT start_time, end_time FROM working_hours
            WHERE day_of_week = ? AND is_active = 1
        `, [dayOfWeek]);

        if (!workingHours) return res.json([]);

        const slots = [];
        const startTimeStr = workingHours.start_time || workingHours.START_TIME;
        const endTimeStr = workingHours.end_time || workingHours.END_TIME;
        const [startHour, startMin] = startTimeStr.split(':').map(Number);
        const [endHour, endMin] = endTimeStr.split(':').map(Number);

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 30) {
                const timeSlot = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

                let isBooked = false;
                if (barberId) {
                    const booked = await db.get(`
                        SELECT id FROM appointments
                        WHERE appointment_date = ? AND appointment_time = ?
                        AND barber_id = ?
                        AND status IN ('pending', 'accepted')
                    `, [date, timeSlot, barberId]);
                    isBooked = !!booked;
                } else {
                    const activeBarbers = await db.get('SELECT COUNT(*) as count FROM barbers WHERE is_active = 1');
                    const activeBarbersCount = activeBarbers.count || activeBarbers.COUNT || 0;

                    const bookedBarbers = await db.get(`
                        SELECT COUNT(DISTINCT barber_id) as count FROM appointments
                        WHERE appointment_date = ? AND appointment_time = ?
                        AND barber_id IS NOT NULL
                        AND status IN ('pending', 'accepted')
                    `, [date, timeSlot]);
                    const bookedBarbersCount = bookedBarbers.count || bookedBarbers.COUNT || 0;

                    const anyBarberBooked = await db.get(`
                        SELECT COUNT(*) as count FROM appointments
                        WHERE appointment_date = ? AND appointment_time = ?
                        AND barber_id IS NULL
                        AND status IN ('pending', 'accepted')
                    `, [date, timeSlot]);
                    const anyBarberBookedCount = anyBarberBooked.count || anyBarberBooked.COUNT || 0;

                    isBooked = (bookedBarbersCount + anyBarberBookedCount) >= activeBarbersCount;
                }

                if (!isBooked) slots.push(timeSlot);
            }
        }
        res.json(slots);
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ error: 'Failed to fetch available slots' });
    }
});

export default router;
