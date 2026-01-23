import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';

// Import routes
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import dataRoutes from './routes/data.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database (Async)
initDatabase().then(() => {
    console.log('✅ Database Ready');
}).catch(err => {
    console.error('❌ Database Initialization Failed:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', dataRoutes);
app.use('/api', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
}

export default app;
