const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: {
      values: ['Electronics', 'Books', 'Lab Equipment', 'Stationery', 'Furniture', 'Cycles', 'Accessories', 'Miscellaneous'],
      message: '{VALUE} is not a valid marketplace category'
    },
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  condition: {
    type: String,
    enum: {
      values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      message: '{VALUE} is not a valid condition'
    },
    required: [true, 'Condition is required']
  },
  images: [{
    type: String
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
