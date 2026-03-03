// backend/src/routes/reviewRoutes.js
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getAllReviews, getProviderReviews,
  createReview, approveReview, deleteReview,
} = require('../controllers/reviewController');

router.get('/',                         authMiddleware(['ADMIN']), getAllReviews);
router.get('/provider/:providerId',     getProviderReviews);
router.post('/:providerId',             authMiddleware(), createReview);
router.patch('/:id/approve',            authMiddleware(['ADMIN']), approveReview);
router.delete('/:id',                   authMiddleware(['ADMIN']), deleteReview);

module.exports = router;