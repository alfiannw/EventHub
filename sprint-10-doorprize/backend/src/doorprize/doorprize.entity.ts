export interface DoorPrizeClaimEntity {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  eligibleTier: string;
  claimedAt: Date;
  actorId: string;
}

export interface DoorPrizeParticipantDto {
  participantId: string;
  name: string;
  email: string;
  company: string;
  position: string;
  points: number;
  checkedIn: boolean;
  avatarUrl?: string;
  eligibleTier: string;
  tierLevel: number;
  claimed: boolean;
  claimId?: string;
  claimedAt?: Date;
}

export interface ClaimDoorPrizeDto {
  participantId: string;
  tier: string;
}

export interface DoorPrizeStatsDto {
  totalClaims: number;
  claimsByTier: Record<string, number>;
  eligibilityDistribution: Record<string, number>;
  totalCheckedInEligible: number;
  claimRatePercent: number;
}
