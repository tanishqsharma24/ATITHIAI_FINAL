const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const JWT_SECRET = process.env.JWT_SECRET || 'atithiai_super_secure_hospitality_jwt_secret_2026';

let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  console.warn('[AtithiAI DB] node:sqlite is not available on this Node runtime, enabling in-memory store:', e.message);
}

let db = null;
if (DatabaseSync) {
  try {
    let dbFile = path.join(__dirname, 'atithiai.db');
    if (isServerless) {
      const tmpFile = path.join('/tmp', 'atithiai.db');
      try {
        if (!fs.existsSync(tmpFile) && fs.existsSync(dbFile)) {
          fs.copyFileSync(dbFile, tmpFile);
        }
        dbFile = tmpFile;
      } catch (err) {
        dbFile = tmpFile;
      }
    }
    db = new DatabaseSync(dbFile);
    try {
      if (isServerless) {
        db.exec('PRAGMA journal_mode = MEMORY;');
      } else {
        db.exec('PRAGMA journal_mode = WAL;');
      }
      db.exec('PRAGMA foreign_keys = ON;');
    } catch (e) {
      console.warn('SQLite PRAGMA warning:', e.message);
    }
  } catch (err) {
    console.warn('[AtithiAI DB] SQLite file init failed, using in-memory mode:', err.message);
    try {
      db = new DatabaseSync(':memory:');
    } catch (e2) {
      db = null;
    }
  }
}

