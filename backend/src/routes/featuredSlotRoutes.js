// backend/src/routes/featuredSlotRoutes.js
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getFeaturedSlots, getPublicFeaturedSlots,
  createSlot, assignFeaturedSlot,
  removeFeaturedSlot, rotateFeaturedSlot, deleteSlot,
} = require('../controllers/featuredSlotController');

// Public route — homepage featured providers
router.get('/public',            getPublicFeaturedSlots);

// Admin routes
router.get('/',                  authMiddleware(['ADMIN']), getFeaturedSlots);
router.post('/',                 authMiddleware(['ADMIN']), createSlot);
router.post('/assign',           authMiddleware(['ADMIN']), assignFeaturedSlot);
router.post('/:slotId/remove',   authMiddleware(['ADMIN']), removeFeaturedSlot);
router.post('/:slotId/rotate',   authMiddleware(['ADMIN']), rotateFeaturedSlot);
router.delete('/:slotId',        authMiddleware(['ADMIN']), deleteSlot);

module.exports = router;