const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 32
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'doctor',
    enum: ['doctor'],
    required: true
  },
  proof: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema); 