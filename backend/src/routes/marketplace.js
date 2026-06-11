const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { upload, uploadImage } = require('../middleware/upload');

const router = express.Router();

// @route   POST api/marketplace
// @desc    Create a product listing
// @access  Private
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, category, description, price, condition } = req.body;

    if (!name || !category || !description || !price || !condition) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      const hostUrl = `${req.protocol}://${req.get('host')}`;
      for (const file of req.files) {
        const url = await uploadImage(file, hostUrl);
        imageUrls.push(url);
      }
    }

    const newProduct = new Product({
      name,
      category,
      description,
      price: Number(price),
      condition,
      images: imageUrls,
      seller: req.user._id
    });

    await newProduct.save();
    await newProduct.populate('seller', 'name email profilePicture department year');

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create marketplace listing error:', error);
    res.status(500).json({ message: 'Server error creating listing', error: error.message });
  }
});

// @route   GET api/marketplace
// @desc    Get all marketplace products with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, condition, minPrice, maxPrice, status } = req.query;
    const query = {};

    // Default to show only active listings unless explicitly requesting sold or all
    if (status) {
      if (status !== 'all') query.status = status;
    } else {
      query.status = 'active';
    }

    if (category) query.category = category;
    if (condition) query.condition = condition;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'name email profilePicture department year')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error retrieving products' });
  }
});

// @route   GET api/marketplace/wishlist
// @desc    Get current user's wishlist products
// @access  Private
router.get('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: {
        path: 'seller',
        select: 'name email profilePicture department year'
      }
    });

    res.json(user.wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error fetching wishlist' });
  }
});

// @route   GET api/marketplace/:id
// @desc    Get a single product details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email profilePicture department year contactNumber');

    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get single product error:', error);
    res.status(500).json({ message: 'Server error retrieving product details' });
  }
});

// @route   PUT api/marketplace/:id
// @desc    Update a product listing
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    // Authorization check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this listing' });
    }

    const { name, category, description, price, condition, status } = req.body;

    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (condition) product.condition = condition;
    if (status) product.status = status;

    await product.save();
    await product.populate('seller', 'name email profilePicture department year');

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating listing' });
  }
});

// @route   DELETE api/marketplace/:id
// @desc    Delete a product listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    // Authorization check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this listing' });
    }

    await product.deleteOne();
    res.json({ message: 'Product listing deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// @route   POST api/marketplace/:id/wishlist
// @desc    Toggle product in wishlist
// @access  Private
router.post('/:id/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    const index = user.wishlist.indexOf(productId);
    let isWishlisted = false;

    if (index === -1) {
      user.wishlist.push(productId);
      isWishlisted = true;
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    res.json({ isWishlisted, wishlist: user.wishlist });
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ message: 'Server error toggling wishlist item' });
  }
});

// @route   PUT api/marketplace/:id/sold
// @desc    Mark product as sold
// @access  Private
router.put('/:id/sold', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    // Authorization check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to edit this listing' });
    }

    product.status = 'sold';
    await product.save();
    await product.populate('seller', 'name email profilePicture department year');

    res.json({ message: 'Product marked as sold successfully', product });
  } catch (error) {
    console.error('Mark sold error:', error);
    res.status(500).json({ message: 'Server error updating product status' });
  }
});

module.exports = router;
