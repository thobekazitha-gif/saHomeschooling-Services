// backend/seed.js
// Creates sample data for local development.
// Run with: node seed.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...\n');

  // ── 1. Create 3 empty featured slots ────────────────────────
  // Schema has no slotNumber, so we just create 3 rows
  const existingSlots = await prisma.featuredSlot.count();
  if (existingSlots === 0) {
    await prisma.featuredSlot.createMany({
      data: [
        { providerId: null },
        { providerId: null },
        { providerId: null },
      ],
    });
    console.log('✅  3 featured slots created');
  } else {
    console.log(`ℹ️   Featured slots already exist (${existingSlots})`);
  }

  // ── 2. Demo provider user ────────────────────────────────────
  const demoEmail = 'demo@sahomeschooling.co.za';
  const hash      = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where:  { email: demoEmail },
    update: {},
    create: {
      email:    demoEmail,
      password: hash,
      name:     'STEM Mastery Demo',
      role:     'PROVIDER',
    },
  });

  // ── 3. Demo provider profile ─────────────────────────────────
  await prisma.providerProfile.upsert({
    where:  { userId: user.id },
    update: {},
    create: {
      userId:           user.id,
      fullName:         'STEM Mastery Tutors',
      accountType:      'Individual Provider',
      bio:              'Specialist STEM tutors for Grades 8–12. We offer personalised online and in-person sessions across Gauteng.',
      experience:       8,
      primaryCategory:  'Tutor',
      secondaryCategories: ['Educational Consultant'],
      serviceTitle:     'Maths & Science Tutoring',
      serviceDesc:      'Expert tutoring in Mathematics, Physical Sciences and Life Sciences.',
      subjects:         'Mathematics, Physical Sciences, Life Sciences',
      ageGroups:        ['11-13', '14-18'],
      deliveryMode:     'Online & In-person',
      city:             'Johannesburg',
      province:         'Gauteng',
      serviceAreaType:  'local',
      radius:           30,
      pricingModel:     'Hourly',
      startingPrice:    'R280/hr',
      availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availabilityNotes:'Weekday afternoons and Saturday mornings',
      phone:            '+27 11 000 1111',
      whatsapp:         '+27 82 000 2222',
      inquiryEmail:     demoEmail,
      listingPlan:      'featured',
      publicDisplay:    true,
      certifications:   'SACE Registered',
      degrees:          'BSc Mathematics & Applied Mathematics',
      status:           'APPROVED',
      languages:        ['English', 'Afrikaans'],
    },
  });

  console.log(`✅  Demo provider seeded`);
  console.log(`   Email:    ${demoEmail}`);
  console.log(`   Password: password123\n`);
  console.log('🎉  Seeding complete!\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());