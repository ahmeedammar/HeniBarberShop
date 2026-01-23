import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(`
            INSERT INTO users (email, password, full_name, phone, role)
            VALUES (?, ?, ?, ?, 'client')
        `, [email, hashedPassword, fullName, phone || null]);

        // Support both better-sqlite3 and libsql lastInsertRowid
        const userId = result.lastInsertRowid || result.lastInsertRowid;

        // Get the actual user to be sure
        const newUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        const token = jwt.sign(
            { id: newUser.id || newUser.ID, email, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: newUser.id || newUser.ID,
                email: newUser.email || newUser.EMAIL,
                fullName: newUser.full_name || newUser.FULL_NAME,
                phone: newUser.phone || newUser.PHONE,
                role: 'client'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Handle possible uppercase keys from some drivers
        const userPassword = user.password || user.PASSWORD;
        const validPassword = await bcrypt.compare(password, userPassword);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userId = user.id || user.ID;
        const userEmail = user.email || user.EMAIL;
        const userRole = user.role || user.ROLE;

        const token = jwt.sign(
            { id: userId, email: userEmail, role: userRole },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: userId,
                email: userEmail,
                fullName: user.full_name || user.FULL_NAME,
                phone: user.phone || user.PHONE,
                role: userRole
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
