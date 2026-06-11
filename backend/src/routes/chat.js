const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper to broadcast socket events
const emitSocketEvent = (req, recipientId, eventName, data) => {
  const io = req.app.get('socketio');
  if (io) {
    io.to(recipientId.toString()).emit(eventName, data);
  }
};

// @route   GET api/chat/conversations
// @desc    Get all conversations for the current user (inbox list)
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate query to find conversations
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name profilePicture department year')
    .populate('receiver', 'name profilePicture department year')
    .populate('itemContext.itemId');

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUser: {
            id: otherUser._id,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
            department: otherUser.department,
            year: otherUser.year
          },
          lastMessage: {
            id: msg._id,
            content: msg.content,
            sender: msg.sender._id,
            read: msg.read,
            itemContext: msg.itemContext,
            createdAt: msg.createdAt
          },
          // Unread count relative to the current user
          unreadCount: (msg.receiver._id.toString() === userId.toString() && !msg.read) ? 1 : 0
        });
      } else {
        // Accumulate unread counts for messages sent to the current user
        if (msg.receiver._id.toString() === userId.toString() && !msg.read) {
          const conv = conversationsMap.get(otherUserId);
          conv.unreadCount += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error retrieving conversations' });
  }
});

// @route   GET api/chat/messages/:recipientId
// @desc    Get message history between current user and specified recipient
// @access  Private
router.get('/messages/:recipientId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const recipientId = req.params.recipientId;

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: recipientId },
        { sender: recipientId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('itemContext.itemId');

    // Mark received messages in this conversation as read
    await Message.updateMany(
      { sender: recipientId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    // Notify the sender that their messages were read
    emitSocketEvent(req, recipientId, 'messages_read', { readBy: userId });

    res.json(messages);
  } catch (error) {
    console.error('Get messages thread error:', error);
    res.status(500).json({ message: 'Server error retrieving message history' });
  }
});

// @route   POST api/chat/messages
// @desc    Send a new chat message
// @access  Private
router.post('/messages', auth, async (req, res) => {
  try {
    const { receiverId, content, itemType, itemId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    if (receiverId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    // Verify recipient exists
    const recipient = await User.findById(receiverId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient student not found' });
    }

    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      itemContext: {
        itemType: itemType || 'None',
        itemId: itemId || null
      }
    });

    await newMessage.save();

    if (itemId) {
      await newMessage.populate('itemContext.itemId');
    }

    // Prepare message payload to emit
    const messagePayload = {
      _id: newMessage._id,
      sender: {
        id: req.user._id,
        name: req.user.name,
        profilePicture: req.user.profilePicture
      },
      receiver: receiverId,
      content: newMessage.content,
      read: newMessage.read,
      itemContext: newMessage.itemContext,
      createdAt: newMessage.createdAt
    };

    // Emit live message event to recipient
    emitSocketEvent(req, receiverId, 'message', messagePayload);

    // Also trigger a real-time notification
    const notification = new Notification({
      recipient: receiverId,
      sender: req.user._id,
      type: 'message',
      content: `New chat from ${req.user.name}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      link: `/chat?userId=${req.user._id}`
    });
    
    await notification.save();
    await notification.populate('sender', 'name profilePicture');
    emitSocketEvent(req, receiverId, 'notification', notification);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message', error: error.message });
  }
});

module.exports = router;
