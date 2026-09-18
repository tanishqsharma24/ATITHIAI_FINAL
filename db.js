const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'atithiai.db');
const JWT_SECRET = process.env.JWT_SECRET || 'atithiai_super_secure_hospitality_jwt_secret_2026';

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);

// Configure WAL mode for high performance
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  console.warn('SQLite PRAGMA warning:', e.message);
}

// -------------------------------------------------------------
// Schema Definitions
// -------------------------------------------------------------
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('owner', 'worker', 'customer')),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      details_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Heritage Homestay',
      address TEXT,
      city TEXT DEFAULT 'Udaipur',
      state TEXT DEFAULT 'Rajasthan',
      country TEXT DEFAULT 'India',
      phone TEXT,
      email TEXT,
      total_rooms INTEGER DEFAULT 10,
      tagline TEXT,
      host_name TEXT,
      host_phone TEXT,
      price_range TEXT,
      rating REAL DEFAULT 4.8,
      reviews_count INTEGER DEFAULT 24,
      connectivity_badge TEXT,
      features_json TEXT DEFAULT '[]',
      cover_image TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      room_number TEXT NOT NULL,
      type TEXT NOT NULL,
      price_per_night REAL DEFAULT 4500,
      status TEXT DEFAULT 'ready' CHECK(status IN ('ready', 'occupied', 'cleaning', 'maintenance')),
      floor TEXT DEFAULT '1',
      amenities_json TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_ref TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests_count INTEGER DEFAULT 2,
      total_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Pending' CHECK(payment_status IN ('Paid', 'Pending', 'Refunded')),
      booking_status TEXT DEFAULT 'Confirmed' CHECK(booking_status IN ('Confirmed', 'Checked In', 'Checked Out', 'Cancelled')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      room_number TEXT,
      category TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      complaint_id TEXT REFERENCES complaints(id) ON DELETE SET NULL,
      assigned_worker_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      department TEXT NOT NULL CHECK(department IN ('Housekeeping', 'Maintenance', 'Front Desk', 'Food & Beverage')),
      title TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Mid', 'Medium', 'High', 'Critical')),
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
      room_number TEXT,
      due_time TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      rating REAL NOT NULL,
      cleanliness_rating REAL DEFAULT 5,
      staff_rating REAL DEFAULT 5,
      amenities_rating REAL DEFAULT 5,
      review_title TEXT,
      review_comment TEXT,
      owner_reply TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      threshold INTEGER DEFAULT 5,
      unit TEXT DEFAULT 'units',
      last_restocked TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_property ON complaints(property_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_worker_id);
  `);

  // Migration for existing tables
  const extraCols = [
    "ALTER TABLE properties ADD COLUMN tagline TEXT;",
    "ALTER TABLE properties ADD COLUMN host_name TEXT;",
    "ALTER TABLE properties ADD COLUMN host_phone TEXT;",
    "ALTER TABLE properties ADD COLUMN price_range TEXT;",
    "ALTER TABLE properties ADD COLUMN rating REAL DEFAULT 4.8;",
    "ALTER TABLE properties ADD COLUMN reviews_count INTEGER DEFAULT 24;",
    "ALTER TABLE properties ADD COLUMN connectivity_badge TEXT;",
    "ALTER TABLE properties ADD COLUMN features_json TEXT DEFAULT '[]';",
    "ALTER TABLE properties ADD COLUMN cover_image TEXT;"
  ];
  for (const colSql of extraCols) {
    try { db.exec(colSql); } catch (e) {}
  }
}

// -------------------------------------------------------------
// Security Utilities (Crypto pbkdf2 & Signed Tokens)
// -------------------------------------------------------------
function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + (7 * 24 * 60 * 60) }; // 7 days
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// -------------------------------------------------------------
// Seed Data Initialization
// -------------------------------------------------------------
function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('📦 Seeding initial AtithiAI hospitality demo data into SQLite...');
  const now = new Date().toISOString();

  // 1. Demo Users
  const { hash: ownerHash, salt: ownerSalt } = hashPassword('password123');
  const { hash: workerHash, salt: workerSalt } = hashPassword('password123');
  const { hash: guestHash, salt: guestSalt } = hashPassword('password123');

  const ownerId = 'usr_owner_01';
  const workerId = 'usr_worker_01';
  const guestId = 'usr_guest_01';

  db.prepare(`
    INSERT INTO users (id, role, name, email, password_hash, salt, phone, details_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ownerId, 'owner', 'Vikram Singh Rathore', 'owner@atithiai.com', ownerHash, ownerSalt, '+91 98290 12345',
    JSON.stringify({ propertyName: 'Amargarh Heritage Stay', city: 'Udaipur', propertyType: 'Heritage Homestay', totalRooms: 25 }),
    now, now
  );

  db.prepare(`
    INSERT INTO users (id, role, name, email, password_hash, salt, phone, details_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    workerId, 'worker', 'Rajesh Kumar', 'worker@atithiai.com', workerHash, workerSalt, '+91 98290 54321',
    JSON.stringify({ department: 'Housekeeping', shift: 'Morning', employeeId: 'EMP-HK-104', assignedProperty: 'Amargarh Heritage Stay' }),
    now, now
  );

  db.prepare(`
    INSERT INTO users (id, role, name, email, password_hash, salt, phone, details_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    guestId, 'customer', 'Dev Sharma', 'guest@atithiai.com', guestHash, guestSalt, '+91 98110 98765',
    JSON.stringify({ nationality: 'Indian', language: 'English', travelStyle: 'Family', preferences: 'Vegetarian, High Floor' }),
    now, now
  );

  // 2. Demo Property
  const propId = 'prop_amargarh_01';
  db.prepare(`
    INSERT INTO properties (id, owner_id, name, type, address, city, state, country, phone, email, total_rooms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    propId, ownerId, 'Amargarh Heritage Stay', 'Heritage Homestay', 'Plot 12, Pichola Lake Road, Haridas Ji Ki Magri',
    'Udaipur', 'Rajasthan', 'India', '+91 294 243 0011', 'stay@amargarhheritage.com', 25, now
  );

  // 3. Demo Rooms
  const roomsData = [
    { id: 'room_101', num: '101', type: 'Classic Courtyard Room', price: 3800, status: 'ready', floor: '1' },
    { id: 'room_102', num: '102', type: 'Classic Courtyard Room', price: 3800, status: 'cleaning', floor: '1' },
    { id: 'room_103', num: '103', type: 'Deluxe Heritage Room', price: 5200, status: 'maintenance', floor: '1' },
    { id: 'room_104', num: '104', type: 'Deluxe Heritage Room', price: 5200, status: 'occupied', floor: '1' },
    { id: 'room_105', num: '105', type: 'Royal Lakeview Suite', price: 8500, status: 'ready', floor: '1' },
    { id: 'room_201', num: '201', type: 'Classic Courtyard Room', price: 3800, status: 'ready', floor: '2' },
    { id: 'room_202', num: '202', type: 'Deluxe Heritage Room', price: 5200, status: 'ready', floor: '2' },
    { id: 'room_203', num: '203', type: 'Royal Lakeview Suite', price: 8500, status: 'ready', floor: '2' },
    { id: 'room_204', num: '204', type: 'Deluxe Heritage Room', price: 5200, status: 'occupied', floor: '2' },
  ];

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, property_id, room_number, type, price_per_night, status, floor, amenities_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of roomsData) {
    insertRoom.run(r.id, propId, r.num, r.type, r.price, r.status, r.floor, JSON.stringify(['Wi-Fi', 'Air Conditioning', 'King Bed', 'Hot Water', 'Lake View']));
  }

  // 4. Demo Bookings
  const bookingId = 'bk_ati_20482';
  db.prepare(`
    INSERT INTO bookings (id, booking_ref, customer_id, property_id, room_id, check_in, check_out, guests_count, total_amount, payment_status, booking_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bookingId, 'ATI-2026-20482', guestId, propId, 'room_204', '2026-09-05', '2026-09-08', 2, 15600, 'Paid', 'Checked In', now
  );

  // 5. Demo Complaints
  db.prepare(`
    INSERT INTO complaints (id, customer_id, property_id, room_number, category, priority, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'cmp_01', guestId, propId, '204', 'AC / Climate', 'High', 'Air conditioner cooling is weak in room 204. Needs maintenance check.', 'In Progress', now
  );

  db.prepare(`
    INSERT INTO complaints (id, customer_id, property_id, room_number, category, priority, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'cmp_02', null, propId, '102', 'Plumbing', 'Critical', 'Water drainage slow in shower stall after morning usage.', 'Open', now
  );

  // 6. Demo Tasks for Workers
  db.prepare(`
    INSERT INTO tasks (id, property_id, complaint_id, assigned_worker_id, department, title, priority, status, room_number, due_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'tsk_01', propId, 'cmp_01', workerId, 'Maintenance', 'Inspect AC condenser filter in Room 204', 'High', 'IN_PROGRESS', '204', '2:00 PM', now
  );

  db.prepare(`
    INSERT INTO tasks (id, property_id, complaint_id, assigned_worker_id, department, title, priority, status, room_number, due_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'tsk_02', propId, null, workerId, 'Housekeeping', 'Replenish fresh towels and linen in Room 102', 'Medium', 'PENDING', '102', '1:30 PM', now
  );

  db.prepare(`
    INSERT INTO tasks (id, property_id, complaint_id, assigned_worker_id, department, title, priority, status, room_number, due_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'tsk_03', propId, null, workerId, 'Housekeeping', 'Deep sanitize and inspect vacant Suite 203', 'Low', 'COMPLETED', '203', '11:00 AM', now
  );

  // 7. Demo Reviews
  db.prepare(`
    INSERT INTO reviews (id, customer_id, property_id, rating, cleanliness_rating, staff_rating, amenities_rating, review_title, review_comment, owner_reply, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_01', guestId, propId, 5.0, 5, 5, 5, 'Exceptional Haveli Experience!',
    'The view of Pichola lake at sunset is unmatched. Staff is warm and the heritage architecture is thoroughly preserved. Will definitely return!',
    'Thank you so much Dev! It was an absolute pleasure hosting you and your family at Amargarh. Safe travels!',
    now
  );

  db.prepare(`
    INSERT INTO reviews (id, customer_id, property_id, rating, cleanliness_rating, staff_rating, amenities_rating, review_title, review_comment, owner_reply, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_02', null, propId, 4.5, 4.5, 5, 4, 'Authentic Rajasthani Hospitality',
    'Delicious food at the rooftop restaurant. Fast Wi-Fi even in the courtyards. Room was spotless.',
    'Thank you for your kind words! We hope to welcome you back soon.',
    now
  );

  // 8. Demo Inventory
  const invData = [
    { id: 'inv_01', name: 'Bath Towels (Egyptian Cotton)', cat: 'Linen', qty: 45, thresh: 15, unit: 'pcs' },
    { id: 'inv_02', name: 'Ayurvedic Toiletries Kit', cat: 'Toiletries', qty: 62, thresh: 20, unit: 'kits' },
    { id: 'inv_03', name: 'Mineral Water Glass Bottles', cat: 'Food & Beverage', qty: 120, thresh: 30, unit: 'bottles' },
    { id: 'inv_04', name: 'Organic Masala Chai Pouches', cat: 'Food & Beverage', qty: 85, thresh: 25, unit: 'pouches' },
    { id: 'inv_05', name: 'Hospitality Grade Disinfectant', cat: 'Housekeeping', qty: 14, thresh: 5, unit: 'litres' },
  ];
  const insertInv = db.prepare(`
    INSERT INTO inventory (id, property_id, item_name, category, quantity, threshold, unit, last_restocked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of invData) {
    insertInv.run(item.id, propId, item.name, item.cat, item.qty, item.thresh, item.unit, now);
  }

  // 9. Initial Audit Log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, event_type, description, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'aud_init', ownerId, 'SYSTEM_INIT', 'AtithiAI Database successfully initialized with offline PMS schemas', now
  );

  console.log('✅ AtithiAI demo database seeded successfully!');
}

// Ensure authentic homestays in rural/cultural destinations exist
function seedHomestays() {
  const now = new Date().toISOString();

  // Update Amargarh metadata with host and connectivity badge
  try {
    db.prepare(`
      UPDATE properties SET
        tagline = 'Centuries-old lakeside haveli with royal courtyards and authentic family hospitality.',
        host_name = 'Vikram Singh Rathore',
        host_phone = '+91 98290 12345',
        price_range = '₹3,800 – ₹8,500',
        rating = 4.9,
        reviews_count = 38,
        connectivity_badge = '4G & Offline-Ready PMS',
        features_json = '["0% Brokerage Direct", "Lake Pichola 2 min", "Home Cooked Rajasthani Meals", "Offline Pass Provided", "Rooftop Dining"]',
        cover_image = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      WHERE id = 'prop_amargarh_01'
    `).run();
  } catch (e) {}

  const countKmb = db.prepare("SELECT COUNT(*) as c FROM properties WHERE id = 'prop_kumbhalgarh_02'").get().c;
  if (countKmb > 0) return; // already populated

  console.log('🏡 Seeding authentic rural homestays and small hotels into AtithiAI database...');

  const insertProp = db.prepare(`
    INSERT INTO properties (
      id, owner_id, name, type, address, city, state, country, phone, email, total_rooms,
      tagline, host_name, host_phone, price_range, rating, reviews_count, connectivity_badge, features_json, cover_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, property_id, room_number, type, price_per_night, status, floor, amenities_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Kumbhalgarh Valley Homestay
  insertProp.run(
    'prop_kumbhalgarh_02', null, 'Kumbhalgarh Valley Homestay', 'Rural Eco-Stay',
    'Village Qila Marg, Foothills of Kumbhalgarh Fort', 'Kumbhalgarh', 'Rajasthan', 'India',
    '+91 98291 33445', 'kumbhalgarh@atithiai.com', 8,
    'Solar-powered stone cottages nestled in the Aravalli hills with organic dairy and farm fresh food.',
    'Keshav & Sunita Rawat', '+91 98291 33445', '₹2,600 – ₹4,200', 4.8, 29,
    'Low Signal Haven (Offline Pass Included)',
    JSON.stringify(['0% Brokerage Direct', 'Low Network Refuge', 'Solar Powered', 'Fort Trekking Guide', 'Farm-to-Table Meals']),
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    now
  );
  insertRoom.run('room_kmb_101', 'prop_kumbhalgarh_02', 'C1', 'Aravalli Valley Cottage', 2600, 'ready', 'Ground', JSON.stringify(['Solar Hot Water', 'Mountain View', 'Farm Breakfast', 'King Bed']));
  insertRoom.run('room_kmb_102', 'prop_kumbhalgarh_02', 'C2', 'Stone Farmhouse Suite', 3800, 'ready', 'Ground', JSON.stringify(['Balcony', 'Organic Milk', 'Campfire Access', 'Twin Bed']));

  // 2. Thar Desert Moon Haveli
  insertProp.run(
    'prop_jaisalmer_03', null, 'Thar Desert Moon Haveli', 'Boutique Desert Haveli',
    'Kotri Para, Inside Jaisalmer Fort Walls', 'Jaisalmer', 'Rajasthan', 'India',
    '+91 94141 88776', 'jaisalmer@atithiai.com', 10,
    'Golden sandstone homestay within historic fort walls with star-gazing terrace and desert safaris.',
    'Fateh Khan', '+91 94141 88776', '₹2,800 – ₹5,500', 4.9, 44,
    'Offline-Ready Digital Pass',
    JSON.stringify(['0% Brokerage Direct', 'Inside Living Fort', 'Cultural Folk Music', 'Camel Safari Assistance', 'Thar Home Cooking']),
    'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=800&q=80',
    now
  );
  insertRoom.run('room_jsm_101', 'prop_jaisalmer_03', '101', 'Sandstone Courtyard Room', 2800, 'ready', '1', JSON.stringify(['Stone Carvings', 'Wi-Fi', 'Thar Tea', 'Attached Bath']));
  insertRoom.run('room_jsm_102', 'prop_jaisalmer_03', '201', 'Royal Bastion Lakeview Suite', 4800, 'ready', '2', JSON.stringify(['Fort Rampart View', 'King Bed', 'Sunset Terrace Access']));

  // 3. Spiti Valley Cedar Cabin
  insertProp.run(
    'prop_spiti_04', null, 'Spiti Valley Cedar Cabin', 'Mountain Homestay',
    'Main Bazaar, Kaza Village', 'Kaza (Spiti Valley)', 'Himachal Pradesh', 'India',
    '+91 94180 55432', 'spiti@atithiai.com', 6,
    'Cozy high-altitude mud & cedar homestay with wood bukhari fireplace and satellite emergency backup.',
    'Tsering Dorje', '+91 94180 55432', '₹2,400 – ₹3,900', 4.9, 31,
    'Remote Offline Zone (Full SMS Pass)',
    JSON.stringify(['0% Brokerage Direct', 'Zero Commission Host', 'Wood Bukhari Heating', 'Tibetan Family Hospitality', 'Monastery Trails']),
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    now
  );
  insertRoom.run('room_spt_101', 'prop_spiti_04', 'K1', 'Cedar Pine Room', 2400, 'ready', '1', JSON.stringify(['Bukhari Heater', 'Wool Blankets', 'Tibetan Tea', 'Mountain View']));
  insertRoom.run('room_spt_102', 'prop_spiti_04', 'K2', 'High Pass Panoramic Attic', 3400, 'ready', '2', JSON.stringify(['360 Peak View', 'Heated Bed', 'Traditional Seating']));

  // 4. Ganga Kinare Forest Cottage
  insertProp.run(
    'prop_rishikesh_05', null, 'Ganga Kinare Forest Cottage', 'Riverfront Homestay',
    'Tapovan Forest Edge, Near Laxman Jhula', 'Rishikesh', 'Uttarakhand', 'India',
    '+91 98370 22114', 'rishikesh@atithiai.com', 9,
    'Serene riverside cottages surrounded by sal forest, sacred chanting, and organic gardens.',
    'Anandita & Devendra Roy', '+91 98370 22114', '₹3,200 – ₹5,800', 4.8, 52,
    '4G & Offline-Ready PMS',
    JSON.stringify(['0% Brokerage Direct', 'Private Ghat Access', 'Morning Yoga Included', 'Ayurvedic Sattvic Kitchen', 'Birdwatching']),
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    now
  );
  insertRoom.run('room_rsh_101', 'prop_rishikesh_05', 'G1', 'Sal Forest Cottage', 3200, 'ready', 'Ground', JSON.stringify(['Private Verandah', 'Yoga Mat', 'Forest View', 'Filtered Spring Water']));
  insertRoom.run('room_rsh_102', 'prop_rishikesh_05', 'G2', 'Sacred Riverview Suite', 4800, 'ready', '1', JSON.stringify(['Ganges River View', 'King Bed', 'Herbal Tea Set', 'Meditation Corner']));
}

// Initialize tables and seed data
initSchema();
seedDatabase();
seedHomestays();

// -------------------------------------------------------------
// Database Operations API
// -------------------------------------------------------------
const dbOps = {
  db,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,

  // Users
  getUserByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
  },
  getUserById: (id) => {
    return db.prepare('SELECT id, role, name, email, phone, avatar_url, details_json, created_at FROM users WHERE id = ?').get(id);
  },
  createUser: ({ id, role, name, email, password, phone, details }) => {
    const { hash, salt } = hashPassword(password);
    const userId = id || `usr_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details || {});

    db.prepare(`
      INSERT INTO users (id, role, name, email, password_hash, salt, phone, details_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, role, name, email, hash, salt, phone || null, detailsJson, now, now);

    // If role is owner, automatically create a property record
    if (role === 'owner') {
      const propId = `prop_${crypto.randomBytes(5).toString('hex')}`;
      const propName = (details && details.propertyName) || `${name}'s Stay`;
      const propType = (details && details.propertyType) || 'Heritage Homestay';
      const city = (details && details.city) || 'Udaipur';
      const rooms = (details && parseInt(details.totalRooms, 10)) || 10;
      db.prepare(`
        INSERT INTO properties (id, owner_id, name, type, city, total_rooms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(propId, userId, propName, propType, city, rooms, now);
    }

    return dbOps.getUserById(userId);
  },

  // Properties & Rooms
  getProperties: () => {
    const props = db.prepare('SELECT * FROM properties').all();
    return props.map(p => {
      const rooms = db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(p.id);
      const minPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price_per_night)) : 2500;
      return {
        ...p,
        features: JSON.parse(p.features_json || '[]'),
        rooms,
        minPrice
      };
    });
  },
  getPropertyById: (id) => {
    const prop = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!prop) return null;
    const rooms = db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(prop.id);
    return {
      ...prop,
      features: JSON.parse(prop.features_json || '[]'),
      rooms
    };
  },
  searchProperties: ({ location, stayType, query }) => {
    let sql = 'SELECT * FROM properties WHERE 1=1';
    const params = [];

    if (location && location.trim() && location.trim().toLowerCase() !== 'all') {
      sql += ' AND (city LIKE ? OR state LIKE ? OR address LIKE ? OR name LIKE ?)';
      const term = `%${location.trim()}%`;
      params.push(term, term, term, term);
    }
    if (stayType && stayType.trim() && stayType.trim().toLowerCase() !== 'all') {
      sql += ' AND type LIKE ?';
      params.push(`%${stayType.trim()}%`);
    }
    if (query && query.trim()) {
      sql += ' AND (name LIKE ? OR tagline LIKE ? OR city LIKE ? OR host_name LIKE ?)';
      const qTerm = `%${query.trim()}%`;
      params.push(qTerm, qTerm, qTerm, qTerm);
    }
    sql += ' ORDER BY rating DESC, created_at ASC';
    const properties = db.prepare(sql).all(...params);

    return properties.map(p => {
      const rooms = db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(p.id);
      const minRoomPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price_per_night)) : 2500;
      return {
        ...p,
        features: JSON.parse(p.features_json || '[]'),
        rooms,
        minPrice: minRoomPrice,
      };
    });
  },
  getRoomsByProperty: (propertyId) => {
    return db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(propertyId);
  },

  // Complaints
  getComplaints: (propertyId = null) => {
    if (propertyId) {
      return db.prepare(`
        SELECT c.*, u.name as guest_name, u.phone as guest_phone
        FROM complaints c
        LEFT JOIN users u ON c.customer_id = u.id
        WHERE c.property_id = ?
        ORDER BY c.created_at DESC
      `).all(propertyId);
    }
    return db.prepare(`
      SELECT c.*, u.name as guest_name, u.phone as guest_phone, p.name as property_name
      FROM complaints c
      LEFT JOIN users u ON c.customer_id = u.id
      LEFT JOIN properties p ON c.property_id = p.id
      ORDER BY c.created_at DESC
    `).all();
  },
  createComplaint: ({ customerId, propertyId, roomNumber, category, priority, description }) => {
    const id = `cmp_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const pid = propertyId || 'prop_amargarh_01';
    db.prepare(`
      INSERT INTO complaints (id, customer_id, property_id, room_number, category, priority, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?)
    `).run(id, customerId || null, pid, roomNumber || '204', category || 'General', priority || 'Medium', description, now);
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  },
  updateComplaintStatus: (id, status) => {
    const resolvedAt = status === 'Resolved' ? new Date().toISOString() : null;
    db.prepare(`
      UPDATE complaints SET status = ?, resolved_at = ? WHERE id = ?
    `).run(status, resolvedAt, id);
    return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  },

  // Tasks
  getTasks: (workerId = null, department = null) => {
    let query = `
      SELECT t.*, u.name as worker_name, p.name as property_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_worker_id = u.id
      LEFT JOIN properties p ON t.property_id = p.id
    `;
    const params = [];
    const conditions = [];

    if (workerId) {
      conditions.push('t.assigned_worker_id = ?');
      params.push(workerId);
    }
    if (department) {
      conditions.push('t.department = ?');
      params.push(department);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY t.created_at DESC';
    return db.prepare(query).all(...params);
  },
  createTask: ({ propertyId, complaintId, assignedWorkerId, department, title, priority, roomNumber, dueTime }) => {
    const id = `tsk_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const pid = propertyId || 'prop_amargarh_01';
    db.prepare(`
      INSERT INTO tasks (id, property_id, complaint_id, assigned_worker_id, department, title, priority, status, room_number, due_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(id, pid, complaintId || null, assignedWorkerId || null, department || 'Housekeeping', title, priority || 'Medium', roomNumber || null, dueTime || 'Immediate', now);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  },
  updateTaskStatus: (id, status) => {
    const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
    db.prepare(`
      UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?
    `).run(status, completedAt, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  },

  // Reviews
  getReviews: (propertyId = null) => {
    let query = `
      SELECT r.*, u.name as guest_name, u.avatar_url as guest_avatar
      FROM reviews r
      LEFT JOIN users u ON r.customer_id = u.id
    `;
    if (propertyId) {
      query += ' WHERE r.property_id = ?';
      return db.prepare(query + ' ORDER BY r.created_at DESC').all(propertyId);
    }
    return db.prepare(query + ' ORDER BY r.created_at DESC').all();
  },
  createReview: ({ customerId, propertyId, rating, cleanliness, staff, amenities, title, comment }) => {
    const id = `rev_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const pid = propertyId || 'prop_amargarh_01';
    db.prepare(`
      INSERT INTO reviews (id, customer_id, property_id, rating, cleanliness_rating, staff_rating, amenities_rating, review_title, review_comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, customerId || null, pid, rating || 5.0, cleanliness || 5, staff || 5, amenities || 5, title || '', comment || '', now);
    return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  },

  // Bookings
  getBookings: (customerId = null) => {
    let query = `
      SELECT b.*, u.name as guest_name, u.email as guest_email, u.phone as guest_phone,
             r.room_number, r.type as room_type, p.name as property_name, p.city as property_city
      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN properties p ON b.property_id = p.id
    `;
    if (customerId) {
      query += ' WHERE b.customer_id = ? ORDER BY b.created_at DESC';
      return db.prepare(query).all(customerId);
    }
    return db.prepare(query + ' ORDER BY b.created_at DESC').all();
  },
  createBooking: ({
    customerId,
    propertyId,
    roomId,
    guestName,
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    guestsCount,
    totalAmount,
    paymentMethod,
    specialRequests
  }) => {
    const id = `bk_${crypto.randomBytes(6).toString('hex')}`;
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `ATI-2026-${randNum}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO bookings (
        id, booking_ref, customer_id, property_id, room_id,
        check_in, check_out, guests_count, total_amount, payment_status, booking_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      bookingRef,
      customerId || null,
      propertyId,
      roomId || null,
      checkIn || now.split('T')[0],
      checkOut || now.split('T')[0],
      parseInt(guestsCount, 10) || 2,
      parseFloat(totalAmount) || 0,
      paymentMethod === 'arrival' ? 'Pending' : 'Paid',
      'Confirmed',
      now
    );

    // Update room status to occupied if room is chosen
    if (roomId) {
      try {
        db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(roomId);
      } catch(e) {}
    }

    // Insert audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, event_type, description, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomBytes(5).toString('hex')}`,
      customerId || 'guest_direct',
      'BOOKING_CREATED',
      `Zero-brokerage direct booking ${bookingRef} created for ${guestName || 'Guest'} at property ${propertyId}. Total: ₹${totalAmount}`,
      now
    );

    return db.prepare(`
      SELECT b.*, p.name as property_name, p.city as property_city, p.type as property_type,
             p.address as property_address, p.phone as property_phone, p.host_name, p.connectivity_badge,
             r.room_number, r.type as room_type
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `).get(id);
  },

  // Inventory
  getInventory: (propertyId = null) => {
    const pid = propertyId || 'prop_amargarh_01';
    return db.prepare('SELECT * FROM inventory WHERE property_id = ? ORDER BY category ASC, item_name ASC').all(pid);
  },

  // Stats for dashboards
  getStats: () => {
    const totalRooms = db.prepare('SELECT COUNT(*) as c FROM rooms').get().c;
    const occupiedRooms = db.prepare("SELECT COUNT(*) as c FROM rooms WHERE status = 'occupied'").get().c;
    const openComplaints = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status != 'Resolved'").get().c;
    const pendingTasks = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status != 'COMPLETED'").get().c;
    const avgRating = db.prepare('SELECT AVG(rating) as r FROM reviews').get().r || 4.8;
    const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;

    return {
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 72,
      openComplaints,
      pendingTasks,
      avgRating: Number(avgRating).toFixed(1),
      totalBookings,
    };
  },

  // Table names list for debugging
  getTableNames: () => {
    return db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").all().map(t => t.name);
  }
};

module.exports = dbOps;
