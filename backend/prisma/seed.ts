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

export const SEEDED_COURSES = [
  {
    id: 'scratch-game',
    title: 'Coding & Game Design (Scratch & Blockly)',
    category: 'Coding & Programming',
    shortDesc: 'Hands-on visual block coding, interactive story animation, and creative game design for young creators.',
    ageGroup: 'Ages 6-10',
    classLevel: 'Grades 1-5',
    outcomes: 'Visual block programming foundations,Animation and sprites logic,Game mechanics and physics,Creative problem-solving',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 120,
    currency: 'USD',
    icon: 'Gamepad2',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'python-ai',
    title: 'Python Programming & AI Basics',
    category: 'Coding & Programming',
    shortDesc: 'Learn Python syntax, data structures, algorithms, and build intelligent AI chatbots and automation tools.',
    ageGroup: 'Ages 10-16',
    classLevel: 'Grades 5-11',
    outcomes: 'Core Python syntax & data structures,Object-oriented programming principles,Data analysis with libraries,AI chatbots & machine learning fundamentals',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 140,
    currency: 'USD',
    icon: 'Code',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'javascript-apps',
    title: 'JavaScript & Interactive App Building',
    category: 'Coding & Programming',
    shortDesc: 'Build modern web logic, interactive browser games, dynamic animations, and responsive app interfaces.',
    ageGroup: 'Ages 11-17',
    classLevel: 'Grades 6-12',
    outcomes: 'Modern ES6+ JavaScript mastery,DOM manipulation & event handlers,Asynchronous programming & APIs,Web app state management',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 140,
    currency: 'USD',
    icon: 'Layers',
    imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'web-dev',
    title: 'Web Development (HTML, CSS & JavaScript)',
    category: 'Web Development',
    shortDesc: 'Master HTML5 semantics, modern CSS styling, flexbox/grid, and deploy beautiful live websites.',
    ageGroup: 'Ages 11-17',
    classLevel: 'Grades 6-12',
    outcomes: 'HTML5 semantic page structuring,Responsive CSS design & animations,UI styling & layouts,Live website publishing & hosting',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 130,
    currency: 'USD',
    icon: 'Globe',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'fullstack-react',
    title: 'Full-Stack Web Apps (React & Node.js)',
    category: 'Web Development',
    shortDesc: 'Build complete end-to-end web applications with React frontend, Node backend, and REST APIs.',
    ageGroup: 'Ages 13-18',
    classLevel: 'Grades 8-12',
    outcomes: 'React component architecture & hooks,Node.js & Express server design,REST API creation & integration,Full-stack cloud deployment',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 160,
    currency: 'USD',
    icon: 'Laptop',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'ai-robotics',
    title: 'AI, Machine Learning & Robotics',
    category: 'AI & Robotics',
    shortDesc: 'Discover computer vision, neural network concepts, speech recognition, and robot simulation models.',
    ageGroup: 'Ages 10-16',
    classLevel: 'Grades 5-11',
    outcomes: 'Machine learning model training,Computer vision & image classification,Speech recognition & natural language,Robotics simulation & logic',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 150,
    currency: 'USD',
    icon: 'Bot',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'iot-microbit',
    title: 'Robotics & Micro:bit Hardware Coding',
    category: 'AI & Robotics',
    shortDesc: 'Program hardware sensors, LED matrices, robotics servos, and Internet of Things gadgets.',
    ageGroup: 'Ages 8-14',
    classLevel: 'Grades 3-9',
    outcomes: 'Microcontroller architecture & wiring,Sensor input & actuator controls,Real-world IoT automation,Hands-on hardware troubleshooting',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 140,
    currency: 'USD',
    icon: 'Cpu',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'math-olympiad',
    title: 'Mathematics Olympiad & Problem Solving',
    category: 'Mathematics & Science',
    shortDesc: 'Master competitive arithmetic, geometry, number theory, and speed problem-solving techniques.',
    ageGroup: 'Ages 7-15',
    classLevel: 'Grades 2-10',
    outcomes: 'Olympiad mental math shortcuts,Spatial reasoning & geometry proofs,Combinatorics & number theory,Speed and analytical precision',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 120,
    currency: 'USD',
    icon: 'Calculator',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'applied-science',
    title: 'Applied STEM Science & Hands-on Physics',
    category: 'Mathematics & Science',
    shortDesc: 'Engage with interactive simulations, astronomy, mechanics, circuitry, and scientific experimentation.',
    ageGroup: 'Ages 8-15',
    classLevel: 'Grades 3-10',
    outcomes: 'Scientific inquiry & hypothesis testing,Mechanical forces & energy principles,Circuitry & electromagnetism,Data modeling & laboratory reporting',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 130,
    currency: 'USD',
    icon: 'Atom',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'english-comm',
    title: 'English Creative Writing, Public Speaking & Debate',
    category: 'English & Communication',
    shortDesc: 'Develop confident public speaking, persuasive speechwriting, storytelling, and structured debate skills.',
    ageGroup: 'Ages 6-15',
    classLevel: 'Grades 1-10',
    outcomes: 'Voice modulation & audience engagement,Creative storytelling & essay structure,Critical thinking & debate argumentation,Vocabulary & presentation confidence',
    duration: '3 - 6 Months',
    totalClasses: 48,
    classDuration: 60,
    price: 110,
    currency: 'USD',
    icon: 'BookOpen',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

export async function main() {
  console.log('🌱 Seeding 10 mentors across global time zones (US, UK, India)...');

  for (const mentor of SEEDED_MENTORS) {
    const workDaysStr = Array.isArray(mentor.workDays) ? mentor.workDays.join(',') : String(mentor.workDays);
    await prisma.mentor.upsert({
      where: { email: mentor.email },
      update: {
        name: mentor.name,
        timeZone: mentor.timeZone,
        workDays: workDaysStr,
        workStartHour: mentor.workStartHour,
        workEndHour: mentor.workEndHour,
        isActive: true,
      },
      create: {
        name: mentor.name,
        email: mentor.email,
        timeZone: mentor.timeZone,
        workDays: workDaysStr,
        workStartHour: mentor.workStartHour,
        workEndHour: mentor.workEndHour,
        isActive: true,
      },
    });
  }

  console.log('🌱 Seeding Course Catalogue and Packages...');

  for (const courseData of SEEDED_COURSES) {
    const course = await prisma.course.upsert({
      where: { id: courseData.id },
      update: {
        title: courseData.title,
        category: courseData.category,
        shortDesc: courseData.shortDesc,
        ageGroup: courseData.ageGroup,
        classLevel: courseData.classLevel,
        outcomes: courseData.outcomes,
        duration: courseData.duration,
        totalClasses: courseData.totalClasses,
        classDuration: courseData.classDuration,
        price: courseData.price,
        currency: courseData.currency,
        icon: courseData.icon,
        imageUrl: courseData.imageUrl,
        isActive: courseData.isActive,
      },
      create: {
        id: courseData.id,
        title: courseData.title,
        category: courseData.category,
        shortDesc: courseData.shortDesc,
        ageGroup: courseData.ageGroup,
        classLevel: courseData.classLevel,
        outcomes: courseData.outcomes,
        duration: courseData.duration,
        totalClasses: courseData.totalClasses,
        classDuration: courseData.classDuration,
        price: courseData.price,
        currency: courseData.currency,
        icon: courseData.icon,
        imageUrl: courseData.imageUrl,
        isActive: courseData.isActive,
      },
    });

    // Seed 4 standard packages for each course
    const packageConfigs = [
      { name: '1 Month Starter', durationMonths: 1, classesCount: 8, multiplier: 1.0, discountPct: 0 },
      { name: '2 Months Foundation', durationMonths: 2, classesCount: 16, multiplier: 1.84, discountPct: 8 },
      { name: '3 Months Pro', durationMonths: 3, classesCount: 24, multiplier: 2.58, discountPct: 14 },
      { name: '6 Months Master', durationMonths: 6, classesCount: 48, multiplier: 4.80, discountPct: 20 },
    ];

    for (const pkg of packageConfigs) {
      const packagePrice = Math.round(course.price * pkg.multiplier);
      const pkgId = `${course.id}-${pkg.durationMonths}m`;
      await prisma.package.upsert({
        where: { id: pkgId },
        update: {
          name: pkg.name,
          durationMonths: pkg.durationMonths,
          classesCount: pkg.classesCount,
          price: packagePrice,
          currency: course.currency,
          discountPct: pkg.discountPct,
          isActive: true,
        },
        create: {
          id: pkgId,
          courseId: course.id,
          name: pkg.name,
          durationMonths: pkg.durationMonths,
          classesCount: pkg.classesCount,
          price: packagePrice,
          currency: course.currency,
          discountPct: pkg.discountPct,
          isActive: true,
        },
      });
    }
  }

  const mentorCount = await prisma.mentor.count();
  const courseCount = await prisma.course.count();
  const packageCount = await prisma.package.count();
  console.log(`✅ Seeding complete. Mentors: ${mentorCount}, Courses: ${courseCount}, Packages: ${packageCount}`);
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
