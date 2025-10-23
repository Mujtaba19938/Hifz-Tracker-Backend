const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  urduName: {
    type: String,
    required: [true, 'Urdu name is required'],
    trim: true
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  studentId: {
    type: String,
    unique: true,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latestAssignment: {
    type: Object,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Student', studentSchema);
