// =============================================================================
// SPRINT 4: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS QrService Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QrService } from '../backend/src/qr/qr.service';

describe('Sprint 4: QR Generation & Validation Engines', () => {
  let service: QrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrService],
    }).compile();

    service = module.get<QrService>(QrService);
  });

  describe('Core QR Ticket Querying', () => {
    it('should retrieve seeded tickets accurately', async () => {
      const tickets = await service.getAllTickets();
      expect(tickets.length).toBeGreaterThanOrEqual(3);
    });

    it('should get ticket by string value', async () => {
      const ticket = await service.getTicketByCode('EH-QR-ALEXRIVERA-7719');
      expect(ticket.participantId).toBe('p-1');
      expect(ticket.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException on non-existent string codes', async () => {
      await expect(service.getTicketByCode('EH-QR-FAKE-CODE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Secure Token Generation and Rotator', () => {
    it('should generate a new QR ticket successfully with defaults', async () => {
      const result = await service.generateQr({
        participantId: 'p-1',
        format: 'QR_CODE'
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('ACTIVE');
      expect(result.format).toBe('QR_CODE');
      expect(result.expiresAt).toBeDefined();
    });

    it('should automatically expire existing active QR code if a new one is compiled (Rotator)', async () => {
      // Setup: Generate first ticket
      const firstTicket = await service.generateQr({ participantId: 'p-4', format: 'QR_CODE' });
      expect(firstTicket.status).toBe('ACTIVE');

      // Setup: Generate second ticket for same participant and same format
      const secondTicket = await service.generateQr({ participantId: 'p-4', format: 'QR_CODE' });
      expect(secondTicket.status).toBe('ACTIVE');

      // First ticket is now expected to be 'EXPIRED'
      const checkedFirst = await service.getTicketById(firstTicket.id);
      expect(checkedFirst.status).toBe('EXPIRED');
    });
  });

  describe('Gate Scanner Simulator & Custom Expirations', () => {
    it('should successfully increment scan counts and record timestamps on valid check-ins', async () => {
      const initialTicket = await service.getTicketByCode('EH-QR-SARAHCHEN-1254');
      const startCount = initialTicket.scansCount;

      const scanned = await service.scanAndValidateQr('EH-QR-SARAHCHEN-1254');
      expect(scanned.scansCount).toBe(startCount + 1);
      expect(scanned.lastScannedAt).toBeDefined();
    });

    it('should throw BadRequestException on scans of revoked passes', async () => {
      await expect(
        service.scanAndValidateQr('EH-QR-ELENAROSTOVA-8120')
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully allow manual administrative revocation of active passes', async () => {
      const ticket = await service.getTicketByCode('EH-QR-ALEXRIVERA-7719');
      expect(ticket.status).toBe('ACTIVE');

      const revoked = await service.revokeQr(ticket.id);
      expect(revoked.status).toBe('REVOKED');

      // Scanner scan should now fail
      await expect(
        service.scanAndValidateQr('EH-QR-ALEXRIVERA-7719')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
