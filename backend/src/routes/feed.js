const express = require('express');
const Post = require('../models/Post');
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

// @route   POST api/feed
// @desc    Create a new social post
// @access  Private
router.post('/', auth, upload.array('images', 3), async (req, res) => {
  try {
    const { content, category } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      const hostUrl = `${req.protocol}://${req.get('host')}`;
      for (const file of req.files) {
        const url = await uploadImage(file, hostUrl);
        imageUrls.push(url);
      }
    }

    const newPost = new Post({
      content,
      category: category || 'update',
      images: imageUrls,
      author: req.user._id
    });

    await newPost.save();
    await newPost.populate('author', 'name email profilePicture department year');

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post', error: error.message });
  }
});

// @route   GET api/feed
// @desc    Get all feed posts (with filter & search options)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(query)
      .populate('author', 'name email profilePicture department year')
      .populate('comments.author', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error retrieving feed posts' });
  }
});

// @route   PUT api/feed/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { content, category } = req.body;
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Authorization check
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    if (content) post.content = content;
    if (category) post.category = category;

    await post.save();
    await post.populate('author', 'name email profilePicture department year');
    await post.populate('comments.author', 'name profilePicture');

    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error updating post' });
  }
});

// @route   DELETE api/feed/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Authorization check
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

// @route   POST api/feed/:id/like
// @desc    Like / unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    let liked = false;

    if (likeIndex === -1) {
      // Like post
      post.likes.push(req.user._id);
      liked = true;

      // Create notification if the user liking is not the author of the post
      if (post.author.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          content: `${req.user.name} liked your post: "${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}"`,
          link: `/feed?postId=${post._id}`
        });
        await notification.save();
        await notification.populate('sender', 'name profilePicture');
        sendSocketNotification(req, post.author, notification);
      }
    } else {
      // Unlike post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ liked, likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error liking/unliking post' });
  }
});

// @route   POST api/feed/:id/comment
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      author: req.user._id,
      content,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();
    
    // Repopulate details
    await post.populate('author', 'name email profilePicture department year');
    await post.populate('comments.author', 'name profilePicture');

    // Create notification if commenter is not author of post
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        content: `${req.user.name} commented on your post: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
        link: `/feed?postId=${post._id}`
      });
      await notification.save();
      await notification.populate('sender', 'name profilePicture');
      sendSocketNotification(req, post.author, notification);
    }

    // Return the updated comments list
    res.json(post.comments);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   DELETE api/feed/:id/comment/:commentId
// @desc    Delete a comment from a post
// @access  Private
router.delete('/:id/comment/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Authorization (Comment author, Post author, or Admin)
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();
    await post.populate('comments.author', 'name profilePicture');

    res.json(post.comments);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

module.exports = router;
