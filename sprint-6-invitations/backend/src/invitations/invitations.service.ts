import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { 
  EventSettingsEntity, 
  ReminderLogEntity, 
  GuestImportEntity, 
  InvitationStatsEntity, 
  ReminderChannel, 
  ReminderInterval 
} from './invitations.entity';

@Injectable()
export class InvitationsService {
  // In-memory settings store
  private settings: Map<string, string> = new Map([
    ['event_name', 'EventHub Global Tech Summit 2026'],
    ['event_venue', 'Grand Ballroom, Plaza Hotel, San Francisco'],
    ['event_date', '2026-09-15'],
    ['event_time', '09:00 AM']
  ]);

  // In-memory mock participants database with RSVP tracking
  private participants: any[] = [
    { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', phone: '+1 555-0192', company: 'Meta', position: 'VP Engineering', tableNumber: 'Table 1', seatNumber: 'Seat A-1', rsvpStatus: 'YES', checkedIn: false },
    { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', phone: '+1 555-0144', company: 'Google', position: 'Principal PM', tableNumber: 'Table 1', seatNumber: 'Seat A-2', rsvpStatus: 'PENDING', checkedIn: false },
    { id: 'p-3', name: 'Elena Rostova', email: 'elena.rostova@kaspersky.com', phone: '+7 901-1234', company: 'Kaspersky', position: 'Security Analyst', tableNumber: 'Table 3', seatNumber: 'Seat B-1', rsvpStatus: 'YES', checkedIn: true },
    { id: 'p-4', name: 'Michael Novak', email: 'm.novak@tesla.com', phone: '+1 555-9876', company: 'Tesla', position: 'Battery Lead', tableNumber: 'Table 2', seatNumber: 'Seat C-5', rsvpStatus: 'NO', checkedIn: false }
  ];

  private reminderLogs: ReminderLogEntity[] = [];
  private auditLogs: any[] = [];
  private notifications: any[] = [];

  constructor() {
    this.seedInitialReminderLogs();
  }

  private seedInitialReminderLogs() {
    this.reminderLogs.push(
      {
        id: 'rem-log-1',
        participantId: 'p-1',
        channel: 'EMAIL',
        intervalStage: 'H-7',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 86400000 * 6)
      },
      {
        id: 'rem-log-2',
        participantId: 'p-2',
        channel: 'WHATSAPP',
        intervalStage: 'H-7',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 86400000 * 5)
      }
    );
  }

  // --- SETTINGS CORE API ---
  async getSettings(): Promise<Record<string, string>> {
    const config: Record<string, string> = {};
    this.settings.forEach((val, key) => {
      config[key] = val;
    });
    return config;
  }

  async updateSetting(key: string, value: string, actor: string = 'COORDINATOR'): Promise<void> {
    const oldValue = this.settings.get(key) || 'NOT_SET';
    this.settings.set(key, value.trim());

    // Record in Audit Trail
    this.logAuditEvent(
      actor,
      'HOST',
      'SETTING_UPDATED',
      `Updated event parameter "${key}" from "${oldValue}" to "${value}"`,
      'SUCCESS',
      { key, oldValue, newValue: value }
    );
  }

  // --- BULK IMPORT CORE API ---
  async bulkImportGuests(guests: GuestImportEntity[], actor: string = 'COORDINATOR'): Promise<any[]> {
    if (!guests || guests.length === 0) {
      throw new BadRequestException('Guest import roster cannot be empty.');
    }

    const imported: any[] = [];
    guests.forEach(g => {
      // Check for email duplicates in current list
      const exists = this.participants.some(p => p.email.toLowerCase() === g.email.toLowerCase());
      if (exists) return; // Skip duplicates

      const newGuest = {
        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: g.name.trim(),
        email: g.email.trim().toLowerCase(),
        phone: g.phone || '',
        company: g.company || 'Individual',
        position: g.position || 'Guest',
        tableNumber: g.tableNumber || 'Unassigned',
        seatNumber: g.seatNumber || 'Unassigned',
        rsvpStatus: 'PENDING',
        checkedIn: false
      };

      this.participants.push(newGuest);
      imported.push(newGuest);
    });

    // Audit logs entry
    this.logAuditEvent(
      actor,
      'HOST',
      'GUESTS_BULK_IMPORTED',
      `Successfully imported ${imported.length} new event guests into roster.`,
      'SUCCESS',
      { importedCount: imported.length }
    );

    return imported;
  }

