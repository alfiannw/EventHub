import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { QrTicketEntity, GenerateQrDto, QrStatus, QrFormat } from './qr.entity';

@Injectable()
export class QrService {
  // Mock repository matching participant IDs from Sprint 3
  private qrTickets: QrTicketEntity[] = [
    {
      id: 'qr-1',
      participantId: 'p-1', // Alex Rivera
      qrCodeString: 'EH-QR-ALEXRIVERA-7719',
      format: 'QR_CODE',
      status: 'ACTIVE',
      scansCount: 0,
      generatedAt: new Date(Date.now() - 3600000 * 2),
      expiresAt: new Date(Date.now() + 3600000 * 48)
    },
    {
      id: 'qr-2',
      participantId: 'p-2', // Sarah Chen
      qrCodeString: 'EH-QR-SARAHCHEN-1254',
      format: 'QR_CODE',
      status: 'ACTIVE',
      scansCount: 1,
      lastScannedAt: new Date(Date.now() - 3600000),
      generatedAt: new Date(Date.now() - 3600000 * 5),
      expiresAt: new Date(Date.now() + 3600000 * 24)
    },
    {
      id: 'qr-3',
      participantId: 'p-3', // Elena Rostova
      qrCodeString: 'EH-QR-ELENAROSTOVA-8120',
      format: 'QR_CODE',
      status: 'REVOKED',
      scansCount: 2,
      lastScannedAt: new Date(Date.now() - 3600000 * 3),
      generatedAt: new Date(Date.now() - 3600000 * 12),
      expiresAt: new Date(Date.now() + 3600000 * 12)
    }
  ];

  private auditLogs: any[] = [];

  constructor() {
    this.logAuditEvent('SYSTEM', 'QR_ENGINE', 'QR_SERVICE_INITIALIZED', 'QR code generator dynamic layout system fully ready.', 'INFO');
  }

  async getAllTickets(): Promise<QrTicketEntity[]> {
    return this.qrTickets;
  }

  async getTicketById(id: string): Promise<QrTicketEntity> {
    const ticket = this.qrTickets.find(t => t.id === id);
    if (!ticket) {
      throw new NotFoundException(`QR Ticket with ID "${id}" not found.`);
    }
    return ticket;
  }

  async getTicketByCode(code: string): Promise<QrTicketEntity> {
    const ticket = this.qrTickets.find(t => t.qrCodeString === code);
    if (!ticket) {
      throw new NotFoundException(`QR ticket with code string "${code}" does not exist.`);
    }
    return ticket;
  }

  async getTicketsByParticipant(participantId: string): Promise<QrTicketEntity[]> {
    return this.qrTickets.filter(t => t.participantId === participantId);
  }

  async generateQr(dto: GenerateQrDto, actor: string = 'SYSTEM'): Promise<QrTicketEntity> {
    if (!dto.participantId) {
      throw new BadRequestException('Participant ID is required to generate a QR Ticket.');
    }

    // Ensure we don't have conflicting duplicate active QR tickets for the same participant in QR_CODE format
    const existingActive = this.qrTickets.find(
      t => t.participantId === dto.participantId && t.status === 'ACTIVE' && t.format === (dto.format || 'QR_CODE')
    );
    if (existingActive) {
      // Revoke the old one automatically before generating a fresh one (Dynamic Rotator Pattern)
      existingActive.status = 'EXPIRED';
      this.logAuditEvent(
        'SYSTEM',
        'QR_ENGINE',
        'QR_DEPRECATED_AUTO',
        `Older active QR code ticket (${existingActive.id}) expired due to fresh generation cycle.`,
        'WARNING',
        { ticketId: existingActive.id, participantId: dto.participantId }
      );
    }

    const uniqueString = `EH-QR-${dto.participantId.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const expiresAt = dto.expiresInHours 
      ? new Date(Date.now() + 3600000 * dto.expiresInHours)
      : new Date(Date.now() + 3600000 * 72); // Default 72 hours validity

    const newTicket: QrTicketEntity = {
      id: `qr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: dto.participantId,
      qrCodeString: uniqueString,
      format: dto.format || 'QR_CODE',
      status: 'ACTIVE',
      scansCount: 0,
      generatedAt: new Date(),
      expiresAt
    };

    this.qrTickets.unshift(newTicket);

    this.logAuditEvent(
      actor,
      'HOST',
      'QR_GENERATED',
      `Issued new security ${newTicket.format} token for attendee profile ID: ${dto.participantId}`,
      'SUCCESS',
      { ticketId: newTicket.id, qrString: uniqueString }
    );

    return newTicket;
  }

  async revokeQr(id: string, actor: string = 'ADMIN'): Promise<QrTicketEntity> {
    const ticket = await this.getTicketById(id);
    if (ticket.status === 'REVOKED') {
      throw new BadRequestException('This QR Ticket has already been permanently revoked.');
    }

    ticket.status = 'REVOKED';
    this.logAuditEvent(
      actor,
      'HOST',
      'QR_REVOKED',
      `Permanently invalidated and revoked QR Ticket ID: ${id}`,
      'WARNING',
      { ticketId: id }
    );

    return ticket;
  }

  async scanAndValidateQr(code: string, actor: string = 'CHECKIN_SCANNER'): Promise<QrTicketEntity> {
    const ticket = await this.getTicketByCode(code);

    if (ticket.status === 'REVOKED') {
      this.logAuditEvent(actor, 'SCANNER', 'QR_SCAN_FAILED', `Declined scan of revoked QR code: ${code}`, 'ERROR', { ticketId: ticket.id });
      throw new BadRequestException('Security Alert: This QR code has been revoked and cannot be used for entry.');
    }

    if (ticket.status === 'EXPIRED' || (ticket.expiresAt && ticket.expiresAt.getTime() < Date.now())) {
      ticket.status = 'EXPIRED';
      this.logAuditEvent(actor, 'SCANNER', 'QR_SCAN_FAILED', `Declined scan of expired QR code: ${code}`, 'ERROR', { ticketId: ticket.id });
      throw new BadRequestException('Entry Denied: This QR code has expired.');
    }

    // Increment scan counts
    ticket.scansCount += 1;
    ticket.lastScannedAt = new Date();

    this.logAuditEvent(
      actor,
      'SCANNER',
      'QR_SCAN_SUCCESS',
      `Successful authentication of QR code token. Scans: ${ticket.scansCount}`,
      'SUCCESS',
      { ticketId: ticket.id, count: ticket.scansCount }
    );

    return ticket;
  }

  // Audit Logs Getter
  getAuditLogs() {
    return this.auditLogs;
  }

  private logAuditEvent(actorId: string, role: string, action: string, details: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', metadata?: any) {
    this.auditLogs.unshift({
      id: `log-qr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
