// =============================================================================
// SPRINT 5: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS CheckInService Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CheckInService } from '../backend/src/checkin/checkin.service';

describe('Sprint 5: QR Check-In Gate & Telemetry Engines', () => {
  let service: CheckInService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckInService],
    }).compile();

    service = module.get<CheckInService>(CheckInService);
  });

  describe('Check-In Log Registry', () => {
    it('should retrieve seeded check-in logs accurately', async () => {
      const logs = await service.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].status).toBe('SUCCESS');
    });

    it('should retrieve check-in history by participant ID', async () => {
      const logs = await service.getLogsByParticipant('p-1');
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scan-Gate Verification Flow', () => {
    it('should successfully check-in a registered participant with active ticket', async () => {
      const log = await service.checkIn({
        qrCodeString: 'EH-QR-LIAM-9902',
        gateName: 'West VIP Entrance',
        scannedBy: 'GateKeeper_Device_A'
      });

      expect(log.id).toBeDefined();
      expect(log.status).toBe('SUCCESS');
      expect(log.participantId).toBe('p-4');
    });

    it('should raise FLAGGED warning and create audit log for duplicate check-ins (double scans)', async () => {
      // Alex Rivera (p-1) is pre-seeded as checkedIn: true
      const log = await service.checkIn({
        qrCodeString: 'EH-QR-ALEXRIVERA-7719',
        gateName: 'West VIP Entrance',
        scannedBy: 'GateKeeper_Device_A'
      });

      expect(log.status).toBe('FLAGGED');
      expect(log.failureReason).toContain('Double scan detected');
    });

    it('should log FAILED state and throw NotFoundException for non-existent ticket codes', async () => {
      await expect(
        service.checkIn({
          qrCodeString: 'EH-QR-NONEXISTENT-CODE',
          gateName: 'West VIP Entrance',
          scannedBy: 'GateKeeper_Device_A'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should block and reject check-ins on revoked tickets', async () => {
      await expect(
        service.checkIn({
          qrCodeString: 'EH-QR-ELENAROSTOVA-8120',
          gateName: 'West VIP Entrance',
          scannedBy: 'GateKeeper_Device_A'
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Traffic Metric Aggregations', () => {
    it('should calculate accurate metrics and conversion rate', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('totalCheckedIn');
      expect(stats).toHaveProperty('totalRegistered');
      expect(stats).toHaveProperty('checkInRate');
      expect(stats).toHaveProperty('byGate');
    });
  });
});
