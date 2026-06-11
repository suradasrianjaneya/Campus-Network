require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const Product = require('../models/Product');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusConnect';

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Clearing database...');

    // Clear existing collections
    await User.deleteMany({});
    await Item.deleteMany({});
    await Product.deleteMany({});
    await Post.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});

    console.log('Database cleared. Seeding users...');

    // Create Admin User
    const admin = new User({
      name: 'Campus Admin',
      rollNumber: 'ADM-001',
      department: 'Administration',
      year: 'Staff',
      email: 'admin@college.edu',
      password: 'password123', // Will be hashed by pre-save middleware
      role: 'admin',
      bio: 'Official campus connect platform administrator.',
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });
    await admin.save();

    // Create Student User 1
    const student1 = new User({
      name: 'John Doe',
      rollNumber: 'CS-2023-042',
      department: 'Computer Science',
      year: '3rd Year',
      email: 'john.doe@college.edu',
      password: 'password123',
      bio: 'Coding enthusiast | Open source contributor | Coffee lover.',
      profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
    });
    await student1.save();

    // Create Student User 2
    const student2 = new User({
      name: 'Jane Smith',
      rollNumber: 'EE-2024-118',
      department: 'Electrical Engineering',
      year: '2nd Year',
      email: 'jane.smith@college.edu',
      password: 'password123',
      bio: 'Enjoys design, robotics, and cycling around campus.',
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    });
    await student2.save();

    console.log('Users seeded. Seeding Lost & Found items...');

    // Seed Lost Items
    const lostPhone = new Item({
      name: 'iPhone 13 (Blue)',
      type: 'lost',
      category: 'Electronics',
      description: 'Lost my blue iPhone 13 near the library lawn. It has a transparent case with a college sticker on the back.',
      location: 'Library Lawn',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      contactNumber: '9876543210',
      images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'],
      reporter: student1._id,
      resolved: false
    });
    await lostPhone.save();

    // Seed Found Items
    const foundKeys = new Item({
      name: 'Car Keys & Keychain',
      type: 'found',
      category: 'Accessories',
      description: 'Found a set of keys with a leather Honda keychain on the cafeteria tables. Turned them in at the help desk or contact me directly.',
      location: 'Cafeteria Table Area',
      date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      contactNumber: '9988776655',
      images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80'],
      reporter: student2._id,
      resolved: false
    });
    await foundKeys.save();

    console.log('Lost & Found seeded. Seeding Marketplace products...');

    // Seed Products
    const productCycle = new Product({
      name: 'Decathlon Rockrider Bicycle',
      category: 'Cycles',
      description: 'Excellent condition mountain bike. 18-speed gears, front suspension. Used for 1 year around campus. Selling because I am graduating.',
      price: 3500,
      condition: 'Good',
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'],
      seller: student1._id,
      status: 'active'
    });
    await productCycle.save();

    const productBook = new Product({
      name: 'Introduction to Algorithms (CLRS) - 3rd Ed',
      category: 'Books',
      description: 'Almost new textbook. No marks or highlights inside. Essential for algorithms course in computer science department.',
      price: 450,
      condition: 'Like New',
      images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
      seller: student2._id,
      status: 'active'
    });
    await productBook.save();

    console.log('Marketplace products seeded. Seeding Student Feed posts...');

    // Seed Feed posts
    const post1 = new Post({
      content: 'Hey everyone! The college Coding Club is hosting a Hackathon next Friday at 4 PM in the main auditorium. Prize pool is worth $500! Open to all departments. Register link on our page.',
      author: student1._id,
      category: 'opportunity',
      likes: [student2._id],
      comments: [
        {
          author: student2._id,
          content: 'Awesome! I am looking for teammates. Anyone in Electrical who wants to join?',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]
    });
    await post1.save();

    const post2 = new Post({
      content: 'Does anyone know if the central library will remain open 24/7 during the final exams week?',
      author: student2._id,
      category: 'question',
      likes: [],
      comments: [
        {
          author: student1._id,
          content: 'Yes, they usually issue a circular. It is open 24/7 starting next Monday.',
          createdAt: new Date(Date.now() - 30 * 60 * 1000)
        }
      ]
    });
    await post2.save();

    console.log('Feed posts seeded successfully!');
    mongoose.connection.close();
    console.log('Seeding script finished successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
