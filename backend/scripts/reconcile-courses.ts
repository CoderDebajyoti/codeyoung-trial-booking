import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function reconcileCourses() {
  console.log('🔍 Starting course database reconciliation and deduplication...');

  // 1. Find all courses related to Cyber Security & Ethical Hacking
  const allCourses = await prisma.course.findMany({
    include: {
      packages: true,
      bookings: true,
    },
  });

  const cyberCourses = allCourses.filter(
    (c) => c.id.startsWith('cyber-security') || c.title.toLowerCase().includes('cyber security')
  );

  console.log(`Found ${cyberCourses.length} Cyber Security course entries in database:`);
  cyberCourses.forEach((c) => {
    console.log(`- ID: ${c.id}, Title: ${c.title}, Packages: ${c.packages.length}, Bookings: ${c.bookings.length}`);
  });

  // 2. Define canonical Cyber Security course data
  const canonicalCyberCourse = {
    id: 'cyber-security',
    title: 'Cyber Security & Ethical Hacking',
    category: 'Coding & Programming',
    shortDesc: 'Learn network protocols, security encryption, defense frameworks, and ethical cyber safety techniques.',
    ageGroup: 'Ages 12-18',
    classLevel: 'Grades 6-12',
    outcomes: 'Network security fundamentals,Data encryption & cryptography,Cyber threats & ethical defense tools,Digital safety & penetration testing basics',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 150,
    currency: 'USD',
    icon: 'Shield',
    imageUrl: '/images/courses/cyber-security.jpg',
    isActive: true,
  };

  // Upsert canonical course
  const canonical = await prisma.course.upsert({
    where: { id: canonicalCyberCourse.id },
    update: {
      title: canonicalCyberCourse.title,
      category: canonicalCyberCourse.category,
      shortDesc: canonicalCyberCourse.shortDesc,
      ageGroup: canonicalCyberCourse.ageGroup,
      classLevel: canonicalCyberCourse.classLevel,
      outcomes: canonicalCyberCourse.outcomes,
      duration: canonicalCyberCourse.duration,
      totalClasses: canonicalCyberCourse.totalClasses,
      classDuration: canonicalCyberCourse.classDuration,
      price: canonicalCyberCourse.price,
      currency: canonicalCyberCourse.currency,
      icon: canonicalCyberCourse.icon,
      imageUrl: canonicalCyberCourse.imageUrl,
      isActive: canonicalCyberCourse.isActive,
    },
    create: canonicalCyberCourse,
  });

  console.log(`✅ Canonical course established: [${canonical.id}] ${canonical.title}`);

  // Seed standard 4 packages for canonical course
  const packageConfigs = [
    { name: '1 Month Starter', durationMonths: 1, classesCount: 8, multiplier: 1.0, discountPct: 0 },
    { name: '2 Months Foundation', durationMonths: 2, classesCount: 16, multiplier: 1.84, discountPct: 8 },
    { name: '3 Months Pro', durationMonths: 3, classesCount: 24, multiplier: 2.58, discountPct: 14 },
    { name: '6 Months Master', durationMonths: 6, classesCount: 48, multiplier: 4.80, discountPct: 20 },
  ];

  for (const pkg of packageConfigs) {
    const pkgId = `${canonical.id}-${pkg.durationMonths}m`;
    const packagePrice = Math.round(canonical.price * pkg.multiplier);
    await prisma.package.upsert({
      where: { id: pkgId },
      update: {
        name: pkg.name,
        durationMonths: pkg.durationMonths,
        classesCount: pkg.classesCount,
        price: packagePrice,
        currency: canonical.currency,
        discountPct: pkg.discountPct,
        isActive: true,
      },
      create: {
        id: pkgId,
        courseId: canonical.id,
        name: pkg.name,
        durationMonths: pkg.durationMonths,
        classesCount: pkg.classesCount,
        price: packagePrice,
        currency: canonical.currency,
        discountPct: pkg.discountPct,
        isActive: true,
      },
    });
  }

  // 3. Migrate references from duplicate courses and safely delete duplicate records
  const duplicates = cyberCourses.filter((c) => c.id !== canonical.id);

  for (const dup of duplicates) {
    // If any booking references this duplicate course, reassign to canonical
    if (dup.bookings.length > 0) {
      console.log(`Migrating ${dup.bookings.length} bookings from [${dup.id}] to [${canonical.id}]...`);
      await prisma.booking.updateMany({
        where: { courseId: dup.id },
        data: { courseId: canonical.id, course: canonical.title },
      });
    }

    // Reassign or delete any orphaned packages
    if (dup.packages.length > 0) {
      await prisma.package.deleteMany({
        where: { courseId: dup.id },
      });
    }

    // Safely delete duplicate course record
    await prisma.course.delete({
      where: { id: dup.id },
    });
    console.log(`🗑️ Removed duplicate course record: ${dup.id}`);
  }

  // 4. Verification
  const remainingCourses = await prisma.course.findMany({
    include: { packages: true },
    orderBy: { title: 'asc' },
  });

  console.log(`\n🎉 Reconciliation complete. Total courses in DB: ${remainingCourses.length}`);
  remainingCourses.forEach((c) => {
    console.log(`- [${c.id}] ${c.title} (${c.category}) | ${c.packages.length} packages | Image: ${c.imageUrl}`);
  });
}

if (process.argv[1] && process.argv[1].includes('reconcile-courses')) {
  reconcileCourses()
    .catch((e) => {
      console.error('❌ Reconciliation failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
