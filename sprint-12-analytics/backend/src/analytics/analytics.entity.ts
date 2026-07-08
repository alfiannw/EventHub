export interface AnalyticsOverviewDto {
  totalRegistered: number;
  checkedInCount: number;
  attendanceRate: number;
  activityCount: number;
  totalPoints: number;
  avgPoints: number;
  songCount: number;
  totalWinners: number;
}

export interface AnalyticsTimelineDto {
  timeLabel: string;
  checkIns: number;
  submissions: number;
}

export interface DoorPrizeTierDto {
  category: string;
  range: string;
  count: number;
}

export interface CompanyAverageDto {
  company: string;
  avgPoints: number;
  memberCount: number;
}

export interface AnalyticsDistributionDto {
  doorPrizeTiers: DoorPrizeTierDto[];
  companyAverages: CompanyAverageDto[];
}

export interface LeaderboardRowDto {
  id: string;
  name: string;
  company: string;
  points: number;
  position: string;
  checkedIn: boolean;
}

export interface AuditLogRowDto {
  id: number;
  actorId: string;
  role: string;
  action: string;
  severity: string;
  details: string;
  timestamp: string;
}
