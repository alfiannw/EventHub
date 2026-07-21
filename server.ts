import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { Participant, ActivitySubmission, SongRequest, DoorPrizeCategory, LuckyDrawCategory, LuckyDrawWinner, AuditLog, EventConfig, ActivityType, EventPlannerItem, BoothVisit, NetworkingConnection, AppUser } from "./src/types";

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "db-store.json");

// Default initial database state
const DEFAULT_EVENT_CONFIG: EventConfig = {
  name: "EventHub Global Tech Summit 2026",
  venue: "Grand Ballroom, Tech Plaza Hotel, San Francisco",
  date: "2026-07-15",
  time: "09:00 AM - 05:00 PM",
  googleMapsUrl: "https://maps.google.com/?q=Grand+Ballroom,+Tech+Plaza+Hotel,+San+Francisco",
  showLeaderboardRank: true,
  schedule: [
    { time: "08:30 AM - 09:30 AM", activity: "Guest Arrival & QR Check-In", description: "Collect badge and register attendance at the front desk" },
    { time: "09:30 AM - 11:00 AM", activity: "Opening Keynote & AI Tech Trends", description: "Opening session featuring key tech highlights in Grand Ballroom" },
    { time: "11:00 AM - 12:30 PM", activity: "Panel Discussion: Future of SaaS", description: "Expert insights panel with corporate leaders and Q&A" },
    { time: "12:30 PM - 02:00 PM", activity: "Networking Lunch & Photo Wall Sharing", description: "Connect with peers, check-in at sponsor booths and snap photo stories" },
    { time: "02:00 PM - 03:30 PM", activity: "Interactive Product Demos", description: "Live booths exploration and hands-on developer sandbox sessions" },
    { time: "03:30 PM - 04:15 PM", activity: "Song Requests & Live Band Performance", description: "Submit your favorite tracks and enjoy live ambient band tunes" },
    { time: "04:15 PM - 05:00 PM", activity: "Lucky Draw Wheel Spinner & Door Prizes", description: "Grand draw session for eligible participants based on milestone score" },
    { time: "05:00 PM - 05:30 PM", activity: "Closing Remarks & Event Day Wrap-up", description: "Closing highlights, feedback forms collection and swag distribution" }
  ],
  pointRules: {
    CHECK_IN: 5,
    FEEDBACK: 5,
    PHOTO_UPLOAD: 5,
    INSTAGRAM_POST: 5,
    SONG_REQUEST: 5,
    STAFF_BEST_PHOTO: 5,
    STAFF_ACTIVE: 5,
    NETWORKING: 15,
    CUSTOM: 5
  },
  activities: [
    {
      id: 'ACT_FEEDBACK',
      type: 'FEEDBACK',
      name: 'Submit Event Feedback',
      description: 'Let the organizer know how we did. Auto-approved on submit.',
      points: 5,
      isEnabled: true,
      requireApproval: false,
      validationMethod: 'AUTOMATIC'
    },
    {
      id: 'ACT_PHOTO',
      type: 'PHOTO_UPLOAD',
      name: 'Share Event Photo',
      description: 'Snap and upload your best moment from today. Pending Staff review.',
      points: 5,
      isEnabled: true,
      requireApproval: true,
      validationMethod: 'STAFF_APPROVAL'
    },
    {
      id: 'ACT_IG',
      type: 'INSTAGRAM_POST',
      name: 'Instagram Post Screenshot',
      description: 'Share your experience on IG using #EventHub2026. Pending Staff review.',
      points: 5,
      isEnabled: true,
      requireApproval: true,
      validationMethod: 'STAFF_APPROVAL'
    },
    {
      id: 'ACT_NETWORKING',
      type: 'NETWORKING',
      name: 'Attendee Networking Challenge',
      description: 'Exchange badge QR codes with other attendees on-site to connect and earn points.',
      points: 15,
      isEnabled: true,
      requireApproval: false,
      validationMethod: 'QR_SCAN'
    }
  ],
  sponsorBooths: [
    { id: "sb-1", name: "Google Cloud", boothCode: "BOOTH-101", pointsReward: 10, locationDescription: "East Expo Corridor - Row A" },
    { id: "sb-2", name: "Stripe", boothCode: "BOOTH-102", pointsReward: 10, locationDescription: "Main Entrance Lounge - Booth B" },
    { id: "sb-3", name: "Vercel Platforms", boothCode: "BOOTH-103", pointsReward: 15, locationDescription: "Developer Pavilion - Center" }
  ]
};

const DEFAULT_DOOR_PRIZES: DoorPrizeCategory[] = [
  { id: "dp-1", name: "Category A", minPoints: 0, maxPoints: 10, description: "Bronze Tier - Eligible for local gift cards and merchandise" },
  { id: "dp-2", name: "Category B", minPoints: 11, maxPoints: 20, description: "Silver Tier - Eligible for smart home gadgets and premium audio gears" },
  { id: "dp-3", name: "Category C", minPoints: 21, maxPoints: 999, description: "Gold Tier - Eligible for high-end notebooks, flagship smartphones and major assets" }
];

const DEFAULT_LUCKY_DRAW_CATEGORIES: LuckyDrawCategory[] = [
  { id: "ld-1", name: "Grand Prize", eligiblePointsMin: 21, prizeName: "Apple MacBook Pro 16\"", quantity: 1 },
  { id: "ld-2", name: "Gold Prize", eligiblePointsMin: 11, prizeName: "Apple iPad Pro 11\"", quantity: 2 },
  { id: "ld-3", name: "Silver Prize", eligiblePointsMin: 5, prizeName: "Sony WH-1000XM5 Headphones", quantity: 3 },
  { id: "ld-4", name: "Bronze Prize", eligiblePointsMin: 0, prizeName: "Anker Prime Power Bank", quantity: 5 }
];

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: "EH-1001",
    name: "Alex Rivera",
    email: "alex.rivera@meta.com",
    phone: "+1 (555) 123-4567",
    company: "Meta Platforms Inc.",
    position: "Senior Staff Engineer",
    tableNumber: "Table 4",
    seatNumber: "Seat A-12",
    rsvpStatus: "YES",
    checkedIn: true,
    checkedInAt: "2026-07-07T08:45:00-07:00",
    points: 25,
    qrCode: "EH-1001-alex.rivera@meta.com"
  },
  {
    id: "EH-1002",
    name: "Sarah Chen",
    email: "sarah.chen@google.com",
    phone: "+1 (555) 987-6543",
    company: "Google LLC",
    position: "VP of Product Development",
    tableNumber: "Table 1",
    seatNumber: "Seat VIP-3",
    rsvpStatus: "YES",
    checkedIn: true,
    checkedInAt: "2026-07-07T08:52:15-07:00",
    points: 15,
    qrCode: "EH-1002-sarah.chen@google.com"
  },
  {
    id: "EH-1003",
    name: "Marcus Aurelius",
    email: "marcus.a@netflix.com",
    phone: "+1 (555) 246-8101",
    company: "Netflix Inc.",
    position: "Director of Engineering",
    tableNumber: "Table 2",
    seatNumber: "Seat B-1",
    rsvpStatus: "YES",
    checkedIn: true,
    checkedInAt: "2026-07-07T09:05:11-07:00",
    points: 5,
    qrCode: "EH-1003-marcus.a@netflix.com"
  },
  {
    id: "EH-1004",
    name: "Elena Rostova",
    email: "elena.rostova@jetbrains.com",
    phone: "+1 (555) 369-1215",
    company: "JetBrains s.r.o.",
    position: "Developer Advocate",
    tableNumber: "Table 6",
    seatNumber: "Seat C-5",
    rsvpStatus: "YES",
    checkedIn: false,
    checkedInAt: null,
    points: 0,
    qrCode: "EH-1004-elena.rostova@jetbrains.com"
  },
  {
    id: "EH-1005",
    name: "Kofi Mensah",
    email: "k.mensah@stripe.com",
    phone: "+1 (555) 789-0123",
    company: "Stripe Inc.",
    position: "Principal Product Designer",
    tableNumber: "Table 3",
    seatNumber: "Seat B-8",
    rsvpStatus: "YES",
    checkedIn: true,
    checkedInAt: "2026-07-07T09:12:00-07:00",
    points: 30,
    qrCode: "EH-1005-k.mensah@stripe.com"
  },
  {
    id: "EH-1006",
    name: "Yuki Tanaka",
    email: "tanaka.yuki@sony.co.jp",
    phone: "+81 90-1234-5678",
    company: "Sony Corporation",
    position: "Lead UI Designer",
    tableNumber: "Table 5",
    seatNumber: "Seat C-11",
    rsvpStatus: "YES",
    checkedIn: true,
    checkedInAt: "2026-07-07T08:58:30-07:00",
    points: 10,
    qrCode: "EH-1006-tanaka.yuki@sony.co.jp"
  },
  {
    id: "EH-1007",
    name: "Clara Dupont",
    email: "c.dupont@spotify.com",
    phone: "+33 6 1234 5678",
    company: "Spotify AB",
    position: "Infrastructure Lead",
    tableNumber: "Table 4",
    seatNumber: "Seat A-3",
    rsvpStatus: "YES",
    checkedIn: false,
    checkedInAt: null,
    points: 0,
    qrCode: "EH-1007-c.dupont@spotify.com"
  },
  {
    id: "EH-1008",
    name: "Liam O'Connor",
    email: "liam.oc@atlassian.com",
    phone: "+61 2 9876 5432",
    company: "Atlassian Corp.",
    position: "Senior Event Coordinator",
    tableNumber: "Table 2",
    seatNumber: "Seat B-2",
    rsvpStatus: "PENDING",
    checkedIn: false,
    checkedInAt: null,
    points: 0,
    qrCode: "EH-1008-liam.oc@atlassian.com"
  }
];

const INITIAL_SONGS: SongRequest[] = [
  {
    id: "song-1",
    participantId: "EH-1001",
    participantName: "Alex Rivera",
    artist: "Daft Punk",
    title: "One More Time",
    message: "Let's kickstart this summit with a bang! Perfect networking mood.",
    status: "APPROVED",
    submittedAt: "2026-07-07T09:15:00-07:00"
  },
  {
    id: "song-2",
    participantId: "EH-1002",
    participantName: "Sarah Chen",
    artist: "Coldplay",
    title: "A Sky Full of Stars",
    message: "Dedicated to the amazing organizing team behind EventHub!",
    status: "PLAYED",
    submittedAt: "2026-07-07T09:25:00-07:00"
  },
  {
    id: "song-3",
    participantId: "EH-1005",
    participantName: "Kofi Mensah",
    artist: "The Weeknd",
    title: "Blinding Lights",
    message: "Keeping the energy level high for the panel speakers!",
    status: "PENDING",
    submittedAt: "2026-07-07T09:40:00-07:00"
  }
];

const INITIAL_SUBMISSIONS: ActivitySubmission[] = [
  {
    id: "act-1",
    participantId: "EH-1001",
    participantName: "Alex Rivera",
    activityType: "PHOTO_UPLOAD",
    description: "Uploaded photo at Main Keynote stage",
    content: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    pointsAwarded: 5,
    status: "APPROVED",
    submittedAt: "2026-07-07T09:30:00-07:00"
  },
  {
    id: "act-2",
    participantId: "EH-1005",
    participantName: "Kofi Mensah",
    activityType: "INSTAGRAM_POST",
    description: "Shared event Instagram story with hashtag #EventHub2026",
    content: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60",
    pointsAwarded: 5,
    status: "APPROVED",
    submittedAt: "2026-07-07T09:35:00-07:00"
  },
  {
    id: "act-3",
    participantId: "EH-1001",
    participantName: "Alex Rivera",
    activityType: "FEEDBACK",
    description: "Submitted event registration day feedback",
    content: "Extremely fast check-in experience! The digital event pass and instant QR badge printer are brilliant.",
    pointsAwarded: 5,
    status: "APPROVED",
    submittedAt: "2026-07-07T09:45:00-07:00"
  },
  {
    id: "act-4",
    participantId: "EH-1002",
    participantName: "Sarah Chen",
    activityType: "PHOTO_UPLOAD",
    description: "Uploaded photo from VIP networking session",
    content: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=60",
    pointsAwarded: 5,
    status: "APPROVED",
    submittedAt: "2026-07-07T09:50:00-07:00"
  },
  {
    id: "act-5",
    participantId: "EH-1005",
    participantName: "Kofi Mensah",
    activityType: "STAFF_BEST_PHOTO",
    description: "Awarded by Staff for best keynote event photo!",
    content: "Staff confirmed outstanding creative composition on stage snap.",
    pointsAwarded: 5,
    status: "APPROVED",
    submittedAt: "2026-07-07T10:00:00-07:00"
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-07-07T08:30:00-07:00",
    actor: "System",
    role: "System Engine",
    action: "DATABASE_INITIALIZATION",
    details: "EventHub database storage initialized with default configurations, point rules, and door prize thresholds.",
    severity: "SUCCESS"
  },
  {
    id: "log-2",
    timestamp: "2026-07-07T08:45:00-07:00",
    actor: "Staff-101",
    role: "Event Staff",
    action: "PARTICIPANT_CHECKIN",
    details: "Participant Alex Rivera (EH-1001) successfully checked in. 5 attendance points awarded and badge printed.",
    severity: "SUCCESS"
  },
  {
    id: "log-3",
    timestamp: "2026-07-07T08:52:15-07:00",
    actor: "Staff-101",
    role: "Event Staff",
    action: "PARTICIPANT_CHECKIN",
    details: "Participant Sarah Chen (EH-1002) checked in at front VIP gate. Badge printed successfully.",
    severity: "SUCCESS"
  }
];

