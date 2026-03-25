const mongoose = require('mongoose');
const User = require('./backend/models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glasscycle');

    console.log('Connected to MongoDB');

    // Remove old username index if it exists
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('users');
      const indexes = await collection.indexes();
      const usernameIndex = indexes.find(idx => idx.name === 'username_1');
      if (usernameIndex) {
        console.log('Removing old username index...');
        await collection.dropIndex('username_1');
        console.log('Old username index removed successfully');
      }
    } catch (indexError) {
      // Index might not exist, continue anyway
      console.log('No old username index found, continuing...');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@greenglass.com' });
    if (existingAdmin) {
      console.log('\n✅ Admin user already exists!');
      console.log('📧 Email: admin@greenglass.com');
      console.log('You can use this account or change the role of another user to admin.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@greenglass.com',
      password: 'admin123', // This will be hashed automatically
      phone: '0000000000',
      role: 'admin',
      entityType: 'other',
      address: 'Sidi Bel Abbes, Algeria',
      isPremium: true,
      isVerified: true
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log('   Email: admin@greenglass.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 Tip: There might be a duplicate key issue.');
      console.error('   Try removing the old index manually from MongoDB:');
      console.error('   db.users.dropIndex("username_1")');
    }
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

createAdmin();
