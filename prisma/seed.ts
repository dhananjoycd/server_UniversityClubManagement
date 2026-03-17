import "dotenv/config";
import { ApplicationStatus, EventType, MemberStatus, NoticeAudience, Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/config/betterAuth";

const seedAdmin = {
  name: process.env.SEED_ADMIN_NAME ?? "Super Admin",
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@club.com",
  password: process.env.SEED_ADMIN_PASSWORD ?? "Admin12345",
};

const seedSite = {
  organizationName: process.env.SEED_ORGANIZATION_NAME ?? "Club Portal",
  contactEmail: process.env.SEED_CONTACT_EMAIL ?? seedAdmin.email,
};

const seedUserPassword = process.env.SEED_USER_PASSWORD ?? "User12345";

const daysFromNow = (days: number, hour = 10, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const seedNotices: Array<{
  title: string;
  content: string;
  audience: NoticeAudience;
}> = [
  {
    title: "Welcome to the Club Portal",
    content:
      "Welcome to the club management portal. Complete your profile, review upcoming activities, and stay updated with official club announcements.",
    audience: NoticeAudience.ALL,
  },
  {
    title: "Membership Application Window Open",
    content:
      "New membership applications are now open for this session. Interested students should submit the application form with accurate academic and contact information.",
    audience: NoticeAudience.APPLICANTS,
  },
  {
    title: "Profile Completion Required",
    content:
      "All general users are requested to complete their profile details, including phone number, department, and academic session, to avoid delays in future approvals.",
    audience: NoticeAudience.USERS,
  },
  {
    title: "Monthly General Meeting Schedule",
    content:
      "The monthly general meeting will be held on Friday at 3:00 PM in the seminar room. Members are requested to attend on time and sign the attendance sheet.",
    audience: NoticeAudience.MEMBERS,
  },
  {
    title: "Event Proposal Submission Deadline",
    content:
      "Event managers must submit proposals for next month's programs by Wednesday evening so budgeting, venue confirmation, and promotion can be completed on time.",
    audience: NoticeAudience.EVENT_MANAGERS,
  },
  {
    title: "Admin Panel Data Review",
    content:
      "Administrators should review pending applications, recent event registrations, and reported profile issues before the weekly management meeting.",
    audience: NoticeAudience.ADMINS,
  },
  {
    title: "Volunteer Recruitment for Orientation",
    content:
      "We are recruiting volunteers for the upcoming club orientation program. Selected members will help with registration, guest support, and session coordination.",
    audience: NoticeAudience.MEMBERS,
  },
  {
    title: "Notice Publishing Guidelines",
    content:
      "Before publishing a notice, verify the audience selection, message clarity, and timing. Avoid duplicate announcements unless there is an important update.",
    audience: NoticeAudience.ADMINS,
  },
  {
    title: "Upcoming Workshop Registration Reminder",
    content:
      "Registration for the upcoming skill development workshop will close soon. Interested participants should confirm their seat early because capacity is limited.",
    audience: NoticeAudience.ALL,
  },
  {
    title: "Application Review Update",
    content:
      "Applicants will receive updates after the review committee finalizes the current batch. Please monitor your email and dashboard notice section regularly.",
    audience: NoticeAudience.APPLICANTS,
  },
];

type SeedUser = {
  name: string;
  email: string;
  role: Role;
  emailVerified?: boolean;
  phone?: string;
  academicSession?: string;
  department?: string;
  image?: string;
  memberProfile?: {
    membershipId: string;
    joinDate: Date;
    bio?: string;
    profilePhoto?: string;
    status: MemberStatus;
  };
  application?: {
    department: string;
    session: string;
    studentId: string;
    district: string;
    phone: string;
    status: ApplicationStatus;
    submittedAt: Date;
    reviewedAt?: Date;
  };
};

const adminUsers: SeedUser[] = [
  {
    name: "Club Admin Rana",
    email: "rana.admin@club.com",
    role: Role.ADMIN,
    emailVerified: true,
    phone: "01710000001",
    academicSession: "2020-21",
    department: "Computer Science and Engineering",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Operations Admin Sadia",
    email: "sadia.admin@club.com",
    role: Role.ADMIN,
    emailVerified: true,
    phone: "01710000002",
    academicSession: "2019-20",
    department: "Information Technology",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  },
];

const eventManagerUsers: SeedUser[] = [
  {
    name: "Event Lead Mahmud",
    email: "mahmud.events@club.com",
    role: Role.EVENT_MANAGER,
    emailVerified: true,
    phone: "01710000003",
    academicSession: "2021-22",
    department: "Software Engineering",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Workshop Manager Tania",
    email: "tania.events@club.com",
    role: Role.EVENT_MANAGER,
    emailVerified: true,
    phone: "01710000004",
    academicSession: "2021-22",
    department: "Computer Science and Engineering",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
  },
];

const memberUsers: SeedUser[] = [
  {
    name: "Tanvir Hasan",
    email: "tanvir.member@club.com",
    role: Role.MEMBER,
    emailVerified: true,
    phone: "01710000005",
    academicSession: "2022-23",
    department: "Computer Science and Engineering",
    memberProfile: {
      membershipId: "MEM-2026-001",
      joinDate: daysFromNow(-180, 10, 0),
      bio: "Backend enthusiast and active club volunteer.",
      profilePhoto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80",
      status: MemberStatus.ACTIVE,
    },
    application: {
      department: "Computer Science and Engineering",
      session: "2022-23",
      studentId: "CSE2201001",
      district: "Dhaka",
      phone: "01710000005",
      status: ApplicationStatus.APPROVED,
      submittedAt: daysFromNow(-220, 9, 0),
      reviewedAt: daysFromNow(-200, 12, 0),
    },
  },
  {
    name: "Nusrat Jahan",
    email: "nusrat.member@club.com",
    role: Role.MEMBER,
    emailVerified: true,
    phone: "01710000006",
    academicSession: "2022-23",
    department: "Information Technology",
    memberProfile: {
      membershipId: "MEM-2026-002",
      joinDate: daysFromNow(-165, 11, 0),
      bio: "Community builder and design support volunteer.",
      profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
      status: MemberStatus.ACTIVE,
    },
    application: {
      department: "Information Technology",
      session: "2022-23",
      studentId: "IT2201002",
      district: "Cumilla",
      phone: "01710000006",
      status: ApplicationStatus.APPROVED,
      submittedAt: daysFromNow(-210, 10, 0),
      reviewedAt: daysFromNow(-190, 13, 0),
    },
  },
  {
    name: "Farhan Ahmed",
    email: "farhan.member@club.com",
    role: Role.MEMBER,
    emailVerified: true,
    phone: "01710000007",
    academicSession: "2021-22",
    department: "Computer Science and Engineering",
    memberProfile: {
      membershipId: "MEM-2026-003",
      joinDate: daysFromNow(-240, 10, 0),
      bio: "Former logistics volunteer currently under temporary suspension.",
      profilePhoto: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=600&q=80",
      status: MemberStatus.SUSPENDED,
    },
    application: {
      department: "Computer Science and Engineering",
      session: "2021-22",
      studentId: "CSE2101003",
      district: "Chattogram",
      phone: "01710000007",
      status: ApplicationStatus.APPROVED,
      submittedAt: daysFromNow(-280, 10, 0),
      reviewedAt: daysFromNow(-260, 15, 0),
    },
  },
  {
    name: "Mim Akter",
    email: "mim.member@club.com",
    role: Role.MEMBER,
    emailVerified: true,
    phone: "01710000008",
    academicSession: "2023-24",
    department: "Software Engineering",
    memberProfile: {
      membershipId: "MEM-2026-004",
      joinDate: daysFromNow(-120, 9, 0),
      bio: "Recently onboarded member waiting for active participation cycle.",
      profilePhoto: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80",
      status: MemberStatus.INACTIVE,
    },
    application: {
      department: "Software Engineering",
      session: "2023-24",
      studentId: "SE2301004",
      district: "Rajshahi",
      phone: "01710000008",
      status: ApplicationStatus.APPROVED,
      submittedAt: daysFromNow(-150, 11, 0),
      reviewedAt: daysFromNow(-135, 14, 0),
    },
  },
  {
    name: "Rafiul Karim",
    email: "rafiul.member@club.com",
    role: Role.MEMBER,
    emailVerified: true,
    phone: "01710000009",
    academicSession: "2022-23",
    department: "Information Technology",
    memberProfile: {
      membershipId: "MEM-2026-005",
      joinDate: daysFromNow(-145, 10, 0),
      bio: "Works on event media, outreach, and volunteer management.",
      profilePhoto: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=600&q=80",
      status: MemberStatus.ACTIVE,
    },
    application: {
      department: "Information Technology",
      session: "2022-23",
      studentId: "IT2201005",
      district: "Khulna",
      phone: "01710000009",
      status: ApplicationStatus.APPROVED,
      submittedAt: daysFromNow(-185, 9, 0),
      reviewedAt: daysFromNow(-170, 11, 0),
    },
  },
];

const applicantUsers: SeedUser[] = [
  {
    name: "Saba Islam",
    email: "saba.applicant@club.com",
    role: Role.USER,
    emailVerified: true,
    phone: "01710000010",
    academicSession: "2024-25",
    department: "Computer Science and Engineering",
    application: {
      department: "Computer Science and Engineering",
      session: "2024-25",
      studentId: "CSE2401010",
      district: "Barishal",
      phone: "01710000010",
      status: ApplicationStatus.PENDING,
      submittedAt: daysFromNow(-6, 10, 0),
    },
  },
  {
    name: "Arif Hossain",
    email: "arif.applicant@club.com",
    role: Role.USER,
    emailVerified: true,
    phone: "01710000011",
    academicSession: "2024-25",
    department: "Software Engineering",
    application: {
      department: "Software Engineering",
      session: "2024-25",
      studentId: "SE2401011",
      district: "Rangpur",
      phone: "01710000011",
      status: ApplicationStatus.REJECTED,
      submittedAt: daysFromNow(-18, 9, 0),
      reviewedAt: daysFromNow(-12, 16, 0),
    },
  },
  {
    name: "Nowrin Sultana",
    email: "nowrin.applicant@club.com",
    role: Role.USER,
    emailVerified: false,
    phone: "01710000012",
    academicSession: "2023-24",
    department: "Information Technology",
    application: {
      department: "Information Technology",
      session: "2023-24",
      studentId: "IT2301012",
      district: "Mymensingh",
      phone: "01710000012",
      status: ApplicationStatus.PENDING,
      submittedAt: daysFromNow(-3, 15, 0),
    },
  },
];

const generalUsers: SeedUser[] = [
  {
    name: "Imran Kabir",
    email: "imran.user@club.com",
    role: Role.USER,
    emailVerified: true,
    phone: "01710000013",
    academicSession: "2023-24",
    department: "Computer Science and Engineering",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Tithi Roy",
    email: "tithi.user@club.com",
    role: Role.USER,
    emailVerified: true,
    academicSession: "2024-25",
    department: "Software Engineering",
  },
  {
    name: "Mahin Chowdhury",
    email: "mahin.user@club.com",
    role: Role.USER,
    emailVerified: false,
    phone: "01710000015",
    academicSession: "2024-25",
  },
  {
    name: "Priya Das",
    email: "priya.user@club.com",
    role: Role.USER,
    emailVerified: true,
    phone: "01710000016",
    academicSession: "2022-23",
    department: "Information Technology",
  },
  {
    name: "Adib Rahman",
    email: "adib.user@club.com",
    role: Role.USER,
    emailVerified: true,
    phone: "01710000017",
    department: "Computer Science and Engineering",
  },
  {
    name: "Sumaiya Anan",
    email: "sumaiya.user@club.com",
    role: Role.USER,
    emailVerified: true,
    phone: "01710000018",
    academicSession: "2025-26",
    department: "Computer Science and Engineering",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
  },
];

const seedUsers: SeedUser[] = [
  ...adminUsers,
  ...eventManagerUsers,
  ...memberUsers,
  ...applicantUsers,
  ...generalUsers,
];

const seedEvents: Array<{
  title: string;
  description: string;
  location: string;
  eventDate: Date;
  capacity: number;
  category:
    | "Workshop"
    | "Seminar"
    | "Webinar"
    | "Hackathon"
    | "Competition"
    | "Tech Talk"
    | "Bootcamp"
    | "Meetup";
  eventType: EventType;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isRegistrationOpen: boolean;
}> = [
  {
    title: "Spring Orientation Meetup",
    description:
      "An introductory meetup for new students to learn about the club, its teams, regular activities, and the process for becoming an active member.",
    location: "Main Auditorium",
    eventDate: daysFromNow(3, 11, 0),
    capacity: 200,
    category: "Meetup",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true,
    isRegistrationOpen: true,
  },
  {
    title: "Frontend Career Bootcamp",
    description:
      "A two-day intensive bootcamp on frontend engineering, portfolio strategy, and industry expectations for entry-level developers.",
    location: "Innovation Lab 301",
    eventDate: daysFromNow(7, 9, 30),
    capacity: 60,
    category: "Bootcamp",
    eventType: EventType.PAID,
    price: 450,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Research Paper Reading Seminar",
    description:
      "Faculty mentors and senior members will discuss how to read research papers efficiently and extract implementation ideas for student projects.",
    location: "Seminar Room A",
    eventDate: daysFromNow(10, 14, 0),
    capacity: 80,
    category: "Seminar",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "UI Design Workshop for Developers",
    description:
      "A practical workshop focused on layout hierarchy, component thinking, and translating design decisions into reusable frontend code.",
    location: "Computer Lab 2",
    eventDate: daysFromNow(12, 15, 30),
    capacity: 45,
    category: "Workshop",
    eventType: EventType.PAID,
    price: 300,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Competitive Programming Contest Night",
    description:
      "An internal contest with beginner, intermediate, and advanced problem sets designed to prepare participants for inter-university competitions.",
    location: "Lab Complex 5",
    eventDate: daysFromNow(15, 18, 0),
    capacity: 90,
    category: "Competition",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "AI Tools in Student Projects Webinar",
    description:
      "A live webinar on responsible use of AI tools for ideation, prototyping, testing, and project documentation within academic guidelines.",
    location: "Google Meet",
    eventDate: daysFromNow(18, 20, 0),
    capacity: 300,
    category: "Webinar",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Startup Founder Fireside Tech Talk",
    description:
      "An invited startup founder will share lessons on shipping products quickly, early hiring decisions, and how student contributors can stand out.",
    location: "Conference Hall",
    eventDate: daysFromNow(21, 16, 0),
    capacity: 120,
    category: "Tech Talk",
    eventType: EventType.PAID,
    price: 200,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "48 Hour Innovation Hackathon",
    description:
      "Teams will build solutions around campus efficiency, student engagement, and accessibility. Mentors and judges will be available throughout the event.",
    location: "Permanent Campus Innovation Hub",
    eventDate: daysFromNow(25, 9, 0),
    capacity: 150,
    category: "Hackathon",
    eventType: EventType.PAID,
    price: 600,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Open Source Contribution Meetup",
    description:
      "Members will review beginner-friendly repositories, contribution etiquette, and how to write small but meaningful pull requests.",
    location: "Library Discussion Corner",
    eventDate: daysFromNow(28, 15, 0),
    capacity: 70,
    category: "Meetup",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Backend API Architecture Seminar",
    description:
      "A seminar on API versioning, validation, transactions, and production-ready patterns using Node.js, TypeScript, and relational databases.",
    location: "Seminar Room B",
    eventDate: daysFromNow(32, 11, 30),
    capacity: 100,
    category: "Seminar",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Mobile App Prototyping Workshop",
    description:
      "Participants will move from problem framing to clickable mobile prototypes and receive feedback on flow, usability, and feature prioritization.",
    location: "Design Studio",
    eventDate: daysFromNow(36, 13, 0),
    capacity: 35,
    category: "Workshop",
    eventType: EventType.PAID,
    price: 350,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Cloud Deployment Bootcamp",
    description:
      "A practical session on environment setup, deployment workflows, monitoring basics, and release hygiene for student-built applications.",
    location: "Cloud Lab",
    eventDate: daysFromNow(40, 10, 0),
    capacity: 50,
    category: "Bootcamp",
    eventType: EventType.PAID,
    price: 500,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Women in Tech Networking Meetup",
    description:
      "A community meetup focused on mentorship, peer networking, and practical career advice from alumni and invited professionals.",
    location: "Student Center Lounge",
    eventDate: daysFromNow(44, 17, 0),
    capacity: 85,
    category: "Meetup",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Cybersecurity Awareness Tech Talk",
    description:
      "This session will cover phishing, password hygiene, account recovery, and safe collaboration practices for club-managed systems.",
    location: "Auditorium 2",
    eventDate: daysFromNow(48, 12, 30),
    capacity: 160,
    category: "Tech Talk",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: false,
  },
  {
    title: "Inter University Project Showcase",
    description:
      "Teams will present final-year and extracurricular software projects to invited guests, judges, and potential collaborators from other campuses.",
    location: "Exhibition Hall",
    eventDate: daysFromNow(54, 10, 30),
    capacity: 220,
    category: "Competition",
    eventType: EventType.PAID,
    price: 250,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Resume and LinkedIn Review Webinar",
    description:
      "Career advisors and senior alumni will review student resumes and LinkedIn profiles, with practical advice for internships and junior roles.",
    location: "Zoom",
    eventDate: daysFromNow(58, 19, 0),
    capacity: 250,
    category: "Webinar",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: true,
  },
  {
    title: "Git and Collaboration Workshop",
    description:
      "A hands-on session on branching strategy, pull requests, code review etiquette, and collaborative delivery for team projects.",
    location: "Lab Complex 3",
    eventDate: daysFromNow(-4, 14, 0),
    capacity: 55,
    category: "Workshop",
    eventType: EventType.FREE,
    imageUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: false,
  },
  {
    title: "Data Science Mini Bootcamp",
    description:
      "A compact bootcamp covering data cleaning, exploratory analysis, visualization, and model evaluation using practical student datasets.",
    location: "Data Lab",
    eventDate: daysFromNow(-11, 9, 0),
    capacity: 40,
    category: "Bootcamp",
    eventType: EventType.PAID,
    price: 550,
    currency: "BDT",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    isRegistrationOpen: false,
  },
];

const ensureAdminUser = async () => {
  const existingUser = await prisma.user.findUnique({
    where: { email: seedAdmin.email },
    select: { id: true, email: true, role: true },
  });

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        name: seedAdmin.name,
        email: seedAdmin.email,
        password: seedAdmin.password,
      },
    });
  }

  const adminUser = await prisma.user.update({
    where: { email: seedAdmin.email },
    data: { role: "SUPER_ADMIN" },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    user: adminUser,
    created: !existingUser,
  };
};