const DEFAULT_EVENTS_LIST: EventPlannerItem[] = [
  {
    id: "evt-2026",
    name: "EventHub Global Tech Summit 2026",
    venue: "Grand Ballroom, Tech Plaza Hotel, San Francisco",
    date: "2026-07-15",
    time: "09:00 AM - 05:00 PM",
    isArchived: false,
    createdAt: "2026-01-10T08:00:00Z",
    description: "The premiere event for SaaS developers, designers, and managers globally.",
    showLeaderboardRank: true,
    venueDetails: {
      ballroom: "Grand Ballroom, Section A & B",
      capacity: 500,
      address: "100 Tech Plaza Boulevard, San Francisco, CA 94107",
      parkingInstructions: "Valet parking available at North Tower. Underground self-parking validated up to 8 hours.",
      googleMapsUrl: "https://maps.google.com/?q=Grand+Ballroom,+Tech+Plaza+Hotel,+San+Francisco"
    },
    schedule: [
      { id: "sch-1", time: "08:30 AM - 09:30 AM", activity: "Guest Arrival & QR Check-In", description: "Collect badge and register attendance at the front desk" },
      { id: "sch-2", time: "09:30 AM - 11:00 AM", activity: "Opening Keynote & AI Tech Trends", description: "Opening session featuring key tech highlights in Grand Ballroom" },
      { id: "sch-3", time: "11:00 AM - 12:30 PM", activity: "Panel Discussion: Future of SaaS", description: "Expert insights panel with corporate leaders and Q&A" },
      { id: "sch-4", time: "12:30 PM - 02:00 PM", activity: "Networking Lunch & Photo Wall Sharing", description: "Connect with peers, check-in at sponsor booths and snap photo stories" },
      { id: "sch-5", time: "02:00 PM - 03:30 PM", activity: "Interactive Product Demos", description: "Live booths exploration and hands-on developer sandbox sessions" },
      { id: "sch-6", time: "03:30 PM - 04:15 PM", activity: "Song Requests & Live Band Performance", description: "Submit your favorite tracks and enjoy live ambient band tunes" },
      { id: "sch-7", time: "04:15 PM - 05:00 PM", activity: "Lucky Draw Wheel Spinner & Door Prizes", description: "Grand draw session for eligible participants based on milestone score" },
      { id: "sch-8", time: "05:00 PM - 05:30 PM", activity: "Closing Remarks & Event Day Wrap-up", description: "Closing highlights, feedback forms collection and swag distribution" }
    ],
    seatingLayout: {
      tablesCount: 12,
      seatsPerTable: 8,
      vipTablesCount: 3,
      assignmentMode: "AUTO"
    },
    pointRules: {
      CHECK_IN: 5,
      FEEDBACK: 5,
      PHOTO_UPLOAD: 5,
      INSTAGRAM_POST: 5,
      SONG_REQUEST: 5,
      STAFF_BEST_PHOTO: 5,
      STAFF_ACTIVE: 5,
      NETWORKING: 15,
      CUSTOM: 5
    },
    activities: [
      { id: "act-cfg-1", type: "CHECK_IN", name: "Summit Gate Check-In", isEnabled: true, requireApproval: false, validationMethod: "AUTOMATIC" },
      { id: "act-cfg-2", type: "FEEDBACK", name: "Anonymous Feedback Form", isEnabled: true, requireApproval: false, validationMethod: "AUTOMATIC" },
      { id: "act-cfg-3", type: "PHOTO_UPLOAD", name: "Photo Wall Upload", isEnabled: true, requireApproval: true, validationMethod: "STAFF_APPROVAL" },
      { id: "act-cfg-4", type: "INSTAGRAM_POST", name: "Social Media Outreach", isEnabled: true, requireApproval: true, validationMethod: "STAFF_APPROVAL" },
      { id: "act-cfg-5", type: "SONG_REQUEST", name: "Stage Song Request", isEnabled: true, requireApproval: true, validationMethod: "STAFF_APPROVAL" },
      { id: "act-cfg-6", type: "NETWORKING", name: "Attendee Networking Challenge", isEnabled: true, requireApproval: false, validationMethod: "QR_SCAN", points: 15 }
    ],
    sponsorBooths: [
      { id: "sb-1", name: "Google Cloud", boothCode: "BOOTH-101", pointsReward: 10, locationDescription: "East Expo Corridor - Row A" },
      { id: "sb-2", name: "Stripe", boothCode: "BOOTH-102", pointsReward: 10, locationDescription: "Main Entrance Lounge - Booth B" },
      { id: "sb-3", name: "Vercel Platforms", boothCode: "BOOTH-103", pointsReward: 15, locationDescription: "Developer Pavilion - Center" }
    ],
    luckyDrawCategories: [
      { id: "ld-1", name: "Grand Prize", eligiblePointsMin: 21, prizeName: "Apple MacBook Pro 16\"", quantity: 1 },
      { id: "ld-2", name: "Gold Prize", eligiblePointsMin: 11, prizeName: "Apple iPad Pro 11\"", quantity: 2 },
      { id: "ld-3", name: "Silver Prize", eligiblePointsMin: 5, prizeName: "Sony WH-1000XM5 Headphones", quantity: 3 }
    ],
    prizes: [
      { id: "prz-1", name: "MacBook Pro 16\"", description: "M3 Max Chip, 36GB RAM, 1TB SSD Space Black", stock: 1, pointsRequiredToRedeem: 100 },
      { id: "prz-2", name: "iPad Pro 11\"", description: "M4 OLED Display, 256GB WiFi Silver", stock: 2, pointsRequiredToRedeem: 60 },
      { id: "prz-3", name: "Sony WH-1000XM5", description: "Wireless Noise Cancelling Over-Ear Headphones", stock: 3, pointsRequiredToRedeem: 30 }
    ],
    registrationForm: {
      requireCompany: true,
      requirePosition: true,
      requirePhone: true,
      requireFoodAllergies: false,
      customDisclaimer: "By RSVPing, you consent to receive event alerts and photos upload permissions.",
      isEnabled: true
    },
    emailTemplates: {
      h7Subject: "Welcome to EventHub Global Tech Summit 2026 - Invitation",
      h7Body: "Dear {{GUEST_NAME}},\n\nYou are cordially invited to attend the EventHub Global Tech Summit 2026 in San Francisco! Please verify your RSVP parameters.\n\nBest Regards,\nEvent Team",
      h3Subject: "Only 3 Days Left! Tech Summit Schedule and Seating",
      h3Body: "Hi {{GUEST_NAME}},\n\nGet ready! We're only 3 days away from opening keynote doors. Find your table number in your portal.\n\nSee you soon!",
      h1Subject: "Tomorrow! QR Entrance Pass Info",
      h1Body: "Hello {{GUEST_NAME}},\n\nYour digital wallet pass and QR entry code is ready for check-in. Don't forget to have it scanned at Desk A.\n\nCheers!",
      dayOfSubject: "Live Event Day: Welcome!",
      dayOfBody: "Welcome to the Tech Summit {{GUEST_NAME}}!\n\nSubmit photos, songs, and complete feedback to claim cool merchandise.\n\nHave fun!"
    },
    whatsappTemplates: {
      h7Message: "Hi {{GUEST_NAME}}! You're invited to {{EVENT_NAME}} on {{EVENT_DATE}}. Click here to confirm RSVP: {{PASS_LINK}}",
      h3Message: "Hello {{GUEST_NAME}}! Only 3 days left until {{EVENT_NAME}}. View your table and seat details at {{PASS_LINK}}",
      h1Message: "Urgent: {{GUEST_NAME}}, your entrance pass for tomorrow's summit is ready! Scan at reception Desk: {{PASS_LINK}}",
      dayOfMessage: "Welcome to {{EVENT_NAME}}! Join the leaderboard, request songs and gain cool prizes today: {{PASS_LINK}}"
    }
  },
  {
    id: "evt-2025",
    name: "SaaS Summit & Expo 2025",
    venue: "Moscone Center West, Hall C, San Francisco",
    date: "2025-10-12",
    time: "08:30 AM - 06:00 PM",
    isArchived: true,
    createdAt: "2025-05-12T09:00:00Z",
    description: "The 2025 iteration of our landmark SaaS expo centering next-gen server architectures.",
    showLeaderboardRank: true,
    venueDetails: {
      ballroom: "Exhibition Hall C, Level 2",
      capacity: 1200,
      address: "800 Howard St, San Francisco, CA 94103",
      parkingInstructions: "Public garage parking across from main atrium."
    },
    schedule: [
      { id: "sch-25-1", time: "08:30 AM - 10:00 AM", activity: "Doors Open & Coffee Networking" },
      { id: "sch-25-2", time: "10:00 AM - 12:00 PM", activity: "SaaS Ecosystem Keynote" },
      { id: "sch-25-3", time: "12:00 PM - 03:00 PM", activity: "Catered Lunch & Vendor Demos" },
      { id: "sch-25-4", time: "03:00 PM - 04:30 PM", activity: "Lucky Draws & Vendor Spot Prizes" }
    ],
    seatingLayout: {
      tablesCount: 25,
      seatsPerTable: 10,
      vipTablesCount: 5,
      assignmentMode: "FIRST_COME"
    },
    pointRules: {
      CHECK_IN: 10,
      FEEDBACK: 10,
      PHOTO_UPLOAD: 5,
      INSTAGRAM_POST: 15,
      SONG_REQUEST: 5,
      STAFF_BEST_PHOTO: 20,
      STAFF_ACTIVE: 10,
      NETWORKING: 15,
      CUSTOM: 10
    },
    activities: [
      { id: "act-25-1", type: "CHECK_IN", name: "Moscone Expo Entry scan", isEnabled: true, requireApproval: false, validationMethod: "AUTOMATIC" },
      { id: "act-25-2", type: "FEEDBACK", name: "Moscone Feedback Exit survey", isEnabled: true, requireApproval: false, validationMethod: "AUTOMATIC" },
      { id: "act-25-3", type: "NETWORKING", name: "Attendee Networking Challenge", isEnabled: true, requireApproval: false, validationMethod: "QR_SCAN", points: 15 }
    ],
    sponsorBooths: [
      { id: "sb-25-1", name: "Amazon Web Services", boothCode: "AWS-401", pointsReward: 20, locationDescription: "Moscone Main Floor - Island B" },
      { id: "sb-25-2", name: "GitHub", boothCode: "GH-402", pointsReward: 15, locationDescription: "Social Hub Space" }
    ],
    luckyDrawCategories: [
      { id: "ld-25-1", name: "Mega Prize", eligiblePointsMin: 30, prizeName: "Sony PlayStation 5 Pro", quantity: 1 }
    ],
    prizes: [
      { id: "prz-25-1", name: "PlayStation 5 Pro", description: "Standard Digital Bundle with controller", stock: 1, pointsRequiredToRedeem: 120 }
    ],
    registrationForm: {
      requireCompany: true,
      requirePosition: false,
      requirePhone: true,
      requireFoodAllergies: true,
      customDisclaimer: "Moscone Center privacy regulations apply.",
      isEnabled: true
    },
    emailTemplates: {
      h7Subject: "Your Ticket to SaaS Summit 2025",
      h7Body: "Hi {{GUEST_NAME}},\n\nYour Moscone badge is reserved.",
      h3Subject: "Moscone Center Seating & Schedule",
      h3Body: "Hi {{GUEST_NAME}},\n\nOnly 3 days left until Moscone Doors open.",
      h1Subject: "Tomorrow! Badge Collection Info",
      h1Body: "Hi {{GUEST_NAME}},\n\nCollect your physical badge tomorrow.",
      dayOfSubject: "SaaS Summit 2025: Live Now",
      dayOfBody: "Welcome to SaaS Summit 2025!"
    },
    whatsappTemplates: {
      h7Message: "Hi {{GUEST_NAME}}! Confirm your badge at {{PASS_LINK}}",
      h3Message: "Hello {{GUEST_NAME}}! 3 days left. Details at {{PASS_LINK}}",
      h1Message: "SaaS Summit tomorrow! Info: {{PASS_LINK}}",
      dayOfMessage: "Live now! Join at {{PASS_LINK}}"
    }
  }
];

interface DatabaseSchema {
  eventConfig: EventConfig;
  doorPrizeCategories: DoorPrizeCategory[];
  luckyDrawCategories: LuckyDrawCategory[];
  participants: Participant[];
  songRequests: SongRequest[];
  activitySubmissions: ActivitySubmission[];
  winners: LuckyDrawWinner[];
  auditLogs: AuditLog[];
  eventsList: EventPlannerItem[];
  boothVisits: BoothVisit[];
  networkingConnections: NetworkingConnection[];
  whitelistedEmails: string[];
  whitelistedStaffEmails: string[];
  users: AppUser[];
}

