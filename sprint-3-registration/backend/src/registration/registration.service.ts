import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ParticipantEntity, RegistrationDto, UpdateRegistrationDto, RsvpStatus } from './registration.entity';

@Injectable()
export class RegistrationService {
  // Pre-seed mock data for development & testing
  private participants: ParticipantEntity[] = [
    {
      id: 'p-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@meta.com',
      phone: '+1 555-0192',
      company: 'Meta Platforms Inc.',
      position: 'VP Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rsvpStatus: 'YES',
      qrCode: 'EH-P1-ALEXRIVERA',
      checkedIn: false,
      points: 25,
      tableNumber: 'Table 1',
      seatNumber: 'Seat A-1',
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000 * 3)
    },
    {
      id: 'p-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@google.com',
      phone: '+1 555-0144',
      company: 'Google LLC',
      position: 'Principal PM',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rsvpStatus: 'PENDING',
      qrCode: 'EH-P2-SARAHCHEN',
      checkedIn: false,
      points: 0,
      tableNumber: 'Unassigned',
      seatNumber: 'Unassigned',
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: 'p-3',
      name: 'Elena Rostova',
      email: 'elena.rostova@kaspersky.com',
      phone: '+7 901-1234',
      company: 'Kaspersky Lab',
      position: 'Senior Security Analyst',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      rsvpStatus: 'YES',
      qrCode: 'EH-P3-ELENAROSTOVA',
      checkedIn: true,
      points: 15,
      tableNumber: 'Table 3',
      seatNumber: 'Seat B-1',
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 4)
    }
  ];

  private auditLogs: any[] = [];

  constructor() {
    this.logAuditEvent('SYSTEM', 'HOST', 'SERVICE_STARTED', 'Participant Registration Service initialized successfully.', 'INFO');
  }

  // Retrieve all participants
  async getAllParticipants(): Promise<ParticipantEntity[]> {
    return this.participants;
  }

  // Retrieve participant by ID
  async getParticipantById(id: string): Promise<ParticipantEntity> {
    const participant = this.participants.find(p => p.id === id);
    if (!participant) {
      throw new NotFoundException(`Participant with ID "${id}" not found.`);
    }
    return participant;
  }

  // Retrieve participant by Email
  async getParticipantByEmail(email: string): Promise<ParticipantEntity> {
    const participant = this.participants.find(p => p.email.toLowerCase() === email.toLowerCase().trim());
    if (!participant) {
      throw new NotFoundException(`Participant with Email "${email}" not found.`);
    }
    return participant;
  }

  // Register / Add a new Participant
  async register(dto: RegistrationDto, actor: string = 'REGISTRATION_PORTAL'): Promise<ParticipantEntity> {
    const emailNormalized = dto.email.toLowerCase().trim();
    
    // Check for unique email
    const exists = this.participants.some(p => p.email.toLowerCase() === emailNormalized);
    if (exists) {
      throw new ConflictException(`A participant with email "${dto.email}" is already registered.`);
    }

    if (!dto.name.trim()) {
      throw new BadRequestException('Participant name cannot be empty.');
    }

    // Assign Table & Seat if RSVP is YES, else unassigned
    let tableNumber = 'Unassigned';
    let seatNumber = 'Unassigned';
    if (dto.rsvpStatus === 'YES') {
      tableNumber = `Table ${Math.floor(Math.random() * 10) + 1}`;
      seatNumber = `Seat ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}-${Math.floor(Math.random() * 10) + 1}`;
    }

    const newParticipant: ParticipantEntity = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: dto.name.trim(),
      email: emailNormalized,
      phone: dto.phone?.trim() || '',
      company: dto.company?.trim() || 'Individual',
      position: dto.position?.trim() || 'Guest',
      avatarUrl: dto.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      rsvpStatus: dto.rsvpStatus,
      qrCode: `EH-QR-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      checkedIn: false,
      points: dto.rsvpStatus === 'YES' ? 5 : 0, // 5 points reward for registering YES
      tableNumber,
      seatNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.participants.push(newParticipant);

    this.logAuditEvent(
      actor,
      'GUEST',
      'PARTICIPANT_REGISTERED',
      `Registered participant "${newParticipant.name}" with status "${newParticipant.rsvpStatus}".`,
      'SUCCESS',
      { participantId: newParticipant.id, email: newParticipant.email }
    );

    return newParticipant;
  }

  // Update participant profile
  async update(id: string, dto: UpdateRegistrationDto, actor: string = 'REGISTRATION_PORTAL'): Promise<ParticipantEntity> {
    const participant = await this.getParticipantById(id);
    const oldRsvp = participant.rsvpStatus;

    if (dto.name !== undefined) participant.name = dto.name.trim();
    if (dto.phone !== undefined) participant.phone = dto.phone.trim();
    if (dto.company !== undefined) participant.company = dto.company.trim();
    if (dto.position !== undefined) participant.position = dto.position.trim();
    if (dto.avatarUrl !== undefined) participant.avatarUrl = dto.avatarUrl;
    
    if (dto.rsvpStatus !== undefined && dto.rsvpStatus !== participant.rsvpStatus) {
      participant.rsvpStatus = dto.rsvpStatus;
      
      // Update seat and table allocations dynamically
      if (dto.rsvpStatus === 'YES') {
        participant.tableNumber = `Table ${Math.floor(Math.random() * 10) + 1}`;
        participant.seatNumber = `Seat ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}-${Math.floor(Math.random() * 10) + 1}`;
        if (participant.points === 0) {
          participant.points = 5; // Reward points for RSVPing YES
        }
      } else {
        participant.tableNumber = 'Unassigned';
        participant.seatNumber = 'Unassigned';
      }
    }

    participant.updatedAt = new Date();

    this.logAuditEvent(
      actor,
      id === actor ? 'GUEST' : 'HOST',
      'PARTICIPANT_UPDATED',
      `Updated registration profile for "${participant.name}".`,
      'SUCCESS',
      { participantId: id, oldRsvp, newRsvp: participant.rsvpStatus }
    );

    return participant;
  }

  // Delete participant
  async deleteParticipant(id: string, actor: string = 'ADMIN_COORDINATOR'): Promise<void> {
    const idx = this.participants.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Participant with ID "${id}" not found.`);
    }

    const name = this.participants[idx].name;
    this.participants.splice(idx, 1);

    this.logAuditEvent(
      actor,
      'HOST',
      'PARTICIPANT_DELETED',
      `Deleted participant record for "${name}" (ID: ${id}).`,
      'WARNING',
      { deletedId: id }
    );
  }

  // Aggregate statistics for RSVP counts
  async getStats() {
    const totalCount = this.participants.length;
    const yesCount = this.participants.filter(p => p.rsvpStatus === 'YES').length;
    const noCount = this.participants.filter(p => p.rsvpStatus === 'NO').length;
    const pendingCount = this.participants.filter(p => p.rsvpStatus === 'PENDING').length;
    
    return {
      totalCount,
      yesCount,
      noCount,
      pendingCount,
      responseRate: totalCount > 0 ? Math.round(((yesCount + noCount) / totalCount) * 100) : 100,
      checkedInCount: this.participants.filter(p => p.checkedIn).length
    };
  }

  // Audit Logs Getter
  getAuditLogs() {
    return this.auditLogs;
  }

  // Logger Helper
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