const ensureSeedUsers = async (reviewerId: string) => {
  let createdCount = 0;
  const roleBreakdown = {
    admin: adminUsers.length,
    eventManager: eventManagerUsers.length,
    member: memberUsers.length,
    applicant: applicantUsers.length,
    generalUser: generalUsers.length,
  };

  for (const seedUser of seedUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: seedUser.email },
      select: { id: true },
    });

    if (!existingUser) {
      await auth.api.signUpEmail({
        body: {
          name: seedUser.name,
          email: seedUser.email,
          password: seedUserPassword,
        },
      });
      createdCount += 1;
    }

    const user = await prisma.user.update({
      where: { email: seedUser.email },
      data: {
        name: seedUser.name,
        role: seedUser.role,
        emailVerified: seedUser.emailVerified ?? false,
        phone: seedUser.phone ?? null,
        academicSession: seedUser.academicSession ?? null,
        department: seedUser.department ?? null,
        image: seedUser.image ?? null,
      },
      select: { id: true },
    });

    if (seedUser.memberProfile) {
      await prisma.memberProfile.upsert({
        where: { userId: user.id },
        update: {
          membershipId: seedUser.memberProfile.membershipId,
          joinDate: seedUser.memberProfile.joinDate,
          bio: seedUser.memberProfile.bio ?? null,
          profilePhoto: seedUser.memberProfile.profilePhoto ?? null,
          status: seedUser.memberProfile.status,
        },
        create: {
          userId: user.id,
          membershipId: seedUser.memberProfile.membershipId,
          joinDate: seedUser.memberProfile.joinDate,
          bio: seedUser.memberProfile.bio ?? null,
          profilePhoto: seedUser.memberProfile.profilePhoto ?? null,
          status: seedUser.memberProfile.status,
        },
      });
    }

    if (seedUser.application) {
      const existingApplication = await prisma.membershipApplication.findFirst({
        where: {
          OR: [{ studentId: seedUser.application.studentId }, { userId: user.id }],
        },
        select: { id: true },
      });

      const applicationData = {
        userId: user.id,
        department: seedUser.application.department,
        session: seedUser.application.session,
        studentId: seedUser.application.studentId,
        district: seedUser.application.district,
        phone: seedUser.application.phone,
        status: seedUser.application.status,
        submittedAt: seedUser.application.submittedAt,
        reviewedAt:
          seedUser.application.status === ApplicationStatus.PENDING
            ? null
            : seedUser.application.reviewedAt ?? new Date(),
        reviewedBy:
          seedUser.application.status === ApplicationStatus.PENDING ? null : reviewerId,
      };

      if (existingApplication) {
        await prisma.membershipApplication.update({
          where: { id: existingApplication.id },
          data: applicationData,
        });
      } else {
        await prisma.membershipApplication.create({
          data: applicationData,
        });
      }
    }
  }

  return {
    created: createdCount,
    total: seedUsers.length,
    defaultPassword: seedUserPassword,
    roleBreakdown,
  };
};

