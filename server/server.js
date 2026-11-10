import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ── Environment Configuration ────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware & Utilities ────────────────────────────────────────────────────
import { generalLimiter } from './middleware/rateLimiter.js';

// ── Routers ───────────────────────────────────────────────────────────────────
import utilityRouter from './routes/utility.js';
import catalogRouter from './routes/catalog.js';
import bookingsRouter from './routes/bookings.js';
import adminRouter from './routes/admin.js';
import userRouter from './routes/user.js';
import webhooksRouter from './routes/webhooks.js';

// ── Production CORS Security Whitelist ─────────────────────────────────────────
const allowedOrigins = [
  'https://nicoman-tourism.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. cURL, GitHub Actions keep-alive, server-to-server)
    if (!origin) return callback(null, true);

    // Allow production domain, localhost dev, and Vercel branch preview URLs
    const isAllowed = allowedOrigins.includes(origin) ||
      /^https:\/\/nicoman-tourism.*\.vercel\.app$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked unauthorized cross-origin request from: ${origin}`);
      callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'svix-id',
    'svix-timestamp',
    'svix-signature'
  ],
};

app.use(cors(corsOptions));

// ── Raw body handler for Resend inbound Svix webhook (must run before express.json)
app.use('/api/webhooks/resend-inbound', express.raw({ type: '*/*' }));
app.use(express.json());

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── API Routes Mounting ───────────────────────────────────────────────────────
app.use('/api', utilityRouter);
app.use('/api', catalogRouter);
app.use('/api', bookingsRouter);
app.use('/api', adminRouter);
app.use('/api/user', userRouter);
app.use('/api', webhooksRouter);

// ── Serve Built Frontend in Standalone / Docker Mode ──────────────────────────
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
