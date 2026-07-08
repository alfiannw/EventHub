import { AnalyticsService } from '../backend/src/analytics/analytics.service';

describe('Sprint 12: Analytics Dashboard Module Tests', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it('should initialize seeds and fetch baseline live overview stats', async () => {
    const overview = await service.getOverview();
    expect(overview.totalRegistered).toBe(6);
    expect(overview.checkedInCount).toBe(5);
    expect(overview.attendanceRate).toBe(83.3);
    expect(overview.totalPoints).toBe(85);
  });

  it('should compute door prize allocation and company averages', async () => {
    const distribution = await service.getDistribution();
    expect(distribution.doorPrizeTiers.length).toBe(3);
    expect(distribution.companyAverages.length).toBe(6);
  });

  it('should pull leaderboard rows ordered by score', async () => {
    const top = await service.getLeaderboard(5);
    expect(top[0].points).toBeGreaterThanOrEqual(top[1].points);
  });

  it('should allow simulate checked-in ingress update', async () => {
    await service.triggerSimulateCheckIn('p-5'); // Non-present guest
    const overview = await service.getOverview();
    expect(overview.checkedInCount).toBe(6);
    expect(overview.attendanceRate).toBe(100);
  });

  it('should trigger point updates and double-entry adjustments', async () => {
    await service.triggerSimulatePoints('p-1', 15);
    const top = await service.getLeaderboard(1, 'Meta Platforms Inc.');
    expect(top[0].points).toBe(40);
  });

  it('should support severity queries for audit log ledgers', async () => {
    const successLogs = await service.getAuditLogs('SUCCESS');
    expect(successLogs.every(log => log.severity === 'SUCCESS')).toBe(true);
  });
});
