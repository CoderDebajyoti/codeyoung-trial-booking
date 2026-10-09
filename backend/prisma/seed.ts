import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SEEDED_MENTORS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 9,
    workEndHour: 17,
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 10,
    workEndHour: 18,
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan.gupta@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 11,
    workEndHour: 19,
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@codeyoung.com',
    timeZone: 'Europe/London',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 9,
    workEndHour: 17,
  },
  {
    name: 'Oliver Smith',
    email: 'oliver.smith@codeyoung.com',
    timeZone: 'Europe/London',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 10,
    workEndHour: 18,
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@codeyoung.com',
    timeZone: 'Europe/London',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 8,
    workEndHour: 16,
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@codeyoung.com',
    timeZone: 'America/New_York',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 9,
    workEndHour: 17,
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@codeyoung.com',
    timeZone: 'America/New_York',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 10,
    workEndHour: 18,
  },
  {
    name: 'David Miller',
    email: 'david.miller@codeyoung.com',
    timeZone: 'America/Chicago',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 9,
    workEndHour: 17,
  },
  {
    name: 'Jessica Davis',
    email: 'jessica.davis@codeyoung.com',
    timeZone: 'America/Los_Angeles',
    workDays: [1, 2, 3, 4, 5],
    workStartHour: 9,
    workEndHour: 17,
  },
];

export async function main() {
  console.log('🌱 Seeding 10 mentors across global time zones (US, UK, India)...');

  for (const mentor of SEEDED_MENTORS) {
    await prisma.mentor.upsert({
      where: { email: mentor.email },
      update: {
        name: mentor.name,
        timeZone: mentor.timeZone,
        workDays: mentor.workDays,
        workStartHour: mentor.workStartHour,
        workEndHour: mentor.workEndHour,
        isActive: true,
      },
      create: {
        name: mentor.name,
        email: mentor.email,
        timeZone: mentor.timeZone,
        workDays: mentor.workDays,
        workStartHour: mentor.workStartHour,
        workEndHour: mentor.workEndHour,
        isActive: true,
      },
    });
  }

  const count = await prisma.mentor.count();
  console.log(`✅ Seeding complete. Total mentors in database: ${count}`);
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  main()
    .catch((e) => {
      console.error('❌ Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