const ensureSiteSetting = async () => {
  const existingSetting = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existingSetting) {
    return {
      setting: existingSetting,
      created: false,
    };
  }

  const setting = await prisma.siteSetting.create({
    data: {
      organizationName: seedSite.organizationName,
      contactEmail: seedSite.contactEmail,
    },
  });

  return {
    setting,
    created: true,
  };
};

const ensureNotices = async (adminUserId: string) => {
  let createdCount = 0;

  for (const notice of seedNotices) {
    const existingNotice = await prisma.notice.findFirst({
      where: {
        title: notice.title,
        createdBy: adminUserId,
      },
      select: { id: true },
    });

    if (existingNotice) {
      continue;
    }

    await prisma.notice.create({
      data: {
        title: notice.title,
        content: notice.content,
        audience: notice.audience,
        createdBy: adminUserId,
      },
    });

    createdCount += 1;
  }

  return {
    created: createdCount,
    total: seedNotices.length,
  };
};

const ensureEvents = async (adminUserId: string) => {
  let createdCount = 0;

  for (const event of seedEvents) {
    const existingEvent = await prisma.event.findFirst({
      where: {
        title: event.title,
        createdBy: adminUserId,
      },
      select: { id: true },
    });

    if (existingEvent) {
      continue;
    }

    await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        capacity: event.capacity,
        category: event.category,
        eventType: event.eventType,
        price: event.eventType === EventType.PAID ? event.price : null,
        currency: event.eventType === EventType.PAID ? event.currency?.toLowerCase() ?? "bdt" : null,
        imageUrl: event.imageUrl,
        isFeatured: event.isFeatured,
        isRegistrationOpen: event.isRegistrationOpen,
        createdBy: adminUserId,
      },
    });

    createdCount += 1;
  }

  return {
    created: createdCount,
    total: seedEvents.length,
  };
};

const main = async () => {
  const adminResult = await ensureAdminUser();
  const userResult = await ensureSeedUsers(adminResult.user.id);
  const settingResult = await ensureSiteSetting();
  const noticeResult = await ensureNotices(adminResult.user.id);
  const eventResult = await ensureEvents(adminResult.user.id);

  console.log("Seed completed.");
  console.log(
    JSON.stringify(
      {
        admin: {
          created: adminResult.created,
          email: adminResult.user.email,
          role: adminResult.user.role,
          defaultPassword: adminResult.created ? seedAdmin.password : undefined,
        },
        users: {
          created: userResult.created,
          totalPrepared: userResult.total,
          defaultPassword: userResult.defaultPassword,
          roleBreakdown: userResult.roleBreakdown,
        },
        siteSetting: {
          created: settingResult.created,
          organizationName: settingResult.setting.organizationName,
        },
        notices: {
          created: noticeResult.created,
          totalPrepared: noticeResult.total,
        },
        events: {
          created: eventResult.created,
          totalPrepared: eventResult.total,
        },
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
