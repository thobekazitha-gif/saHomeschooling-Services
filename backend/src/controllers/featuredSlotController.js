// backend/src/controllers/featuredSlotController.js
// FeaturedSlot model: id, providerId, provider, addedAt, expiresAt
// Note: no slotNumber column in this schema — slots are identified by id.
const { PrismaClient } = require('@prisma/client');
const { sendError }    = require('../utils');

const prisma = new PrismaClient();
const SLOT_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// GET /api/featured-slots  (ADMIN)
const getFeaturedSlots = async (req, res) => {
  try {
    const slots = await prisma.featuredSlot.findMany({
      include: {
        provider: {
          select: {
            id: true, fullName: true, primaryCategory: true,
            profilePhoto: true, city: true, province: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });
    return res.json({ success: true, data: slots });
  } catch (err) {
    console.error('[SLOT] getFeaturedSlots error:', err);
    return sendError(res, 500, 'Failed to fetch featured slots.');
  }
};

// GET /api/featured-slots/public  (public — homepage)
const getPublicFeaturedSlots = async (req, res) => {
  try {
    const now   = new Date();
    const slots = await prisma.featuredSlot.findMany({
      where: {
        providerId: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        provider: {
          select: {
            id: true, fullName: true, primaryCategory: true,
            profilePhoto: true, bio: true, city: true, province: true,
            startingPrice: true, listingPlan: true,
          },
        },
      },
    });
    return res.json({ success: true, data: slots });
  } catch (err) {
    console.error('[SLOT] getPublicFeaturedSlots error:', err);
    return sendError(res, 500, 'Failed to fetch featured slots.');
  }
};

// POST /api/featured-slots  (ADMIN — create a new empty slot)
const createSlot = async (req, res) => {
  try {
    const slot = await prisma.featuredSlot.create({
      data: { providerId: null, expiresAt: null },
    });
    console.log(`[SLOT] CREATED | ${slot.id}`);
    return res.status(201).json({ success: true, data: slot });
  } catch (err) {
    console.error('[SLOT] createSlot error:', err);
    return sendError(res, 500, 'Failed to create slot.');
  }
};

// POST /api/featured-slots/assign  (ADMIN)
const assignFeaturedSlot = async (req, res) => {
  const { slotId, providerId } = req.body;
  if (!slotId || !providerId)
    return sendError(res, 400, 'slotId and providerId are required.');

  try {
    const slot = await prisma.featuredSlot.update({
      where: { id: slotId },
      data:  {
        providerId,
        addedAt:   new Date(),
        expiresAt: new Date(Date.now() + SLOT_DURATION_MS),
      },
    });
    console.log(`[SLOT] ASSIGN | ${slotId} -> provider ${providerId}`);
    return res.json({ success: true, data: slot });
  } catch (err) {
    console.error('[SLOT] assignFeaturedSlot error:', err);
    return sendError(res, 500, 'Failed to assign slot.');
  }
};

// POST /api/featured-slots/:slotId/remove  (ADMIN)
const removeFeaturedSlot = async (req, res) => {
  try {
    const slot = await prisma.featuredSlot.update({
      where: { id: req.params.slotId },
      data:  { providerId: null, expiresAt: null },
    });
    console.log(`[SLOT] REMOVE | ${req.params.slotId}`);
    return res.json({ success: true, data: slot });
  } catch (err) {
    console.error('[SLOT] removeFeaturedSlot error:', err);
    return sendError(res, 500, 'Failed to remove slot.');
  }
};

// POST /api/featured-slots/:slotId/rotate  (ADMIN)
// Picks a random APPROVED provider not currently occupying any slot
const rotateFeaturedSlot = async (req, res) => {
  try {
    // IDs already in a slot
    const occupied = (await prisma.featuredSlot.findMany({
      where:  { providerId: { not: null } },
      select: { providerId: true },
    })).map(s => s.providerId).filter(Boolean);

    const candidates = await prisma.providerProfile.findMany({
      where: {
        status: 'APPROVED',
        id:     { notIn: occupied },
      },
    });

    if (!candidates.length)
      return sendError(res, 404, 'No eligible providers available for rotation.');

    const next = candidates[Math.floor(Math.random() * candidates.length)];

    const slot = await prisma.featuredSlot.update({
      where: { id: req.params.slotId },
      data:  {
        providerId: next.id,
        addedAt:    new Date(),
        expiresAt:  new Date(Date.now() + SLOT_DURATION_MS),
      },
    });

    console.log(`[SLOT] ROTATE | ${req.params.slotId} -> ${next.id}`);
    return res.json({ success: true, data: slot });
  } catch (err) {
    console.error('[SLOT] rotateFeaturedSlot error:', err);
    return sendError(res, 500, 'Failed to rotate slot.');
  }
};

// DELETE /api/featured-slots/:slotId  (ADMIN — delete slot entirely)
const deleteSlot = async (req, res) => {
  try {
    await prisma.featuredSlot.delete({ where: { id: req.params.slotId } });
    console.log(`[SLOT] DELETE | ${req.params.slotId}`);
    return res.json({ success: true, message: 'Slot deleted.' });
  } catch (err) {
    console.error('[SLOT] deleteSlot error:', err);
    return sendError(res, 500, 'Failed to delete slot.');
  }
};

module.exports = {
  getFeaturedSlots, getPublicFeaturedSlots,
  createSlot, assignFeaturedSlot,
  removeFeaturedSlot, rotateFeaturedSlot, deleteSlot,
};