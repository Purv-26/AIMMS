require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const User = require('./models/User');

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

// Signup endpoint
app.post('/signup/:role', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { role } = req.params;
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'Signup successful!' });
  } catch (err) {
    console.error(err);
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