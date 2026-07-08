// =============================================================================
// SPRINT 3: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS RegistrationService Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RegistrationService } from '../backend/src/registration/registration.service';

describe('Sprint 3: Participant Registration & RSVP Core Engines', () => {
  let service: RegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistrationService],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  describe('Core Participant Roster Querying', () => {
    it('should retrieve pre-seeded participants successfully', async () => {
      const roster = await service.getAllParticipants();
      expect(roster.length).toBeGreaterThanOrEqual(3);
      expect(roster[0].name).toBe('Alex Rivera');
    });

    it('should retrieve single participant by ID', async () => {
      const p = await service.getParticipantById('p-1');
      expect(p.email).toBe('alex.rivera@meta.com');
    });

    it('should throw NotFoundException if retrieving invalid ID', async () => {
      await expect(service.getParticipantById('p-invalid')).rejects.toThrow(NotFoundException);
    });

    it('should retrieve participant by Email regardless of casing', async () => {
      const p = await service.getParticipantByEmail('  ALEX.RIVERA@meta.com  ');
      expect(p.id).toBe('p-1');
    });
  });

  describe('Attendee Direct Registration Flow', () => {
    it('should register a new attendee and auto-assign table/seat for RSVP "YES"', async () => {
      const dto = {
        name: 'Liam O Connor',
        email: 'liam.oconnor@atlassian.com',
        phone: '+61 400 000 000',
        company: 'Atlassian',
        position: 'Staff Engineer',
        rsvpStatus: 'YES' as const
      };

      const result = await service.register(dto);
      expect(result.id).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.rsvpStatus).toBe('YES');
      expect(result.tableNumber).not.toBe('Unassigned');
      expect(result.seatNumber).not.toBe('Unassigned');
      expect(result.points).toBe(5); // 5 welcome points for RSVPing YES
    });

    it('should register a new attendee and leave seating unassigned for RSVP "NO"', async () => {
      const dto = {
        name: 'Jane Doe',
        email: 'jane.doe@microsoft.com',
        phone: '+1 555-9876',
        company: 'Microsoft',
        position: 'Software Architect',
        rsvpStatus: 'NO' as const
      };

      const result = await service.register(dto);
      expect(result.rsvpStatus).toBe('NO');
      expect(result.tableNumber).toBe('Unassigned');
      expect(result.seatNumber).toBe('Unassigned');
      expect(result.points).toBe(0);
    });

    it('should block registration and throw ConflictException if email exists', async () => {
      const dto = {
        name: 'Duplicate Alex',
        email: 'alex.rivera@meta.com', // Already registered
        rsvpStatus: 'YES' as const
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('RSVP Status Management & Profile Updates', () => {
    it('should successfully update name and phone details', async () => {
      const updateDto = {
        name: 'Alex Rivera Jr.',
        phone: '+1 999-9999'
      };

      const result = await service.update('p-1', updateDto);
      expect(result.name).toBe('Alex Rivera Jr.');
      expect(result.phone).toBe('+1 999-9999');
    });

    it('should assign a seat when RSVP is switched from PENDING to YES', async () => {
      const pBefore = await service.getParticipantById('p-2');
      expect(pBefore.rsvpStatus).toBe('PENDING');
      expect(pBefore.tableNumber).toBe('Unassigned');

      const result = await service.update('p-2', { rsvpStatus: 'YES' });
      expect(result.rsvpStatus).toBe('YES');
      expect(result.tableNumber).not.toBe('Unassigned');
      expect(result.seatNumber).not.toBe('Unassigned');
    });

    it('should revoke seat allocations when RSVP is switched to NO', async () => {
      const result = await service.update('p-1', { rsvpStatus: 'NO' });
      expect(result.rsvpStatus).toBe('NO');
      expect(result.tableNumber).toBe('Unassigned');
      expect(result.seatNumber).toBe('Unassigned');
    });
  });

  describe('KPI Metric Aggregations', () => {
    it('should calculate accurate metrics and response rates', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('yesCount');
      expect(stats).toHaveProperty('pendingCount');
      expect(stats.totalCount).toBeGreaterThanOrEqual(3);
    });
  });
});
