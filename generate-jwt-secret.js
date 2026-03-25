// Generate a secure JWT Secret
// Run: node generate-jwt-secret.js

const crypto = require('crypto');

// Generate a random 64-character hex string (very secure)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 JWT_SECRET Generated:\n');
console.log('='.repeat(80));
console.log(jwtSecret);
console.log('='.repeat(80));
console.log('\n📝 Copy this and add it to your .env file:');
console.log(`JWT_SECRET=${jwtSecret}\n`);
console.log('⚠️  Keep this secret safe! Never share it or commit it to Git!\n');
console.log('📍 Location: C:\\Users\\moham\\OneDrive\\Bureau\\greenglass\\greenglass\\.env\n');
