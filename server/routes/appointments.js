import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all appointments (admin only)
router.get('/admin/appointments', authenticateToken, requireAdmin, (req, res) => {
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

        const appointments = db.prepare(query).all(...params);
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get client appointments
router.get('/client/appointments', authenticateToken, (req, res) => {
    try {
        const appointments = db.prepare(`
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
    `).all(req.user.id);

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Create appointment
router.post('/appointments', authenticateToken, (req, res) => {
    try {
        const { serviceId, barberId, appointmentDate, appointmentTime, notes } = req.body;

        if (!serviceId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ error: 'Service, date, and time are required' });
        }

        // Check if slot is available
        let isBooked = false;
        if (barberId) {
            const booked = db.prepare(`
                SELECT id FROM appointments
                WHERE appointment_date = ? AND appointment_time = ?
                AND barber_id = ?
                AND status IN ('pending', 'accepted')
            `).get(appointmentDate, appointmentTime, barberId);
            isBooked = !!booked;
        } else {
            const activeBarbersCount = db.prepare('SELECT COUNT(*) as count FROM barbers WHERE is_active = 1').get().count;
            const bookedBarbersCount = db.prepare(`
                SELECT COUNT(DISTINCT barber_id) as count FROM appointments
                WHERE appointment_date = ? AND appointment_time = ?
                AND barber_id IS NOT NULL
                AND status IN ('pending', 'accepted')
            `).get(appointmentDate, appointmentTime).count;
            const anyBarberBooked = db.prepare(`
                SELECT COUNT(*) as count FROM appointments
                WHERE appointment_date = ? AND appointment_time = ?
                AND barber_id IS NULL
                AND status IN ('pending', 'accepted')
            `).get(appointmentDate, appointmentTime).count;

            isBooked = (bookedBarbersCount + anyBarberBooked) >= activeBarbersCount;
        }

        if (isBooked) {
            return res.status(409).json({ error: 'This time slot is no longer available' });
        }

        // Create appointment
        const result = db.prepare(`
      INSERT INTO appointments (client_id, service_id, barber_id, appointment_date, appointment_time, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, serviceId, barberId || null, appointmentDate, appointmentTime, notes || null);

        // Create notification for admins
        const admins = db.prepare('SELECT id FROM users WHERE role = ?').all('admin');
        const notificationStmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `);

        admins.forEach(admin => {
            notificationStmt.run(
                admin.id,
                'New Appointment Request',
                `New booking request for ${appointmentDate} at ${appointmentTime}`,
                'appointment'
            );
        });

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
router.patch('/appointments/:id/status', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        if (!['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Get appointment details
        const appointment = db.prepare(`
      SELECT a.*, u.id as client_id, u.full_name as client_name
      FROM appointments a
      JOIN users u ON a.client_id = u.id
      WHERE a.id = ?
    `).get(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Update appointment
        db.prepare(`
      UPDATE appointments
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, adminNotes || null, id);

        // Create notification for client
        let notificationTitle = 'Appointment Update';
        let notificationMessage = '';

        switch (status) {
            case 'accepted':
                notificationTitle = 'Appointment Confirmed!';
                notificationMessage = `Your appointment on ${appointment.appointment_date} at ${appointment.appointment_time} has been confirmed.`;
                break;
            case 'rejected':
                notificationTitle = 'Appointment Declined';
                notificationMessage = `Unfortunately, your appointment request for ${appointment.appointment_date} at ${appointment.appointment_time} could not be accommodated.`;
                break;
            case 'cancelled':
                notificationTitle = 'Appointment Cancelled';
                notificationMessage = `Your appointment on ${appointment.appointment_date} at ${appointment.appointment_time} has been cancelled.`;
                break;
        }

        if (notificationMessage) {
            db.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(appointment.client_id, notificationTitle, notificationMessage, 'appointment');
        }

        res.json({ message: 'Appointment status updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Get available time slots
router.get('/available-slots', (req, res) => {
    try {
        const { date, barberId } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        // Get day of week (0 = Sunday, 6 = Saturday)
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        // Get working hours for this day
        const workingHours = db.prepare(`
      SELECT start_time, end_time
      FROM working_hours
      WHERE day_of_week = ? AND is_active = 1
    `).get(dayOfWeek);

        if (!workingHours) {
            return res.json([]);
        }

        // Generate time slots (30-minute intervals)
        const slots = [];
        const [startHour, startMin] = workingHours.start_time.split(':').map(Number);
        const [endHour, endMin] = workingHours.end_time.split(':').map(Number);

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 30) {
                if (hour === startHour && min < startMin) continue;
                if (hour === endHour - 1 && min >= endMin) break;

                const timeSlot = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

                // Check availability
                let isBooked = false;
                if (barberId) {
                    const booked = db.prepare(`
                        SELECT id FROM appointments
                        WHERE appointment_date = ? AND appointment_time = ?
                        AND barber_id = ?
                        AND status IN ('pending', 'accepted')
                    `).get(date, timeSlot, barberId);
                    isBooked = !!booked;
                } else {
                    // If no specific barber, check if all active barbers are booked
                    const activeBarbersCount = db.prepare('SELECT COUNT(*) as count FROM barbers WHERE is_active = 1').get().count;
                    const bookedBarbersCount = db.prepare(`
                        SELECT COUNT(DISTINCT barber_id) as count FROM appointments
                        WHERE appointment_date = ? AND appointment_time = ?
                        AND barber_id IS NOT NULL
                        AND status IN ('pending', 'accepted')
                    `).get(date, timeSlot).count;

                    // Also check if there's an appointment with "Any Barber" (barber_id IS NULL)
                    const anyBarberBooked = db.prepare(`
                        SELECT COUNT(*) as count FROM appointments
                        WHERE appointment_date = ? AND appointment_time = ?
                        AND barber_id IS NULL
                        AND status IN ('pending', 'accepted')
                    `).get(date, timeSlot).count;

                    isBooked = (bookedBarbersCount + anyBarberBooked) >= activeBarbersCount;
                }

                if (!isBooked) {
                    slots.push(timeSlot);
                }
            }
        }

        res.json(slots);
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ error: 'Failed to fetch available slots' });
    }
});

export default router;