// Memory database loaded from or backed up to JSON
let db: DatabaseSchema = {
  eventConfig: DEFAULT_EVENT_CONFIG,
  doorPrizeCategories: DEFAULT_DOOR_PRIZES,
  luckyDrawCategories: DEFAULT_LUCKY_DRAW_CATEGORIES,
  participants: INITIAL_PARTICIPANTS,
  songRequests: INITIAL_SONGS,
  activitySubmissions: INITIAL_SUBMISSIONS,
  winners: [],
  auditLogs: INITIAL_AUDIT_LOGS,
  eventsList: DEFAULT_EVENTS_LIST,
  boothVisits: [],
  networkingConnections: [],
  whitelistedEmails: ["manager@eventhub.com"],
  whitelistedStaffEmails: ["staff@eventhub.com"],
  users: [
    {
      id: "user-superadmin",
      email: "alfian.n.wicaksono@gmail.com",
      name: "Alfian Wicaksono",
      role: "SUPER_ADMIN",
      password: "SuperAdmin2026!",
      createdAt: new Date().toISOString()
    }
  ]
};

// Helper to load database
function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      db = JSON.parse(data);
      if (!db.eventsList) {
        db.eventsList = DEFAULT_EVENTS_LIST;
      }
      if (!db.boothVisits) {
        db.boothVisits = [];
      }
      if (!db.networkingConnections) {
        db.networkingConnections = [];
      }
      if (!db.whitelistedEmails) {
        db.whitelistedEmails = ["manager@eventhub.com"];
      }
      if (!db.whitelistedStaffEmails) {
        db.whitelistedStaffEmails = ["staff@eventhub.com"];
      }
      if (!db.users) {
        db.users = [];
      }
      if (db.participants) {
        db.participants.forEach(p => {
          if (p.approved === undefined) {
            p.approved = true;
          }
        });
      }
      // Seed superadmin if not present
      const hasSuperAdmin = db.users.some(u => u.email.toLowerCase() === "alfian.n.wicaksono@gmail.com".toLowerCase());
      if (!hasSuperAdmin) {
        db.users.push({
          id: "user-superadmin",
          email: "alfian.n.wicaksono@gmail.com",
          name: "Alfian Wicaksono",
          role: "SUPER_ADMIN",
          password: "SuperAdmin2026!",
          createdAt: new Date().toISOString()
        });
      }
      saveDb();
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("Failed to load DB file, using fallback state:", err);
  }
}

// Helper to save database
function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save DB file:", err);
  }
}

loadDb();

// Add audit log helper
function addAuditLog(actor: string, role: string, action: string, details: string, severity: AuditLog['severity'] = 'INFO') {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    role,
    action,
    details,
    severity
  };
  db.auditLogs.unshift(newLog); // Put new logs first
  saveDb();
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Endpoints

// 1. Event Config
app.get("/api/event-config", (req, res) => {
  res.json(db.eventConfig);
});

