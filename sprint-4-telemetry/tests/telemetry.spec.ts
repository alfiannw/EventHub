// =============================================================================
// SPRINT 4: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS TelemetryService & Logs Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TelemetryService } from '../backend/src/telemetry/telemetry.service';

describe('Sprint 4: Telemetry, Audit Logging & Dynamic Notifications Core Engine', () => {
  let telemetryService: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryService],
    }).compile();

    telemetryService = module.get<TelemetryService>(TelemetryService);
  });

  describe('Participant Notifications Engine', () => {
    it('should successfully create a new notification in unread state', async () => {
      const result = await telemetryService.createNotification(
        'p-1',
        'Prize Redeemed',
        'Your Anker Prime Power Bank is ready for pickup at the information counter.'
      );

      expect(result).toHaveProperty('id');
      expect(result.participantId).toBe('p-1');
      expect(result.title).toBe('Prize Redeemed');
      expect(result.isRead).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve sorted notifications list and support marking notification read', async () => {
      // Create new unread notification
      const notif = await telemetryService.createNotification('p-2', 'Alert', 'Sample alert');
      
      const unreadList = await telemetryService.getNotificationsByParticipant('p-2');
      expect(unreadList[0].id).toBe(notif.id);
      expect(unreadList[0].isRead).toBe(false);

      // Mark as read
      const updated = await telemetryService.markNotificationRead(notif.id);
      expect(updated.isRead).toBe(true);

      // Verify not found error for invalid notification IDs
      await expect(
        telemetryService.markNotificationRead('invalid-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Security Audit Trail Logging', () => {
    it('should write audit events and retrieve them with filters', async () => {
      const log = await telemetryService.logAuditEvent(
        'admin_user_02',
        'ADMIN',
        'IP_RATE_LIMITED',
        'IP Address 192.168.1.140 blocked for exceeding 100 req/min/IP limit.',
        'WARNING'
      );

      expect(log).toHaveProperty('id');
      expect(log.actorId).toBe('admin_user_02');
      expect(log.action).toBe('IP_RATE_LIMITED');
      expect(log.severity).toBe('WARNING');

      // Fetch with severity filter
      const logs = await telemetryService.getAuditLogs('WARNING');
      expect(logs.some(l => l.id === log.id)).toBe(true);

      // Fetch with search term filter
      const searchLogs = await telemetryService.getAuditLogs('ALL', 'Rate_Limited');
      expect(searchLogs.length).toBeGreaterThan(0);
      expect(searchLogs[0].details).toContain('exceeding 100 req/min/IP limit');
    });
  });

  describe('DevOps Metrics Telemetry', () => {
    it('should record fresh metrics and correctly trigger telemetry pulse', async () => {
      // Trigger dynamic pulse
      const updatedMetrics = await telemetryService.triggerTelemetryPulse();

      expect(updatedMetrics).toHaveProperty('id');
      expect(updatedMetrics.nodeId).toBe('node-aws-ecs-01');
      expect(updatedMetrics.activeWebsocketConnections).toBeGreaterThanOrEqual(1000);
      expect(updatedMetrics.redisCacheHitRate).toBeGreaterThanOrEqual(92);
      expect(updatedMetrics.recordedAt).toBeInstanceOf(Date);

      // Fetch latest
      const latest = await telemetryService.getLatestMetrics();
      expect(latest.id).toBe(updatedMetrics.id);
    });
  });
});