  // --- REMINDERS BROADCAST CORE API ---
  async broadcastReminder(channel: ReminderChannel, intervalStage: ReminderInterval, actor: string = 'COORDINATOR'): Promise<number> {
    // Standard event coordination protocol: 
    // Filter guests who haven't responded (PENDING) OR guests who said YES but are not checked-in yet.
    const targetGuests = this.participants.filter(p => {
      if (intervalStage === 'H-7') {
        // Invite/Response reminder is sent to PENDING RSVPs
        return p.rsvpStatus === 'PENDING';
      } else {
        // Coordination info, directions, and Day-Of welcomes go to RSVPs with status YES who are NOT checked in
        return p.rsvpStatus === 'PENDING' || (p.rsvpStatus === 'YES' && !p.checkedIn);
      }
    });

    if (targetGuests.length === 0) {
      return 0;
    }

    const eventName = this.settings.get('event_name') || 'Summit';
    const venueName = this.settings.get('event_venue') || 'TBD';

    targetGuests.forEach(guest => {
      const logId = `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Determine delivery success status (Simulated: 95% Delivered, 5% Sent/Failed)
      const deliveryStatus: 'DELIVERED' | 'FAILED' = Math.random() > 0.05 ? 'DELIVERED' : 'FAILED';

      this.reminderLogs.unshift({
        id: logId,
        participantId: guest.id,
        channel,
        intervalStage,
        status: deliveryStatus,
        sentAt: new Date()
      });

      // Insert in-app notifications
      if (deliveryStatus === 'DELIVERED') {
        this.notifications.unshift({
          id: `notif-${Date.now()}-${guest.id}`,
          participantId: guest.id,
          title: `Event Notice: ${intervalStage} Reminder ✉️`,
          message: `Greetings ${guest.name}, only short period until ${eventName}! Please double check your schedule and details for ${venueName}.`,
          isRead: false,
          createdAt: new Date()
        });
      }
    });

    // Logging audit activity
    this.logAuditEvent(
      actor,
      'HOST',
      'REMINDER_BROADCAST',
      `Broadcasted ${intervalStage} reminders via ${channel} to ${targetGuests.length} matching recipients.`,
      'INFO',
      { channel, intervalStage, recipientCount: targetGuests.length }
    );

    return targetGuests.length;
  }

  // --- STATS OVERVIEW ---
  async getStats(): Promise<InvitationStatsEntity> {
    const totalGuests = this.participants.length;
    const rsvpYes = this.participants.filter(p => p.rsvpStatus === 'YES').length;
    const rsvpNo = this.participants.filter(p => p.rsvpStatus === 'NO').length;
    const rsvpPending = this.participants.filter(p => p.rsvpStatus === 'PENDING').length;

    const remindersSent = this.reminderLogs.length;
    const deliveredCount = this.reminderLogs.filter(r => r.status === 'DELIVERED').length;
    const deliverySuccessRate = remindersSent > 0 ? Math.round((deliveredCount / remindersSent) * 100) : 100;

    return {
      totalGuests,
      rsvpYes,
      rsvpNo,
      rsvpPending,
      remindersSent,
      deliverySuccessRate
    };
  }

  // --- GETTERS FOR MOCKS ---
  getParticipantsList() {
    return this.participants;
  }

  getReminderLogs() {
    return this.reminderLogs;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  getNotifications() {
    return this.notifications;
  }

  // Audit Logs Helper
  private logAuditEvent(actorId: string, role: string, action: string, details: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', metadata?: any) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
      actorId,
      role,
      action,
      details,
      severity,
      metadata
    });
  }
}
