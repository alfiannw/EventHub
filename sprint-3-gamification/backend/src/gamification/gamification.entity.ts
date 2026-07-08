export interface CompanyEntity {
  id: string;
  name: string;
  industry?: string;
  createdAt: Date;
}

export interface ParticipantEntity {
  id: string;
  companyId?: string;
  tableId?: string;
  seatNumber?: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
  qrCodeHash: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  currentPoints: number;
  createdAt: Date;
}

export interface ActivityRuleEntity {
  id: number;
  activityType: string;
  pointsReward: number;
  description: string;
  createdAt: Date;
}

export type ActivitySubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ActivitySubmissionEntity {
  id: string;
  participantId: string;
  activityRuleId: number;
  submissionText?: string;
  submissionMediaUrl?: string;
  status: ActivitySubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface PointTransactionEntity {
  id: string; // matches bigint/string serialization
  participantId: string;
  submissionId?: string;
  pointsChanged: number;
  runningBalance: number;
  reason: string;
  createdAt: Date;
}

export interface PrizeCategoryEntity {
  id: string;
  name: string;
  eligiblePointsMin: number;
  tierLevel: number;
  createdAt: Date;
}

export interface PrizeEntity {
  id: string;
  categoryId: string;
  name: string;
  totalQuantity: number;
  remainingQuantity: number;
  createdAt: Date;
}

export interface LuckyDrawWinnerEntity {
  id: string;
  participantId: string;
  prizeId: string;
  drawnAt: Date;
}

export type SongRequestStatus = 'PENDING' | 'APPROVED' | 'PLAYED' | 'REJECTED';

export interface SongRequestEntity {
  id: string;
  participantId: string;
  artist: string;
  title: string;
  message?: string;
  status: SongRequestStatus;
  createdAt: Date;
}

export interface NotificationEntity {
  id: string;
  participantId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuditLogEntity {
  id: string;
  actorId: string;
  role: string;
  action: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  details: string;
  metadata?: any;
  ipAddress?: string;
  timestamp: Date;
}
