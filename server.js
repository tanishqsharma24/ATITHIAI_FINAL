const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dbOps = require('./db.js');

const app = express();
const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

// -------------------------------------------------------------
// Middleware
// -------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

// -------------------------------------------------------------
// Auth Middleware
// -------------------------------------------------------------
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const payload = dbOps.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  req.user = payload;
  next();
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// POST /api/auth/register (or /signup)
const handleRegister = (req, res) => {
  try {
    const { role, name, email, password, phone, ...details } = req.body;

    if (!role || !['owner', 'worker', 'customer'].includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Valid role is required (owner, worker, customer)' });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required (min 2 characters)' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanRole = role.toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = dbOps.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please Sign In.' });
    }

    // Create user
    const newUser = dbOps.createUser({
      role: cleanRole,
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone || null,
      details,
    });

    const token = dbOps.generateToken({
      id: newUser.id,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        role: newUser.role,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        details: JSON.parse(newUser.details_json || '{}'),
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration: ' + err.message });
  }
};

app.post('/api/auth/register', handleRegister);
app.post('/api/auth/signup', handleRegister);

// POST /api/auth/login (or /signin)
const handleLogin = (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = dbOps.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email address. Please Sign Up.' });
    }

    // Role check if provided
    if (role && role.toLowerCase() !== user.role.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `This email is registered as an ${user.role.toUpperCase()}. Please select the "${user.role.toUpperCase()}" role tab to sign in.`,
        registeredRole: user.role
      });
    }

    const isValid = dbOps.verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please check your credentials.' });
    }

    const token = dbOps.generateToken({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        details: JSON.parse(user.details_json || '{}'),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login: ' + err.message });
  }
};

app.post('/api/auth/login', handleLogin);
app.post('/api/auth/signin', handleLogin);

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = dbOps.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({
    success: true,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      details: JSON.parse(user.details_json || '{}'),
    },
  });
});

// -------------------------------------------------------------
// Hospitality Data Endpoints
// -------------------------------------------------------------

