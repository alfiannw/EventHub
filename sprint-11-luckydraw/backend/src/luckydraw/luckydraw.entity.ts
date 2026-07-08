export interface LuckyDrawWinnerEntity {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  prizeTier: string;
  prizeName: string;
  drawnAt: Date;
  actorId: string;
}

export interface LuckyDrawCandidateDto {
  participantId: string;
  name: string;
  email: string;
  company: string;
  position: string;
  points: number;
  checkedIn: boolean;
  avatarUrl?: string;
  isWinner: boolean;
  prizeName?: string;
}

export interface RecordWinnerDto {
  participantId: string;
  prizeTier: string;
  prizeName: string;
}

export interface LuckyDrawStatsDto {
  totalWinners: number;
  winnersByTier: Record<string, number>;
  totalEligibleCandidates: number;
  drawRatePercent: number;
}
