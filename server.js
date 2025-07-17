require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const multer = require('multer');
const Doctor = require('./models/Doctor');
const Login = require('./models/Login');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aimms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Multer setup for doctor proof uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Signup Patient
app.post('/signup/patient', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: 'patient' });
    await user.save();
    res.status(201).json({ message: 'Signup successful!', role: 'patient' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Signup Doctor (with proof upload)
app.post('/signup/doctor', upload.single('proof'), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || !req.file) {
      return res.status(400).json({ message: 'All fields are required (including proof).' });
    }
    const existingDoctor = await Doctor.findOne({ username });
    if (existingDoctor) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = new Doctor({ username, password: hashedPassword, role: 'doctor', proof: req.file.filename });
    await doctor.save();
    res.status(201).json({ message: 'Signup successful!', role: 'doctor' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login endpoint for both users and doctors
app.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    let user = null;
    if (role === 'doctor') {
      user = await Doctor.findOne({ username });
    } else if (role === 'patient') {
      user = await User.findOne({ username });
    } else {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Log the login
    await Login.create({ username, role });
    res.status(200).json({ message: 'Login successful!', role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Admin endpoints to fetch all users and doctors
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
app.get('/admin/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({}, '-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('AIMMS Backend Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
