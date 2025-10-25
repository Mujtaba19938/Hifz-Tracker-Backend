const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars from .env first, then config.env (if present)
dotenv.config();
dotenv.config({ path: './config.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set. Please set it in .env or config.env');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️ Admin already exists:', {
        id: existingAdmin._id.toString(),
        name: existingAdmin.name,
        email: existingAdmin.email,
      });
      return;
    }

    // Generate a unique phoneNumber (required and unique for non-students)
    async function generateUniquePhone() {
      let unique = false;
      let phone = '';
      while (!unique) {
        phone = '1' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        // eslint-disable-next-line no-await-in-loop
        const exists = await User.findOne({ phoneNumber: phone });
        unique = !exists;
      }
      return phone;
    }

    const phoneNumber = await generateUniquePhone();

    const admin = new User({
      name: 'Admin',
      email: 'admin', // backend expects username in the email field
      phoneNumber,
      password: 'admin123', // will be hashed by pre-save hook
      role: 'admin',
      isActive: true,
    });

    await admin.save();

    console.log('✅ Default admin created successfully');
    console.log('---');
    console.log('Username (email): admin');
    console.log('Password:        admin123');
    console.log('Admin ID:', admin._id.toString());
    console.log('Phone:', admin.phoneNumber);
  } catch (err) {
    console.error('❌ Seed admin error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

run();
