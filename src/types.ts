export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  tableNumber: string;
  seatNumber: string;
  avatarUrl?: string;
  rsvpStatus: 'PENDING' | 'YES' | 'NO';
  checkedIn: boolean;
  checkedInAt: string | null;
  points: number;
  qrCode: string;
  invitationStatus?: 'NOT_SENT' | 'DELIVERED' | 'OPENED' | 'REGISTERED' | 'DECLINED';
  invitationChannel?: 'EMAIL' | 'WHATSAPP';
  password?: string;
  dietaryPreference?: string;
  tShirtSize?: string;
  specialNeeds?: string;
  companyLogoUrl?: string;
  revoked?: boolean;
  approved?: boolean;
}

export type ActivityType =
  | 'CHECK_IN'
  | 'FEEDBACK'
  | 'PHOTO_UPLOAD'
  | 'INSTAGRAM_POST'
  | 'SONG_REQUEST'
  | 'STAFF_BEST_PHOTO'
  | 'STAFF_ACTIVE'
  | 'NETWORKING'
  | 'CUSTOM';

export type ValidationMethod = 'AUTOMATIC' | 'STAFF_APPROVAL' | 'QR_SCAN' | 'GPS' | 'MANUAL_APPROVAL';

export interface ActivitySubmission {
  id: string;
  participantId: string;
  participantName: string;
  activityType: ActivityType;
  description: string;
  content: string; // URL, text content, etc.
  pointsAwarded: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export interface SongRequest {
  id: string;
  participantId: string;
  participantName: string;
  artist: string;
  title: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PLAYED';
  submittedAt: string;
}

export interface DoorPrizeCategory {
  id: string;
  name: string; // e.g. Category A, Category B, Category C
  minPoints: number;
  maxPoints: number;
  description: string;
}

export interface LuckyDrawCategory {
  id: string;
  name: string; // e.g. Grand Prize, Gold Prize, Silver Prize
  eligiblePointsMin: number;
  prizeName: string;
  quantity: number;
}

export interface LuckyDrawWinner {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  prizeCategoryName: string;
  prizeName: string;
  drawnAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
}

export interface EventConfig {
  name: string;
  venue: string;
  date: string;
  time: string;
  schedule: Array<{ time: string; activity: string; description?: string }>;
  pointRules: Record<string, number>;
  googleMapsUrl?: string;
  showLeaderboardRank?: boolean;
  activities?: Array<{
    id: string;
    type: ActivityType | string;
    name: string;
    description?: string;
    isEnabled: boolean;
    requireApproval: boolean;
    validationMethod: ValidationMethod;
    startTime?: string;
    endTime?: string;
    points?: number;
    requiresCamera?: boolean;
    requiresGallery?: boolean;
  }>;
  sponsorBooths?: Array<{
    id: string;
    name: string;
    boothCode: string;
    pointsReward: number;
    locationDescription: string;
  }>;
}

export interface EventPlannerItem {
  id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  isArchived: boolean;
  createdAt: string;
  description: string;
  showLeaderboardRank?: boolean;
  venueDetails: {
    ballroom: string;
    capacity: number;
    address: string;
    parkingInstructions: string;
    googleMapsUrl?: string;
  };
  schedule: Array<{ id: string; time: string; activity: string; description?: string }>;
  seatingLayout: {
    tablesCount: number;
    seatsPerTable: number;
    vipTablesCount: number;
    assignmentMode: 'AUTO' | 'MANUAL' | 'FIRST_COME';
  };
  pointRules: Record<ActivityType, number>;
  activities: Array<{
    id: string;
    type: ActivityType | string;
    name: string;
    description?: string;
    isEnabled: boolean;
    requireApproval: boolean;
    validationMethod: ValidationMethod;
    startTime?: string;
    endTime?: string;
    points?: number;
    requiresCamera?: boolean;
    requiresGallery?: boolean;
  }>;
  sponsorBooths: Array<{
    id: string;
    name: string;
    boothCode: string;
    pointsReward: number;
    locationDescription: string;
  }>;
  luckyDrawCategories: Array<{
    id: string;
    name: string;
    eligiblePointsMin: number;
    prizeName: string;
    quantity: number;
  }>;
  prizes: Array<{
    id: string;
    name: string;
    description: string;
    stock: number;
    pointsRequiredToRedeem: number;
    imageUrl?: string;
  }>;
  registrationForm: {
    requireCompany: boolean;
    requirePosition: boolean;
    requirePhone: boolean;
    requireFoodAllergies: boolean;
    customDisclaimer: string;
    isEnabled: boolean;
  };
  emailTemplates: {
    h7Subject: string;
    h7Body: string;
    h3Subject: string;
    h3Body: string;
    h1Subject: string;
    h1Body: string;
    dayOfSubject: string;
    dayOfBody: string;
  };
  whatsappTemplates: {
    h7Message: string;
    h3Message: string;
    h1Message: string;
    dayOfMessage: string;
  };
}

export interface BoothVisit {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  participantCompany: string;
  participantPosition: string;
  boothId: string;
  boothName: string;
  boothCode: string;
  pointsAwarded: number;
  visitedAt: string;
}

export interface NetworkingConnection {
  id: string;
  fromParticipantId: string;
  fromParticipantName: string;
  fromParticipantCompany: string;
  fromParticipantPosition: string;
  toParticipantId: string;
  toParticipantName: string;
  toParticipantCompany: string;
  toParticipantPosition: string;
  pointsAwarded: number;
  connectedAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'EVENT_MANAGER' | 'EVENT_STAFF';
  password?: string;
  revoked?: boolean;
  createdAt: string;
}


