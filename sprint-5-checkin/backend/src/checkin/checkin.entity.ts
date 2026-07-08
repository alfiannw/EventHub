export type CheckInStatus = 'SUCCESS' | 'FAILED' | 'FLAGGED';

export interface CheckInLogEntity {
  id: string;
  participantId: string;
  ticketId?: string;
  gateName: string;
  scannedBy: string;
  status: CheckInStatus;
  failureReason?: string;
  checkedInAt: Date;
}

export interface CheckInDto {
  qrCodeString: string;
  gateName?: string;
  scannedBy?: string;
}

export interface CheckInStats {
  totalCheckedIn: number;
  totalRegistered: number;
  checkInRate: number;
  byGate: Record<string, number>;
  hourlyDistribution: Record<string, number>;
}
