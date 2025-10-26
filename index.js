const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./utils/db');

// Load env for local/dev (Vercel provides env in runtime)
dotenv.config();

overrideEnvFromConfig();

function overrideEnvFromConfig() {
  // Optional: allow config.env fallback like server.js does
  try {
    dotenv.config({ path: './config.env' });
  } catch (e) {}
}

const app = express();

// Middleware (match server.js behavior as closely as possible)
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006', 'exp://192.168.100.15:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight request logger (same pattern as server.js for /api)
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

// Connect to MongoDB (cached in serverless)
connectDB();

// Routes (unchanged)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/classes', require('./routes/classes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hifz Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler (keep same shape)
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

// Export the app for Vercel serverless
module.exports = app;
