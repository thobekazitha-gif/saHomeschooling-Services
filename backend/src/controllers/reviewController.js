// backend/src/controllers/reviewController.js
// Review model fields: id, providerId, reviewer, rating, text, status, createdAt
const { PrismaClient } = require('@prisma/client');
const { sendError }    = require('../utils');

const prisma = new PrismaClient();

// GET /api/reviews  (ADMIN — all reviews)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: { provider: { select: { id: true, fullName: true } } },
    });
    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('[REVIEW] getAllReviews error:', err);
    return sendError(res, 500, 'Failed to fetch reviews.');
  }
};

// GET /api/reviews/provider/:providerId  (public)
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where:   { providerId: req.params.providerId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('[REVIEW] getProviderReviews error:', err);
    return sendError(res, 500, 'Failed to fetch reviews.');
  }
};

// POST /api/reviews/:providerId  (any authenticated user)
const createReview = async (req, res) => {
  try {
    const { rating, text, reviewer } = req.body;
    const { providerId } = req.params;

    if (!rating || Number(rating) < 1 || Number(rating) > 5)
      return sendError(res, 400, 'Rating must be between 1 and 5.');
    if (!text || !text.trim())
      return sendError(res, 400, 'Review text is required.');

    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
    if (!provider) return sendError(res, 404, 'Provider not found.');

    const review = await prisma.review.create({
      data: {
        providerId,
        rating:   Number(rating),
        text:     text.trim(),
        reviewer: reviewer?.trim() || 'Anonymous',
        status:   'pending', // admin approves before it shows publicly
      },
    });

    console.log(`[REVIEW] CREATE | provider ${providerId} | rating ${rating}`);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error('[REVIEW] createReview error:', err);
    return sendError(res, 500, 'Failed to submit review.');
  }
};

// PATCH /api/reviews/:id/approve  (ADMIN)
const approveReview = async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data:  { status: 'approved' },
    });
    console.log(`[REVIEW] APPROVED | ${req.params.id}`);
    return res.json({ success: true, data: review });
  } catch (err) {
    console.error('[REVIEW] approveReview error:', err);
    return sendError(res, 500, 'Failed to approve review.');
  }
};

// DELETE /api/reviews/:id  (ADMIN)
const deleteReview = async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    console.log(`[REVIEW] DELETE | ${req.params.id}`);
    return res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    console.error('[REVIEW] deleteReview error:', err);
    return sendError(res, 500, 'Failed to delete review.');
  }
};

module.exports = { getAllReviews, getProviderReviews, createReview, approveReview, deleteReview };