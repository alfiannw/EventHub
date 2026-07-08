export type RsvpStatus = 'YES' | 'NO' | 'PENDING';

export interface ParticipantEntity {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  avatarUrl?: string;
  rsvpStatus: RsvpStatus;
  qrCode?: string;
  checkedIn: boolean;
  points: number;
  tableNumber: string;
  seatNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  avatarUrl?: string;
  rsvpStatus: RsvpStatus;
}

export interface UpdateRegistrationDto {
  name?: string;
  phone?: string;
  company?: string;
  position?: string;
  avatarUrl?: string;
  rsvpStatus?: RsvpStatus;
}
