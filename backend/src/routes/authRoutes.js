// backend/src/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { register, login, me, logout, getUsers } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        me);
router.post('/logout',   logout);
router.get('/users',     authMiddleware(['ADMIN']), getUsers);

module.exports = router;