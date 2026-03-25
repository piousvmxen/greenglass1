const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { apiLimiter, securityLogger } = require('./middleware/security');

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Replit reverse proxy)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ─── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https://nominatim.openstreetmap.org"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}));

// ─── Body parsing with size limits ────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── NoSQL injection prevention ──────────────────────────────────────────────
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Sanitized key "${key}" in request from ${req.ip}`);
  }
}));

// ─── Security event logger & general rate limit ───────────────────────────────
app.use(securityLogger);
app.use('/api', apiLimiter);

// Serve uploaded avatars
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's personal room
  socket.on('join-user', (userId) => {
    const roomId = `user_${userId}`;
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('send-message', (data) => {
    // Broadcast to the room
    if (data.roomId) {
      io.to(data.roomId).emit('receive-message', data.message || data);
    }
    // Also emit to user rooms for real-time updates
    if (data.message) {
      const senderId = data.message.senderId?._id || data.message.senderId;
      const receiverId = data.message.receiverId?._id || data.message.receiverId;
      
      if (senderId) {
        io.to(`user_${senderId}`).emit('receive-message', data.message);
      }
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('receive-message', data.message);
      }
      // Also emit globally for conversation list updates
      io.emit('new-message', data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glasscycle')
.then(async () => {
  console.log('MongoDB Connected');
  
  // Auto-create admin user if it doesn't exist
  await createAdminIfNotExists();
})
.catch(err => console.error('MongoDB Error:', err));

// Auto-create admin user function
const createAdminIfNotExists = async () => {
  try {
    const User = require('./models/User');
    
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Remove old username index if it exists (for compatibility)
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('users');
      const indexes = await collection.indexes();
      const usernameIndex = indexes.find(idx => idx.name === 'username_1');
      if (usernameIndex) {
        console.log('🔧 Removing old username index...');
        await collection.dropIndex('username_1');
        console.log('✅ Old username index removed');
      }
    } catch (indexError) {
      // Index might not exist, continue anyway
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@greenglass.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const admin = new User({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword, // Will be hashed automatically by pre-save hook
      phone: '0000000000',
      role: 'admin',
      entityType: 'other',
      address: 'Sidi Bel Abbes, Algeria',
      isPremium: true,
      isVerified: true
    });

    await admin.save();

    console.log('\n✅ Admin user created automatically!');
    console.log('📧 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('💡 You can set ADMIN_EMAIL and ADMIN_PASSWORD in environment variables to customize.\n');
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Admin user might already exist (duplicate key)');
    } else {
      console.error('⚠️  Error creating admin user:', error.message);
      console.error('   You can create admin manually using: node create-admin.js');
    }
  }
};

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export io for use in routes
app.set('io', io);