app.post("/api/event-config", (req, res) => {
  try {
    const configUpdate = req.body as Partial<EventConfig>;
    db.eventConfig = { ...db.eventConfig, ...configUpdate };
    addAuditLog("Manager", "Event Manager", "UPDATE_EVENT_CONFIG", `Updated event details and schedule.`, "INFO");
    saveDb();
    res.json(db.eventConfig);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 1.1 Event Planner REST API
app.get("/api/planner/events", (req, res) => {
  res.json(db.eventsList);
});

app.post("/api/planner/events", (req, res) => {
  try {
    const newEvent = req.body as EventPlannerItem;
    if (!newEvent.id) {
      newEvent.id = `evt-${Date.now()}`;
    }
    newEvent.createdAt = new Date().toISOString();
    db.eventsList.push(newEvent);
    
    if (!newEvent.isArchived) {
      db.eventConfig = {
        name: newEvent.name,
        venue: newEvent.venue,
        date: newEvent.date,
        time: newEvent.time,
        appUrl: db.eventConfig?.appUrl,
        schedule: newEvent.schedule.map(s => ({ time: s.time, activity: s.activity, description: s.description })),
        pointRules: newEvent.pointRules,
        googleMapsUrl: newEvent.venueDetails?.googleMapsUrl,
        showLeaderboardRank: newEvent.showLeaderboardRank !== false
      };
    }

    addAuditLog("Manager", "Event Manager", "CREATE_EVENT", `Created new event: "${newEvent.name}"`, "SUCCESS");
    saveDb();
    res.json(newEvent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/planner/events/duplicate", (req, res) => {
  try {
    const { eventId } = req.body;
    const sourceEvent = db.eventsList.find(e => e.id === eventId);
    if (!sourceEvent) {
      return res.status(404).json({ error: "Source event not found" });
    }
    
    const duplicated: EventPlannerItem = JSON.parse(JSON.stringify(sourceEvent));
    duplicated.id = `evt-dup-${Date.now()}`;
    duplicated.name = `${sourceEvent.name} (Copy)`;
    duplicated.isArchived = false;
    duplicated.createdAt = new Date().toISOString();
    
    db.eventsList.push(duplicated);
    
    db.eventConfig = {
      name: duplicated.name,
      venue: duplicated.venue,
      date: duplicated.date,
      time: duplicated.time,
      appUrl: db.eventConfig?.appUrl,
      schedule: duplicated.schedule.map(s => ({ time: s.time, activity: s.activity, description: s.description })),
      pointRules: duplicated.pointRules,
      googleMapsUrl: duplicated.venueDetails?.googleMapsUrl,
      showLeaderboardRank: duplicated.showLeaderboardRank !== false
    };
    
    addAuditLog("Manager", "Event Manager", "DUPLICATE_EVENT", `Duplicated event "${sourceEvent.name}" into "${duplicated.name}"`, "SUCCESS");
    saveDb();
    res.json(duplicated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/planner/events/archive", (req, res) => {
  try {
    const { eventId, isArchived } = req.body;
    const event = db.eventsList.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    event.isArchived = isArchived;
    const actionLabel = isArchived ? "ARCHIVE_EVENT" : "REACTIVE_EVENT";
    addAuditLog("Manager", "Event Manager", actionLabel, `${isArchived ? 'Archived' : 'Activated'} event "${event.name}"`, "WARNING");
    saveDb();
    res.json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/planner/config/all", (req, res) => {
  try {
    const updatedEvent = req.body as EventPlannerItem;
    const index = db.eventsList.findIndex(e => e.id === updatedEvent.id);
    if (index === -1) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    db.eventsList[index] = updatedEvent;
    
    if (!updatedEvent.isArchived) {
      db.eventConfig = {
        name: updatedEvent.name,
        venue: updatedEvent.venue,
        date: updatedEvent.date,
        time: updatedEvent.time,
        appUrl: db.eventConfig?.appUrl,
        schedule: updatedEvent.schedule.map(s => ({ time: s.time, activity: s.activity, description: s.description })),
        pointRules: updatedEvent.pointRules,
        googleMapsUrl: updatedEvent.venueDetails?.googleMapsUrl,
        sponsorBooths: updatedEvent.sponsorBooths,
        showLeaderboardRank: updatedEvent.showLeaderboardRank !== false
      };
      
      if (updatedEvent.luckyDrawCategories && updatedEvent.luckyDrawCategories.length > 0) {
        db.luckyDrawCategories = updatedEvent.luckyDrawCategories;
      }
    }
    
    addAuditLog("Manager", "Event Manager", "UPDATE_EVENT_PLANNED_CONFIG", `Updated multiple configurations for "${updatedEvent.name}"`, "INFO");
    saveDb();
    res.json(updatedEvent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


// 2. Door Prize Categories
app.get("/api/door-prizes", (req, res) => {
  res.json(db.doorPrizeCategories);
});

app.post("/api/door-prizes", (req, res) => {
  try {
    const newCategories = req.body as DoorPrizeCategory[];
    db.doorPrizeCategories = newCategories;
    addAuditLog("Manager", "Event Manager", "UPDATE_DOOR_PRIZE_RULES", `Modified the score tiers for Category A, B, and C.`, "INFO");
    saveDb();
    res.json(db.doorPrizeCategories);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Lucky Draw Configuration & Winner Drawing
app.get("/api/lucky-draw/config", (req, res) => {
  res.json(db.luckyDrawCategories);
});

app.post("/api/lucky-draw/config", (req, res) => {
  try {
    db.luckyDrawCategories = req.body as LuckyDrawCategory[];
    addAuditLog("Manager", "Event Manager", "UPDATE_LUCKY_DRAW_CONFIG", "Updated lucky draw item lists and required tiers.", "INFO");
    saveDb();
    res.json(db.luckyDrawCategories);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/lucky-draw/winners", (req, res) => {
  res.json(db.winners);
});

app.post("/api/lucky-draw/draw", (req, res) => {
  try {
    const { categoryId } = req.body;
    const category = db.luckyDrawCategories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(404).json({ error: "Lucky draw category not found" });
    }

    // Get checked in participants
    // Filter out participants who already won *any* prize (anti-duplicate logic!)
    const wonParticipantIds = new Set(db.winners.map(w => w.participantId));
    
    // Filter participants based on check-in and points matching the category
    const eligibleParticipants = db.participants.filter(p => {
      return p.checkedIn && p.points >= category.eligiblePointsMin && !wonParticipantIds.has(p.id);
    });

    if (eligibleParticipants.length === 0) {
      return res.status(400).json({ 
        error: `No eligible participants found. Candidates must be checked in, have at least ${category.eligiblePointsMin} points, and not have won already.` 
      });
    }

    // Pick a random winner!
    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const winnerParticipant = eligibleParticipants[randomIndex];

    const newWinner: LuckyDrawWinner = {
      id: `win-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: winnerParticipant.id,
      participantName: winnerParticipant.name,
      participantCompany: winnerParticipant.company,
      prizeCategoryName: category.name,
      prizeName: category.prizeName,
      drawnAt: new Date().toISOString()
    };

    db.winners.unshift(newWinner);
    addAuditLog(
      "Manager", 
      "Event Manager", 
      "LUCKY_DRAW_WINNER", 
      `Drawn winner: ${winnerParticipant.name} (${winnerParticipant.company}) won "${category.prizeName}" under ${category.name}!`, 
      "SUCCESS"
    );
    saveDb();
    res.json({ winner: newWinner, eligibleCount: eligibleParticipants.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/lucky-draw/reset", (req, res) => {
  db.winners = [];
  addAuditLog("Manager", "Event Manager", "RESET_LUCKY_DRAW", "Cleared all lucky draw winner history for a redraw session.", "WARNING");
  saveDb();
  res.json({ success: true, message: "Winner list cleared." });
});

// 4. Participants API
app.get("/api/participants", (req, res) => {
  res.json(db.participants);
});

app.post("/api/participants", (req, res) => {
  try {
    const { name, email, phone, company, position, tableNumber, seatNumber, rsvpStatus, invitationStatus, invitationChannel } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Check if participant already exists by email
    const exists = db.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "A participant with this email is already registered." });
    }

    const nextIdNum = Math.max(...db.participants.map(p => parseInt(p.id.replace("EH-", "")))) + 1;
    const newParticipant: Participant = {
      id: `EH-${nextIdNum}`,
      name,
      email,
      phone: phone || "",
      company: company || "Self-Employed",
      position: position || "Attendee",
      tableNumber: tableNumber || "Table General",
      seatNumber: seatNumber || `Seat ${Math.floor(Math.random() * 50) + 1}`,
      rsvpStatus: rsvpStatus || "PENDING",
      checkedIn: false,
      checkedInAt: null,
      points: 0,
      qrCode: `EH-${nextIdNum}-${email}`,
      invitationStatus: invitationStatus || "NOT_SENT",
      invitationChannel: invitationChannel,
      approved: true
    };

    db.participants.push(newParticipant);
    addAuditLog("Manager", "Event Manager", "PARTICIPANT_ADDED", `Manager manually added guest invitation: ${name} (${company}).`, "INFO");
    saveDb();
    res.json(newParticipant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Approve or reject/disapprove a participant registration
app.post("/api/participants/toggle-approve", (req, res) => {
  try {
    const { id, approved } = req.body;
    const participant = db.participants.find(p => p.id === id);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }
    participant.approved = approved !== undefined ? !!approved : !participant.approved;
    addAuditLog("Manager/Staff", "Admin/Staff Action", "PARTICIPANT_APPROVE", `${participant.approved ? 'Approved' : 'Unapproved'} participant registration: ${participant.name} (${participant.email}).`, "INFO");
    saveDb();
    res.json(participant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Send invitations endpoint (updates status to DELIVERED and sends email if SMTP is configured)
app.post("/api/invitations/send", async (req, res) => {
  try {
    const { participantIds, channel, emailSubject, emailBody, waMessage } = req.body;
    if (!participantIds || !Array.isArray(participantIds) || !channel) {
      return res.status(400).json({ error: "participantIds array and channel are required" });
    }

    // SMTP configuration check
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    const hasSmtpConfig = smtpHost && smtpUser && smtpPass;

    let count = 0;
    const errors: string[] = [];

    // Base URL for links prioritizing custom configured appUrl, then env APP_URL, then request headers
    let origin = db.eventConfig?.appUrl || "";
    if (!origin && process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL") {
      origin = process.env.APP_URL;
    }
    if (!origin) {
      origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
    }

    // Clean trailing slash
    if (origin && origin.endsWith("/")) {
      origin = origin.substring(0, origin.length - 1);
    }

    if (channel === "EMAIL") {
      if (!hasSmtpConfig) {
        // Fallback simulation mode
        participantIds.forEach(id => {
          const participant = db.participants.find(p => p.id === id);
          if (participant) {
            participant.invitationStatus = "DELIVERED";
            participant.invitationChannel = "EMAIL";
            count++;
          }
        });

        if (count > 0) {
          addAuditLog("Manager", "Event Manager", "INVITATION_SENT_SIMULATED", `Simulated dispatch of ${count} invitations via EMAIL (SMTP not configured).`, "WARNING");
          saveDb();
        }

        return res.json({
          success: true,
          countSent: count,
          warning: `Dispatched ${count} guest(s) in system, but REAL EMAILS could not be sent because SMTP is not configured in .env. Silakan tentukan SMTP_HOST, SMTP_PORT, SMTP_USER, dan SMTP_PASS di environment variable.`
        });
      }

      // Create nodemailer transport
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Verify connection configuration
      try {
        await transporter.verify();
      } catch (verifyErr: any) {
        console.error("SMTP Verify Error:", verifyErr);
        return res.status(500).json({
          error: `Gagal menghubungkan ke server SMTP. Pastikan kredensial SMTP_HOST, SMTP_PORT, SMTP_USER, dan SMTP_PASS benar. Error: ${verifyErr.message}`
        });
      }

      // Dynamic template values substitution & mailing
      for (const id of participantIds) {
        const participant = db.participants.find(p => p.id === id);
        if (participant) {
          try {
            // Replace templates
            const rsvpLink = `${origin}/rsvp?id=${participant.id}`;
            const subject = (emailSubject || "Exclusive Invitation")
              .replace(/\[Name\]/g, participant.name)
              .replace(/\[Date\]/g, db.eventConfig?.date || "2026-07-15")
              .replace(/\[Time\]/g, db.eventConfig?.time || "09:00 AM - 05:00 PM")
              .replace(/\[Venue\]/g, db.eventConfig?.venue || "Grand Ballroom")
              .replace(/\[MapLink\]/g, db.eventConfig?.googleMapsUrl || "https://maps.google.com");

            const textBody = (emailBody || "")
              .replace(/\[Name\]/g, participant.name)
              .replace(/\[Date\]/g, db.eventConfig?.date || "2026-07-15")
              .replace(/\[Time\]/g, db.eventConfig?.time || "09:00 AM - 05:00 PM")
              .replace(/\[Venue\]/g, db.eventConfig?.venue || "Grand Ballroom")
              .replace(/\[MapLink\]/g, db.eventConfig?.googleMapsUrl || "https://maps.google.com")
              .replace(/\[Link\]/g, rsvpLink)
              .replace(/\[ID\]/g, participant.id);

            // Construct dynamic schedule list HTML
            let scheduleHtml = "";
            if (db.eventConfig?.schedule && db.eventConfig.schedule.length > 0) {
              scheduleHtml = db.eventConfig.schedule.map(item => `
                <div style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: 'Courier New', Courier, monospace; font-size: 10px;">
                  <span style="font-weight: bold; color: #0f172a; text-transform: uppercase; display: inline-block; width: 90px;">${item.time}</span>
                  <span style="color: #475569; display: inline-block;">${item.activity}</span>
                </div>
              `).join("");
            } else {
              scheduleHtml = `<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 10px; font-family: 'Courier New', Courier, monospace;">No scheduled activities found in config.</div>`;
            }

            // Construct nice, modern HTML email body matching Live Dispatch Simulation Preview EXACTLY
            const htmlContent = `
              <div style="background-color: #f1f5f9; padding: 40px 16px; font-family: 'Courier New', Courier, monospace;">
                <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #141414; background-color: #ffffff; box-shadow: 4px 4px 0px 0px #141414; box-sizing: border-box;">
                  
                  <!-- Logo / Title Banner -->
                  <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px;">
                    <span style="font-size: 10px; font-weight: 900; color: #4338ca; text-transform: uppercase; letter-spacing: 2px; display: block;">EH // DIGITAL CAMPAIGN PASS</span>
                    <h4 style="font-weight: bold; font-size: 14px; color: #0f172a; text-transform: uppercase; margin: 4px 0 0 0;">
                      ${db.eventConfig?.name || "Global Tech Summit 2026"}
                    </h4>
                  </div>

                  <!-- 1. Personalized Greeting -->
                  <div style="margin-bottom: 20px;">
                    <span style="font-weight: bold; color: #3730a3; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; display: block;">[ 1. Personalized Greeting ]</span>
                    <p style="font-size: 12px; color: #475569; line-height: 1.6; white-space: pre-wrap; margin-top: 8px;">${textBody}</p>
                  </div>

                  <!-- Seating, Table and personalized details -->
                  <div style="background-color: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                      <tr>
                        <td style="width: 50%; vertical-align: top; padding-right: 8px; border-right: 1px solid #e2e8f0;">
                          <span style="font-size: 8px; color: #94a3b8; font-weight: bold; display: block; text-transform: uppercase;">CAMPAIGN TARGET GUEST</span>
                          <span style="font-weight: bold; color: #0f172a; display: block; margin-top: 2px; font-size: 11px;">${participant.name}</span>
                          <span style="color: #64748b; font-size: 9px; display: block; margin-top: 1px;">${participant.position || 'Attendee'} at ${participant.company || 'Independent'}</span>
                        </td>
                        <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                          <span style="font-size: 8px; color: #94a3b8; font-weight: bold; display: block; text-transform: uppercase;">SEATING ASSIGNMENT</span>
                          <span style="font-weight: bold; color: #d97706; display: block; margin-top: 2px; font-size: 11px;">Tersedia saat Check-In</span>
                          <span style="color: #64748b; font-size: 8.5px; display: block; line-height: 1.3; margin-top: 2px;">Silakan lakukan check-in di gate masuk untuk mendapatkan nomor meja dan kursi Anda.</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- 2. Agenda Timeline -->
                  <div style="margin-bottom: 20px;">
                    <span style="font-weight: bold; color: #3730a3; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; display: block; margin-bottom: 8px;">[ 2. Agenda Timeline ]</span>
                    <div style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 4px;">
                      ${scheduleHtml}
                    </div>
                  </div>

                  <!-- 3. Interactive Guest Actions -->
                  <div style="margin-bottom: 20px;">
                    <span style="font-weight: bold; color: #3730a3; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; display: block;">[ 3. Interactive Guest Actions ]</span>
                    
                    <div style="margin-top: 12px; text-align: center;">
                      <a href="${rsvpLink}" target="_blank" style="background-color: #141414; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: inline-block; border: 2px solid #141414;">
                        Confirm RSVP / Digital Pass
                      </a>
                    </div>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; margin-top: 12px; font-size: 9px;">
                      <span style="color: #94a3b8; font-weight: bold; text-transform: uppercase; display: inline-block; margin-right: 4px;">Invitation Link:</span>
                      <a href="${rsvpLink}" target="_blank" style="color: #3b82f6; word-break: break-all; text-decoration: none;">${rsvpLink}</a>
                    </div>
                  </div>

                  <!-- 4. Venue Coordinates & Location -->
                  <div style="margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #3730a3; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; display: block; margin-bottom: 8px;">[ 4. Venue Coordinates & Location ]</span>
                    
                    <div style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f5f3ff;">
                      <table style="width: 100%; border-collapse: collapse; font-family: 'Courier New', Courier, monospace; font-size: 10px;">
                        <tr>
                          <td style="width: 100px; vertical-align: top; padding-right: 12px;">
                            <div style="background-color: #DFDEDA; border: 1px solid #141414; width: 90px; height: 60px; text-align: center; padding-top: 12px; box-sizing: border-box;">
                              <span style="font-size: 16px; display: block;">📍</span>
                              <span style="font-size: 7px; font-weight: bold; color: #141414; letter-spacing: -0.5px; text-transform: uppercase; display: block; margin-top: 2px;">SIMULATED MAP</span>
                            </div>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="font-weight: bold; color: #0f172a; margin: 0; font-size: 11px;">
                              📍 ${db.eventConfig?.venue || 'Grand Ballroom'}
                            </p>
                            <p style="color: #64748b; font-size: 9px; margin: 3px 0 0 0;">Coordinates: 37.7749° N, 122.4194° W</p>
                            <p style="color: #475569; font-size: 9px; font-style: italic; margin: 3px 0 0 0; line-height: 1.3;">Valet parking available at Tower Gate. Self-parking validated up to 8 hours.</p>
                            ${db.eventConfig?.googleMapsUrl ? `
                              <div style="margin-top: 8px;">
                                <a href="${db.eventConfig.googleMapsUrl}" target="_blank" style="background-color: #141414; color: #ffffff; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; padding: 4px 8px; display: inline-block; border: 1px solid #141414;">
                                  📍 Get Position on Google Maps
                                </a>
                              </div>
                            ` : ""}
                          </td>
                        </tr>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            `;

            await transporter.sendMail({
              from: smtpFrom,
              to: participant.email,
              subject: subject,
              text: textBody + `\n\nConfirm RSVP here: ${rsvpLink}`,
              html: htmlContent,
            });

            participant.invitationStatus = "DELIVERED";
            participant.invitationChannel = "EMAIL";
            count++;
          } catch (mailErr: any) {
            console.error(`Gagal mengirim email ke ${participant.email}:`, mailErr);
            errors.push(`${participant.name} (${participant.email}): ${mailErr.message}`);
          }
        }
      }

      if (count > 0) {
        addAuditLog("Manager", "Event Manager", "INVITATION_SENT", `Dispatched ${count} real emails successfully via SMTP.`, "INFO");
        saveDb();
      }

      if (errors.length > 0) {
        return res.status(500).json({
          error: `Gagal mengirim ke beberapa guest: ${errors.join(", ")}`
        });
      }

      return res.json({ success: true, countSent: count });
    } else {
      // WHATSAPP channel or others (simulated / manual)
      participantIds.forEach(id => {
        const participant = db.participants.find(p => p.id === id);
        if (participant) {
          participant.invitationStatus = "DELIVERED";
          participant.invitationChannel = channel;
          count++;
        }
      });

      if (count > 0) {
        addAuditLog("Manager", "Event Manager", "INVITATION_SENT", `Dispatched ${count} invitations via WHATSAPP (Simulated).`, "INFO");
        saveDb();
      }

      res.json({ success: true, countSent: count });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Track invitation open (updates status to OPENED)
app.post("/api/invitations/track-open", (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ error: "participantId is required" });
    }

    const participant = db.participants.find(p => p.id === participantId);
    if (participant) {
      // Only transition to OPENED if currently NOT_SENT or DELIVERED
      if (participant.invitationStatus === "NOT_SENT" || participant.invitationStatus === "DELIVERED" || !participant.invitationStatus) {
        participant.invitationStatus = "OPENED";
        addAuditLog("System", "Invitation Tracker", "INVITATION_OPENED", `Guest ${participant.name} (${participant.email}) opened their invitation.`, "INFO");
        saveDb();
      }
      return res.json({ success: true, invitationStatus: participant.invitationStatus });
    }

    res.status(404).json({ error: "Participant not found" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Invite upload endpoint (Manager upload participant invitation list)
app.post("/api/participants/bulk-import", (req, res) => {
  try {
    const importList = req.body as Array<Omit<Participant, 'id' | 'rsvpStatus' | 'checkedIn' | 'checkedInAt' | 'points' | 'qrCode'>>;
    let count = 0;

    importList.forEach(item => {
      const emailLower = item.email.toLowerCase();
      const alreadyInList = db.participants.find(p => p.email.toLowerCase() === emailLower);
      if (!alreadyInList) {
        const nextIdNum = Math.max(...db.participants.map(p => parseInt(p.id.replace("EH-", "")))) + 1;
        const newPart: Participant = {
          id: `EH-${nextIdNum}`,
          name: item.name,
          email: item.email,
          phone: item.phone || "",
          company: item.company || "Unknown",
          position: item.position || "Attendee",
          tableNumber: item.tableNumber || "Table Pending",
          seatNumber: item.seatNumber || "Seat Pending",
          rsvpStatus: "PENDING",
          checkedIn: false,
          checkedInAt: null,
          points: 0,
          qrCode: `EH-${nextIdNum}-${item.email}`,
          approved: true
        };
        db.participants.push(newPart);
        count++;
      }
    });

    if (count > 0) {
      addAuditLog("Manager", "Event Manager", "BULK_IMPORT_GUESTS", `Uploaded guest invitation list containing ${count} new invitations.`, "INFO");
      saveDb();
    }
    res.json({ success: true, countImported: count, total: db.participants.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Register a new participant account with password and profile
app.post("/api/participants/register", (req, res) => {
  try {
    const { name, email, password, phone, company, position, dietaryPreference, tShirtSize, specialNeeds, rsvpStatus, avatarUrl, companyLogoUrl } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    const exists = db.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "A participant with this email is already registered." });
    }

    const nextIdNum = Math.max(...db.participants.map(p => parseInt(p.id.replace("EH-", "")))) + 1;
    const newParticipant: Participant = {
      id: `EH-${nextIdNum}`,
      name,
      email,
      phone: phone || "",
      company: company || "Independent",
      position: position || "Professional",
      tableNumber: "Table General",
      seatNumber: `Seat ${Math.floor(Math.random() * 50) + 1}`,
      rsvpStatus: rsvpStatus || "YES",
      checkedIn: false,
      checkedInAt: null,
      points: 0,
      qrCode: `EH-${nextIdNum}-${email}`,
      invitationStatus: rsvpStatus === "NO" ? "DECLINED" : "REGISTERED",
      invitationChannel: "EMAIL",
      password: password || "",
      dietaryPreference: dietaryPreference || "None",
      tShirtSize: tShirtSize || "M",
      specialNeeds: specialNeeds || "",
      companyLogoUrl: companyLogoUrl || "",
      avatarUrl: avatarUrl || "",
      approved: false
    };

    db.participants.push(newParticipant);
    addAuditLog("Participant", "Event Participant", "REGISTER", `New participant registered: ${name} (${company}).`, "INFO");
    saveDb();
    res.json(newParticipant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Unified Login Route (handles Super Admin, Event Manager, and Participant)
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 1. Check administrative users (Super Admin & Event Manager)
    const adminUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (adminUser) {
      if (adminUser.password !== password) {
        return res.status(401).json({ error: "Incorrect password." });
      }
      if (adminUser.revoked) {
        return res.status(403).json({ error: "Your access has been revoked by the Superadmin." });
      }
      return res.json({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isOrganizer: true
      });
    }

    // 2. Check event participants
    const participant = db.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (participant) {
      if (participant.password && participant.password !== password) {
        return res.status(401).json({ error: "Incorrect password." });
      }
      if (participant.revoked) {
        return res.status(403).json({ error: "Your access has been revoked by the Superadmin." });
      }
      // auto-set password if they log in and don't have one set yet
      if (!participant.password && password) {
        participant.password = password;
        saveDb();
      }
      return res.json({
        id: participant.id,
        email: participant.email,
        name: participant.name,
        role: "PARTICIPANT",
        participantDetails: participant,
        isOrganizer: false
      });
    }

    return res.status(404).json({ error: "No registered account found with this email." });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Register a new Event Manager
app.post("/api/auth/register-manager", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // Check if whitelisted
    const isWhitelisted = db.whitelistedEmails.some(e => e.toLowerCase() === email.toLowerCase());
    if (!isWhitelisted && email.toLowerCase() !== "alfian.n.wicaksono@gmail.com") {
      return res.status(403).json({ error: "Email is not whitelisted by the Superadmin. Please contact your Superadmin for access." });
    }

    // Check if already registered in db.users
    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "This email is already registered as an administrator/manager." });
    }

    const newManager: AppUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role: "EVENT_MANAGER",
      password,
      createdAt: new Date().toISOString()
    };

    db.users.push(newManager);
    addAuditLog("Superadmin", "System Security", "REGISTER_MANAGER", `New Event Manager whitelisted and registered: ${name} (${email}).`, "SUCCESS");
    saveDb();

    res.json({
      id: newManager.id,
      email: newManager.email,
      name: newManager.name,
      role: newManager.role,
      isOrganizer: true
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Register a new Event Staff
app.post("/api/auth/register-staff", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // Check if whitelisted for staff
    const isWhitelisted = db.whitelistedStaffEmails.some(e => e.toLowerCase() === email.toLowerCase());
    if (!isWhitelisted && email.toLowerCase() !== "alfian.n.wicaksono@gmail.com") {
      return res.status(403).json({ error: "Email is not whitelisted by the Superadmin. Please contact your Superadmin for access." });
    }

    // Check if already registered in db.users
    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "This email is already registered as an administrator/staff." });
    }

    const newStaff: AppUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role: "EVENT_STAFF",
      password,
      createdAt: new Date().toISOString()
    };

    db.users.push(newStaff);
    addAuditLog("Superadmin", "System Security", "REGISTER_STAFF", `New Event Staff whitelisted and registered: ${name} (${email}).`, "SUCCESS");
    saveDb();

    res.json({
      id: newStaff.id,
      email: newStaff.email,
      name: newStaff.name,
      role: newStaff.role,
      isOrganizer: true
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Whitelist management
app.get("/api/admin/whitelist", (req, res) => {
  res.json(db.whitelistedEmails || []);
});

// Admin Staff Whitelist management
app.get("/api/admin/staff-whitelist", (req, res) => {
  res.json(db.whitelistedStaffEmails || []);
});

app.post("/api/admin/whitelist/add", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (db.whitelistedEmails.includes(cleanEmail)) {
      return res.status(400).json({ error: "Email is already whitelisted." });
    }
    db.whitelistedEmails.push(cleanEmail);
    addAuditLog("Superadmin", "System Security", "WHITELIST_ADD", `Added email to Event Manager whitelist: ${cleanEmail}`, "SUCCESS");
    saveDb();
    res.json(db.whitelistedEmails);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/admin/staff-whitelist/add", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (db.whitelistedStaffEmails.includes(cleanEmail)) {
      return res.status(400).json({ error: "Email is already whitelisted." });
    }
    db.whitelistedStaffEmails.push(cleanEmail);
    addAuditLog("Superadmin", "System Security", "STAFF_WHITELIST_ADD", `Added email to Event Staff whitelist: ${cleanEmail}`, "SUCCESS");
    saveDb();
    res.json(db.whitelistedStaffEmails);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/admin/whitelist/remove", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    db.whitelistedEmails = db.whitelistedEmails.filter(e => e !== cleanEmail);
    
    // Also revoke existing active managers with this email if any!
    const manager = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (manager) {
      manager.revoked = true;
    }
    
    addAuditLog("Superadmin", "System Security", "WHITELIST_REMOVE", `Removed email from Event Manager whitelist: ${cleanEmail}`, "WARNING");
    saveDb();
    res.json(db.whitelistedEmails);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/admin/staff-whitelist/remove", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    db.whitelistedStaffEmails = db.whitelistedStaffEmails.filter(e => e !== cleanEmail);
    
    // Also revoke existing active staff with this email if any!
    const staff = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (staff) {
      staff.revoked = true;
    }
    
    addAuditLog("Superadmin", "System Security", "STAFF_WHITELIST_REMOVE", `Removed email from Event Staff whitelist: ${cleanEmail}`, "WARNING");
    saveDb();
    res.json(db.whitelistedStaffEmails);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin User Management list
app.get("/api/admin/users", (req, res) => {
  try {
    // Return both administrative users and participants in a clean unified way
    const admins = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      revoked: !!u.revoked,
      createdAt: u.createdAt,
      type: "USER"
    }));

    const parts = db.participants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: "PARTICIPANT",
      revoked: !!p.revoked,
      createdAt: p.checkedInAt || new Date().toISOString(),
      type: "PARTICIPANT"
    }));

    res.json([...admins, ...parts]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin User Revocation toggle
app.post("/api/admin/users/revoke", (req, res) => {
  try {
    const { targetId, targetType, revoke } = req.body;
    if (!targetId || !targetType) {
      return res.status(400).json({ error: "targetId and targetType are required" });
    }

    if (targetType === "USER") {
      const user = db.users.find(u => u.id === targetId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role === "SUPER_ADMIN") {
        return res.status(400).json({ error: "Cannot revoke the Superadmin account!" });
      }
      user.revoked = !!revoke;
      addAuditLog("Superadmin", "System Security", revoke ? "USER_REVOKE" : "USER_UNREVOKE", `${revoke ? 'Revoked' : 'Restored'} access for administrator: ${user.name} (${user.email})`, "WARNING");
    } else if (targetType === "PARTICIPANT") {
      const participant = db.participants.find(p => p.id === targetId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      participant.revoked = !!revoke;
      addAuditLog("Superadmin", "System Security", revoke ? "PARTICIPANT_REVOKE" : "PARTICIPANT_UNREVOKE", `${revoke ? 'Revoked' : 'Restored'} access for participant: ${participant.name} (${participant.email})`, "WARNING");
    } else {
      return res.status(400).json({ error: "Invalid targetType" });
    }

    saveDb();
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login a participant
app.post("/api/participants/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const participant = db.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!participant) {
      return res.status(404).json({ error: "No registered participant found with this email." });
    }
    
    // Check if participant's access has been revoked
    if (participant.revoked) {
      return res.status(403).json({ error: "Your access has been revoked by the Superadmin." });
    }

    // backwards compatibility for pre-seeded users
    if (participant.password && participant.password !== password) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    // auto-set password if they log in and don't have one set yet
    if (!participant.password && password) {
      participant.password = password;
    }

    res.json(participant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Participant Profile
app.post("/api/participants/update-profile", (req, res) => {
  try {
    const { id, name, phone, company, position, avatarUrl, companyLogoUrl, dietaryPreference, tShirtSize, specialNeeds, rsvpStatus } = req.body;
    const participant = db.participants.find(p => p.id === id);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found." });
    }

    if (name) participant.name = name;
    if (phone !== undefined) participant.phone = phone;
    if (company !== undefined) participant.company = company;
    if (position !== undefined) participant.position = position;
    if (avatarUrl !== undefined) participant.avatarUrl = avatarUrl;
    if (companyLogoUrl !== undefined) participant.companyLogoUrl = companyLogoUrl;
    if (dietaryPreference !== undefined) participant.dietaryPreference = dietaryPreference;
    if (tShirtSize !== undefined) participant.tShirtSize = tShirtSize;
    if (specialNeeds !== undefined) participant.specialNeeds = specialNeeds;
    if (rsvpStatus !== undefined) {
      participant.rsvpStatus = rsvpStatus;
      participant.invitationStatus = rsvpStatus === "NO" ? "DECLINED" : "REGISTERED";
    }

    addAuditLog("Participant", "Event Participant", "PROFILE_UPDATE", `Updated profile details for ${participant.name} (${participant.email}).`, "INFO");
    saveDb();
    res.json(participant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update RSVP Status (Participant replies RSVP)
app.post("/api/participants/rsvp", (req, res) => {
  try {
    const { email, rsvpStatus, name, phone, company, position, password, dietaryPreference, tShirtSize, specialNeeds, avatarUrl, companyLogoUrl } = req.body;
    const participant = db.participants.find(p => p.email.toLowerCase() === email.toLowerCase());

    if (!participant) {
      // Create a new participant with RSVP YES/NO directly!
      const nextIdNum = Math.max(...db.participants.map(p => parseInt(p.id.replace("EH-", "")))) + 1;
      const newPart: Participant = {
        id: `EH-${nextIdNum}`,
        name: name || "Anonymous",
        email,
        phone: phone || "",
        company: company || "Independent",
        position: position || "Professional",
        tableNumber: "Table General",
        seatNumber: `Seat ${Math.floor(Math.random() * 50) + 1}`,
        rsvpStatus: rsvpStatus || "YES",
        checkedIn: false,
        checkedInAt: null,
        points: 0,
        qrCode: `EH-${nextIdNum}-${email}`,
        invitationStatus: rsvpStatus === "NO" ? "DECLINED" : "REGISTERED",
        invitationChannel: "EMAIL",
        password: password || "",
        dietaryPreference: dietaryPreference || "None",
        tShirtSize: tShirtSize || "M",
        specialNeeds: specialNeeds || "",
        companyLogoUrl: companyLogoUrl || "",
        avatarUrl: avatarUrl || "",
        approved: false
      };
      db.participants.push(newPart);
      addAuditLog("Participant", "Event Participant", "RSVP_SUBMIT", `New RSVP submitted directly by ${email} with status ${rsvpStatus}.`, "INFO");
      saveDb();
      return res.json(newPart);
    }

    participant.rsvpStatus = rsvpStatus;
    participant.invitationStatus = rsvpStatus === "NO" ? "DECLINED" : "REGISTERED";
    if (name) participant.name = name;
    if (phone) participant.phone = phone;
    if (company) participant.company = company;
    if (position) participant.position = position;
    if (password) participant.password = password;
    if (dietaryPreference) participant.dietaryPreference = dietaryPreference;
    if (tShirtSize) participant.tShirtSize = tShirtSize;
    if (specialNeeds) participant.specialNeeds = specialNeeds;
    if (avatarUrl) participant.avatarUrl = avatarUrl;
    if (companyLogoUrl) participant.companyLogoUrl = companyLogoUrl;

    addAuditLog("Participant", "Event Participant", "RSVP_SUBMIT", `Guest RSVP updated for ${participant.name} (${participant.email}) to: ${rsvpStatus}.`, "INFO");
    saveDb();
    res.json(participant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Sponsor Booth endpoints
app.get("/api/sponsor-booth/visits", (req, res) => {
  if (!db.boothVisits) {
    db.boothVisits = [];
  }
  res.json(db.boothVisits);
});

app.get("/api/sponsor-booth/stats", (req, res) => {
  if (!db.boothVisits) {
    db.boothVisits = [];
  }
  const visits = db.boothVisits;
  const activeEvent = db.eventsList.find(e => !e.isArchived) || db.eventsList[0];
  const booths = activeEvent ? activeEvent.sponsorBooths : [];
  const participants = db.participants;

  // 1. Traffic by booth (booth traffic)
  const boothTraffic = booths.map(b => {
    const boothVisitsList = visits.filter(v => v.boothId === b.id);
    const uniqueVisitors = new Set(boothVisitsList.map(v => v.participantId)).size;
    return {
      id: b.id,
      name: b.name,
      boothCode: b.boothCode,
      location: b.locationDescription,
      totalVisits: boothVisitsList.length,
      uniqueVisitors,
      pointsDistributed: boothVisitsList.reduce((sum, v) => sum + v.pointsAwarded, 0)
    };
  });

  // 2. Popular booths (sorted by visits)
  const popularBooths = [...boothTraffic].sort((a, b) => b.totalVisits - a.totalVisits);

  // 3. Lead Generation (scans grouped by booth with details)
  const leadGen = booths.map(b => {
    const boothVisitsList = visits.filter(v => v.boothId === b.id);
    return {
      boothId: b.id,
      boothName: b.name,
      boothCode: b.boothCode,
      leadsCount: boothVisitsList.length,
      leads: boothVisitsList.map(v => ({
        id: v.participantId,
        name: v.participantName,
        email: v.participantEmail,
        company: v.participantCompany,
        position: v.participantPosition,
        visitedAt: v.visitedAt
      }))
    };
  });

  // 4. Sponsor engagement
  const totalVisits = visits.length;
  const uniqueScannersCount = new Set(visits.map(v => v.participantId)).size;
  const checkedInCount = participants.filter(p => p.checkedIn).length;
  const engagementRate = checkedInCount > 0 ? parseFloat(((uniqueScannersCount / checkedInCount) * 100).toFixed(1)) : 0;
  const avgBoothsVisited = uniqueScannersCount > 0 ? parseFloat((totalVisits / uniqueScannersCount).toFixed(1)) : 0;

  res.json({
    boothTraffic,
    popularBooths,
    leadGen,
    engagementRate,
    avgBoothsVisited,
    totalVisits,
    uniqueScannersCount,
    checkedInCount
  });
});

app.post("/api/sponsor-booth/scan", (req, res) => {
  try {
    const { participantId, boothCode } = req.body;
    if (!participantId || !boothCode) {
      return res.status(400).json({ error: "Missing participantId or boothCode." });
    }

    const participant = db.participants.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found." });
    }

    if (!participant.checkedIn) {
      return res.status(400).json({ error: "Participant must be checked-in to scan sponsor booths." });
    }

    const activeEvent = db.eventsList.find(e => !e.isArchived) || db.eventsList[0];
    if (!activeEvent) {
      return res.status(400).json({ error: "No active event configured." });
    }

    const booth = activeEvent.sponsorBooths.find(b => b.boothCode.toUpperCase() === boothCode.trim().toUpperCase());
    if (!booth) {
      return res.status(404).json({ error: "Sponsor booth with this code not found." });
    }

    if (!db.boothVisits) {
      db.boothVisits = [];
    }
    const alreadyVisited = db.boothVisits.some(v => v.participantId === participantId && v.boothId === booth.id);
    if (alreadyVisited) {
      return res.status(400).json({ error: `You have already scanned ${booth.name}'s booth!` });
    }

    const pointsReward = booth.pointsReward || 10;
    participant.points += pointsReward;

    const visit: BoothVisit = {
      id: `visit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantEmail: participant.email,
      participantCompany: participant.company,
      participantPosition: participant.position || "Attendee",
      boothId: booth.id,
      boothName: booth.name,
      boothCode: booth.boothCode,
      pointsAwarded: pointsReward,
      visitedAt: new Date().toISOString()
    };

    db.boothVisits.push(visit);

    // Also record it as an activity submission for consistency
    const activitySub: ActivitySubmission = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      activityType: "CUSTOM",
      description: `Visited sponsor booth: ${booth.name} (${booth.boothCode})`,
      content: `Booth visit: ${booth.name}. Awarded ${pointsReward} pts.`,
      pointsAwarded: pointsReward,
      status: "APPROVED",
      submittedAt: visit.visitedAt
    };
    db.activitySubmissions.push(activitySub);

    addAuditLog(
      participant.name,
      "Participant",
      "SPONSOR_BOOTH_SCAN",
      `Participant ${participant.name} scanned booth ${booth.name} (${booth.boothCode}) and got ${pointsReward} pts.`,
      "SUCCESS"
    );

    saveDb();
    res.json({ success: true, participant, visit });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Networking Challenge routes
app.get("/api/networking/connections", (req, res) => {
  res.json(db.networkingConnections || []);
});

app.post("/api/networking/connect", (req, res) => {
  try {
    const { fromParticipantId, targetCode } = req.body;
    if (!fromParticipantId || !targetCode) {
      return res.status(400).json({ error: "Missing participantId or target QR code." });
    }

    const fromParticipant = db.participants.find(p => p.id === fromParticipantId);
    if (!fromParticipant) {
      return res.status(404).json({ error: "Your participant record was not found." });
    }

    if (!fromParticipant.checkedIn) {
      return res.status(400).json({ error: "You must be checked-in to participate in the Networking Challenge." });
    }

    const cleanTargetCode = targetCode.trim();
    const toParticipant = db.participants.find(p => p.qrCode === cleanTargetCode || p.id === cleanTargetCode);
    if (!toParticipant) {
      return res.status(404).json({ error: "No attendee found with that code/QR." });
    }

    if (fromParticipant.id === toParticipant.id) {
      return res.status(400).json({ error: "You cannot network with yourself! Try scanning another attendee's QR." });
    }

    if (!toParticipant.checkedIn) {
      return res.status(400).json({ error: `Attendee ${toParticipant.name} has not checked in yet.` });
    }

    if (!db.networkingConnections) {
      db.networkingConnections = [];
    }

    const alreadyConnected = db.networkingConnections.some(c => 
      (c.fromParticipantId === fromParticipant.id && c.toParticipantId === toParticipant.id) ||
      (c.fromParticipantId === toParticipant.id && c.toParticipantId === fromParticipant.id)
    );

    if (alreadyConnected) {
      return res.status(400).json({ error: `You have already connected with ${toParticipant.name}!` });
    }

    const activeEvent = db.eventsList.find(e => !e.isArchived) || db.eventsList[0];
    let pointsReward = db.eventConfig.pointRules.NETWORKING || 15;
    if (activeEvent && activeEvent.activities) {
      const netAct = activeEvent.activities.find(a => a.type === "NETWORKING");
      if (netAct) {
        if (!netAct.isEnabled) {
          return res.status(400).json({ error: "The Networking Challenge is currently disabled by the event organizer." });
        }
        if (typeof netAct.points === 'number') {
          pointsReward = netAct.points;
        }
      }
    }
    
    // Award points to BOTH participants
    fromParticipant.points += pointsReward;
    toParticipant.points += pointsReward;

    const connection: NetworkingConnection = {
      id: `net-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fromParticipantId: fromParticipant.id,
      fromParticipantName: fromParticipant.name,
      fromParticipantCompany: fromParticipant.company,
      fromParticipantPosition: fromParticipant.position || "Attendee",
      toParticipantId: toParticipant.id,
      toParticipantName: toParticipant.name,
      toParticipantCompany: toParticipant.company,
      toParticipantPosition: toParticipant.position || "Attendee",
      pointsAwarded: pointsReward,
      connectedAt: new Date().toISOString()
    };

    db.networkingConnections.push(connection);

    // Record activity submissions for both
    const activitySub1: ActivitySubmission = {
      id: `act-${Date.now()}-net1`,
      participantId: fromParticipant.id,
      participantName: fromParticipant.name,
      activityType: "NETWORKING",
      description: `Met with ${toParticipant.name} (${toParticipant.company})`,
      content: `Connected with attendee: ${toParticipant.name}. Awarded ${pointsReward} pts.`,
      pointsAwarded: pointsReward,
      status: "APPROVED",
      submittedAt: connection.connectedAt
    };

    const activitySub2: ActivitySubmission = {
      id: `act-${Date.now()}-net2`,
      participantId: toParticipant.id,
      participantName: toParticipant.name,
      activityType: "NETWORKING",
      description: `Met with ${fromParticipant.name} (${fromParticipant.company})`,
      content: `Connected with attendee: ${fromParticipant.name}. Awarded ${pointsReward} pts.`,
      pointsAwarded: pointsReward,
      status: "APPROVED",
      submittedAt: connection.connectedAt
    };

    db.activitySubmissions.push(activitySub1);
    db.activitySubmissions.push(activitySub2);

    addAuditLog(
      fromParticipant.name,
      "Participant",
      "NETWORKING_CONNECT",
      `Attendee ${fromParticipant.name} connected with ${toParticipant.name} (${toParticipant.company}) and both received +${pointsReward} pts.`,
      "SUCCESS"
    );

    saveDb();
    res.json({ success: true, connection, pointsAwarded: pointsReward, targetParticipantName: toParticipant.name });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/networking/reset", (req, res) => {
  db.networkingConnections = [];
  db.activitySubmissions = db.activitySubmissions.filter(sub => sub.activityType !== "NETWORKING");
  addAuditLog("Manager", "Event Manager", "RESET_NETWORKING_CONNECTIONS", "Reset all participant networking connections.", "WARNING");
  saveDb();
  res.json({ success: true });
});

app.post("/api/sponsor-booth/reset", (req, res) => {
  db.boothVisits = [];
  db.activitySubmissions = db.activitySubmissions.filter(sub => !sub.description.startsWith("Visited sponsor booth:"));
  addAuditLog("Manager", "Event Manager", "RESET_SPONSOR_BOOTH_VISITS", "Reset all sponsor booth visits.", "WARNING");
  saveDb();
  res.json({ success: true, message: "Sponsor booth visits have been reset." });
});

// Check-in participant
app.post("/api/checkin", (req, res) => {
  try {
    const { participantId, staffActor } = req.body;
    const participant = db.participants.find(p => p.id === participantId);

    if (!participant) {
      return res.status(404).json({ error: "Participant not found." });
    }

    if (participant.checkedIn) {
      return res.status(400).json({ error: "Participant is already checked in." });
    }

    participant.checkedIn = true;
    participant.checkedInAt = new Date().toISOString();
    
    // Award check-in points
    const checkinPoints = db.eventConfig.pointRules.CHECK_IN;
    participant.points += checkinPoints;

    // Record check-in activity submission
    const newSub: ActivitySubmission = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      activityType: "CHECK_IN",
      description: "Auto-awarded points for QR / Manual check-in",
      content: `Checked-in timestamp: ${participant.checkedInAt}`,
      pointsAwarded: checkinPoints,
      status: "APPROVED",
      submittedAt: participant.checkedInAt
    };
    db.activitySubmissions.push(newSub);

    addAuditLog(
      staffActor || "Staff-101", 
      "Event Staff", 
      "PARTICIPANT_CHECKIN", 
      `Checked-in participant ${participant.name} (${participant.id}) successfully and awarded ${checkinPoints} pts.`, 
      "SUCCESS"
    );
    saveDb();
    res.json(participant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Activity Submissions
app.get("/api/activities", (req, res) => {
  res.json(db.activitySubmissions);
});

app.post("/api/activities", (req, res) => {
  try {
    const { participantId, activityType, description, content } = req.body;
    const participant = db.participants.find(p => p.id === participantId);

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Determine points and auto-approve status based on dynamic activities list
    const matchedActivity = db.eventConfig.activities?.find(a => a.type === activityType);
    const points = matchedActivity?.points ?? db.eventConfig.pointRules[activityType as ActivityType] ?? 5;
    
    let isAutoApprove = false;
    if (matchedActivity) {
      isAutoApprove = matchedActivity.validationMethod === 'AUTOMATIC' || (!matchedActivity.validationMethod && !matchedActivity.requireApproval);
    } else {
      isAutoApprove = activityType === "FEEDBACK" || activityType === "CHECK_IN";
    }

    // Build the submission
    const newSubmission: ActivitySubmission = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId,
      participantName: participant.name,
      activityType: activityType as ActivityType,
      description,
      content,
      pointsAwarded: points,
      status: isAutoApprove ? "APPROVED" : "PENDING",
      submittedAt: new Date().toISOString()
    };

    // If auto-approved, add points directly
    if (newSubmission.status === "APPROVED") {
      participant.points += points;
      addAuditLog("System", "Event Engine", "ACTIVITY_APPROVED", `Activity approved: ${participant.name} awarded ${points} pts for ${activityType}.`, "SUCCESS");
    } else {
      addAuditLog("Participant", "Event Participant", "ACTIVITY_SUBMISSION", `${participant.name} submitted ${activityType} proof for staff approval.`, "INFO");
    }

    db.activitySubmissions.push(newSubmission);
    saveDb();
    res.json(newSubmission);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/activities/approve", (req, res) => {
  try {
    const { submissionId, status, staffActor } = req.body; // 'APPROVED' or 'REJECTED'
    const sub = db.activitySubmissions.find(s => s.id === submissionId);
    
    if (!sub) {
      return res.status(404).json({ error: "Activity submission not found" });
    }

    if (sub.status !== "PENDING") {
      return res.status(400).json({ error: `Activity has already been processed with status: ${sub.status}` });
    }

    sub.status = status;
    const participant = db.participants.find(p => p.id === sub.participantId);

    if (status === "APPROVED" && participant) {
      participant.points += sub.pointsAwarded;
      addAuditLog(
        staffActor || "Staff-101", 
        "Event Staff", 
        "ACTIVITY_APPROVAL", 
        `Approved ${sub.activityType} from ${participant.name} (${participant.id}). Awarded ${sub.pointsAwarded} pts.`, 
        "SUCCESS"
      );
    } else if (status === "REJECTED" && participant) {
      addAuditLog(
        staffActor || "Staff-101", 
        "Event Staff", 
        "ACTIVITY_REJECT", 
        `Rejected ${sub.activityType} submission from ${participant.name}.`, 
        "WARNING"
      );
    }

    saveDb();
    res.json(sub);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Staff awards manual custom point award
app.post("/api/activities/award-custom", (req, res) => {
  try {
    const { participantId, activityType, description, staffActor } = req.body; // e.g. STAFF_BEST_PHOTO or STAFF_ACTIVE
    const participant = db.participants.find(p => p.id === participantId);

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    const points = db.eventConfig.pointRules[activityType as ActivityType] || 5;
    participant.points += points;

    const newSub: ActivitySubmission = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      activityType: activityType as ActivityType,
      description,
      content: `Awarded manually by Staff member: ${staffActor || 'Staff-101'}`,
      pointsAwarded: points,
      status: "APPROVED",
      submittedAt: new Date().toISOString()
    };

    db.activitySubmissions.push(newSub);
    addAuditLog(
      staffActor || "Staff-101", 
      "Event Staff", 
      "CUSTOM_POINTS_AWARDED", 
      `Manually awarded ${points} points for "${activityType}" to ${participant.name}.`, 
      "SUCCESS"
    );
    saveDb();
    res.json({ success: true, participant, submission: newSub });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Songs Requests
app.get("/api/songs", (req, res) => {
  res.json(db.songRequests);
});

app.post("/api/songs", (req, res) => {
  try {
    const { participantId, artist, title, message } = req.body;
    const participant = db.participants.find(p => p.id === participantId);

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    const newRequest: SongRequest = {
      id: `song-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId,
      participantName: participant.name,
      artist,
      title,
      message: message || "",
      status: "PENDING",
      submittedAt: new Date().toISOString()
    };

    db.songRequests.push(newRequest);
    addAuditLog("Participant", "Event Participant", "SONG_REQUEST_SUBMIT", `Song requested: "${title}" by ${artist} requested by ${participant.name}.`, "INFO");
    saveDb();
    res.json(newRequest);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/songs/status", (req, res) => {
  try {
    const { songId, status, staffActor } = req.body; // PENDING, APPROVED, REJECTED, PLAYED
    const song = db.songRequests.find(s => s.id === songId);

    if (!song) {
      return res.status(404).json({ error: "Song request not found" });
    }

    const prevStatus = song.status;
    song.status = status;

    const participant = db.participants.find(p => p.id === song.participantId);

    // If changing to APPROVED for the first time, award song points!
    if (status === "APPROVED" && prevStatus !== "APPROVED" && prevStatus !== "PLAYED" && participant) {
      const songPoints = db.eventConfig.pointRules.SONG_REQUEST;
      participant.points += songPoints;

      // Also create an approved activity log entry to track score history
      const newSub: ActivitySubmission = {
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        participantId: participant.id,
        participantName: participant.name,
        activityType: "SONG_REQUEST",
        description: `Approved song request: "${song.title}" by ${song.artist}`,
        content: song.message,
        pointsAwarded: songPoints,
        status: "APPROVED",
        submittedAt: new Date().toISOString()
      };
      db.activitySubmissions.push(newSub);

      addAuditLog(
        staffActor || "Staff-101", 
        "Event Staff", 
        "SONG_APPROVED", 
        `Approved song "${song.title}" for ${participant.name}. Awarded ${songPoints} pts.`, 
        "SUCCESS"
      );
    } else {
      addAuditLog(
        staffActor || "Staff-101", 
        "Event Staff", 
        "SONG_STATUS_CHANGE", 
        `Updated song "${song.title}" status to ${status}.`, 
        "INFO"
      );
    }

    saveDb();
    res.json(song);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Audit Logs
app.get("/api/audit-logs", (req, res) => {
  res.json(db.auditLogs);
});

// =============================================================================
// SPRINT 9: LEADERBOARD & MILESTONES API ENDPOINTS
// =============================================================================

interface ClaimRecord {
  id: string;
  participantId: string;
  milestoneName: string;
  unlockedAt: string;
  claimed: boolean;
  claimedAt?: string;
}

let milestoneClaims: ClaimRecord[] = [
  {
    id: "claim-seed-1",
    participantId: "EH-1001",
    milestoneName: "BRONZE_PASS",
    unlockedAt: new Date(Date.now() - 3600000).toISOString(),
    claimed: true,
    claimedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "claim-seed-2",
    participantId: "EH-1001",
    milestoneName: "SILVER_LOUNGE",
    unlockedAt: new Date(Date.now() - 3600000).toISOString(),
    claimed: false
  },
  {
    id: "claim-seed-3",
    participantId: "EH-1005",
    milestoneName: "BRONZE_PASS",
    unlockedAt: new Date(Date.now() - 3600000).toISOString(),
    claimed: true,
    claimedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

function getUnlockedMilestones(points: number): string[] {
  const milestones: string[] = [];
  if (points >= 5) milestones.push("BRONZE_PASS");
  if (points >= 11) milestones.push("SILVER_LOUNGE");
  if (points >= 21) milestones.push("GOLD_RAFFLE_VIP");
  return milestones;
}

// 1. Get Leaderboard Standings
app.get("/api/sprint9/leaderboard", (req, res) => {
  const { search, company, tier } = req.query;
  let list = [...db.participants];

  // Apply filters
  if (search) {
    const s = (search as string).toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.email.toLowerCase().includes(s) || 
      p.position.toLowerCase().includes(s)
    );
  }

  if (company) {
    const c = (company as string).toLowerCase();
    list = list.filter(p => p.company.toLowerCase().includes(c));
  }

  if (tier) {
    list = list.filter(p => {
      if (tier === 'GOLD') return p.points >= 21;
      if (tier === 'SILVER') return p.points >= 11 && p.points < 21;
      if (tier === 'BRONZE') return p.points >= 5 && p.points < 11;
      return p.points < 5;
    });
  }

  // Sort
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.checkedIn !== a.checkedIn) return (b.checkedIn ? 1 : 0) - (a.checkedIn ? 1 : 0);
    return a.name.localeCompare(b.name);
  });

  // Map to DTO
  const dto = list.map((p, idx) => ({
    rank: idx + 1,
    participantId: p.id,
    name: p.name,
    email: p.email,
    company: p.company,
    position: p.position,
    points: p.points,
    checkedIn: p.checkedIn,
    avatarUrl: p.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    unlockedMilestones: getUnlockedMilestones(p.points)
  }));

  res.json(dto);
});

// 2. Adjust Score
app.post("/api/sprint9/leaderboard/adjust", (req, res) => {
  try {
    const { participantId, pointsDelta, reasonCode, description } = req.body;
    const actor = req.headers['x-actor-name'] || 'Staff-Desk';

    const participant = db.participants.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found." });
    }

    participant.points = Math.max(0, participant.points + Number(pointsDelta));
    if (reasonCode === 'CHECK_IN' && pointsDelta > 0) {
      participant.checkedIn = true;
      if (!participant.checkedInAt) {
        participant.checkedInAt = new Date().toISOString();
      }
    }

    // Add activity submission record
    const newSub: ActivitySubmission = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      activityType: (reasonCode === 'CHECK_IN' || reasonCode === 'FEEDBACK' || reasonCode === 'SONG_REQUEST' || reasonCode === 'PHOTO_WALL' || reasonCode === 'SPOT_AWARD' ? reasonCode : 'CUSTOM') as any,
      description: description || `Points adjusted via Leaderboard Desk`,
      content: `Delta: ${pointsDelta}, Total: ${participant.points}`,
      pointsAwarded: Number(pointsDelta),
      status: "APPROVED",
      submittedAt: new Date().toISOString()
    };
    db.activitySubmissions.push(newSub);

    addAuditLog(
      actor as string,
      "Event Staff",
      "SCORE_ADJUSTMENT",
      `Adjusted score for ${participant.name} by ${pointsDelta} pts (New total: ${participant.points})`,
      pointsDelta >= 0 ? "SUCCESS" : "WARNING"
    );

    saveDb();
    res.json(participant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Get Logs
app.get("/api/sprint9/leaderboard/logs", (req, res) => {
  const { participantId } = req.query;
  
  let list = db.activitySubmissions.filter(s => s.status === 'APPROVED');
  if (participantId) {
    list = list.filter(s => s.participantId === participantId);
  }

  // Sort by date descending
  list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const logs = list.map(s => ({
    id: s.id,
    participantId: s.participantId,
    pointsDelta: s.pointsAwarded,
    currentTotal: 0,
    reasonCode: s.activityType,
    description: s.description,
    actorId: "Staff-Desk",
    createdAt: s.submittedAt
  }));

  res.json(logs);
});

// 4. Get Milestones
app.get("/api/sprint9/leaderboard/milestones", (req, res) => {
  const { participantId } = req.query;
  if (!participantId) {
    return res.json([]);
  }

  const participant = db.participants.find(p => p.id === participantId);
  if (!participant) {
    return res.status(404).json({ error: "Participant not found" });
  }

  const unlocked = getUnlockedMilestones(participant.points);
  
  const milestones = unlocked.map(name => {
    const claimedRecord = milestoneClaims.find(c => c.participantId === participantId && c.milestoneName === name);
    return {
      id: claimedRecord?.id || `m-${participantId}-${name}`,
      participantId,
      milestoneName: name,
      unlockedAt: new Date().toISOString(),
      claimed: !!claimedRecord?.claimed,
      claimedAt: claimedRecord?.claimedAt
    };
  });

  res.json(milestones);
});

// 5. Claim Milestone
app.post("/api/sprint9/leaderboard/milestones/claim", (req, res) => {
  try {
    const { participantId, milestoneName } = req.body;
    const actor = req.headers['x-actor-name'] || 'Staff-Desk';

    const participant = db.participants.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    const unlocked = getUnlockedMilestones(participant.points);
    if (!unlocked.includes(milestoneName)) {
      return res.status(400).json({ error: "Milestone is locked. Accumulate more points first." });
    }

    let claimRecord = milestoneClaims.find(c => c.participantId === participantId && c.milestoneName === milestoneName);
    if (claimRecord && claimRecord.claimed) {
      return res.status(400).json({ error: "Milestone reward already claimed." });
    }

    if (!claimRecord) {
      claimRecord = {
        id: `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        participantId,
        milestoneName,
        unlockedAt: new Date().toISOString(),
        claimed: true,
        claimedAt: new Date().toISOString()
      };
      milestoneClaims.push(claimRecord);
    } else {
      claimRecord.claimed = true;
      claimRecord.claimedAt = new Date().toISOString();
    }

    addAuditLog(
      actor as string,
      "Event Staff",
      "REWARD_CLAIM",
      `Swag claimed: ${milestoneName} claimed by ${participant.name}`,
      "SUCCESS"
    );

    res.json(claimRecord);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Get Stats
app.get("/api/sprint9/leaderboard/stats", (req, res) => {
  const participants = db.participants;
  const totalPoints = participants.reduce((sum, p) => sum + p.points, 0);
  const checkedInCount = participants.filter(p => p.checkedIn).length;
  const avgPoints = checkedInCount > 0 ? totalPoints / checkedInCount : 0;

  const milestoneCounts = {
    BRONZE_PASS: 0,
    SILVER_LOUNGE: 0,
    GOLD_RAFFLE_VIP: 0
  };

  participants.forEach(p => {
    const unlocked = getUnlockedMilestones(p.points);
    unlocked.forEach(m => {
      if (m in milestoneCounts) {
        milestoneCounts[m as keyof typeof milestoneCounts]++;
      }
    });
  });

  const companyScores: Record<string, number> = {};
  participants.forEach(p => {
    companyScores[p.company || "Independent"] = (companyScores[p.company || "Independent"] || 0) + p.points;
  });

  res.json({
    totalPointsAwarded: totalPoints,
    averagePointsPerAttendee: Math.round(avgPoints * 10) / 10,
    unlockedMilestonesCount: milestoneCounts,
    pointsDistributionByCompany: companyScores,
    totalScoreAdjustments: db.activitySubmissions.length
  });
});

// 7. Reset Leaderboard
app.post("/api/sprint9/leaderboard/reset", (req, res) => {
  db.participants.forEach(p => {
    p.points = p.checkedIn ? 5 : 0;
  });
  milestoneClaims = [];
  addAuditLog("Manager", "Event Manager", "RESET_LEADERBOARD", "Reset leaderboard points and swag redemptions.", "WARNING");
  saveDb();
  res.json({ success: true, message: "Leaderboard reset complete." });
});

// =============================================================================
// SPRINT 10: DOOR PRIZE ENGINE API ENDPOINTS
// =============================================================================

interface DoorPrizeClaimRecord {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  eligibleTier: string;
  claimedAt: string;
  actorId: string;
}

let doorPrizeClaims: DoorPrizeClaimRecord[] = [
  {
    id: "claim-seed-dp-1",
    participantId: "EH-1001",
    participantName: "Alex Rivera",
    participantCompany: "Meta Platforms Inc.",
    eligibleTier: "Gold Tier Selections",
    claimedAt: new Date(Date.now() - 7200000).toISOString(),
    actorId: "Staff-Desk-A"
  }
];

// 1. Get Checked-In Attendees & Eligible Door Prize Tiers
app.get("/api/sprint10/doorprize", (req, res) => {
  const { search, company, tier, claimed } = req.query;
  let list = [...db.participants];

  // Apply search (name, email, position)
  if (search) {
    const s = (search as string).toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.email.toLowerCase().includes(s) || 
      (p.position && p.position.toLowerCase().includes(s))
    );
  }

  // Apply company filter
  if (company) {
    const c = (company as string).toLowerCase();
    list = list.filter(p => p.company.toLowerCase().includes(c));
  }

  // Map to DTOs
  let mapped = list.map(p => {
    // Determine tier
    let eligibleTier = "Bronze Tier Selections";
    let tierLevel = 1;
    if (p.points >= 21) {
      eligibleTier = "Gold Tier Selections";
      tierLevel = 3;
    } else if (p.points >= 11) {
      eligibleTier = "Silver Tier Selections";
      tierLevel = 2;
    }

    const claim = doorPrizeClaims.find(c => c.participantId === p.id);

    return {
      participantId: p.id,
      name: p.name,
      email: p.email,
      company: p.company,
      position: p.position || "",
      points: p.points,
      checkedIn: p.checkedIn,
      avatarUrl: p.avatarUrl || "",
      eligibleTier,
      tierLevel,
      claimed: !!claim,
      claimId: claim?.id,
      claimedAt: claim?.claimedAt
    };
  });

  // Apply tier filter
  if (tier) {
    mapped = mapped.filter(p => {
      const mappedTier = p.tierLevel === 3 ? "GOLD" : p.tierLevel === 2 ? "SILVER" : "BRONZE";
      return mappedTier === tier;
    });
  }

  // Apply claimed filter
  if (claimed !== undefined) {
    const isClaimed = claimed === "true";
    mapped = mapped.filter(p => p.claimed === isClaimed);
  }

  res.json(mapped);
});

// 2. Claim Door Prize
app.post("/api/sprint10/doorprize/claim", (req, res) => {
  try {
    const { participantId, tier } = req.body;
    const actor = req.headers["x-actor-name"] as string || "Staff-System";

    const participant = db.participants.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: `Participant with ID "${participantId}" not found.` });
    }

    if (!participant.checkedIn) {
      return res.status(400).json({ error: "Participant must be checked-in to be eligible for door prizes." });
    }

    const alreadyClaimed = doorPrizeClaims.some(c => c.participantId === participantId);
    if (alreadyClaimed) {
      return res.status(400).json({ error: "This participant has already claimed a door prize." });
    }

    // Compute correct tier based on points
    let computedTier = "Bronze Tier Selections";
    if (participant.points >= 21) {
      computedTier = "Gold Tier Selections";
    } else if (participant.points >= 11) {
      computedTier = "Silver Tier Selections";
    }

    if (tier !== computedTier) {
      return res.status(400).json({ 
        error: `Invalid tier verification: requested "${tier}", but candidate is only eligible for "${computedTier}".` 
      });
    }

    const newClaim = {
      id: `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantCompany: participant.company,
      eligibleTier: computedTier,
      claimedAt: new Date().toISOString(),
      actorId: actor
    };

    doorPrizeClaims.unshift(newClaim);
    
    addAuditLog(
      actor,
      "Event Staff",
      "DOOR_PRIZE_CLAIM",
      `Participant ${participant.name} (Company: ${participant.company}) successfully claimed their door prize: ${computedTier}`,
      "SUCCESS"
    );

    res.status(201).json(newClaim);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Retrieve Door Prize Claim Logs
app.get("/api/sprint10/doorprize/logs", (req, res) => {
  res.json(doorPrizeClaims);
});

// 4. Get Door Prize Metrics & Stats Dashboard
app.get("/api/sprint10/doorprize/stats", (req, res) => {
  const totalClaims = doorPrizeClaims.length;

  const claimsByTier: Record<string, number> = {
    "Bronze Tier Selections": 0,
    "Silver Tier Selections": 0,
    "Gold Tier Selections": 0
  };
  doorPrizeClaims.forEach(c => {
    claimsByTier[c.eligibleTier] = (claimsByTier[c.eligibleTier] || 0) + 1;
  });

  const eligibilityDistribution: Record<string, number> = {
    "Bronze Tier Selections": 0,
    "Silver Tier Selections": 0,
    "Gold Tier Selections": 0
  };

  let totalCheckedInEligible = 0;
  db.participants.forEach(p => {
    if (p.checkedIn) {
      totalCheckedInEligible++;
      let computedTier = "Bronze Tier Selections";
      if (p.points >= 21) {
        computedTier = "Gold Tier Selections";
      } else if (p.points >= 11) {
        computedTier = "Silver Tier Selections";
      }
      eligibilityDistribution[computedTier] = (eligibilityDistribution[computedTier] || 0) + 1;
    }
  });

  const claimRatePercent = totalCheckedInEligible > 0 
    ? Math.round((totalClaims / totalCheckedInEligible) * 1000) / 10 
    : 0;

  res.json({
    totalClaims,
    claimsByTier,
    eligibilityDistribution,
    totalCheckedInEligible,
    claimRatePercent
  });
});

// 5. Reset Door Prize Claims
app.post("/api/sprint10/doorprize/reset", (req, res) => {
  doorPrizeClaims = [];
  db.participants.forEach(p => {
    if (p.id === "EH-1001" || p.id === "p-1") p.points = 25;
    else if (p.id === "EH-1002" || p.id === "p-2") p.points = 15;
    else if (p.id === "EH-1003" || p.id === "p-3") p.points = 5;
    else if (p.id === "EH-1005" || p.id === "p-4") p.points = 30;
    else if (p.id === "EH-1004" || p.id === "p-5") p.points = 0;
    else if (p.id === "EH-1006" || p.id === "p-6") p.points = 10;
    p.checkedIn = p.id !== "EH-1004" && p.id !== "p-5";
  });
  addAuditLog("Manager", "Event Manager", "RESET_DOOR_PRIZE_CLAIMS", "Purged door prize claims and reset participants score cache.", "WARNING");
  saveDb();
  res.json({ success: true, message: "Door prize claims and state have been reset successfully." });
});

// =============================================================================
// SPRINT 11: LUCKY DRAW WHEEL API ENDPOINTS
// =============================================================================

interface LuckyDrawWinnerRecord {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  prizeTier: string;
  prizeName: string;
  drawnAt: string;
  actorId: string;
}

let luckyDrawWinners: LuckyDrawWinnerRecord[] = [
  {
    id: "winner-seed-ld-1",
    participantId: "EH-1005",
    participantName: "Kofi Mensah",
    participantCompany: "Stripe Inc.",
    prizeTier: "Major Prize",
    prizeName: "Sony WH-1000XM5 ANC Headphones",
    drawnAt: new Date(Date.now() - 3600000).toISOString(),
    actorId: "Staff-Desk-B"
  }
];

// 1. Get Eligible Candidates List
app.get("/api/sprint11/luckydraw/candidates", (req, res) => {
  const { search, company } = req.query;
  let list = [...db.participants];

  if (search) {
    const s = (search as string).toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.email.toLowerCase().includes(s) || 
      (p.position && p.position.toLowerCase().includes(s))
    );
  }

  if (company) {
    const c = (company as string).toLowerCase();
    list = list.filter(p => p.company.toLowerCase().includes(c));
  }

  const mapped = list.map(p => {
    // Find if already winner
    const winner = luckyDrawWinners.find(w => w.participantId === p.id);
    return {
      participantId: p.id,
      name: p.name,
      email: p.email,
      company: p.company,
      position: p.position || "",
      points: p.points,
      checkedIn: p.checkedIn,
      avatarUrl: p.avatarUrl || "",
      isWinner: !!winner,
      prizeName: winner?.prizeName
    };
  });

  res.json(mapped);
});

// 2. Record Lucky Draw Winner
app.post("/api/sprint11/luckydraw/winner", (req, res) => {
  try {
    const { participantId, prizeTier, prizeName } = req.body;
    const actor = req.headers["x-actor-name"] as string || "Staff-System";

    const participant = db.participants.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: `Participant with ID "${participantId}" not found.` });
    }

    if (!participant.checkedIn) {
      return res.status(400).json({ error: "Participant must be checked-in to be eligible for lucky draw." });
    }

    const alreadyWon = luckyDrawWinners.some(w => w.participantId === participantId);
    if (alreadyWon) {
      return res.status(400).json({ error: "This participant has already won a lucky draw prize." });
    }

    const newWinner = {
      id: `winner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantCompany: participant.company,
      prizeTier,
      prizeName,
      drawnAt: new Date().toISOString(),
      actorId: actor
    };

    luckyDrawWinners.unshift(newWinner);

    addAuditLog(
      actor,
      "Event Staff",
      "LUCKY_DRAW_WIN",
      `Participant ${participant.name} (Company: ${participant.company}) won ${prizeTier}: ${prizeName}`,
      "SUCCESS"
    );

    res.status(201).json(newWinner);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Retrieve Winners Logs
app.get("/api/sprint11/luckydraw/winners", (req, res) => {
  res.json(luckyDrawWinners);
});

// 4. Get Lucky Draw Statistics
app.get("/api/sprint11/luckydraw/stats", (req, res) => {
  const totalWinners = luckyDrawWinners.length;

  const winnersByTier: Record<string, number> = {
    "Grand Prize": 0,
    "Major Prize": 0,
    "Special Prize": 0
  };
  luckyDrawWinners.forEach(w => {
    if (winnersByTier[w.prizeTier] !== undefined) {
      winnersByTier[w.prizeTier]++;
    } else {
      winnersByTier[w.prizeTier] = 1;
    }
  });

  const totalEligibleCandidates = db.participants.filter(
    p => p.checkedIn && !luckyDrawWinners.some(w => w.participantId === p.id)
  ).length;

  const totalCheckedIn = db.participants.filter(p => p.checkedIn).length;
  const drawRatePercent = totalCheckedIn > 0 
    ? Math.round((totalWinners / totalCheckedIn) * 1000) / 10 
    : 0;

  res.json({
    totalWinners,
    winnersByTier,
    totalEligibleCandidates,
    drawRatePercent
  });
});

// 5. Reset Lucky Draw State
app.post("/api/sprint11/luckydraw/reset", (req, res) => {
  luckyDrawWinners = [];
  db.participants.forEach(p => {
    if (p.id === "EH-1001" || p.id === "p-1") p.points = 25;
    else if (p.id === "EH-1002" || p.id === "p-2") p.points = 15;
    else if (p.id === "EH-1003" || p.id === "p-3") p.points = 5;
    else if (p.id === "EH-1005" || p.id === "p-4") p.points = 30;
    else if (p.id === "EH-1004" || p.id === "p-5") p.points = 0;
    else if (p.id === "EH-1006" || p.id === "p-6") p.points = 10;
    p.checkedIn = p.id !== "EH-1004" && p.id !== "p-5";
  });
  addAuditLog("Manager", "Event Manager", "RESET_LUCKY_DRAW", "Purged lucky draw winners list.", "WARNING");
  saveDb();
  res.json({ success: true, message: "Lucky draw winners and state have been reset successfully." });
});

// 8. Stats / Analytics Metrics

app.get("/api/stats", (req, res) => {
  const participants = db.participants;
  const submissions = db.activitySubmissions;
  const songs = db.songRequests;

  const totalRegistered = participants.length;
  const checkedInCount = participants.filter(p => p.checkedIn).length;
  const attendanceRate = totalRegistered > 0 ? parseFloat(((checkedInCount / totalRegistered) * 100).toFixed(1)) : 0;

  // Activity rate
  const activityCount = submissions.length;
  
  // Points breakdown
  const totalPoints = participants.reduce((sum, p) => sum + p.points, 0);
  const avgPoints = checkedInCount > 0 ? parseFloat((totalPoints / checkedInCount).toFixed(1)) : 0;

  // Door prize category counts
  const doorPrizeDistribution = db.doorPrizeCategories.map(cat => {
    const count = participants.filter(p => p.checkedIn && p.points >= cat.minPoints && p.points <= cat.maxPoints).length;
    return {
      category: cat.name,
      range: `${cat.minPoints}-${cat.maxPoints === 999 ? '99+' : cat.maxPoints} pts`,
      count
    };
  });

  // Top 5 participants
  const topParticipants = [...participants]
    .filter(p => p.checkedIn)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      name: p.name,
      company: p.company,
      points: p.points,
      rsvpStatus: p.rsvpStatus
    }));

  // Activity submissions count by type
  const activitiesByType = submissions.reduce((acc, sub) => {
    acc[sub.activityType] = (acc[sub.activityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Songs requests statuses
  const songStatusBreakdown = songs.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, { PENDING: 0, APPROVED: 0, REJECTED: 0, PLAYED: 0 } as Record<string, number>);

  res.json({
    totalRegistered,
    checkedInCount,
    attendanceRate,
    activityCount,
    totalPoints,
    avgPoints,
    doorPrizeDistribution,
    topParticipants,
    activitiesByType,
    songStatusBreakdown,
    totalWinners: db.winners.length
  });
});

async function startServer() {
  // Integrate Vite for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve index.html and static dist files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EventHub Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer();
