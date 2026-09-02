import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, query } from './db/index.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Nginx / Railway reverse proxy headers for rate limiting
app.set('trust proxy', 1);

// Production Security Headers (disable contentSecurityPolicy in production for embedded scripts)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting to protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health Check Endpoint for Railway & Docker
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

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Static frontend serving for single-service Railway deployments
const distPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  console.log(`📁 Serving compiled static frontend from ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server after initializing DB
const startServer = async () => {
  try {
    await initDb();
    const server = app.listen(PORT, '0.0.0.0', () => {
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
