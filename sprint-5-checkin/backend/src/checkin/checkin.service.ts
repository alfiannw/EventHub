import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CheckInLogEntity, CheckInDto, CheckInStats, CheckInStatus } from './checkin.entity';

@Injectable()
export class CheckInService {
  // Mock check-in logs directory
  private checkInLogs: CheckInLogEntity[] = [
    {
      id: 'log-1',
      participantId: 'p-1', // Alex Rivera
      ticketId: 'qr-1',
      gateName: 'West VIP Gate',
      scannedBy: 'device_01',
      status: 'SUCCESS',
      checkedInAt: new Date(Date.now() - 3600000 * 4)
    },
    {
      id: 'log-2',
      participantId: 'p-2', // Sarah Chen
      ticketId: 'qr-2',
      gateName: 'East General Gate',
      scannedBy: 'device_02',
      status: 'SUCCESS',
      checkedInAt: new Date(Date.now() - 3600000 * 2)
    }
  ];

  // Simulated participant states matching Sprints 3 & 4
  private participants = [
    { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', checkedIn: true, tableNumber: 'Table 1', seatNumber: 'Seat A-1', points: 5 },
    { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', checkedIn: true, tableNumber: 'Table 2', seatNumber: 'Seat B-2', points: 15 },
    { id: 'p-3', name: 'Elena Rostova', email: 'elena.rostova@kaspersky.com', checkedIn: false, tableNumber: 'Table 3', seatNumber: 'Seat C-3', points: 0 },
    { id: 'p-4', name: 'Liam O\'Connor', email: 'liam.oc@atlassian.com', checkedIn: false, tableNumber: 'Table 4', seatNumber: 'Seat D-4', points: 5 }
  ];

  // Simulated QR Tickets from Sprint 4
  private qrTickets = [
    { id: 'qr-1', participantId: 'p-1', qrCodeString: 'EH-QR-ALEXRIVERA-7719', status: 'ACTIVE', scansCount: 1 },
    { id: 'qr-2', participantId: 'p-2', qrCodeString: 'EH-QR-SARAHCHEN-1254', status: 'ACTIVE', scansCount: 1 },
    { id: 'qr-3', participantId: 'p-3', qrCodeString: 'EH-QR-ELENAROSTOVA-8120', status: 'REVOKED', scansCount: 0 },
    { id: 'qr-4', participantId: 'p-4', qrCodeString: 'EH-QR-LIAM-9902', status: 'ACTIVE', scansCount: 0 }
  ];

  async getLogs(): Promise<CheckInLogEntity[]> {
    return this.checkInLogs;
  }

  async getLogsByParticipant(participantId: string): Promise<CheckInLogEntity[]> {
    return this.checkInLogs.filter(log => log.participantId === participantId);
  }

  async checkIn(dto: CheckInDto): Promise<CheckInLogEntity> {
    const { qrCodeString, gateName = 'Main Entrance', scannedBy = 'SYSTEM' } = dto;

    if (!qrCodeString) {
      throw new BadRequestException('QR Code is required for processing check-in.');
    }

    // 1. Locate the QR Ticket
    const ticket = this.qrTickets.find(t => t.qrCodeString === qrCodeString);
    if (!ticket) {
      const failedLog: CheckInLogEntity = {
        id: `log-failed-${Date.now()}`,
        participantId: 'UNKNOWN',
        gateName,
        scannedBy,
        status: 'FAILED',
        failureReason: 'QR Code signature not found in central ticket registry.',
        checkedInAt: new Date()
      };
      this.checkInLogs.unshift(failedLog);
      throw new NotFoundException('Invalid QR code scanned. Ticket signature does not exist.');
    }

    // 2. Validate ticket status
    if (ticket.status === 'REVOKED') {
      const failedLog: CheckInLogEntity = {
        id: `log-failed-${Date.now()}`,
        participantId: ticket.participantId,
        ticketId: ticket.id,
        gateName,
        scannedBy,
        status: 'FAILED',
        failureReason: 'Ticket status is permanently REVOKED.',
        checkedInAt: new Date()
      };
      this.checkInLogs.unshift(failedLog);
      throw new BadRequestException('Check-In Denied: This QR Ticket has been revoked.');
    }

    // 3. Locate participant
    const participant = this.participants.find(p => p.id === ticket.participantId);
    if (!participant) {
      throw new NotFoundException('Internal Error: Associated participant profile not found.');
    }

    // 4. Double scan / Already checked in check (Flagged behavior)
    if (participant.checkedIn) {
      const flaggedLog: CheckInLogEntity = {
        id: `log-flagged-${Date.now()}`,
        participantId: participant.id,
        ticketId: ticket.id,
        gateName,
        scannedBy,
        status: 'FLAGGED',
        failureReason: 'Duplicate Check-In Attempt. Participant was already checked in.',
        checkedInAt: new Date()
      };
      this.checkInLogs.unshift(flaggedLog);
      ticket.scansCount += 1;
      return flaggedLog;
    }

    // 5. Success Check-In
    participant.checkedIn = true;
    participant.points += 10; // 10 check-in gamification bonus points
    ticket.scansCount += 1;

    const successLog: CheckInLogEntity = {
      id: `log-${Date.now()}`,
      participantId: participant.id,
      ticketId: ticket.id,
      gateName,
      scannedBy,
      status: 'SUCCESS',
      checkedInAt: new Date()
    };

    this.checkInLogs.unshift(successLog);
    return successLog;
  }

  async getStats(): Promise<CheckInStats> {
    const totalRegistered = this.participants.length;
    const totalCheckedIn = this.participants.filter(p => p.checkedIn).length;
    const checkInRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

    // Aggregate by gate
    const byGate: Record<string, number> = {};
    this.checkInLogs.forEach(log => {
      if (log.status === 'SUCCESS') {
        byGate[log.gateName] = (byGate[log.gateName] || 0) + 1;
      }
    });

    // Aggregate hourly distribution (dummy mapping for standard layout graphs)
    const hourlyDistribution: Record<string, number> = {
      '08:00': 15,
      '09:00': 42,
      '10:00': 28,
      '11:00': 12,
      '12:00': totalCheckedIn
    };

    return {
      totalCheckedIn,
      totalRegistered,
      checkInRate,
      byGate,
      hourlyDistribution
    };
  }
}
