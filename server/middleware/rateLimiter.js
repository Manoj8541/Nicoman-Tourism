// ─── Lightweight In-Memory Sliding-Window Rate Limiter (Zero-Dependency) ──────
const rateLimitMap = new Map();

export const createRateLimiter = ({ windowMs = 60 * 1000, max = 60, message = 'Too many requests, please try again shortly.' } = {}) => {
  return (req, res, next) => {
    // Skip rate limiting for health pings & webhooks
    if (req.path === '/api/health' || req.path === '/api/webhooks/resend-inbound' || req.path === '/health') {
      return next();
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const key = `${req.path}:${clientIp}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(key, record);

    // Prune stale records to prevent memory buildup
    if (rateLimitMap.size > 8000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetTime) rateLimitMap.delete(k);
      }
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({ error: message, retryAfter: Math.ceil((record.resetTime - now) / 1000) });
    }

    next();
  };
};

// General API rate limiter (120 req / minute per IP)
export const generalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });

// Stricter rate limiter for write/abuse-prone endpoints (30 req / 5 mins per IP)
export const writeLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Too many submissions. Please wait a few minutes before trying again.'
});
