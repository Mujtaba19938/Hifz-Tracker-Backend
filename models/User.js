const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: function() {
      return this.role !== 'student';
    },
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['teacher', 'admin', 'student'],
    default: 'teacher'
  },
  masjidInfo: {
    name: String,
    address: String,
    city: String,
    country: String
  },
  studentInfo: {
    class: String,
    section: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hashing password for user:', {
      name: this.name,
      role: this.role,
      originalPassword: this.password,
      passwordLength: this.password?.length
    });
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('Password hashed successfully for:', this.name);
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing password:', {
    candidatePassword: candidatePassword,
    storedPassword: this.password,
    candidateLength: candidatePassword?.length,
    storedLength: this.password?.length
  });
  
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password comparison result:', result);
  
  return result;
};

module.exports = mongoose.model('User', userSchema);
