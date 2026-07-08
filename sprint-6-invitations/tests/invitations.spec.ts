// =============================================================================
// SPRINT 6: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS InvitationsService & RSVP campaigns engine
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InvitationsService } from '../backend/src/invitations/invitations.service';

describe('Sprint 6: Invitation Manager & RSVP Coordination Engine', () => {
  let invitationsService: InvitationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitationsService],
    }).compile();

    invitationsService = module.get<InvitationsService>(InvitationsService);
  });

  describe('Event Settings Coordination', () => {
    it('should successfully retrieve current event settings', async () => {
      const settings = await invitationsService.getSettings();
      expect(settings).toHaveProperty('event_name');
      expect(settings).toHaveProperty('event_venue');
      expect(settings).toHaveProperty('event_date');
      expect(settings).toHaveProperty('event_time');
    });

    it('should successfully update event parameters and create an audit log', async () => {
      await invitationsService.updateSetting('event_name', 'Tech Summit V2', 'ADMIN_COORDINATOR');
      const settings = await invitationsService.getSettings();
      expect(settings.event_name).toBe('Tech Summit V2');

      // Verify audit trail
      const audit = invitationsService.getAuditLogs();
      expect(audit.length).toBeGreaterThan(0);
      expect(audit[0].action).toBe('SETTING_UPDATED');
      expect(audit[0].metadata.newValue).toBe('Tech Summit V2');
    });
  });

  describe('Bulk Guest Import', () => {
    it('should successfully bulk import new guests and skip duplicates', async () => {
      const rosterSizeBefore = invitationsService.getParticipantsList().length;
      
      const importList = [
        { name: 'Ksenia Borodina', email: 'ksenia.b@yandex.ru', phone: '+7 905-1234', company: 'Yandex', position: 'HR VP' },
        { name: 'Marcus Aurelius', email: 'marcus.aurelius@rome.it', phone: '+39 06-1122', company: 'SPQR', position: 'Emperor' }
      ];

      const result = await invitationsService.bulkImportGuests(importList, 'ADMIN_IMPORT');
      expect(result.length).toBe(2);

      const rosterSizeAfter = invitationsService.getParticipantsList().length;
      expect(rosterSizeAfter).toBe(rosterSizeBefore + 2);

      // Attempt duplicate import of same guests
      const secondResult = await invitationsService.bulkImportGuests(importList, 'ADMIN_IMPORT');
      expect(secondResult.length).toBe(0); // Should skip both
    });

    it('should reject empty list imports', async () => {
      await expect(
        invitationsService.bulkImportGuests([])
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('RSVP Campaign Reminders Dispatcher', () => {
    it('should successfully count and send reminders to eligible recipients', async () => {
      // 1. Get stats before dispatch
      const statsBefore = await invitationsService.getStats();

      // 2. Broadcast H-7 reminder
      const count = await invitationsService.broadcastReminder('EMAIL', 'H-7', 'ADMIN_COORDINATOR');
      
      // Verification: Targets guests with RSVPStatus = PENDING
      // Sarah Chen (p-2) has RSVP Status = PENDING, so she should be targeted.
      expect(count).toBeGreaterThan(0);

      // 3. Verify logs
      const logs = invitationsService.getReminderLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].channel).toBe('EMAIL');
      expect(logs[0].intervalStage).toBe('H-7');

      // 4. Verify stats were updated
      const statsAfter = await invitationsService.getStats();
      expect(statsAfter.remindersSent).toBeGreaterThan(statsBefore.remindersSent);
    });
  });
});
