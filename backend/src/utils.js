// backend/src/utils.js

/**
 * Consistent error response
 */
const sendError = (res, status, message) =>
  res.status(status).json({ success: false, error: message });

/**
 * Consistent success response
 */
const sendSuccess = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

module.exports = { sendError, sendSuccess };