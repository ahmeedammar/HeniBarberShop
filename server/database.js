import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  // Users table (both clients and admins)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Barbers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bio TEXT,
      image_url TEXT,
      specialty TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Services table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
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
    )
  `);

  // Working hours table
  db.exec(`
    CREATE TABLE IF NOT EXISTS working_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL CHECK(day_of_week >= 0 AND day_of_week <= 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Unavailable slots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS unavailable_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barber_id INTEGER,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      reason TEXT,
      FOREIGN KEY (barber_id) REFERENCES barbers(id)
    )
  `);

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Insert default admin user (password: admin123)
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@barbershop.com');
  if (!adminExists) {
    // bcrypt hash for 'admin123'
    db.prepare(`
      INSERT INTO users (email, password, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run('admin@barbershop.com', '$2b$10$4KgtMtSuHpcWFrM8kJFKe.5Pm9sEePB6e4oDj2mvzXPJExqKt9CX6', 'Administrator', 'admin');
  }

  // Insert default services
  const servicesCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (servicesCount.count === 0) {
    const services = [
      { name: 'service_classic', description: 'service_classic_desc', price: 15, duration: 30 },
      { name: 'service_beard', description: 'service_beard_desc', price: 10, duration: 20 },
      { name: 'service_combo', description: 'service_combo_desc', price: 20, duration: 45 },
      { name: 'service_shave', description: 'service_shave_desc', price: 12, duration: 30 },
      { name: 'service_kids', description: 'service_kids_desc', price: 8, duration: 25 },
      { name: 'service_color', description: 'service_color_desc', price: 25, duration: 60 }
    ];

    const insertService = db.prepare(`
      INSERT INTO services (name, description, price, duration)
      VALUES (?, ?, ?, ?)
    `);

    services.forEach(service => {
      insertService.run(service.name, service.description, service.price, service.duration);
    });
  }

  // Insert default barbers
  const barbersCount = db.prepare('SELECT COUNT(*) as count FROM barbers').get();
  if (barbersCount.count === 0) {
    const barbers = [
      {
        name: 'Heni Njeh',
        bio: 'barber_heni_bio',
        specialty: 'barber_heni_specialty',
        image_url: '/src/assets/lem3alemm.png'
      },
      {
        name: 'Amine Chaachoue',
        bio: 'barber_amine_bio',
        specialty: 'barber_amine_specialty',
        image_url: '/src/assets/amine.png'
      }
    ];

    const insertBarber = db.prepare(`
      INSERT INTO barbers (name, bio, specialty, image_url)
      VALUES (?, ?, ?, ?)
    `);

    barbers.forEach(barber => {
      insertBarber.run(barber.name, barber.bio, barber.specialty, barber.image_url);
    });
  }

  // Insert default working hours (Monday-Saturday, 9AM-7PM)
  const hoursCount = db.prepare('SELECT COUNT(*) as count FROM working_hours').get();
  if (hoursCount.count === 0) {
    const insertHours = db.prepare(`
      INSERT INTO working_hours (day_of_week, start_time, end_time)
      VALUES (?, ?, ?)
    `);

    // Monday (1) to Saturday (6)
    for (let day = 1; day <= 6; day++) {
      insertHours.run(day, '09:00', '19:00');
    }
  }

  console.log('✅ Database initialized successfully');
}

export default db;
