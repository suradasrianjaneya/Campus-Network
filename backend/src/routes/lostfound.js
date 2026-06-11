const express = require('express');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { upload, uploadImage } = require('../middleware/upload');

const router = express.Router();

// Helper to broadcast socket notifications
const sendSocketNotification = (req, recipientId, notification) => {
  const io = req.app.get('socketio');
  if (io) {
    io.to(recipientId.toString()).emit('notification', notification);
  }
};

// @route   POST api/lostfound
// @desc    Report a lost or found item
// @access  Private
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, type, category, description, location, date, contactNumber } = req.body;

    if (!name || !type || !category || !description || !location || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      const hostUrl = `${req.protocol}://${req.get('host')}`;
      for (const file of req.files) {
        const url = await uploadImage(file, hostUrl);
        imageUrls.push(url);
      }
    }

    const newItem = new Item({
      name,
      type,
      category,
      description,
      location,
      date: new Date(date),
      contactNumber,
      images: imageUrls,
      reporter: req.user._id
    });

    await newItem.save();
    
    // Populate reporter info
    await newItem.populate('reporter', 'name email profilePicture department year');

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error reporting item', error: error.message });
  }
});

// @route   GET api/lostfound
// @desc    Get all lost and found reports with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, type, category, resolved } = req.query;
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (resolved !== undefined) {
      query.resolved = resolved === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query)
      .populate('reporter', 'name email profilePicture department year')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error retrieving reports' });
  }
});

// @route   GET api/lostfound/:id
// @desc    Get a single report details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reporter', 'name email profilePicture department year contactNumber')
      .populate('claimedBy', 'name email profilePicture department year')
      .populate('suspiciousClaims.user', 'name rollNumber email department');

    if (!item) {
      return res.status(404).json({ message: 'Item listing not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get single report error:', error);
    res.status(500).json({ message: 'Server error retrieving item details' });
  }
});

// @route   PUT api/lostfound/:id
// @desc    Update a report listing
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item listing not found' });
    }

    // Authorization check (reporter or admin)
    if (item.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this listing' });
    }

    const { name, category, description, location, date, contactNumber, resolved } = req.body;

    if (name) item.name = name;
    if (category) item.category = category;
    if (description) item.description = description;
    if (location) item.location = location;
    if (date) item.date = new Date(date);
    if (contactNumber !== undefined) item.contactNumber = contactNumber;
    if (resolved !== undefined) item.resolved = resolved;

    await item.save();
    await item.populate('reporter', 'name email profilePicture department year');

    res.json(item);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error updating listing' });
  }
});

// @route   DELETE api/lostfound/:id
// @desc    Delete a report listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item listing not found' });
    }

    // Authorization check
    if (item.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this listing' });
    }

    await item.deleteOne();
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Server error deleting listing' });
  }
});

// @route   POST api/lostfound/:id/claim
// @desc    Claim an item (Notifies reporter)
// @access  Private
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item listing not found' });
    }

    if (item.resolved) {
      return res.status(400).json({ message: 'This item is already marked as resolved' });
    }

    if (item.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot claim your own reported item' });
    }

    // Check if notification already exists for this claim to prevent duplicate spam
    const existingNotification = await Notification.findOne({
      recipient: item.reporter,
      sender: req.user._id,
      type: 'claim',
      link: `/lostfound/${item._id}`
    });

    if (existingNotification) {
      return res.status(400).json({ message: 'You have already submitted a claim notification for this item' });
    }

    // Create a claim notification for the reporter
    const notification = new Notification({
      recipient: item.reporter,
      sender: req.user._id,
      type: 'claim',
      content: `${req.user.name} is claiming the item: "${item.name}" you reported.`,
      link: `/lostfound/${item._id}`
    });

    await notification.save();
    
    // Populate details for sending via socket
    await notification.populate('sender', 'name profilePicture');

    sendSocketNotification(req, item.reporter, notification);

    res.json({ message: 'Claim request sent successfully to the reporter' });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({ message: 'Server error submitting claim request' });
  }
});

// @route   PUT api/lostfound/:id/resolve
// @desc    Resolve an item claim (Mark as resolved & select claimer)
// @access  Private
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item listing not found' });
    }

    if (item.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to resolve this listing' });
    }

    const { claimedByUserId } = req.body; // Optional ID of student who claimed it

    item.resolved = true;
    if (claimedByUserId) {
      item.claimedBy = claimedByUserId;

      // Send resolution notification to claimant
      const notification = new Notification({
        recipient: claimedByUserId,
        sender: req.user._id,
        type: 'claim',
        content: `Your claim for the item "${item.name}" has been accepted!`,
        link: `/lostfound/${item._id}`
      });
      await notification.save();
      await notification.populate('sender', 'name profilePicture');
      sendSocketNotification(req, claimedByUserId, notification);
    }

    await item.save();
    await item.populate('reporter', 'name email profilePicture department year');
    if (item.claimedBy) {
      await item.populate('claimedBy', 'name email profilePicture department year');
    }

    res.json({ message: 'Item marked as resolved successfully', item });
  } catch (error) {
    console.error('Resolve item error:', error);
    res.status(500).json({ message: 'Server error resolving item claim' });
  }
});

// @route   POST api/lostfound/:id/report-claim
// @desc    Report a suspicious claim on an item
// @access  Private
router.post('/:id/report-claim', auth, async (req, res) => {
  try {
    const { reason, suspiciousUser } = req.body; // suspiciousUser: ID of claiming user

    if (!reason || !suspiciousUser) {
      return res.status(400).json({ message: 'Please provide the suspicious user ID and a reason' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item listing not found' });
    }

    if (item.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to flag claims on this item' });
    }

    // Add suspicious claim report
    item.suspiciousClaims.push({
      user: suspiciousUser,
      reason
    });

    await item.save();

    res.json({ message: 'Suspicious claim reported successfully to admin moderation', item });
  } catch (error) {
    console.error('Report suspicious claim error:', error);
    res.status(500).json({ message: 'Server error submitting suspicious claim report' });
  }
});

module.exports = router;
