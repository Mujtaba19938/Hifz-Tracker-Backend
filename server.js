const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/homework', require('./routes/homework'));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Server accessible at:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://127.0.0.1:${PORT}`);
  console.log(`   - http://192.168.100.15:${PORT}`);
  console.log(`   - http://10.5.0.2:${PORT}`);
});
