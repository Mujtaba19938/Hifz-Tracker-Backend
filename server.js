const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables from .env first, then fallback to config.env
dotenv.config();
dotenv.config({ path: './config.env' });

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006', 'exp://192.168.100.15:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const safeBody = typeof req.body === 'object' ? { ...req.body } : req.body;
    try {
      if (safeBody && typeof safeBody === 'object') {
        if ('password' in safeBody) safeBody.password = '[REDACTED]';
        if ('token' in safeBody) safeBody.token = '[REDACTED]';
      }
    } catch (_) {}
    console.log(`➡️  ${req.method} ${req.path}`, { query: req.query, body: safeBody });
  }
  next();
});

// MongoDB Connection with improved stability
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://khananimujtaba_db_user:WiXhDMSLON4ke5qh@hifztrackercluster.lyskfqj.mongodb.net/hifztracker?retryWrites=true&w=majority";

const connectDB = async (retryCount = 0) => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      bufferCommands: false
    });
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log('✅ Live data sync active between Admin, Teacher, and Student');
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}/${maxRetries}):`, error.message);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying connection in ${retryDelay/1000} seconds...`);
      setTimeout(() => connectDB(retryCount + 1), retryDelay);
    } else {
      console.error('❌ Failed to connect to MongoDB after maximum retries');
      console.error('🔄 Will continue attempting to reconnect...');
      setTimeout(() => connectDB(0), retryDelay);
    }
  }
};

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  // Automatically attempt reconnection
  setTimeout(() => {
    if (mongoose.connection.readyState === 0) {
      console.log('🔄 Attempting automatic reconnection...');
      connectDB(0);
    }
  }, 2000);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error.message);
  // Attempt reconnection on error
  if (mongoose.connection.readyState === 0) {
    console.log('🔄 Attempting reconnection after error...');
    setTimeout(() => connectDB(0), 3000);
  }
});

mongoose.connection.on('close', () => {
  console.warn('⚠️ MongoDB connection closed');
});

mongoose.connection.on('connecting', () => {
  console.log('🔄 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

// Connect to MongoDB
connectDB();

// Ensure an admin user exists
const User = require('./models/User');
async function ensureAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@hifztracker.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.ADMIN_NAME || 'Super Admin';

    let admin = await User.findOne({ email });
    if (!admin) {
      admin = new User({ name, email, phoneNumber: '1000000000', password, role: 'admin', isActive: true });
      await admin.save();
      console.log(`👑 Admin user created: ${email}`);
      return;
    }
    let updated = false;
    if (admin.role !== 'admin') { admin.role = 'admin'; updated = true; }
    if (process.env.ADMIN_PASSWORD) { admin.password = password; updated = true; }
    if (updated) { await admin.save(); console.log(`👑 Admin user ensured/updated: ${email}`); }
    else { console.log(`👑 Admin user present: ${email}`); }
  } catch (e) {
    console.error('❌ ensureAdminUser error:', e.message);
  }
}

mongoose.connection.once('connected', () => {
  ensureAdminUser();
});

// Routes
const routesPath = path.join(__dirname, 'routes');

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/activity', require('./src/routes/activity'));
app.use('/api/homework', require('./src/routes/homework'));
app.use('/api/classes', require('./src/routes/classes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Hifz Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Create HTTP server and attach Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io instance for route handlers
app.set('io', io);

// Socket.io connection handlers
io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  socket.on('join_class', ({ className, section }) => {
    const room = `${className}-${section}`;
    socket.join(room);
    console.log(`Teacher joined room: ${room}`);
  });

  socket.on('join_student', (studentId) => {
    const room = `student-${studentId}`;
    socket.join(room);
    console.log(`Student joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});
