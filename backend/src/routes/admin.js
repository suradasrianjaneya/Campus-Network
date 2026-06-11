const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Item = require('../models/Item');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply admin protection to all routes in this file
router.use(auth);
router.use(adminAuth);

// @route   GET api/admin/users
// @desc    Get all students list
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error retrieving users list' });
  }
});

// @route   PUT api/admin/users/:id/ban
// @desc    Ban or unban a user
// @access  Admin
router.put('/users/:id/ban', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'Administrators cannot be banned' });
    }

    // Toggle ban state
    targetUser.banned = !targetUser.banned;
    await targetUser.save();

    res.json({
      message: `User has been successfully ${targetUser.banned ? 'banned' : 'unbanned'}`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        rollNumber: targetUser.rollNumber,
        email: targetUser.email,
        banned: targetUser.banned
      }
    });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ message: 'Server error updating user ban status' });
  }
});

// @route   GET api/admin/stats
// @desc    Get platform stats for dashboard
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activePosts = await Post.countDocuments();
    
    // Marketplace stats
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const soldProducts = await Product.countDocuments({ status: 'sold' });

    // Lost & Found stats
    const totalItems = await Item.countDocuments();
    const lostItems = await Item.countDocuments({ type: 'lost' });
    const foundItems = await Item.countDocuments({ type: 'found' });
    const resolvedItems = await Item.countDocuments({ resolved: true });
    
    // Fetch suspicious reports
    const flaggedItems = await Item.find({ 'suspiciousClaims.0': { $exists: true } })
      .populate('reporter', 'name rollNumber')
      .populate('suspiciousClaims.user', 'name rollNumber')
      .select('name type category suspiciousClaims location');

    res.json({
      metrics: {
        totalUsers,
        activePosts,
        totalProducts,
        activeProducts,
        soldProducts,
        totalItems,
        lostItems,
        foundItems,
        resolvedItems
      },
      flaggedItems
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error calculating system metrics' });
  }
});

module.exports = router;
