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

export interface ParticipantOverviewEntity {
  id: string;
  name: string;
  email: string;
  currentPoints: number;
}
