import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(DATA_DIR, 'servicehub.db');
export const db = new Database(DB_PATH);

// Optimize SQLite for reliability and speed
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')),
      phone TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS provider_profiles (
      user_id INTEGER PRIMARY KEY,
      business_name TEXT NOT NULL,
      bio TEXT NOT NULL,
      experience_years INTEGER NOT NULL DEFAULT 1,
      hourly_rate REAL NOT NULL DEFAULT 350.0,
      service_area TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL DEFAULT 'Pune',
      state TEXT NOT NULL DEFAULT 'Maharashtra',
      pincode TEXT NOT NULL DEFAULT '411001',
      service_modes_json TEXT NOT NULL DEFAULT '["ON_SITE"]',
      languages_json TEXT NOT NULL DEFAULT '["Hindi", "English"]',
      verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      verified_badge INTEGER NOT NULL DEFAULT 0,
      aadhaar_verified INTEGER NOT NULL DEFAULT 0,
      trade_license_no TEXT,
      skills_json TEXT NOT NULL DEFAULT '[]',
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      sector TEXT NOT NULL DEFAULT 'URBAN_RURAL', -- 'HOME', 'AGRI_RURAL', 'ELECTRONICS', 'COMMUNITY'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      pricing_unit TEXT NOT NULL DEFAULT 'fixed', -- 'fixed', 'per hour', 'per visit', 'per acre / bigha', 'per sq ft'
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      image_url TEXT,
      service_mode TEXT NOT NULL DEFAULT 'ON_SITE', -- 'ON_SITE', 'AT_SHOP', 'REMOTE', 'TRAVEL'
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAUSED')),
      service_area TEXT NOT NULL,
      pincodes_covered TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      address TEXT NOT NULL,
      pincode TEXT,
      district TEXT,
      service_mode TEXT NOT NULL DEFAULT 'ON_SITE',
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_PAYMENT', 'COMPLETED', 'CANCELLED', 'REJECTED')),
      total_price REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Cash on Service / COD',
      payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PAID')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE RESTRICT,
      FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE,
      gateway_order_id TEXT NOT NULL UNIQUE,
      gateway_payment_id TEXT,
      gateway_qr_id TEXT,
      amount REAL NOT NULL,
      base_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      platform_fee REAL NOT NULL DEFAULT 29.0,
      provider_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'EXPIRED')),
      qr_string TEXT NOT NULL,
      qr_data_url TEXT,
      expires_at DATETIME NOT NULL,
      paid_at DATETIME,
      payment_method TEXT DEFAULT 'UPI_QR',
      bank_reference TEXT,
      signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS booking_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      changed_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY(changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE,
      service_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emergency_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_type TEXT NOT NULL CHECK(incident_type IN ('LPG_LEAK', 'ELECTRICAL_HAZARD', 'WATER_LEAK', 'FIRE_SMOKE', 'OTHER_URGENT')),
      severity TEXT NOT NULL DEFAULT 'HIGH' CHECK(severity IN ('CRITICAL', 'HIGH', 'MODERATE')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      district TEXT NOT NULL,
      pincode TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')),
      assigned_provider_id INTEGER,
      notes TEXT,
      accepted_at DATETIME,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(assigned_provider_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
    CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
    CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON booking_status_history(booking_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_requests(status);
    CREATE INDEX IF NOT EXISTS idx_emergency_district ON emergency_requests(district);
    CREATE INDEX IF NOT EXISTS idx_emergency_assigned ON emergency_requests(assigned_provider_id);
    CREATE INDEX IF NOT EXISTS idx_emergency_customer ON emergency_requests(customer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(gateway_order_id);
  `);

  runDatabaseMigrations();
  seedIndiaMarketplaceData();
}

function runDatabaseMigrations() {
  // 1. Add coordinates to provider_profiles if not exists
  const profileColumns = db.prepare('PRAGMA table_info(provider_profiles)').all() as any[];
  const hasLat = profileColumns.some(c => c.name === 'latitude');
  if (!hasLat) {
    db.exec(`
      ALTER TABLE provider_profiles ADD COLUMN latitude REAL;
      ALTER TABLE provider_profiles ADD COLUMN longitude REAL;
    `);
  }

  // Populate realistic coordinates based on district / city
  db.exec(`
    UPDATE provider_profiles
    SET latitude = CASE
      WHEN district LIKE '%Pune%' OR city LIKE '%Pune%' THEN 18.5204
      WHEN district LIKE '%Baramati%' OR service_area LIKE '%Baramati%' THEN 18.1517
      WHEN district LIKE '%Nashik%' OR city LIKE '%Nashik%' THEN 19.9975
      WHEN district LIKE '%Kolhapur%' OR city LIKE '%Kolhapur%' THEN 16.7050
      WHEN district LIKE '%Satara%' OR city LIKE '%Satara%' THEN 17.6805
      WHEN district LIKE '%Solapur%' OR city LIKE '%Solapur%' THEN 17.6599
      WHEN district LIKE '%Mumbai%' OR district LIKE '%Thane%' THEN 19.0760
      ELSE 18.5204
    END,
    longitude = CASE
      WHEN district LIKE '%Pune%' OR city LIKE '%Pune%' THEN 73.8567
      WHEN district LIKE '%Baramati%' OR service_area LIKE '%Baramati%' THEN 74.5772
      WHEN district LIKE '%Nashik%' OR city LIKE '%Nashik%' THEN 73.7898
      WHEN district LIKE '%Kolhapur%' OR city LIKE '%Kolhapur%' THEN 74.2433
      WHEN district LIKE '%Satara%' OR city LIKE '%Satara%' THEN 74.0183
      WHEN district LIKE '%Solapur%' OR city LIKE '%Solapur%' THEN 75.9064
      WHEN district LIKE '%Mumbai%' OR district LIKE '%Thane%' THEN 72.8777
      ELSE 73.8567
    END
    WHERE latitude IS NULL OR longitude IS NULL;
  `);

  // 2. Safe check and migration for bookings check constraint with AWAITING_PAYMENT
  const bookingSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'bookings'").get() as any)?.sql || '';
  if (!bookingSql.includes('AWAITING_PAYMENT')) {
    db.transaction(() => {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE bookings_migration_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          provider_id INTEGER NOT NULL,
          booking_date TEXT NOT NULL,
          time_slot TEXT NOT NULL,
          address TEXT NOT NULL,
          pincode TEXT,
          district TEXT,
          service_mode TEXT NOT NULL DEFAULT 'ON_SITE',
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_PAYMENT', 'COMPLETED', 'CANCELLED', 'REJECTED')),
          total_price REAL NOT NULL,
          payment_method TEXT NOT NULL DEFAULT 'Cash on Service / COD',
          payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PAID')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE RESTRICT,
          FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE
        );

        INSERT INTO bookings_migration_temp 
        SELECT id, service_id, customer_id, provider_id, booking_date, time_slot, address, pincode, district, service_mode, notes, status, total_price, payment_method, payment_status, created_at, updated_at 
        FROM bookings;

        DROP TABLE bookings;
        ALTER TABLE bookings_migration_temp RENAME TO bookings;

        CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      `);
      db.pragma('foreign_keys = ON');
    })();
  }

  // 3. Populate initial booking_status_history for existing bookings if empty
  const historyCount = (db.prepare('SELECT COUNT(*) as c FROM booking_status_history').get() as any).c;
  if (historyCount === 0) {
    const existingBookings = db.prepare('SELECT id, status, customer_id, provider_id, created_at FROM bookings').all() as any[];
    const insertHistory = db.prepare(`
      INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const b of existingBookings) {
      insertHistory.run(b.id, 'PENDING', 'Initial service booking request submitted', b.customer_id, b.created_at);
      if (b.status !== 'PENDING') {
        insertHistory.run(b.id, b.status, `Status changed to ${b.status}`, b.provider_id, b.created_at);
      }
    }
  }

  // 4. Ensure Popular Service Categories (AC Repair, Carpentry, Appliance Repair, Plumbing) are present
  const acCat = db.prepare("SELECT id FROM categories WHERE slug = 'ac-repair-maintenance'").get() as any;
  if (!acCat) {
    db.transaction(() => {
      const insertCat = db.prepare(`
        INSERT INTO categories (name, slug, description, icon_name, image_url, sector)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const acCatId = insertCat.run(
        'AC Repair & Maintenance',
        'ac-repair-maintenance',
        'Split & window AC servicing, jet-pump deep coil wash, eco-friendly gas refill, PCB repair, and compressor diagnostics.',
        'AirVent',
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        'HOME'
      ).lastInsertRowid as number;

      let carpCatId = (db.prepare("SELECT id FROM categories WHERE slug = 'carpentry-woodwork'").get() as any)?.id;
      if (!carpCatId) {
        carpCatId = insertCat.run(
          'Carpentry & Custom Woodwork',
          'carpentry-woodwork',
          'Furniture assembly, wooden door lock fixing, modular kitchen cabinet realignment, and bespoke timber craft.',
          'Hammer',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
          'HOME'
        ).lastInsertRowid as number;
      }

      let appCatId = (db.prepare("SELECT id FROM categories WHERE slug = 'appliance-repair'").get() as any)?.id;
      if (!appCatId) {
        appCatId = insertCat.run(
          'Appliance & Kitchen Repair',
          'appliance-repair',
          'Washing machine drum repair, refrigerator cooling diagnostics, microwave oven heating, and kitchen appliance care.',
          'Cpu',
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
          'ELECTRONICS'
        ).lastInsertRowid as number;
      }

      let acUser = db.prepare("SELECT id FROM users WHERE email = 'rahul.ac@servicehub.in'").get() as any;
      let acUserId: number;
      if (!acUser) {
        const proPass = bcrypt.hashSync('Pro@123', 10);
        const insUser = db.prepare(`
          INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
          VALUES (?, ?, ?, 'SERVICE_PROVIDER', ?, ?)
        `).run(
          'Rahul Shinde',
          'rahul.ac@servicehub.in',
          proPass,
          '+91 98224 55667',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        );
        acUserId = insUser.lastInsertRowid as number;

        db.prepare(`
          INSERT INTO provider_profiles (
            user_id, business_name, bio, experience_years, hourly_rate, service_area, city, district, state, pincode, latitude, longitude, service_modes_json, languages_json, verification_status, verified_badge, aadhaar_verified, trade_license_no, skills_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 1, 1, ?, ?)
        `).run(
          acUserId,
          'CoolAir Pro HVAC Solutions & AC Services',
          'Certified HVAC technician with 8 years of specialized experience in Inverter ACs, VRV systems, copper piping, and pressure washing. Daikin, Voltas, LG & Blue Star specialist.',
          8,
          450.0,
          'Pune Metro (Kothrud, Viman Nagar, Hinjawadi, Hadapsar, Baner)',
          'Pune',
          'Pune',
          'Maharashtra',
          '411038',
          18.5204,
          73.8567,
          JSON.stringify(['ON_SITE']),
          JSON.stringify(['Marathi', 'Hindi', 'English']),
          'MH-HVAC-AC-2020-5541',
          JSON.stringify(['Split AC Jet Wash', 'Gas Leakage Detection & Refill', 'Inverter PCB Diagnostics', 'AC Uninstallation & Installation'])
        );
      } else {
        acUserId = acUser.id;
      }

      const insertService = db.prepare(`
        INSERT INTO services (provider_id, category_id, title, description, price, currency, pricing_unit, duration_minutes, image_url, service_mode, status, service_area, pincodes_covered)
        VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'ON_SITE', 'ACTIVE', ?, ?)
      `);

      const sAc1 = insertService.run(
        acUserId,
        acCatId,
        'Split AC Deep Jet Foam Cleaning & Filter Wash',
        'High-pressure water jet coil wash, indoor blower cleaning, anti-microbial foam treatment, drain pipe flushing, and temperature performance testing.',
        599.0,
        'per unit',
        45,
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        'Pune Metro & Suburbs',
        '411038, 411045, 411057, 411001'
      ).lastInsertRowid as number;

      insertService.run(
        acUserId,
        acCatId,
        'AC Gas Leakage Detection & Complete R32/R410A Refill',
        'Nitrogen pressure test to detect micro-leaking joints, copper brazing repair, vacuum pump moisture purge, and complete OEM-grade refrigerant charging.',
        1899.0,
        'fixed',
        90,
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        'Pune Metro & Suburbs',
        '411038, 411045, 411057, 411001'
      );

      insertService.run(
        acUserId,
        acCatId,
        'AC Inverter PCB Circuit & Cooling Inspection',
        'Diagnostic troubleshooting for error codes, compressor tripping, sensor faults, fan motor capacitor replacement, and circuit motherboard soldering.',
        399.0,
        'per inspection',
        60,
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        'Pune Metro & Suburbs',
        '411038, 411045, 411057'
      );

      let carpUser = db.prepare("SELECT id FROM users WHERE email = 'rajesh.wood@servicehub.in'").get() as any;
      let carpUserId: number;
      if (!carpUser) {
        const proPass = bcrypt.hashSync('Pro@123', 10);
        const insUser = db.prepare(`
          INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
          VALUES (?, ?, ?, 'SERVICE_PROVIDER', ?, ?)
        `).run(
          'Rajesh Sharma',
          'rajesh.wood@servicehub.in',
          proPass,
          '+91 98229 33445',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
        );
        carpUserId = insUser.lastInsertRowid as number;
        db.prepare(`
          INSERT INTO provider_profiles (
            user_id, business_name, bio, experience_years, hourly_rate, service_area, city, district, state, pincode, latitude, longitude, service_modes_json, languages_json, verification_status, verified_badge, aadhaar_verified, trade_license_no, skills_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 1, 1, ?, ?)
        `).run(
          carpUserId,
          'Shree Ganesh Timber & Modular Woodworks',
          'Master carpenter with 14 years expertise in modular kitchen fittings, Godrej lock installations, antique wooden restoration, and custom wardrobe adjustments.',
          14,
          350.0,
          'Pune Metro & Pimpri-Chinchwad',
          'Pune',
          'Pune',
          'Maharashtra',
          '411033',
          18.6298,
          73.7997,
          JSON.stringify(['ON_SITE']),
          JSON.stringify(['Hindi', 'Marathi']),
          'MH-CARP-2016-8912',
          JSON.stringify(['Modular Kitchen Hinges', 'Door Lock & Latch Fitting', 'Bed Assembly', 'Wood Polish'])
        );
      } else {
        carpUserId = carpUser.id;
      }

      insertService.run(
        carpUserId,
        carpCatId,
        'Modular Kitchen Cabinet Hinge & Drawer Realignment',
        'Soft-close hydraulic hinge adjustments, channel lubrication, drawer alignment, and handle tightening for smooth functioning.',
        449.0,
        'fixed',
        60,
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
        'Pune & PCMC',
        '411033, 411038'
      );

      const demoCust = db.prepare("SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1").get() as any;
      if (demoCust && sAc1) {
        const dummyBooking = db.prepare(`
          INSERT INTO bookings (service_id, customer_id, provider_id, booking_date, time_slot, address, pincode, district, service_mode, notes, status, total_price, payment_method, payment_status, created_at)
          VALUES (?, ?, ?, '2026-10-20', '10:00 AM - 12:00 PM', 'Flat 402, Rohan Tarang, Wakad, Pune', '411057', 'Pune', 'ON_SITE', 'Split AC cooling weak and making rattling noise.', 'COMPLETED', 599.0, 'UPI / Online (GPay)', 'PAID', '2026-10-19 14:00:00')
        `).run(sAc1, demoCust.id, acUserId);

        db.prepare(`
          INSERT INTO reviews (booking_id, service_id, customer_id, provider_id, rating, comment, created_at)
          VALUES (?, ?, ?, ?, 5, 'Rahul reached our apartment on time with his high pressure jet pump. The cooling is icy cold now and power consumption dropped noticeably. Genuine and honest technician!', '2026-10-20 13:00:00')
        `).run(dummyBooking.lastInsertRowid, sAc1, demoCust.id, acUserId);
      }
    })();
  }
}

