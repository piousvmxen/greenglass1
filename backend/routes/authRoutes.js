const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[SECURITY WARNING] JWT_SECRET is not set. Using an insecure fallback. Set JWT_SECRET in your environment variables for production.');
  return 'greenglass_dev_secret_change_me_in_production';
})();

// Generate JWT Token — 7-day expiry (shorter than before)
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', authLimiter, [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Invalid phone number format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role, entityType, address, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'user',
      entityType: entityType || 'individual',
      address: address || '',
      location: location || {}
    });

    await user.save();

    const token = generateToken(user._id);

    console.log(`[AUTH] New user registered: ${email} (${user.role})`);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        entityType: user.entityType,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Always run through the same code path to prevent user enumeration
    if (!user) {
      console.warn(`[AUTH] Failed login attempt for non-existent email: ${email} from ${req.ip}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Account lockout check
    if (user.isLocked) {
      const unlockIn = Math.ceil((user.lockUntil - Date.now()) / 60000);
      console.warn(`[AUTH] Locked account login attempt: ${email} from ${req.ip}`);
      return res.status(423).json({
        message: `Account temporarily locked. Try again in ${unlockIn} minute(s).`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      const remaining = Math.max(0, 5 - user.loginAttempts);
      console.warn(`[AUTH] Failed login for ${email} from ${req.ip} | Attempts: ${user.loginAttempts}`);
      return res.status(401).json({
        message: remaining > 0
          ? `Invalid credentials. ${remaining} attempt(s) remaining before lockout.`
          : 'Invalid credentials. Account is now locked for 15 minutes.'
      });
    }

    // Successful login — reset attempts
    await user.resetLoginAttempts();

    const token = generateToken(user._id);
    console.log(`[AUTH] Successful login: ${email} from ${req.ip}`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        entityType: user.entityType,
        points: user.points,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginAttempts -lockUntil');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('GET /me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
