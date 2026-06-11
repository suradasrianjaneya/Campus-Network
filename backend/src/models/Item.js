const mongoose = require('mongoose');

const suspiciousClaimSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Type (lost or found) is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  location: {
    type: String,
    required: [true, 'Last seen / found location is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date lost or found is required']
  },
  contactNumber: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  suspiciousClaims: [suspiciousClaimSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);
