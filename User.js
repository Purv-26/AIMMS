const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    enum: ['doctor', 'patient'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 
