// backend/src/routes/statsRoutes.js
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getStats } = require('../controllers/statsController');

router.get('/', authMiddleware(['ADMIN']), getStats);

module.exports = router;