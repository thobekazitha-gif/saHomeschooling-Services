// backend/src/routes/providerRoutes.js
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getProviders, getProviderById, getProviderByUserId,
  createProvider, updateProvider,
  approveProvider, rejectProvider, deleteProvider,
} = require('../controllers/providerController');

// Public
router.get('/',                  getProviders);
router.get('/user/:userId',      getProviderByUserId);
router.get('/:id',               getProviderById);

// Registration — no auth needed (userId comes in the body)
router.post('/',                 createProvider);

// Owner or admin
router.put('/:id',               authMiddleware(['ADMIN', 'PROVIDER']), updateProvider);

// Admin only
router.post('/:id/approve',      authMiddleware(['ADMIN']), approveProvider);
router.post('/:id/reject',       authMiddleware(['ADMIN']), rejectProvider);
router.delete('/:id',            authMiddleware(['ADMIN']), deleteProvider);

module.exports = router;