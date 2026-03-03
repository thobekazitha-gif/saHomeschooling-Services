require('dotenv').config();

const { execSync } = require('child_process');
try {
  console.log('Running prisma generate...');
  execSync('node node_modules/prisma/build/index.js generate', {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  console.log('Running database migrations...');
  execSync('node node_modules/prisma/build/index.js migrate deploy', {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  console.log('Migrations complete.');
} catch (e) {
  console.log('Migration note:', e.message);
}

const express = require('express');
const cors    = require('cors');
const { port } = require('./config');

const authRoutes         = require('./routes/authRoutes');
const providerRoutes     = require('./routes/providerRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');
const featuredSlotRoutes = require('./routes/featuredSlotRoutes');
const statsRoutes        = require('./routes/statsRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',           authRoutes);
app.use('/api/providers',      providerRoutes);
app.use('/api/reviews',        reviewRoutes);
app.use('/api/featured-slots', featuredSlotRoutes);
app.use('/api/stats',          statsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log('\n?  SA Homeschooling API running on port ' + port);
  console.log('   Environment : ' + (process.env.NODE_ENV || 'development'));
  console.log('   Frontend URL: ' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '\n');
});
