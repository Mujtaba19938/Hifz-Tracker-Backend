const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'], // e.g., "Hifz 3"
    unique: true,
    trim: true,
  },
  sections: [
    {
      type: String, // e.g., "A", "B", "C"
      required: true,
      trim: true,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
