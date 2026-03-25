const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glasscycle');

    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    console.log('\n📋 Current indexes on users collection:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Try to remove username_1 index
    const usernameIndex = indexes.find(idx => idx.name === 'username_1');
    if (usernameIndex) {
      console.log('\n🗑️  Removing username_1 index...');
      await collection.dropIndex('username_1');
      console.log('✅ username_1 index removed successfully!');
    } else {
      console.log('\n✅ No username_1 index found. All good!');
    }

    // List indexes again
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! You can now run create-admin.js');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 27) {
      console.error('   Index not found. This is fine, continuing...');
    }
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

fixIndex();