// -------------------------------------------------------------
// Schema Definitions (SQLite)
// -------------------------------------------------------------
function initSchema() {
  if (!db) return;
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
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      room_number TEXT NOT NULL,
      type TEXT NOT NULL,
      price_per_night REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready', 'occupied', 'cleaning', 'maintenance')),
      floor TEXT DEFAULT '1',
      amenities_json TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_ref TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests_count INTEGER DEFAULT 2,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK(payment_status IN ('Pending', 'Paid', 'Refunded')),
      booking_status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(booking_status IN ('Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      room_number TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      complaint_id TEXT REFERENCES complaints(id) ON DELETE SET NULL,
      assigned_worker_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
      room_number TEXT,
      due_time TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      rating REAL NOT NULL CHECK(rating >= 1.0 AND rating <= 5.0),
      cleanliness_rating REAL DEFAULT 5.0,
      staff_rating REAL DEFAULT 5.0,
      amenities_rating REAL DEFAULT 5.0,
      review_title TEXT,
      review_comment TEXT NOT NULL,
      owner_reply TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER NOT NULL DEFAULT 10,
      unit TEXT NOT NULL DEFAULT 'units',
      last_restocked TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Ensure columns exist on properties table if upgraded
  const cols = [
    { name: 'tagline', type: 'TEXT' },
    { name: 'host_name', type: 'TEXT' },
    { name: 'host_phone', type: 'TEXT' },
    { name: 'price_range', type: 'TEXT' },
    { name: 'rating', type: 'REAL DEFAULT 4.8' },
    { name: 'reviews_count', type: 'INTEGER DEFAULT 24' },
    { name: 'connectivity_badge', type: 'TEXT' },
    { name: 'features_json', type: "TEXT DEFAULT '[]'" },
    { name: 'cover_image', type: 'TEXT' }
  ];

  for (const col of cols) {
    try {
      db.exec(`ALTER TABLE properties ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {}
  }
}

// -------------------------------------------------------------
// Cryptographic Password & Token Helpers
// -------------------------------------------------------------
function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, salt) {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// -------------------------------------------------------------
// In-Memory Fallback Seed Data
// -------------------------------------------------------------
const nowIso = new Date().toISOString();
const { hash: ownerHash, salt: ownerSalt } = hashPassword('password123');
const { hash: workerHash, salt: workerSalt } = hashPassword('password123');
const { hash: guestHash, salt: guestSalt } = hashPassword('password123');

const inMemUsers = [
  { id: 'usr_owner_01', role: 'owner', name: 'Vikram Singh Rathore', email: 'owner@atithiai.com', password_hash: ownerHash, salt: ownerSalt, phone: '+91 98290 12345', details_json: JSON.stringify({ propertyName: 'Amargarh Heritage Stay', city: 'Udaipur', propertyType: 'Heritage Homestay', totalRooms: 25 }), created_at: nowIso, updated_at: nowIso },
  { id: 'usr_worker_01', role: 'worker', name: 'Rajesh Kumar', email: 'worker@atithiai.com', password_hash: workerHash, salt: workerSalt, phone: '+91 98290 54321', details_json: JSON.stringify({ department: 'Housekeeping', shift: 'Morning', employeeId: 'EMP-HK-104', assignedProperty: 'Amargarh Heritage Stay' }), created_at: nowIso, updated_at: nowIso },
  { id: 'usr_guest_01', role: 'customer', name: 'Dev Sharma', email: 'guest@atithiai.com', password_hash: guestHash, salt: guestSalt, phone: '+91 98110 98765', details_json: JSON.stringify({ nationality: 'Indian', language: 'English', travelStyle: 'Family', preferences: 'Vegetarian, High Floor' }), created_at: nowIso, updated_at: nowIso }
];

const inMemProperties = [
  { id: 'prop_amargarh_01', owner_id: 'usr_owner_01', name: 'Amargarh Heritage Stay', type: 'Heritage Homestay', address: 'Plot 12, Pichola Lake Road, Haridas Ji Ki Magri', city: 'Udaipur', state: 'Rajasthan', country: 'India', phone: '+91 294 243 0011', email: 'stay@amargarhheritage.com', total_rooms: 25, tagline: '18th-century lakeview haveli offering authentic royal Mewari hospitality.', host_name: 'Vikram Singh Rathore', host_phone: '+91 98290 12345', price_range: '₹3,800 – ₹8,500', rating: 4.9, reviews_count: 48, connectivity_badge: '4G & Offline-Ready PMS', features_json: '["0% Brokerage Direct","Zero Commission Host","Lake Pichola Views","Authentic Mewari Thali","Solar Heated Water","Heritage Courtyard"]', cover_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', created_at: nowIso },
  { id: 'prop_kumbhalgarh_02', owner_id: null, name: 'Kumbhalgarh Valley Homestay', type: 'Rural Homestay', address: 'Village Qila Road, Near Fort Gate', city: 'Kumbhalgarh', state: 'Rajasthan', country: 'India', phone: '+91 94141 88920', email: 'kumbhalgarh@atithiai.com', total_rooms: 8, tagline: 'Off-grid hillside stone cottages near the Great Wall of India with organic farm dining.', host_name: 'Rawat Singh', host_phone: '+91 94141 88920', price_range: '₹2,600 – ₹4,200', rating: 4.8, reviews_count: 36, connectivity_badge: 'Low Signal Haven (Offline Pass Included)', features_json: '["0% Brokerage Direct","Zero Commission Host","Solar Micro-Grid","Farm-to-Table Food","Aravalli Forest Trails","Stargazing Terrace"]', cover_image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', created_at: nowIso },
  { id: 'prop_jaisalmer_03', owner_id: null, name: 'Thar Desert Moon Haveli', type: 'Desert Haveli', address: 'Dhibba Para, Fort Outer Enclosure', city: 'Jaisalmer', state: 'Rajasthan', country: 'India', phone: '+91 94142 33411', email: 'jaisalmer@atithiai.com', total_rooms: 12, tagline: 'Golden sandstone rooms carved by local artisans with private camel desert trails.', host_name: 'Fateh Khan', host_phone: '+91 94142 33411', price_range: '₹2,800 – ₹5,500', rating: 4.9, reviews_count: 64, connectivity_badge: 'Offline-Ready Digital Pass', features_json: '["0% Brokerage Direct","Zero Commission Host","Jaisalmer Fort Views","Evening Manganiyar Folk Music","Dune Sunset Trek"]', cover_image: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=800&q=80', created_at: nowIso },
  { id: 'prop_spiti_04', owner_id: null, name: 'Spiti Valley Cedar Cabin', type: 'Mountain Homestay', address: 'Main Bazaar, Kaza Village', city: 'Kaza (Spiti Valley)', state: 'Himachal Pradesh', country: 'India', phone: '+91 94180 55432', email: 'spiti@atithiai.com', total_rooms: 6, tagline: 'Cozy high-altitude mud & cedar homestay with wood bukhari fireplace and satellite emergency backup.', host_name: 'Tsering Dorje', host_phone: '+91 94180 55432', price_range: '₹2,400 – ₹3,900', rating: 4.9, reviews_count: 31, connectivity_badge: 'Remote Offline Zone (Full SMS Pass)', features_json: '["0% Brokerage Direct","Zero Commission Host","Wood Bukhari Heating","Tibetan Family Hospitality","Monastery Trails"]', cover_image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', created_at: nowIso },
  { id: 'prop_rishikesh_05', owner_id: null, name: 'Ganga Kinare Forest Cottage', type: 'Riverfront Homestay', address: 'Tapovan Forest Edge, Near Laxman Jhula', city: 'Rishikesh', state: 'Uttarakhand', country: 'India', phone: '+91 98370 22114', email: 'rishikesh@atithiai.com', total_rooms: 9, tagline: 'Serene riverside cottages surrounded by sal forest, sacred chanting, and organic gardens.', host_name: 'Anandita & Devendra Roy', host_phone: '+91 98370 22114', price_range: '₹3,200 – ₹5,800', rating: 4.8, reviews_count: 52, connectivity_badge: '4G & Offline-Ready PMS', features_json: '["0% Brokerage Direct","Private Ghat Access","Morning Yoga Included","Ayurvedic Sattvic Kitchen","Birdwatching"]', cover_image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', created_at: nowIso }
];

const inMemRooms = [
  { id: 'room_101', property_id: 'prop_amargarh_01', room_number: '101', type: 'Classic Courtyard Room', price_per_night: 3800, status: 'ready', floor: '1', amenities_json: '["Courtyard View","Wi-Fi","Queen Bed","Heritage Decor"]' },
  { id: 'room_102', property_id: 'prop_amargarh_01', room_number: '102', type: 'Classic Courtyard Room', price_per_night: 3800, status: 'cleaning', floor: '1', amenities_json: '["Courtyard View","Wi-Fi","Queen Bed"]' },
  { id: 'room_103', property_id: 'prop_amargarh_01', room_number: '103', type: 'Deluxe Heritage Room', price_per_night: 5200, status: 'maintenance', floor: '1', amenities_json: '["Lake View Balcony","King Bed","Jharokha Seating"]' },
  { id: 'room_104', property_id: 'prop_amargarh_01', room_number: '104', type: 'Deluxe Heritage Room', price_per_night: 5200, status: 'occupied', floor: '1', amenities_json: '["Lake View Balcony","King Bed","Rain Shower"]' },
  { id: 'room_105', property_id: 'prop_amargarh_01', room_number: '105', type: 'Royal Lakeview Suite', price_per_night: 8500, status: 'ready', floor: '1', amenities_json: '["Panoramic Lake Pichola View","Royal Canopy Bed","Heritage Bathtub"]' },
  { id: 'room_kmb_101', property_id: 'prop_kumbhalgarh_02', room_number: 'C1', type: 'Valley Stone Cottage', price_per_night: 2600, status: 'ready', floor: 'Ground', amenities_json: '["Valley View Patio","Solar Heated Water","King Bed","Clay Water Pitcher"]' },
  { id: 'room_kmb_102', property_id: 'prop_kumbhalgarh_02', room_number: 'C2', type: 'Fort Vista Machan Hut', price_per_night: 3800, status: 'ready', floor: 'Elevated', amenities_json: '["Fort Panorama","Wooden Machan Balcony","Aravalli Breeze"]' },
  { id: 'room_jsm_101', property_id: 'prop_jaisalmer_03', room_number: '101', type: 'Sandstone Courtyard Room', price_per_night: 2800, status: 'ready', floor: '1', amenities_json: '["Stone Carvings","Wi-Fi","Thar Tea","Attached Bath"]' },
  { id: 'room_jsm_102', property_id: 'prop_jaisalmer_03', room_number: '201', type: 'Royal Bastion Lakeview Suite', price_per_night: 4800, status: 'ready', floor: '2', amenities_json: '["Fort Rampart View","King Bed","Sunset Terrace Access"]' },
  { id: 'room_spt_101', property_id: 'prop_spiti_04', room_number: 'K1', type: 'Cedar Pine Room', price_per_night: 2400, status: 'ready', floor: '1', amenities_json: '["Bukhari Heater","Wool Blankets","Tibetan Tea","Mountain View"]' },
  { id: 'room_spt_102', property_id: 'prop_spiti_04', room_number: 'K2', type: 'High Pass Panoramic Attic', price_per_night: 3400, status: 'ready', floor: '2', amenities_json: '["360 Peak View","Heated Bed","Traditional Seating"]' },
  { id: 'room_rsh_101', property_id: 'prop_rishikesh_05', room_number: 'G1', type: 'Sal Forest Cottage', price_per_night: 3200, status: 'ready', floor: 'Ground', amenities_json: '["Private Verandah","Yoga Mat","Forest View","Filtered Spring Water"]' },
  { id: 'room_rsh_102', property_id: 'prop_rishikesh_05', room_number: 'G2', type: 'Sacred Riverview Suite', price_per_night: 4800, status: 'ready', floor: '1', amenities_json: '["Ganges River View","King Bed","Herbal Tea Set","Meditation Corner"]' }
];

const inMemComplaints = [
  { id: 'cmp_01', customer_id: 'usr_guest_01', property_id: 'prop_amargarh_01', room_number: '103', category: 'Maintenance', priority: 'High', description: 'Heritage brass air conditioning unit vibrating and cooling slowly.', status: 'In Progress', created_at: nowIso },
  { id: 'cmp_02', customer_id: 'usr_guest_01', property_id: 'prop_amargarh_01', room_number: '102', category: 'Housekeeping', priority: 'Medium', description: 'Extra handwoven Mewari cotton towels requested for bathroom.', status: 'Open', created_at: nowIso },
  { id: 'cmp_03', customer_id: 'usr_guest_01', property_id: 'prop_amargarh_01', room_number: '104', category: 'Food & Beverage', priority: 'Low', description: 'Hot saffron herbal tea request for evening courtyard sitting.', status: 'Resolved', created_at: nowIso }
];

const inMemTasks = [
  { id: 'tsk_01', property_id: 'prop_amargarh_01', complaint_id: 'cmp_01', assigned_worker_id: 'usr_worker_01', department: 'Maintenance', title: 'Inspect AC unit filter in Room 103', priority: 'High', status: 'IN_PROGRESS', room_number: '103', due_time: 'Within 1 hour', created_at: nowIso },
  { id: 'tsk_02', property_id: 'prop_amargarh_01', complaint_id: 'cmp_02', assigned_worker_id: 'usr_worker_01', department: 'Housekeeping', title: 'Deliver extra towels to Room 102', priority: 'Medium', status: 'PENDING', room_number: '102', due_time: '30 mins', created_at: nowIso },
  { id: 'tsk_03', property_id: 'prop_amargarh_01', complaint_id: null, assigned_worker_id: 'usr_worker_01', department: 'Housekeeping', title: 'Daily sanitize and inspect Room 105 Lakeview Suite', priority: 'Medium', status: 'PENDING', room_number: '105', due_time: '2:00 PM', created_at: nowIso }
];

const inMemReviews = [
  { id: 'rev_01', customer_id: 'usr_guest_01', property_id: 'prop_amargarh_01', rating: 5, cleanliness_rating: 5, staff_rating: 5, amenities_rating: 5, review_title: 'Unbelievable lakeview and royal Mewari hospitality!', review_comment: 'Staying at Amargarh was the highlight of our Rajasthan trip. Vikram and his staff treated us like royalty.', owner_reply: 'Thank you Dev! It was an honor hosting your family.', created_at: nowIso },
  { id: 'rev_02', customer_id: null, property_id: 'prop_amargarh_01', rating: 4.8, cleanliness_rating: 5, staff_rating: 5, amenities_rating: 4.5, review_title: 'True heritage stay, zero middleman booking', review_comment: 'Loved the direct booking option and zero brokerage savings.', owner_reply: null, created_at: nowIso }
];

const inMemBookings = [
  { id: 'bk_demo_01', booking_ref: 'ATI-2026-20482', customer_id: 'usr_guest_01', property_id: 'prop_amargarh_01', room_id: 'room_104', check_in: '2026-09-05', check_out: '2026-09-08', guests_count: 2, total_amount: 12600, payment_status: 'Paid', booking_status: 'Confirmed', created_at: nowIso }
];

const inMemInventory = [
  { id: 'inv_01', property_id: 'prop_amargarh_01', item_name: 'Organic Herbal Soap Bars', category: 'Toiletries', quantity: 120, threshold: 30, unit: 'bars', last_restocked: nowIso },
  { id: 'inv_02', property_id: 'prop_amargarh_01', item_name: 'Mewari Handwoven Towels', category: 'Linen', quantity: 65, threshold: 20, unit: 'pieces', last_restocked: nowIso },
  { id: 'inv_03', property_id: 'prop_amargarh_01', item_name: 'Filtered Water Glass Bottles', category: 'Dining', quantity: 80, threshold: 25, unit: 'bottles', last_restocked: nowIso }
];

// Seed SQLite if available
if (db) {
  try {
    initSchema();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      console.log('📦 Seeding initial AtithiAI demo users into SQLite...');
      const insertUser = db.prepare('INSERT INTO users (id, role, name, email, password_hash, salt, phone, details_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const u of inMemUsers) {
        insertUser.run(u.id, u.role, u.name, u.email, u.password_hash, u.salt, u.phone, u.details_json, u.created_at, u.updated_at);
      }
    }

    const propCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
    if (propCount === 0) {
      console.log('🏡 Seeding verified rural homestays into SQLite...');
      const insertProp = db.prepare(`
        INSERT INTO properties (id, owner_id, name, type, address, city, state, country, phone, email, total_rooms, tagline, host_name, host_phone, price_range, rating, reviews_count, connectivity_badge, features_json, cover_image, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of inMemProperties) {
        insertProp.run(p.id, p.owner_id, p.name, p.type, p.address, p.city, p.state, p.country, p.phone, p.email, p.total_rooms, p.tagline, p.host_name, p.host_phone, p.price_range, p.rating, p.reviews_count, p.connectivity_badge, p.features_json, p.cover_image, p.created_at);
      }

      const insertRoom = db.prepare(`
        INSERT INTO rooms (id, property_id, room_number, type, price_per_night, status, floor, amenities_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of inMemRooms) {
        insertRoom.run(r.id, r.property_id, r.room_number, r.type, r.price_per_night, r.status, r.floor, r.amenities_json);
      }

      const insertComplaint = db.prepare(`INSERT INTO complaints (id, customer_id, property_id, room_number, category, priority, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const c of inMemComplaints) {
        insertComplaint.run(c.id, c.customer_id, c.property_id, c.room_number, c.category, c.priority, c.description, c.status, c.created_at);
      }

      const insertTask = db.prepare(`INSERT INTO tasks (id, property_id, complaint_id, assigned_worker_id, department, title, priority, status, room_number, due_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const t of inMemTasks) {
        insertTask.run(t.id, t.property_id, t.complaint_id, t.assigned_worker_id, t.department, t.title, t.priority, t.status, t.room_number, t.due_time, t.created_at);
      }

      const insertReview = db.prepare(`INSERT INTO reviews (id, customer_id, property_id, rating, cleanliness_rating, staff_rating, amenities_rating, review_title, review_comment, owner_reply, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const rev of inMemReviews) {
        insertReview.run(rev.id, rev.customer_id, rev.property_id, rev.rating, rev.cleanliness_rating, rev.staff_rating, rev.amenities_rating, rev.review_title, rev.review_comment, rev.owner_reply, rev.created_at);
      }

      const insertInventory = db.prepare(`INSERT INTO inventory (id, property_id, item_name, category, quantity, threshold, unit, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const inv of inMemInventory) {
        insertInventory.run(inv.id, inv.property_id, inv.item_name, inv.category, inv.quantity, inv.threshold, inv.unit, inv.last_restocked);
      }
    }
  } catch (e) {
    console.warn('[AtithiAI DB] SQLite seeding note:', e.message);
  }
}

// -------------------------------------------------------------
// Database Operations API (Supports SQLite & In-Memory Fallback)
// -------------------------------------------------------------
const dbOps = {
  db,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,

  // Users
  getUserByEmail: (email) => {
    if (db) {
      return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
    }
    return inMemUsers.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) || null;
  },
  getUserById: (id) => {
    if (db) {
      return db.prepare('SELECT id, role, name, email, phone, avatar_url, details_json, created_at FROM users WHERE id = ?').get(id);
    }
    const u = inMemUsers.find(x => x.id === id);
    if (!u) return null;
    return { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone, avatar_url: u.avatar_url, details_json: u.details_json, created_at: u.created_at };
  },
  createUser: ({ id, role, name, email, password, phone, details }) => {
    const { hash, salt } = hashPassword(password);
    const userId = id || `usr_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details || {});

    if (db) {
      db.prepare(`
        INSERT INTO users (id, role, name, email, password_hash, salt, phone, details_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, role, name, email, hash, salt, phone || null, detailsJson, now, now);

      if (role === 'owner') {
        const propId = `prop_${crypto.randomBytes(5).toString('hex')}`;
        const propName = (details && details.propertyName) || `${name}'s Stay`;
        const propType = (details && details.propertyType) || 'Heritage Homestay';
        const city = (details && details.city) || 'Udaipur';
        const rooms = (details && parseInt(details.totalRooms, 10)) || 10;
        try {
          db.prepare(`
            INSERT INTO properties (id, owner_id, name, type, city, total_rooms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(propId, userId, propName, propType, city, rooms, now);
        } catch (e) {}
      }

      return dbOps.getUserById(userId);
    }

    const newUser = { id: userId, role, name, email, password_hash: hash, salt, phone: phone || null, details_json: detailsJson, created_at: now, updated_at: now };
    inMemUsers.push(newUser);
    if (role === 'owner') {
      const propId = `prop_${crypto.randomBytes(5).toString('hex')}`;
      inMemProperties.push({
        id: propId,
        owner_id: userId,
        name: (details && details.propertyName) || `${name}'s Stay`,
        type: (details && details.propertyType) || 'Heritage Homestay',
        address: '',
        city: (details && details.city) || 'Udaipur',
        state: 'Rajasthan',
        country: 'India',
        phone: phone || '',
        email: email || '',
        total_rooms: (details && parseInt(details.totalRooms, 10)) || 10,
        features_json: '[]',
        created_at: now
      });
    }
    return dbOps.getUserById(userId);
  },

  // Properties & Rooms
  getProperties: () => {
    if (db) {
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
    }
    return inMemProperties.map(p => {
      const rooms = inMemRooms.filter(r => r.property_id === p.id);
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
    if (db) {
      const prop = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
      if (!prop) return null;
      const rooms = db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(id);
      return {
        ...prop,
        features: JSON.parse(prop.features_json || '[]'),
        rooms
      };
    }
    const prop = inMemProperties.find(p => p.id === id);
    if (!prop) return null;
    const rooms = inMemRooms.filter(r => r.property_id === id);
    return {
      ...prop,
      features: JSON.parse(prop.features_json || '[]'),
      rooms
    };
  },
  searchProperties: ({ location = '', stayType = '', query = '' } = {}) => {
    if (db) {
      let sql = 'SELECT * FROM properties WHERE 1=1';
      const params = [];

      if (location && location.trim()) {
        sql += ' AND (city LIKE ? OR state LIKE ? OR address LIKE ?)';
        const locTerm = `%${location.trim()}%`;
        params.push(locTerm, locTerm, locTerm);
      }
      if (stayType && stayType !== 'all' && stayType.trim()) {
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
    }

    let list = inMemProperties.slice();
    if (location && location.trim()) {
      const l = location.trim().toLowerCase();
      list = list.filter(p =>
        (p.city && p.city.toLowerCase().includes(l)) ||
        (p.state && p.state.toLowerCase().includes(l)) ||
        (p.address && p.address.toLowerCase().includes(l))
      );
    }
    if (stayType && stayType !== 'all' && stayType.trim()) {
      const t = stayType.trim().toLowerCase();
      list = list.filter(p => p.type && p.type.toLowerCase().includes(t));
    }
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.tagline && p.tagline.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.host_name && p.host_name.toLowerCase().includes(q))
      );
    }
    return list.map(p => {
      const rooms = inMemRooms.filter(r => r.property_id === p.id);
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
    if (db) {
      return db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(propertyId);
    }
    return inMemRooms.filter(r => r.property_id === propertyId);
  },

  // Complaints
  getComplaints: (propertyId = null) => {
    if (db) {
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
    }
    return inMemComplaints.filter(c => !propertyId || c.property_id === propertyId);
  },
  createComplaint: ({ customerId, propertyId, roomNumber, category, priority, description }) => {
    const id = `cmp_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const pid = propertyId || 'prop_amargarh_01';

    if (db) {
      db.prepare(`
        INSERT INTO complaints (id, customer_id, property_id, room_number, category, priority, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?)
      `).run(id, customerId || null, pid, roomNumber || '204', category || 'General', priority || 'Medium', description, now);
      return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    }

    const item = { id, customer_id: customerId || null, property_id: pid, room_number: roomNumber || '204', category: category || 'General', priority: priority || 'Medium', description, status: 'Open', created_at: now };
    inMemComplaints.unshift(item);
    return item;
  },
  updateComplaintStatus: (id, status) => {
    const resolvedAt = status === 'Resolved' ? new Date().toISOString() : null;
    if (db) {
      db.prepare(`
        UPDATE complaints SET status = ?, resolved_at = ? WHERE id = ?
      `).run(status, resolvedAt, id);
      return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    }
    const c = inMemComplaints.find(x => x.id === id);
    if (c) { c.status = status; c.resolved_at = resolvedAt; }
    return c;
  },

  // Tasks
  getTasks: (propertyId = null, workerId = null) => {
    if (db) {
      let query = `
        SELECT t.*, u.name as worker_name, p.name as property_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_worker_id = u.id
        LEFT JOIN properties p ON t.property_id = p.id
        WHERE 1=1
      `;
      const params = [];
      if (propertyId) {
        query += ' AND t.property_id = ?';
        params.push(propertyId);
      }
      if (workerId) {
        query += ' AND t.assigned_worker_id = ?';
        params.push(workerId);
      }
      query += ' ORDER BY t.created_at DESC';
      return db.prepare(query).all(...params);
    }
    return inMemTasks.filter(t => (!propertyId || t.property_id === propertyId) && (!workerId || t.assigned_worker_id === workerId));
  },
  createTask: ({ propertyId, complaintId, assignedWorkerId, department, title, priority, roomNumber, dueTime }) => {
    const id = `tsk_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const pid = propertyId || 'prop_amargarh_01';

    if (db) {
      db.prepare(`
        INSERT INTO tasks (id, property_id, complaint_id, assigned_worker_id, department, title, priority, status, room_number, due_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
      `).run(id, pid, complaintId || null, assignedWorkerId || null, department || 'Housekeeping', title, priority || 'Medium', roomNumber || null, dueTime || 'Immediate', now);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    }

    const item = { id, property_id: pid, complaint_id: complaintId || null, assigned_worker_id: assignedWorkerId || null, department: department || 'Housekeeping', title, priority: priority || 'Medium', status: 'PENDING', room_number: roomNumber || null, due_time: dueTime || 'Immediate', created_at: now };
    inMemTasks.unshift(item);
    return item;
  },
  updateTaskStatus: (id, status) => {
    const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
    if (db) {
      db.prepare(`
        UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?
      `).run(status, completedAt, id);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    }
    const t = inMemTasks.find(x => x.id === id);
    if (t) { t.status = status; t.completed_at = completedAt; }
    return t;
  },

  // Reviews
  getReviews: (propertyId = null) => {
    if (db) {
      const pid = propertyId || 'prop_amargarh_01';
      return db.prepare(`
        SELECT r.*, u.name as reviewer_name
        FROM reviews r
        LEFT JOIN users u ON r.customer_id = u.id
        WHERE r.property_id = ?
        ORDER BY r.created_at DESC
      `).all(pid);
    }
    return inMemReviews.filter(r => !propertyId || r.property_id === propertyId);
  },
  createReview: ({ customerId, propertyId, rating, cleanliness, staff, amenities, title, comment }) => {
    const id = `rev_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const pid = propertyId || 'prop_amargarh_01';

    if (db) {
      db.prepare(`
        INSERT INTO reviews (id, customer_id, property_id, rating, cleanliness_rating, staff_rating, amenities_rating, review_title, review_comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, customerId || null, pid, rating || 5.0, cleanliness || 5, staff || 5, amenities || 5, title || '', comment || '', now);
      return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    }

    const rev = { id, customer_id: customerId || null, property_id: pid, rating: rating || 5.0, cleanliness_rating: cleanliness || 5, staff_rating: staff || 5, amenities_rating: amenities || 5, review_title: title || '', review_comment: comment || '', created_at: now };
    inMemReviews.unshift(rev);
    return rev;
  },

  // Bookings
  getBookings: (customerId = null) => {
    if (db) {
      let query = `
        SELECT b.*, p.name as property_name, p.city as property_city, r.room_number, r.type as room_type
        FROM bookings b
        LEFT JOIN properties p ON b.property_id = p.id
        LEFT JOIN rooms r ON b.room_id = r.id
      `;
      if (customerId) {
        query += ' WHERE b.customer_id = ? ORDER BY b.created_at DESC';
        return db.prepare(query).all(customerId);
      }
      return db.prepare(query + ' ORDER BY b.created_at DESC').all();
    }
    return inMemBookings.filter(b => !customerId || b.customer_id === customerId);
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

    if (db) {
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

      if (roomId) {
        try {
          db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(roomId);
        } catch(e) {}
      }

      try {
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
      } catch (e) {}

      return db.prepare(`
        SELECT b.*, p.name as property_name, p.city as property_city, p.type as property_type,
               p.address as property_address, p.phone as property_phone, p.host_name, p.connectivity_badge,
               r.room_number, r.type as room_type
        FROM bookings b
        LEFT JOIN properties p ON b.property_id = p.id
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE b.id = ?
      `).get(id);
    }

    const prop = inMemProperties.find(p => p.id === propertyId) || inMemProperties[0];
    const rm = inMemRooms.find(r => r.id === roomId);
    if (rm) { rm.status = 'occupied'; }

    const item = {
      id,
      booking_ref: bookingRef,
      customer_id: customerId || null,
      property_id: propertyId,
      room_id: roomId || null,
      check_in: checkIn || now.split('T')[0],
      check_out: checkOut || now.split('T')[0],
      guests_count: parseInt(guestsCount, 10) || 2,
      total_amount: parseFloat(totalAmount) || 0,
      payment_status: paymentMethod === 'arrival' ? 'Pending' : 'Paid',
      booking_status: 'Confirmed',
      created_at: now,
      property_name: prop ? prop.name : 'Heritage Stay',
      property_city: prop ? prop.city : 'Udaipur',
      property_type: prop ? prop.type : 'Heritage Homestay',
      property_address: prop ? prop.address : '',
      property_phone: prop ? prop.phone : '',
      host_name: prop ? prop.host_name : 'Host',
      connectivity_badge: prop ? prop.connectivity_badge : 'Offline-Ready',
      room_number: rm ? rm.room_number : '101',
      room_type: rm ? rm.type : 'Deluxe Room'
    };
    inMemBookings.unshift(item);
    return item;
  },

  // Inventory
  getInventory: (propertyId = null) => {
    if (db) {
      const pid = propertyId || 'prop_amargarh_01';
      return db.prepare('SELECT * FROM inventory WHERE property_id = ? ORDER BY category ASC, item_name ASC').all(pid);
    }
    return inMemInventory.filter(i => !propertyId || i.property_id === propertyId);
  },

  // Stats for dashboards
  getStats: () => {
    if (db) {
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
    }

    const totalRooms = inMemRooms.length;
    const occupiedRooms = inMemRooms.filter(r => r.status === 'occupied').length;
    const openComplaints = inMemComplaints.filter(c => c.status !== 'Resolved').length;
    const pendingTasks = inMemTasks.filter(t => t.status !== 'COMPLETED').length;
    return {
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 72,
      openComplaints,
      pendingTasks,
      avgRating: '4.8',
      totalBookings: inMemBookings.length
    };
  },

  // Table names list for debugging
  getTableNames: () => {
    if (db) {
      return db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").all().map(t => t.name);
    }
    return ['users', 'properties', 'rooms', 'bookings', 'complaints', 'tasks', 'reviews', 'inventory', 'audit_logs'];
  }
};

module.exports = dbOps;
