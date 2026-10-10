import { Mentor, Parent, Booking, BookingStatus, Notification, NotificationType, NotificationStatus, Course, Package } from '../types/models.js';


export interface InMemoryBooking extends Booking {
  mentor: Mentor;
  parent: Parent;
}

const DEFAULT_MENTORS: Mentor[] = [
  {
    id: 'mentor-1-aarav',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-2-priya',
    name: 'Priya Patel',
    email: 'priya.patel@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 10,
    workEndHour: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-3-rohan',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@codeyoung.com',
    timeZone: 'Asia/Kolkata',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 11,
    workEndHour: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-4-emily',
    name: 'Emily Watson',
    email: 'emily.watson@codeyoung.com',
    timeZone: 'Europe/London',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-5-oliver',
    name: 'Oliver Smith',
    email: 'oliver.smith@codeyoung.com',
    timeZone: 'Europe/London',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 10,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-6-james',
    name: 'James Wilson',
    email: 'james.wilson@codeyoung.com',
    timeZone: 'Europe/London',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 8,
    workEndHour: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-7-sarah',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@codeyoung.com',
    timeZone: 'America/New_York',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-8-michael',
    name: 'Michael Brown',
    email: 'michael.brown@codeyoung.com',
    timeZone: 'America/New_York',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 10,
    workEndHour: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-9-david',
    name: 'David Miller',
    email: 'david.miller@codeyoung.com',
    timeZone: 'America/Chicago',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mentor-10-jessica',
    name: 'Jessica Davis',
    email: 'jessica.davis@codeyoung.com',
    timeZone: 'America/Los_Angeles',
    isActive: true,
    workDays: [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DEFAULT_COURSES: Course[] = [
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DEFAULT_PACKAGES: Package[] = DEFAULT_COURSES.flatMap((course) => [
  {
    id: `${course.id}-1m`,
    courseId: course.id,
    name: '1 Month Starter',
    durationMonths: 1,
    classesCount: 8,
    price: course.price,
    currency: course.currency,
    discountPct: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${course.id}-2m`,
    courseId: course.id,
    name: '2 Months Foundation',
    durationMonths: 2,
    classesCount: 16,
    price: Math.round(course.price * 1.84),
    currency: course.currency,
    discountPct: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${course.id}-3m`,
    courseId: course.id,
    name: '3 Months Pro',
    durationMonths: 3,
    classesCount: 24,
    price: Math.round(course.price * 2.58),
    currency: course.currency,
    discountPct: 14,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${course.id}-6m`,
    courseId: course.id,
    name: '6 Months Master',
    durationMonths: 6,
    classesCount: 48,
    price: Math.round(course.price * 4.80),
    currency: course.currency,
    discountPct: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

class InMemoryStore {
  public mentors: Mentor[] = [...DEFAULT_MENTORS];
  public parents: Parent[] = [];
  public bookings: InMemoryBooking[] = [];
  public notifications: Notification[] = [];
  public courses: Course[] = [...DEFAULT_COURSES];
  public packages: Package[] = [...DEFAULT_PACKAGES];

  reset(): void {
    this.mentors = [...DEFAULT_MENTORS];
    this.parents = [];
    this.bookings = [];
    this.notifications = [];
    this.courses = [...DEFAULT_COURSES];
    this.packages = [...DEFAULT_PACKAGES];
  }

  getMentors(): Mentor[] {
    return this.mentors.filter((m) => m.isActive);
  }

  getMentorById(id: string): Mentor | null {
    return this.mentors.find((m) => m.id === id) || null;
  }

  findOrCreateParent(data: { name: string; email: string; phone?: string; timeZone: string }): Parent {
    let parent = this.parents.find((p) => p.email === data.email);
    if (!parent) {
      parent = {
        id: `parent-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        timeZone: data.timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.parents.push(parent);
    } else {
      parent.name = data.name;
      parent.timeZone = data.timeZone;
      if (data.phone) parent.phone = data.phone;
    }
    return parent;
  }

  createBooking(data: {
    parentId: string;
    mentorId: string;
    courseId?: string | null;
    course?: string;
    studentName?: string | null;
    startAt: Date;
    endAt: Date;
    parentTimeZone: string;
    mentorTimeZone: string;
    demoClassUrl: string;
    idempotencyKey?: string | null;
  }): InMemoryBooking {
    const mentor = this.getMentorById(data.mentorId);
    const parent = this.parents.find((p) => p.id === data.parentId);
    if (!mentor || !parent) {
      throw new Error('Mentor or parent not found for in-memory booking creation');
    }

    const newBooking: InMemoryBooking = {
      id: `booking-${Math.random().toString(36).substring(2, 9)}`,
      parentId: data.parentId,
      mentorId: data.mentorId,
      courseId: data.courseId || null,
      course: data.course || 'Coding & STEM Trial',
      studentName: data.studentName || null,
      startAt: data.startAt,
      endAt: data.endAt,
      parentTimeZone: data.parentTimeZone,
      mentorTimeZone: data.mentorTimeZone,
      status: BookingStatus.CONFIRMED,
      demoClassUrl: data.demoClassUrl,
      idempotencyKey: data.idempotencyKey || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      mentor,
      parent,
    };

    this.bookings.push(newBooking);
    return newBooking;
  }

  createNotification(data: {
    bookingId: string;
    type: NotificationType;
    recipient: string;
    recipientRole: string;
    subject: string;
    content: string;
    htmlContent?: string | null;
    scheduledFor?: Date;
  }): Notification {
    const existing = this.notifications.find(
      (n) => n.bookingId === data.bookingId && n.type === data.type
    );
    if (existing) {
      return existing;
    }

    const notif: Notification = {
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      bookingId: data.bookingId,
      type: data.type,
      recipient: data.recipient,
      recipientRole: data.recipientRole,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent || null,
      status: NotificationStatus.PENDING,
      scheduledFor: data.scheduledFor || new Date(),
      sentAt: null,
      attemptCount: 0,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.push(notif);
    return notif;
  }

  getPendingNotifications(now: Date = new Date()): Notification[] {
    return this.notifications.filter(
      (n) => n.status === NotificationStatus.PENDING && n.scheduledFor <= now && n.attemptCount < 3
    );
  }

  updateNotification(
    id: string,
    data: {
      status?: NotificationStatus;
      sentAt?: Date | null;
      attemptCount?: number;
      lastError?: string | null;
      scheduledFor?: Date;
    }
  ): Notification | null {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) return null;

    if (data.status !== undefined) notif.status = data.status;
    if (data.sentAt !== undefined) notif.sentAt = data.sentAt;
    if (data.attemptCount !== undefined) notif.attemptCount = data.attemptCount;
    if (data.lastError !== undefined) notif.lastError = data.lastError;
    if (data.scheduledFor !== undefined) notif.scheduledFor = data.scheduledFor;
    notif.updatedAt = new Date();

    return notif;
  }
}

export const inMemoryStore = new InMemoryStore();
