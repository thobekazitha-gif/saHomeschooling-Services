// backend/src/controllers/providerController.js
// All field names match the actual Prisma schema exactly.
const { PrismaClient } = require('@prisma/client');
const { sendError }    = require('../utils');

const prisma = new PrismaClient();

// ── helpers ───────────────────────────────────────────────────
// Attach computed averageRating to a provider object
const withRating = (provider) => {
  if (!provider.reviews) return provider;
  const ratings = provider.reviews.map(r => r.rating);
  const avg = ratings.length
    ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  const { reviews, ...rest } = provider;
  return { ...rest, averageRating: avg, reviewCount: ratings.length };
};

// ─────────────────────────────────────────────────────────────
//  GET /api/providers
//  Public: returns APPROVED providers only
//  Admin:  can filter by ?status=PENDING|APPROVED|REJECTED
// ─────────────────────────────────────────────────────────────
const getProviders = async (req, res) => {
  try {
    const { status, category, province, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (req.user?.role === 'ADMIN' && status) {
      where.status = status.toUpperCase(); // PENDING | APPROVED | REJECTED
    } else {
      where.status = 'APPROVED'; // public always sees only approved
    }

    if (category) where.primaryCategory = { contains: category, mode: 'insensitive' };
    if (province)  where.province        = { contains: province,  mode: 'insensitive' };
    if (search) {
      where.OR = [
        { fullName:        { contains: search, mode: 'insensitive' } },
        { bio:             { contains: search, mode: 'insensitive' } },
        { primaryCategory: { contains: search, mode: 'insensitive' } },
        { subjects:        { contains: search, mode: 'insensitive' } },
        { city:            { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await prisma.providerProfile.count({ where });

    const providers = await prisma.providerProfile.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ listingPlan: 'desc' }, { createdAt: 'desc' }],
      include: { reviews: { select: { rating: true } } },
    });

    return res.json({
      success: true,
      data:    providers.map(withRating),
      total,
      page:    Number(page),
      limit:   Number(limit),
    });
  } catch (err) {
    console.error('[PROVIDER] getProviders error:', err);
    return sendError(res, 500, 'Failed to fetch providers.');
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/providers/:id
// ─────────────────────────────────────────────────────────────
const getProviderById = async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where:   { id: req.params.id },
      include: { reviews: { orderBy: { createdAt: 'desc' } } },
    });
    if (!provider) return sendError(res, 404, 'Provider not found.');
    return res.json({ success: true, data: withRating(provider) });
  } catch (err) {
    console.error('[PROVIDER] getProviderById error:', err);
    return sendError(res, 500, 'Failed to fetch provider.');
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/providers/user/:userId
//  Fetch the provider profile belonging to a specific user
// ─────────────────────────────────────────────────────────────
const getProviderByUserId = async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where:   { userId: req.params.userId },
      include: { reviews: { orderBy: { createdAt: 'desc' } } },
    });
    if (!provider) return sendError(res, 404, 'Provider profile not found.');
    return res.json({ success: true, data: withRating(provider) });
  } catch (err) {
    console.error('[PROVIDER] getProviderByUserId error:', err);
    return sendError(res, 500, 'Failed to fetch provider profile.');
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/providers
//  Called by the frontend Registration.js after /api/auth/register.
//  Fields match the ProviderProfile model exactly.
// ─────────────────────────────────────────────────────────────
const createProvider = async (req, res) => {
  try {
    const {
      userId,
      fullName, accountType,
      bio, experience, languages,
      primaryCategory, secondaryCategories,
      serviceTitle, serviceDesc, subjects, ageGroups, deliveryMode,
      city, province, serviceAreaType, radius,
      pricingModel, startingPrice,
      availabilityDays, availabilityNotes,
      phone, whatsapp, inquiryEmail,
      website, facebook, twitter, instagram, linkedin, pinterest, tiktok,
      listingPlan, publicDisplay,
      certifications, degrees, memberships, clearance,
      profilePhoto,
      certFile, certFileName, certFileType,
      clearanceFile, clearanceFileName, clearanceFileType,
    } = req.body;

    if (!userId)   return sendError(res, 400, 'userId is required.');
    if (!fullName) return sendError(res, 400, 'fullName is required.');

    // Make sure the user actually exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 404, 'User not found.');

    // If a profile already exists for this user, return it
    const existing = await prisma.providerProfile.findUnique({ where: { userId } });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Profile already exists.',
        data:    existing,
      });
    }

    const provider = await prisma.providerProfile.create({
      data: {
        userId,
        fullName,
        accountType:         accountType         || 'Individual Provider',
        bio:                 bio                 || null,
        experience:          experience          ? Number(experience) : null,
        languages:           languages           || [],
        primaryCategory:     primaryCategory     || null,
        secondaryCategories: secondaryCategories || [],
        serviceTitle:        serviceTitle        || null,
        serviceDesc:         serviceDesc         || null,
        subjects:            subjects            || null,
        ageGroups:           ageGroups           || [],
        deliveryMode:        deliveryMode        || null,
        city:                city                || null,
        province:            province            || null,
        serviceAreaType:     serviceAreaType     || null,
        radius:              radius              ? Number(radius) : null,
        pricingModel:        pricingModel        || null,
        startingPrice:       startingPrice       || null,
        availabilityDays:    availabilityDays    || [],
        availabilityNotes:   availabilityNotes   || null,
        phone:               phone               || null,
        whatsapp:            whatsapp            || null,
        inquiryEmail:        inquiryEmail        || null,
        website:             website             || null,
        facebook:            facebook            || null,
        twitter:             twitter             || null,
        instagram:           instagram           || null,
        linkedin:            linkedin            || null,
        pinterest:           pinterest           || null,
        tiktok:              tiktok              || null,
        listingPlan:         listingPlan         || 'free',
        publicDisplay:       !!publicDisplay,
        certifications:      certifications      || null,
        degrees:             degrees             || null,
        memberships:         memberships         || null,
        clearance:           clearance           || null,
        profilePhoto:        profilePhoto        || null,
        certFile:            certFile            || null,
        certFileName:        certFileName        || null,
        certFileType:        certFileType        || null,
        clearanceFile:       clearanceFile       || null,
        clearanceFileName:   clearanceFileName   || null,
        clearanceFileType:   clearanceFileType   || null,
        status:              'PENDING',
      },
    });

    console.log(`[PROVIDER] CREATE | ${provider.fullName} | ${provider.listingPlan}`);
    return res.status(201).json({ success: true, data: provider });
  } catch (err) {
    console.error('[PROVIDER] createProvider error:', err);
    return sendError(res, 500, 'Failed to create provider profile.');
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/providers/:id
//  Owner or admin may update. Status changes are blocked here
//  (use /approve or /reject endpoints for that).
// ─────────────────────────────────────────────────────────────
const updateProvider = async (req, res) => {
  try {
    const existing = await prisma.providerProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 404, 'Provider not found.');

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id)
      return sendError(res, 403, 'You do not have permission to update this profile.');

    // Strip fields that must not be changed via this endpoint
    const {
      status, id, createdAt, updatedAt, userId,
      ...updateData
    } = req.body;

    // Coerce types to match schema
    if (updateData.experience !== undefined)
      updateData.experience = updateData.experience ? Number(updateData.experience) : null;
    if (updateData.radius !== undefined)
      updateData.radius = updateData.radius ? Number(updateData.radius) : null;
    if (updateData.publicDisplay !== undefined)
      updateData.publicDisplay = !!updateData.publicDisplay;

    const updated = await prisma.providerProfile.update({
      where: { id: req.params.id },
      data:  updateData,
    });

    console.log(`[PROVIDER] UPDATE | ${updated.fullName}`);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PROVIDER] updateProvider error:', err);
    return sendError(res, 500, 'Failed to update provider.');
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/providers/:id/approve  (ADMIN)
// ─────────────────────────────────────────────────────────────
const approveProvider = async (req, res) => {
  try {
    const provider = await prisma.providerProfile.update({
      where: { id: req.params.id },
      data:  { status: 'APPROVED', publicDisplay: true },
    });
    console.log(`[PROVIDER] APPROVED | ${provider.fullName}`);
    return res.json({ success: true, data: provider });
  } catch (err) {
    console.error('[PROVIDER] approveProvider error:', err);
    return sendError(res, 500, 'Failed to approve provider.');
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/providers/:id/reject  (ADMIN)
// ─────────────────────────────────────────────────────────────
const rejectProvider = async (req, res) => {
  try {
    const provider = await prisma.providerProfile.update({
      where: { id: req.params.id },
      data:  { status: 'REJECTED', publicDisplay: false },
    });
    console.log(`[PROVIDER] REJECTED | ${provider.fullName}`);
    return res.json({ success: true, data: provider });
  } catch (err) {
    console.error('[PROVIDER] rejectProvider error:', err);
    return sendError(res, 500, 'Failed to reject provider.');
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/providers/:id  (ADMIN)
// ─────────────────────────────────────────────────────────────
const deleteProvider = async (req, res) => {
  try {
    await prisma.providerProfile.delete({ where: { id: req.params.id } });
    console.log(`[PROVIDER] DELETE | ${req.params.id}`);
    return res.json({ success: true, message: 'Provider deleted.' });
  } catch (err) {
    console.error('[PROVIDER] deleteProvider error:', err);
    return sendError(res, 500, 'Failed to delete provider.');
  }
};

module.exports = {
  getProviders, getProviderById, getProviderByUserId,
  createProvider, updateProvider,
  approveProvider, rejectProvider, deleteProvider,
};