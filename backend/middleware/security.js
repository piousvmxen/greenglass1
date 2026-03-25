const rateLimit = require('express-rate-limit');

// ─── General API rate limiter ─────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
  skip: (req) => req.path === '/health',
});

// ─── Auth endpoints — much stricter ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ─── Security event logger ────────────────────────────────────────────────────
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /(\$where|\$regex|\$ne|\$gt|\$lt|\$in|\$nin|\$or|\$and)/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
  ];

  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const combined = body + query;

  const isSuspicious = suspiciousPatterns.some(p => p.test(combined));
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request from ${req.ip} | ${req.method} ${req.path} | Body: ${body.slice(0, 200)}`);
  }

  next();
};

// ─── Validate ObjectId params to prevent injection via route params ───────────
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (id && !/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

module.exports = { apiLimiter, authLimiter, securityLogger, validateObjectId };
