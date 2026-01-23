import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if we should use Turso (Production)
const useTurso = process.env.TURSO_URL && process.env.TURSO_AUTH_TOKEN;

let db;
let client;

if (useTurso) {
  console.log('🌐 Connecting to Turso Cloud Database');
  client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
  console.log('📁 Using local SQLite database:', dbPath);
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
}

// Database wrapper to unify the API
const dbWrapper = {
  // For INSERT, UPDATE, DELETE
  run: async (sql, params = []) => {
    if (useTurso) {
      return await client.execute({ sql, args: params });
    }
    return db.prepare(sql).run(...params);
  },
  // For SELECT (one result)
  get: async (sql, params = []) => {
    if (useTurso) {
      const result = await client.execute({ sql, args: params });
      return result.rows[0];
    }
    return db.prepare(sql).get(...params);
  },
  // For SELECT (multiple results)
  all: async (sql, params = []) => {
    if (useTurso) {
      const result = await client.execute({ sql, args: params });
      return result.rows;
    }
    return db.prepare(sql).all(...params);
  },
  // For raw execution
  exec: async (sql) => {
    if (useTurso) {
      return await client.execute(sql);
    }
    return db.exec(sql);
  }
};

// Initialize database schema
export async function initDatabase() {
  console.log('🏁 Initializing database...');

  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    `CREATE TABLE IF NOT EXISTS barbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            bio TEXT,
            image_url TEXT,
            specialty TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    `CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            duration INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    `CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            barber_id INTEGER,
            service_id INTEGER NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
            notes TEXT,
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES users(id),
            FOREIGN KEY (barber_id) REFERENCES barbers(id),
            FOREIGN KEY (service_id) REFERENCES services(id)
        )`,
    `CREATE TABLE IF NOT EXISTS working_hours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_of_week INTEGER NOT NULL CHECK(day_of_week >= 0 AND day_of_week <= 6),
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1
        )`,
    `CREATE TABLE IF NOT EXISTS unavailable_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barber_id INTEGER,
            start_datetime TEXT NOT NULL,
            end_datetime TEXT NOT NULL,
            reason TEXT,
            FOREIGN KEY (barber_id) REFERENCES barbers(id)
        )`,
    `CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`
  ];

  for (const sql of schema) {
    await dbWrapper.exec(sql);
  }

  // Default admin
  const adminExists = await dbWrapper.get('SELECT id FROM users WHERE email = ?', ['admin@barbershop.com']);
  if (!adminExists) {
    await dbWrapper.run(`
            INSERT INTO users (email, password, full_name, role)
            VALUES (?, ?, ?, ?)
        `, ['admin@barbershop.com', '$2b$10$4KgtMtSuHpcWFrM8kJFKe.5Pm9sEePB6e4oDj2mvzXPJExqKt9CX6', 'Administrator', 'admin']);
  }

  // Default services
  const servicesCount = await dbWrapper.get('SELECT COUNT(*) as count FROM services');
  if (servicesCount.count === 0 || servicesCount.COUNT === 0) {
    const services = [
      ['service_classic', 'service_classic_desc', 15, 30],
      ['service_beard', 'service_beard_desc', 10, 20],
      ['service_combo', 'service_combo_desc', 20, 45],
      ['service_shave', 'service_shave_desc', 12, 30],
      ['service_kids', 'service_kids_desc', 8, 25],
      ['service_color', 'service_color_desc', 25, 60]
    ];
    for (const s of services) {
      await dbWrapper.run('INSERT INTO services (name, description, price, duration) VALUES (?, ?, ?, ?)', s);
    }
  }

  // Default barbers
  const barbersCount = await dbWrapper.get('SELECT COUNT(*) as count FROM barbers');
  if (barbersCount.count === 0 || barbersCount.COUNT === 0) {
    const barbers = [
      ['Heni Njeh', 'barber_heni_bio', 'barber_heni_specialty', '/lem3alemm.png'],
      ['Amine Chaachoue', 'barber_amine_bio', 'barber_amine_specialty', '/amine.png']
    ];
    for (const b of barbers) {
      await dbWrapper.run('INSERT INTO barbers (name, bio, specialty, image_url) VALUES (?, ?, ?, ?)', b);
    }
  }

  // Default working hours
  const hoursCount = await dbWrapper.get('SELECT COUNT(*) as count FROM working_hours');
  if (hoursCount.count === 0 || hoursCount.COUNT === 0) {
    for (let day = 1; day <= 6; day++) {
      await dbWrapper.run('INSERT INTO working_hours (day_of_week, start_time, end_time) VALUES (?, ?, ?)', [day, '09:00', '19:00']);
    }
  }

  console.log('✅ Database synchronized successfully');
}

export default dbWrapper;
