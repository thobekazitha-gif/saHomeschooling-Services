// backend/src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { jwtSecret, jwtExpiry, adminEmail, adminPassword, adminName } = require('../config');
const { sendError } = require('../utils');

const prisma = new PrismaClient();

// ── token helper ──────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });

// ── public user shape ─────────────────────────────────────────
const publicUser = (u) => ({
  id:          u.id,
  email:       u.email,
  role:        u.role,
  name:        u.name,
  accountType: u.accountType,
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Creates a User row only.
//  The frontend sends a second POST /api/providers request to
//  create the ProviderProfile (keeps concerns separate).
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { email, password, name, role = 'PROVIDER', accountType } = req.body;

  if (!email || !password)
    return sendError(res, 400, 'Email and password are required.');

  const trimmed = email.trim().toLowerCase();

  if (trimmed === adminEmail)
    return sendError(res, 409, 'This email address is reserved.');

  try {
    const existing = await prisma.user.findUnique({ where: { email: trimmed } });
    if (existing)
      return sendError(res, 409, 'An account with this email already exists.');

    const hashed = await bcrypt.hash(password, 10);

    // Role must be a valid enum value: PROVIDER | USER
    const safeRole = ['PROVIDER', 'USER'].includes(role.toUpperCase())
      ? role.toUpperCase()
      : 'PROVIDER';

    const user = await prisma.user.create({
      data: {
        email:       trimmed,
        password:    hashed,
        name:        name || null,
        role:        safeRole,
        accountType: accountType || (safeRole === 'USER' ? 'user' : 'provider'),
        lastLogin:   new Date(),
      },
    });

    const token = signToken({ id: user.id, role: user.role });
    console.log(`[AUTH] REGISTER | ${user.email} | ${user.role}`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user:    publicUser(user),
      // Legacy shape kept so older frontend code still works
      data:    { token, user: publicUser(user) },
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    return sendError(res, 500, 'Registration failed. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return sendError(res, 400, 'Email and password are required.');

  const trimmed = email.trim().toLowerCase();

  try {
    // ── Hardcoded admin (no DB row required) ──
    if (trimmed === adminEmail) {
      if (password !== adminPassword)
        return sendError(res, 401, 'Invalid credentials.');

      const adminUser = {
        id:          'admin_hardcoded',
        email:       adminEmail,
        role:        'ADMIN',
        name:        adminName,
        accountType: 'admin',
      };
      const token = signToken({ id: 'admin_hardcoded', role: 'ADMIN' });
      console.log(`[AUTH] LOGIN | ${adminEmail} | ADMIN`);

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user:    adminUser,
        data:    { token, user: adminUser },
      });
    }

    // ── DB login ──
    const user = await prisma.user.findUnique({ where: { email: trimmed } });
    if (!user) return sendError(res, 401, 'Invalid credentials.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return sendError(res, 401, 'Invalid credentials.');

    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLogin: new Date() },
    });

    const token = signToken({ id: user.id, role: user.role });
    console.log(`[AUTH] LOGIN | ${user.email} | ${user.role}`);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user:    publicUser(user),
      data:    { token, user: publicUser(user) },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return sendError(res, 500, 'Login failed. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/me
// ─────────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return sendError(res, 401, 'No token provided.');

    let decoded;
    try {
      decoded = jwt.verify(authHeader.slice(7), jwtSecret);
    } catch {
      return sendError(res, 401, 'Invalid or expired token.');
    }

    if (decoded.id === 'admin_hardcoded') {
      return res.json({
        success: true,
        data: {
          id:          'admin_hardcoded',
          email:       adminEmail,
          role:        'ADMIN',
          name:        adminName,
          accountType: 'admin',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where:  { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, accountType: true, lastLogin: true },
    });
    if (!user) return sendError(res, 404, 'User not found.');

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('[AUTH] /me error:', err);
    return sendError(res, 500, 'Server error.');
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
const logout = (_req, res) => {
  console.log('[AUTH] LOGOUT');
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/users  (ADMIN only)
// ─────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true, email: true, role: true, name: true,
        accountType: true, createdAt: true, lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const adminEntry = {
      id:          'admin_hardcoded',
      email:       adminEmail,
      role:        'ADMIN',
      name:        adminName,
      accountType: 'admin',
      createdAt:   null,
      lastLogin:   null,
    };

    return res.json({ success: true, data: [adminEntry, ...dbUsers] });
  } catch (err) {
    console.error('[AUTH] getUsers error:', err);
    return sendError(res, 500, 'Failed to fetch users.');
  }
};

module.exports = { register, login, me, logout, getUsers };