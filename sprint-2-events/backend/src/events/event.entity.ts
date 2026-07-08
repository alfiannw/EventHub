export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface EventEntity {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  venueName: string;
  venueAddress: string;
  capacity: number;
  status: EventStatus;
  
  // Theme & Layout
  themePreset: string;
  brandPrimary: string;
  brandSecondary: string;
  coverImageUrl?: string;
  logoUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EventSessionEntity {
  id: string;
  eventId: string;
  title: string;
  description: string;
  speakerName?: string;
  speakerTitle?: string;
  speakerBio?: string;
  speakerAvatar?: string;
  locationRoom?: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventTableEntity {
  id: string;
  eventId: string;
  tableName: string;
  tableNumber: number;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeatingAssignmentEntity {
  id: string;
  tableId: string;
  guestId: string;
  guestName: string;
  seatNumber: number;
  createdAt: Date;
}
