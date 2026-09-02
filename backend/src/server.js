import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDb, query } from './db/index.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Nginx reverse proxy headers for rate limiting
app.set('trust proxy', 1);

// Production Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: '*', // Allows frontend container/dev server requests
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting to protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT 1');
    if (dbRes.rows.length > 0) {
      res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ status: 'error', database: 'disconnected' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server after initializing DB
const startServer = async () => {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another process or Docker container.`);
        console.error(`👉 Solution: Run 'docker-compose stop backend' to free port ${PORT}.\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
