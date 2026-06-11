require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const jwt = require('jsonwebtoken');

// Route imports
const authRoutes = require('./routes/auth');
const lostfoundRoutes = require('./routes/lostfound');
const marketplaceRoutes = require('./routes/marketplace');
const feedRoutes = require('./routes/feed');
const chatRoutes = require('./routes/chat');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// Express Application Setup
const app = express();
const server = http.createServer(app);

// Socket.io Server Setup
const io = socketIo(server, {
  cors: {
    origin: '*', // In production, replace with specific origins
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach socket.io to the application instance for route-level access
app.set('socketio', io);

// Security & Utility Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for easier local development
  crossOriginResourcePolicy: false // Allow loading local uploads from frontend
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/lostfound', lostfoundRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// Simple Health Check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Keep track of connected online user IDs
const onlineUsers = new Map(); // userId -> socketId

// Socket.io JWT Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      console.log('Socket connection unauthorized: Invalid token');
    }
  }
  next(); // Allow guest socket connections if necessary, or throw error: next(new Error('Authentication error'));
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Register user as online and join their private room
  if (socket.userId) {
    socket.join(socket.userId.toString());
    onlineUsers.set(socket.userId.toString(), socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
    console.log(`User registered online: ${socket.userId}`);
  }

  // Handle manual status requests
  socket.on('get_online_users', () => {
    socket.emit('online_users', Array.from(onlineUsers.keys()));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      onlineUsers.delete(socket.userId.toString());
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`User went offline: ${socket.userId}`);
    }
  });
});

// MongoDB Connection & Server Start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusConnect';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected successfully!');
    server.listen(PORT, () => {
      console.log(`CampusConnect Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
