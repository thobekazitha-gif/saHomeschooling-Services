// backend/src/index.js
require('dotenv').config(); // MUST be the very first line

const express = require('express');
const cors    = require('cors');
const { port } = require('./config');

const authRoutes         = require('./routes/authRoutes');
const providerRoutes     = require('./routes/providerRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');
const featuredSlotRoutes = require('./routes/featuredSlotRoutes');
const statsRoutes        = require('./routes/statsRoutes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// FRONTEND_URL is set to your Vercel URL in Render's environment variables.
// Falls back to localhost:3000 for local development.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' })); // 10mb allows base64 profile photos

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/providers',      providerRoutes);
app.use('/api/reviews',        reviewRoutes);
app.use('/api/featured-slots', featuredSlotRoutes);
app.use('/api/stats',          statsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`\n✅  SA Homeschooling API running on port ${port}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('\n   Endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
  console.log('   GET  /api/auth/users          (ADMIN)');
  console.log('   GET  /api/providers            (public)');
  console.log('   POST /api/providers            (registration)');
  console.log('   GET  /api/providers/:id        (public)');
  console.log('   PUT  /api/providers/:id        (ADMIN | PROVIDER)');
  console.log('   POST /api/providers/:id/approve (ADMIN)');
  console.log('   POST /api/providers/:id/reject  (ADMIN)');
  console.log('   GET  /api/stats                (ADMIN)');
  console.log('   GET  /api/reviews              (ADMIN)\n');
});