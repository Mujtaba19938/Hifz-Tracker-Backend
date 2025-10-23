const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['sabak','revision','manzil','new'], default: 'sabak' },
  surah: { type: String },
  startVerse: { type: Number },
  endVerse: { type: Number },
  mistakes: { type: Number, default: 0 },
  qualities: { type: String, default: '' },
  status: { type: String, enum: ['pending','completed'], default: 'pending' },
  dateAssigned: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
