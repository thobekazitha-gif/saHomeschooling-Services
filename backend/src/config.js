// backend/src/config.js
// NOTE: dotenv is loaded as the very first line of src/index.js
// so process.env is fully populated before this module is required.

module.exports = {
  port:      process.env.PORT       || 5000,
  jwtSecret: process.env.JWT_SECRET || 'sah_secret_key_change_in_production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  nodeEnv:   process.env.NODE_ENV   || 'development',

  // Admin credentials — always sourced from environment variables
  adminEmail:    (process.env.ADMIN_EMAIL    || 'admin@sahomeschooling.co.za').toLowerCase(),
  adminPassword:  process.env.ADMIN_PASSWORD || 'admin@123',
  adminName:      process.env.ADMIN_NAME     || 'SA Homeschooling Admin',
};