function seedIndiaMarketplaceData() {
  // Check if already seeded with Indian marketplace data
  const indiaCat = db.prepare("SELECT id FROM categories WHERE slug = 'agriculture-rural'").get();
  if (indiaCat) {
    return; // Already populated with India marketplace seed
  }

  const executeSeed = db.transaction(() => {
    db.exec(`
      DELETE FROM reviews;
      DELETE FROM bookings;
      DELETE FROM notifications;
      DELETE FROM services;
      DELETE FROM categories;
      DELETE FROM provider_profiles;
      DELETE FROM users;
    `);

    const saltRounds = 10;
    const adminPass = bcrypt.hashSync('Admin@123', saltRounds);
    const proPass = bcrypt.hashSync('Pro@123', saltRounds);
    const custPass = bcrypt.hashSync('Customer@123', saltRounds);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertProfile = db.prepare(`
      INSERT INTO provider_profiles (
        user_id, business_name, bio, experience_years, hourly_rate, service_area, city, district, state, pincode, service_modes_json, languages_json, verification_status, verified_badge, aadhaar_verified, trade_license_no, skills_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCategory = db.prepare(`
      INSERT INTO categories (name, slug, description, icon_name, image_url, sector)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertService = db.prepare(`
      INSERT INTO services (provider_id, category_id, title, description, price, currency, pricing_unit, duration_minutes, image_url, service_mode, status, service_area, pincodes_covered)
      VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `);

    const insertBooking = db.prepare(`
      INSERT INTO bookings (service_id, customer_id, provider_id, booking_date, time_slot, address, pincode, district, service_mode, notes, status, total_price, payment_method, payment_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertReview = db.prepare(`
      INSERT INTO reviews (booking_id, service_id, customer_id, provider_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin Account
    insertUser.run(
      'ServiceHub India Administrator',
      'admin@servicehub.in',
      adminPass,
      'ADMIN',
      '+91 98220 12345',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    );

    // 2. Demo Customer
    const cust = insertUser.run(
      'Pooja Sharma',
      'customer@servicehub.in',
      custPass,
      'CUSTOMER',
      '+91 98231 45678',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    );
    const custId = cust.lastInsertRowid as number;

    // 3. Indian Service Providers across Rural, Town, and Cities

    // Pro 1: Agriculture & Solar Tubewell Specialist (Rural / Taluka)
    const p1 = insertUser.run(
      'Rameshwar Patil',
      'rameshwar@kisanmitra.in',
      proPass,
      'SERVICE_PROVIDER',
      '+91 94220 78901',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    );
    const p1Id = p1.lastInsertRowid as number;
    insertProfile.run(
      p1Id,
      'Kisan Mitra Solar Pumps & Agro Repairs',
      'Certified agricultural machinery & solar irrigation technician with 11 years field experience serving farmers in Baramati and Pune rural belt. Specialized in submersible pump rewinding, micro-drip tubing, and solar drive controllers.',
      11,
      450.0,
      'Baramati, Daund, Indapur & Surrounding Villages',
      'Baramati',
      'Pune',
      'Maharashtra',
      '413102',
      JSON.stringify(['ON_SITE', 'TRAVEL_SERVICE']),
      JSON.stringify(['Marathi', 'Hindi']),
      'APPROVED',
      1,
      1,
      'MH-AGRI-PMP-2018-490',
      JSON.stringify(['Solar Pump Maintenance', 'Submersible Motor Rewinding', 'Drip Line Installation', 'Tractor Hydraulic Valve Check'])
    );

    // Pro 2: Home Sanitization & Deep Cleaning Specialist (City)
    const p2 = insertUser.run(
      'Sunita Deshmukh',
      'sunita@swachhghar.in',
      proPass,
      'SERVICE_PROVIDER',
      '+91 98223 90123',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    );
    const p2Id = p2.lastInsertRowid as number;
    insertProfile.run(
      p2Id,
      'SwachhGhar Deep Cleaning & Hygiene',
      'Professional residential hygiene and post-festival deep cleaning service across Pune metro. We bring mechanized scrubber equipment, single-disc machines, and eco-certified chemicals.',
      6,
      350.0,
      'Kothrud, Baner, Wakad, Hinjawadi & Shivaji Nagar',
      'Pune',
      'Pune',
      'Maharashtra',
      '411038',
      JSON.stringify(['ON_SITE']),
      JSON.stringify(['Marathi', 'Hindi', 'English']),
      'APPROVED',
      1,
      1,
      'MH-MSME-CLEAN-8821',
      JSON.stringify(['2BHK/3BHK Deep Cleaning', 'Kitchen Chimney & Stove Degreasing', 'Bathroom Tile Scaling', 'Sofa Shampooing'])
    );

    // Pro 3: Inverter, Solar & RO Electronics Specialist (Semi-Urban / Town)
    const p3 = insertUser.run(
      'Mohd. Aslam',
      'aslam@urjasolutions.in',
      proPass,
      'SERVICE_PROVIDER',
      '+91 97920 12345',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
    );
    const p3Id = p3.lastInsertRowid as number;
    insertProfile.run(
      p3Id,
      'Urja Solar Inverter & RO Clinic',
      'Certified electronic repair specialist with dedicated workshop in Lucknow. We service home inverters, tubular batteries, RO water filters, and solar charge controllers with genuine spares.',
      9,
      300.0,
      'Gomti Nagar, Alambagh, Chinhat & Barabanki Road',
      'Lucknow',
      'Lucknow',
      'Uttar Pradesh',
      '226010',
      JSON.stringify(['ON_SITE', 'WORKSHOP_VISIT']),
      JSON.stringify(['Hindi', 'Urdu', 'English']),
      'APPROVED',
      1,
      1,
      'UP-ELEC-RO-2019-312',
      JSON.stringify(['Inverter PCB Repair', 'Tubular Battery Gravity & Acid Refill', 'RO Membrane Replacement', 'Solar Inverter Calibration'])
    );

    // Pro 4: Vedic Panditji & Cultural Ceremonies Specialist
    const p4 = insertUser.run(
      'Pt. Vidhyadhar Shastri',
      'shastri@vedicpuja.in',
      proPass,
      'SERVICE_PROVIDER',
      '+91 94150 67890',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    );
    const p4Id = p4.lastInsertRowid as number;
    insertProfile.run(
      p4Id,
      'Vaidik Anushthan & Puja Sewa Kendra',
      'Varanasi trained Acharya with 15 years experience performing authentic Griha Pravesh, Satyanarayan Katha, Vastu Shanti, and marriage ceremonies according to Vedic scriptures with complete puja samagri.',
      15,
      1100.0,
      'Varanasi, Prayagraj & Lucknow Region',
      'Varanasi',
      'Varanasi',
      'Uttar Pradesh',
      '221001',
      JSON.stringify(['ON_SITE', 'REMOTE']),
      JSON.stringify(['Hindi', 'Sanskrit']),
      'APPROVED',
      1,
      1,
      'VAR-VED-SANSTHAN-042',
      JSON.stringify(['Griha Pravesh Puja', 'Satyanarayan Katha', 'Vastu Shanti', 'Navgrah Shanti', 'Online Sankalp'])
    );

    // Pro 5: EV Charging & Master Electrician (Metro City)
    const p5 = insertUser.run(
      'Vikram Reddy',
      'vikram@sparkvolt.in',
      proPass,
      'SERVICE_PROVIDER',
      '+91 99001 23456',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    );
    const p5Id = p5.lastInsertRowid as number;
    insertProfile.run(
      p5Id,
      'SparkVolt Electricals & EV Charge Hub',
      'ITI Certified Master Electrician specializing in residential distribution boxes, earthing pit installations, and EV 2-wheeler / 4-wheeler charging sockets across Bengaluru.',
      8,
      400.0,
      'Koramangala, HSR Layout, Bellandur, Electronic City & Anekal',
      'Bengaluru',
      'Bengaluru Urban',
      'Karnataka',
      '560034',
      JSON.stringify(['ON_SITE']),
      JSON.stringify(['Kannada', 'Telugu', 'Hindi', 'English']),
      'APPROVED',
      1,
      1,
      'KA-DISCOM-LIC-7741',
      JSON.stringify(['Copper Earthing Pit', 'MCB Tripping Diagnostic', 'EV 16A/32A Socket Setup', 'Single Phase to 3-Phase Conversion'])
    );

    // Pro 6: Pending Application (Tractor Mechanic & Mistri)
    const p6 = insertUser.run(
      'Balwinder Singh',
      'balwinder@pashudhan.in',
      proPass,
      'SERVICE_PROVIDER',
      '+91 98140 11223',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    );
    const p6Id = p6.lastInsertRowid as number;
    insertProfile.run(
      p6Id,
      'Guru Nanak Tractor & Dairy Care',
      'Agricultural tractor engine servicing, rotavator blade alignment, and dairy equipment maintenance specialist.',
      12,
      500.0,
      'Khanna, Samrala & Ludhiana Rural',
      'Khanna',
      'Ludhiana',
      'Punjab',
      '141401',
      JSON.stringify(['ON_SITE', 'TRAVEL_SERVICE']),
      JSON.stringify(['Punjabi', 'Hindi']),
      'PENDING',
      0,
      1,
      'PB-AGRI-TRAC-8812',
      JSON.stringify(['Mahindra/Sonalika Tractor Servicing', 'Milking Machine Maintenance', 'Bailer Equipment Repair'])
    );

    // 4. Categories covering India's Urban, Semi-Urban & Rural Life
    const catAgri = insertCategory.run(
      'Agriculture & Solar Farm Services',
      'agriculture-rural',
      'Solar water pumps, tubewell rewinding, micro-drip irrigation, and farm equipment diagnostics.',
      'Tractor',
      '/src/assets/images/category_agri_rural_service_1792827856095.jpg',
      'AGRI_RURAL'
    ).lastInsertRowid as number;

    const catElectronics = insertCategory.run(
      'Inverter, Solar & RO Repair',
      'electronics-inverter-ro',
      'Home power inverters, battery electrolyte health, solar panels, and water purifiers.',
      'Cpu',
      '/src/assets/images/category_appliance_electronics_india_1792827856498.jpg',
      'ELECTRONICS'
    ).lastInsertRowid as number;

    const catCleaning = insertCategory.run(
      'Home Deep Cleaning & Pest Care',
      'home-cleaning',
      '2BHK/3BHK full home deep sanitization, kitchen degreasing, sofa cleaning, and festival prep.',
      'Sparkles',
      '/src/assets/images/category_home_cleaning_1792825590312.jpg',
      'HOME'
    ).lastInsertRowid as number;

    const catElectrical = insertCategory.run(
      'Electrical & EV Charging',
      'electrical-smart-home',
      'Certified wiremen, MCB panel installation, copper earthing pits, and 2W/4W EV chargers.',
      'Zap',
      '/src/assets/images/category_electrician_tech_1792825591928.jpg',
      'HOME'
    ).lastInsertRowid as number;

    const catPuja = insertCategory.run(
      'Puja, Vedic Ceremonies & Events',
      'puja-vedic-events',
      'Experienced Pandits and Acharyas for Griha Pravesh, Satyanarayan Katha, and festive ceremonies.',
      'Flame',
      '/src/assets/images/category_puja_events_craft_1792827856552.jpg',
      'COMMUNITY'
    ).lastInsertRowid as number;

    const catPlumbing = insertCategory.run(
      'Plumbing & Water Tanks',
      'plumbing-water-tanks',
      'Water storage tank cleaning, pipe leakage rectification, bathroom fittings, and motor installation.',
      'Wrench',
      '/src/assets/images/category_plumbing_repairs_1792825591296.jpg',
      'HOME'
    ).lastInsertRowid as number;

    // 5. Realistic Services in INR (₹)
    const s1 = insertService.run(
      p1Id,
      catAgri,
      'Solar Submersible Tubewell Pump Diagnostic & Overhaul',
      'Complete field inspection of 3HP/5HP solar pump, DC drive controller diagnostics, impeller cleaning, and cable insulation resistance testing.',
      1499.0,
      'per visit',
      120,
      '/src/assets/images/category_agri_rural_service_1792827856095.jpg',
      'ON_SITE',
      'Baramati & Pune Rural Villages',
      '413102, 413133, 412206'
    ).lastInsertRowid as number;

    const s2 = insertService.run(
      p1Id,
      catAgri,
      'Micro-Drip Irrigation Pipeline Flushing & Pressure Test',
      'De-clogging dripper emitters, venturi injector acid flush, lateral pipe leak repair, and sub-main pressure testing for orchards and sugarcane fields.',
      1850.0,
      'per acre / bigha',
      180,
      '/src/assets/images/category_agri_rural_service_1792827856095.jpg',
      'ON_SITE',
      'Baramati & Daund Taluka',
      '413102, 413133'
    ).lastInsertRowid as number;

    const s3 = insertService.run(
      p2Id,
      catCleaning,
      '2BHK / 3BHK Comprehensive Festival Deep Cleaning',
      'Intensive mechanized scrubbing of floors, kitchen tiles and cabinets, bathroom descaling, balcony wash, and window track vacuuming.',
      2499.0,
      'fixed',
      240,
      '/src/assets/images/category_home_cleaning_1792825590312.jpg',
      'ON_SITE',
      'Pune Metro (Kothrud, Baner, Wakad, Hinjawadi)',
      '411038, 411045, 411057, 411001'
    ).lastInsertRowid as number;

    const s4 = insertService.run(
      p3Id,
      catElectronics,
      'Inverter & Tubular Battery Complete Health Check & Descaling',
      'Specific gravity test of all battery cells using hydrometer, distilled water top-up, terminal post corrosion cleaning, and inverter charging cutoff calibration.',
      499.0,
      'per visit',
      60,
      '/src/assets/images/category_appliance_electronics_india_1792827856498.jpg',
      'ON_SITE',
      'Lucknow Urban & Rural Outskirts',
      '226010, 226001, 226028'
    ).lastInsertRowid as number;

    const s5 = insertService.run(
      p3Id,
      catElectronics,
      'RO Water Purifier Membrane & Sediment Filter Replacement',
      'Complete servicing for Kent, Aquaguard, Pureit and generic RO systems. Includes 75/80 GPD membrane check, sediment filter, carbon block, and TDS calibration.',
      899.0,
      'fixed',
      90,
      '/src/assets/images/category_appliance_electronics_india_1792827856498.jpg',
      'ON_SITE',
      'Lucknow & Surrounding Areas',
      '226010, 226001'
    ).lastInsertRowid as number;

    const s6 = insertService.run(
      p4Id,
      catPuja,
      'Griha Pravesh & Vastu Shanti Vedic Puja (With Samagri)',
      'Auspicious house warming ceremony conducted by certified Acharya. Includes Navgrah puja, Havan, Ganesh puja, Vastu havan, and holy rituals according to Muhurat.',
      3500.0,
      'fixed',
      180,
      '/src/assets/images/category_puja_events_craft_1792827856552.jpg',
      'ON_SITE',
      'Varanasi, Prayagraj & Lucknow',
      '221001, 221002, 226001'
    ).lastInsertRowid as number;

    const s7 = insertService.run(
      p5Id,
      catElectrical,
      'Dedicated 16A/32A EV Charging Point & Earthing Setup',
      'Installation of heavy-duty waterproof 16A socket or 32A industrial plug, dedicated 20A MCB in main panel, 4 sq mm copper wiring, and earthing continuity test.',
      1799.0,
      'fixed',
      120,
      '/src/assets/images/category_electrician_tech_1792825591928.jpg',
      'ON_SITE',
      'Bengaluru Urban & Rural',
      '560034, 560100, 560103'
    ).lastInsertRowid as number;

    // 6. Realistic Completed Bookings & Verified Indian Reviews
    const b1 = insertBooking.run(
      s1,
      custId,
      p1Id,
      '2026-10-18',
      '09:00 AM - 11:00 AM',
      'Farm Plot 14, Near Primary Health Centre, Malegaon BK, Baramati',
      '413102',
      'Pune',
      'ON_SITE',
      '5HP Shakti solar pump was throwing E-04 error code during morning peak sun.',
      'COMPLETED',
      1499.0,
      'UPI / Online (PhonePe)',
      'PAID',
      '2026-10-16 11:20:00'
    ).lastInsertRowid as number;

    insertReview.run(
      b1,
      s1,
      custId,
      p1Id,
      5,
      'Rameshwarji reached our farm right on time with his testing tools. He diagnosed the faulty lightning arrestor and cleaned the solar drive terminals in under an hour. Water discharge is back to normal! Bahut badiya service.',
      '2026-10-18 14:15:00'
    );

    const b2 = insertBooking.run(
      s3,
      custId,
      p2Id,
      '2026-10-21',
      '10:00 AM - 02:00 PM',
      'Flat 402, Ganga Carnation, Koregaon Park Road, Pune',
      '411001',
      'Pune',
      'ON_SITE',
      'Pre-Diwali house sanitization. Please focus on kitchen tiles and chimney.',
      'COMPLETED',
      2499.0,
      'Cash on Service / COD',
      'PAID',
      '2026-10-20 09:30:00'
    ).lastInsertRowid as number;

    insertReview.run(
      b2,
      s3,
      custId,
      p2Id,
      5,
      'Sunita and her team did an exemplary job. The kitchen chimney and tiles look brand new with zero sticky oil grease left behind. Honest and trustworthy professionals.',
      '2026-10-21 16:30:00'
    );

    // Booking 3: Upcoming confirmed
    insertBooking.run(
      s4,
      custId,
      p3Id,
      '2026-10-27',
      '02:00 PM - 04:00 PM',
      'House 34/B, Sector 4, Vikas Nagar, Lucknow',
      '226022',
      'Lucknow',
      'ON_SITE',
      'Luminous 150Ah battery backup dropped from 4 hours to 30 mins.',
      'CONFIRMED',
      499.0,
      'Cash on Service / COD',
      'PENDING',
      '2026-10-23 15:45:00'
    );

    // Initial Notifications
    insertNotif.run(
      custId,
      'Appointment Confirmed',
      'Mohd. Aslam has confirmed your Inverter & Battery Service for Oct 27 at 02:00 PM.',
      'BOOKING_ACCEPTED',
      '/dashboard',
      0
    );

    insertNotif.run(
      p1Id,
      'New 5-Star Farmer Feedback',
      'Pooja Sharma submitted 5 stars for Solar Submersible Tubewell Pump Diagnostic in Baramati!',
      'REVIEW_RECEIVED',
      '/pro-dashboard',
      0
    );
  });

  executeSeed();

  console.log('ServiceHub India Marketplace database initialized and seeded successfully.');
}
