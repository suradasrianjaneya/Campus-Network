const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { upload, uploadImage } = require('../middleware/upload');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'fallback_secret_key', 
    { expiresIn: '7d' }
  );
};

// @route   POST api/auth/register
// @desc    Register a student
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
  const { name, rollNumber, department, year, email, password } = req.body;

  try {
    // Basic validation
    if (!name || !rollNumber || !department || !year || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check college email pattern if required (could be configured later)
    
    // Check if user already exists (by email or rollNumber)
    let user = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (user) {
      if (user.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      return res.status(400).json({ message: 'User with this roll number already exists' });
    }

    user = new User({
      name,
      rollNumber,
      department,
      year,
      email,
      password
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        department: user.department,
        year: user.year,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// @route   POST api/auth/login
// @desc    Login a student
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'Your account has been banned by an administrator' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        department: user.department,
        year: user.year,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// @route   GET api/auth/me
// @desc    Get current logged in user details
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      rollNumber: req.user.rollNumber,
      department: req.user.department,
      year: req.user.year,
      email: req.user.email,
      bio: req.user.bio,
      profilePicture: req.user.profilePicture,
      role: req.user.role,
      wishlist: req.user.wishlist
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile details (bio & profile picture)
// @access  Private
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, bio, department, year } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (department) user.department = department;
    if (year) user.year = year;

    if (req.file) {
      const hostUrl = `${req.protocol}://${req.get('host')}`;
      const profilePicUrl = await uploadImage(req.file, hostUrl);
      user.profilePicture = profilePicUrl;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        department: user.department,
        year: user.year,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        role: user.role,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});

module.exports = router;