// GET /api/stats (Aggregated Overview)
app.get('/api/stats', (req, res) => {
  try {
    const stats = dbOps.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/properties & /api/properties/search & /api/properties/:id
app.get('/api/properties', (req, res) => {
  try {
    const props = dbOps.getProperties();
    res.json({ success: true, data: props });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/properties/search', (req, res) => {
  try {
    const { location, stayType, query } = req.query;
    const properties = dbOps.searchProperties({ location, stayType, query });
    res.json({ success: true, data: properties });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/properties/:id', (req, res) => {
  try {
    const property = dbOps.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/agent/recommend (AI-driven Stay Matcher)
app.post('/api/agent/recommend', (req, res) => {
  try {
    const { prompt, location } = req.body;
    const allProps = dbOps.getProperties();

    let matched = allProps;
    const cleanPrompt = (prompt || '').toLowerCase();

    if (location || cleanPrompt) {
      const filtered = matched.filter(p => {
        const text = `${p.name} ${p.city} ${p.state} ${p.tagline || ''} ${p.type} ${p.features_json || ''}`.toLowerCase();
        if (location && text.includes(location.toLowerCase())) return true;
        if (cleanPrompt.includes(p.city.toLowerCase())) return true;
        if (cleanPrompt.includes('offline') && (p.connectivity_badge || '').toLowerCase().includes('offline')) return true;
        if (cleanPrompt.includes('heritage') && (p.type || '').toLowerCase().includes('heritage')) return true;
        if (cleanPrompt.includes('desert') && text.includes('desert')) return true;
        if (cleanPrompt.includes('mountain') && text.includes('mountain')) return true;
        if (cleanPrompt.includes('cheap') || cleanPrompt.includes('budget')) return p.minPrice <= 3000;
        return false;
      });
      if (filtered.length > 0) matched = filtered;
    }

    const top = matched[0] || allProps[0];
    const aiMessage = `Based on your stay details, I recommend **${top.name}** in ${top.city} hosted directly by ${top.host_name || 'the local host'}. You save 100% on middleman commissions (0% Brokerage), and your booking includes an Offline Digital Pass for seamless check-in even without internet connectivity.`;

    res.json({
      success: true,
      recommendation: aiMessage,
      properties: matched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/rooms', (req, res) => {
  try {
    const propertyId = req.query.propertyId || 'prop_amargarh_01';
    const rooms = dbOps.getRoomsByProperty(propertyId);
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/complaints
app.get('/api/complaints', (req, res) => {
  try {
    const complaints = dbOps.getComplaints(req.query.propertyId || null);
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/complaints', (req, res) => {
  try {
    const { customerId, propertyId, roomNumber, category, priority, description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Complaint description is required' });
    }
    const newComplaint = dbOps.createComplaint({
      customerId,
      propertyId,
      roomNumber,
      category,
      priority,
      description,
    });

    // Auto-create a task for staff if critical/high
    const dept = (category && category.toLowerCase().includes('clean')) ? 'Housekeeping' : 'Maintenance';
    dbOps.createTask({
      propertyId,
      complaintId: newComplaint.id,
      department: dept,
      title: `Resolve Guest Issue: ${category || 'General'} (${roomNumber || 'Room 204'})`,
      priority: priority || 'Medium',
      roomNumber: roomNumber || '204',
      dueTime: 'Within 2 hrs',
    });

    res.status(201).json({ success: true, message: 'Complaint registered successfully', data: newComplaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/complaints/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required' });
    }
    const updated = dbOps.updateComplaintStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST & PATCH /api/tasks
app.get('/api/tasks', (req, res) => {
  try {
    const { workerId, department } = req.query;
    const tasks = dbOps.getTasks(workerId || null, department || null);
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { propertyId, complaintId, assignedWorkerId, department, title, priority, roomNumber, dueTime } = req.body;
    if (!title || !department) {
      return res.status(400).json({ success: false, message: 'Title and department are required' });
    }
    const task = dbOps.createTask({
      propertyId,
      complaintId,
      assignedWorkerId,
      department,
      title,
      priority,
      roomNumber,
      dueTime,
    });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const updated = dbOps.updateTaskStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/reviews
app.get('/api/reviews', (req, res) => {
  try {
    const reviews = dbOps.getReviews(req.query.propertyId || null);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const { customerId, propertyId, rating, cleanliness, staff, amenities, title, comment } = req.body;
    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }
    const newReview = dbOps.createReview({
      customerId,
      propertyId,
      rating: parseFloat(rating),
      cleanliness: cleanliness ? parseFloat(cleanliness) : 5,
      staff: staff ? parseFloat(staff) : 5,
      amenities: amenities ? parseFloat(amenities) : 5,
      title,
      comment,
    });
    res.status(201).json({ success: true, message: 'Review submitted successfully', data: newReview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/bookings
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = dbOps.getBookings(req.query.customerId || null);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const {
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
    } = req.body;

    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'Property selection is required' });
    }

    const booking = dbOps.createBooking({
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
      paymentMethod: paymentMethod || 'arrival',
      specialRequests
    });

    res.status(201).json({
      success: true,
      message: 'Zero-brokerage direct booking confirmed successfully!',
      data: booking
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to process booking: ' + err.message });
  }
});

// GET /api/inventory
app.get('/api/inventory', (req, res) => {
  try {
    const items = dbOps.getInventory(req.query.propertyId || null);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// Static File Serving & Fallback
// -------------------------------------------------------------
app.use(express.static(ROOT_DIR, {
  index: 'index.html',
  maxAge: '0', // Development mode - no aggressive browser caching
}));

// Route fallback for 404
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>404 Not Found - AtithiAI</title>
      <style>
        body { background: #0b0f19; color: #f3f4f6; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 16px; text-align: center; max-width: 480px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        h1 { font-size: 3rem; margin: 0 0 1rem; color: #38bdf8; }
        p { color: rgba(255,255,255,0.7); line-height: 1.6; }
        a { color: #fff; text-decoration: none; display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #0066FF, #00B1C5); border-radius: 999px; font-weight: 500; }
        a:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>404</h1>
        <p>The requested route <code>${req.url}</code> could not be found.</p>
        <a href="/">Return to Home</a>
      </div>
    </body>
    </html>
  `);
});

// -------------------------------------------------------------
// Server Start (Only when run directly, not in Vercel Serverless)
// -------------------------------------------------------------
if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 AtithiAI Hospitality Platform Server Running!`);
    console.log(`======================================================`);
    console.log(`  Local URL:        http://localhost:${PORT}/`);
    console.log(`  Login Portal:     http://localhost:${PORT}/auth.html`);
    console.log(`  Landing Page:     http://localhost:${PORT}/Atithiai_Landing.Page1.html`);
    console.log(`  Customer Stay:    http://localhost:${PORT}/Customer_Dashboard1.html`);
    console.log(`  Owner Dashboard:  http://localhost:${PORT}/Owner_Dashboard2.html`);
    console.log(`  Worker Dashboard: http://localhost:${PORT}/worker_Dashboard_2.html`);
    console.log(`  API Status:       http://localhost:${PORT}/api/stats`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
