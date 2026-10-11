import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const courses = await prisma.course.findMany({
    include: {
      packages: true,
      _count: { select: { bookings: true } },
    },
  });
  console.log('Total courses in DB:', courses.length);
  for (const c of courses) {
    console.log(`- [${c.id}] ${c.title} | Category: ${c.category} | Packages: ${c.packages.length} | Bookings: ${c._count.bookings} | Image: ${c.imageUrl}`);
  }
}

check().finally(() => prisma.$disconnect());
