const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  itemContext: {
    itemType: {
      type: String,
      enum: ['Product', 'Item', 'None'],
      default: 'None'
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'itemContext.itemType',
      default: null
    }
  }
}, {
  timestamps: true
});

// Create index for efficient querying of conversation history between two users
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
