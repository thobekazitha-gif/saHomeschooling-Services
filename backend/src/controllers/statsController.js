// backend/src/controllers/statsController.js
const { PrismaClient } = require('@prisma/client');
const { sendError }    = require('../utils');

const prisma = new PrismaClient();

// GET /api/stats  (ADMIN)
const getStats = async (req, res) => {
  try {
    const [
      totalProviders,
      pendingProviders,
      approvedProviders,
      rejectedProviders,
      totalUsers,
      totalReviews,
      pendingReviews,
      featuredSlots,
    ] = await Promise.all([
      prisma.providerProfile.count(),
      prisma.providerProfile.count({ where: { status: 'PENDING'  } }),
      prisma.providerProfile.count({ where: { status: 'APPROVED' } }),
      prisma.providerProfile.count({ where: { status: 'REJECTED' } }),
      prisma.user.count(),
      prisma.review.count(),
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.featuredSlot.findMany({
        include: { provider: { select: { id: true, fullName: true } } },
      }),
    ]);

    // Breakdown by listing plan
    const planBreakdown = await prisma.providerProfile.groupBy({
      by:     ['listingPlan'],
      _count: { id: true },
    });

    // Top categories (approved only)
    const categoryBreakdown = await prisma.providerProfile.groupBy({
      by:      ['primaryCategory'],
      _count:  { id: true },
      where:   { status: 'APPROVED', primaryCategory: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take:    10,
    });

    // Province distribution
    const provinceBreakdown = await prisma.providerProfile.groupBy({
      by:      ['province'],
      _count:  { id: true },
      where:   { status: 'APPROVED', province: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    });

    return res.json({
      success: true,
      data: {
        providers: {
          total:    totalProviders,
          pending:  pendingProviders,
          approved: approvedProviders,
          rejected: rejectedProviders,
        },
        users:   totalUsers,
        reviews: { total: totalReviews, pending: pendingReviews },
        featured: {
          total:    featuredSlots.length,
          occupied: featuredSlots.filter(s => s.providerId).length,
          slots:    featuredSlots,
        },
        planBreakdown: planBreakdown.map(p => ({
          plan:  p.listingPlan,
          count: p._count.id,
        })),
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c.primaryCategory,
          count:    c._count.id,
        })),
        provinceBreakdown: provinceBreakdown.map(p => ({
          province: p.province,
          count:    p._count.id,
        })),
      },
    });
  } catch (err) {
    console.error('[STATS] getStats error:', err);
    return sendError(res, 500, 'Failed to fetch statistics.');
  }
};

module.exports = { getStats };