const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user via JWT
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Token is valid, but user could not be found' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'This account has been banned by an administrator' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token verification failed, authorization denied', error: error.message });
  }
};

// Middleware to authorize admins
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Administrator privileges required' });
  }
};

module.exports = { auth, adminAuth };
