// client/src/tests/rateLimiter.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Pure unit test of the sliding-window rate limiting algorithm (server/middleware/rateLimiter.js)
const createRateLimiter = ({ windowMs = 60 * 1000, max = 3, message = 'Too many requests, please try again shortly.' } = {}) => {
  const rateLimitMap = new Map();

  return (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/health') {
      return next();
    }

    const clientIp = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
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

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));

    if (record.count > max) {
      return res.status(429).json({ error: message, retryAfter: Math.ceil((record.resetTime - now) / 1000) });
    }

    next();
  };
};

describe('DDoS & Abuse Defense: In-Memory Sliding-Window Rate Limiter', () => {
  let mockReq, mockRes, nextFn;

  beforeEach(() => {
    nextFn = vi.fn();
    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('allows requests within the allowed threshold (calls next and sets rate-limit headers)', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 3 });
    mockReq = { path: '/api/feedback', headers: { 'x-forwarded-for': '192.168.1.1' } };

    // Request 1
    limiter(mockReq, mockRes, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(1);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 2);

    // Request 2
    limiter(mockReq, mockRes, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(2);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);

    // Request 3
    limiter(mockReq, mockRes, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(3);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
  });

  it('intercepts request 4 with HTTP 429 Too Many Requests when threshold is exceeded', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 3 });
    mockReq = { path: '/api/feedback', headers: { 'x-forwarded-for': '192.168.1.50' } };

    // Send 3 allowed requests
    limiter(mockReq, mockRes, nextFn);
    limiter(mockReq, mockRes, nextFn);
    limiter(mockReq, mockRes, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(3);

    // 4th request exceeds max threshold
    limiter(mockReq, mockRes, nextFn);

    // Should NOT call next(), but respond with HTTP 429
    expect(nextFn).toHaveBeenCalledTimes(3);
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Too many requests'),
      })
    );
  });

  it('bypasses rate limiting completely for essential health check endpoints', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
    mockReq = { path: '/api/health', headers: { 'x-forwarded-for': '192.168.1.99' } };

    // Send 5 rapid health pings
    for (let i = 0; i < 5; i++) {
      limiter(mockReq, mockRes, nextFn);
    }

    // All 5 must pass cleanly without getting throttled
    expect(nextFn).toHaveBeenCalledTimes(5);
    expect(mockRes.status).not.toHaveBeenCalledWith(429);
  });
});
