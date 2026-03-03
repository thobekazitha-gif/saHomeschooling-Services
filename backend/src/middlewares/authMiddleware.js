// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

/**
 * authMiddleware(roles?)
 * Verifies Bearer JWT and attaches decoded payload to req.user { id, role }.
 * Pass allowed roles to restrict: authMiddleware(['ADMIN'])
 */
const authMiddleware = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided.' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    if (roles.length > 0 && !roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;