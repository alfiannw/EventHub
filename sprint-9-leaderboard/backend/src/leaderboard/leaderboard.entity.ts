export type ReasonCodeType = 'CHECK_IN' | 'FEEDBACK' | 'SONG_REQUEST' | 'PHOTO_WALL' | 'SPOT_AWARD' | 'MANUAL_CORRECTION';
export type MilestoneType = 'BRONZE_PASS' | 'SILVER_LOUNGE' | 'GOLD_RAFFLE_VIP';

export interface ScoreLogEntity {
  id: string;
  participantId: string;
  pointsDelta: number;
  currentTotal: number;
  reasonCode: ReasonCodeType;
  description: string;
  actorId: string;
  createdAt: Date;
}

export interface MilestoneEntity {
  id: string;
  participantId: string;
  milestoneName: MilestoneType;
  unlockedAt: Date;
  claimed: boolean;
  claimedAt?: Date;
}

export interface LeaderboardEntryDto {
  rank: number;
  participantId: string;
  name: string;
  email: string;
  company: string;
  position: string;
  points: number;
  checkedIn: boolean;
  avatarUrl?: string;
  unlockedMilestones: MilestoneType[];
}

export interface AdjustScoreDto {
  participantId: string;
  pointsDelta: number;
  reasonCode: ReasonCodeType;
  description?: string;
}

export interface ClaimMilestoneDto {
  participantId: string;
  milestoneName: MilestoneType;
}

export interface LeaderboardStatsDto {
  totalPointsAwarded: number;
  averagePointsPerAttendee: number;
  unlockedMilestonesCount: Record<MilestoneType, number>;
  pointsDistributionByCompany: Record<string, number>;
  totalScoreAdjustments: number;
}
