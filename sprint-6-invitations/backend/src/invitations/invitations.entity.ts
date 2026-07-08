export interface EventSettingsEntity {
  key: string;
  value: string;
  updatedAt: Date;
}

export type ReminderChannel = 'EMAIL' | 'WHATSAPP';
export type ReminderInterval = 'H-7' | 'H-3' | 'H-1' | 'DAY-OF';
export type DeliveryStatus = 'SENT' | 'DELIVERED' | 'FAILED';

export interface ReminderLogEntity {
  id: string;
  participantId: string;
  channel: ReminderChannel;
  intervalStage: ReminderInterval;
  status: DeliveryStatus;
  sentAt: Date;
}

export interface GuestImportEntity {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  tableNumber?: string;
  seatNumber?: string;
}

export interface InvitationStatsEntity {
  totalGuests: number;
  rsvpYes: number;
  rsvpNo: number;
  rsvpPending: number;
  remindersSent: number;
  deliverySuccessRate: number;
}
