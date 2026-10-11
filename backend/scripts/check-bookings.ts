import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const bookings = await prisma.booking.findMany();
  console.log('Total bookings in DB:', bookings.length);
  for (const b of bookings) {
    console.log(`- Booking ${b.id}: courseId=${b.courseId}, course=${b.course}, student=${b.studentName}`);
  }
}

check().finally(() => prisma.$disconnect());
