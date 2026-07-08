import { LeaderboardService } from '../backend/src/leaderboard/leaderboard.service';

describe('Sprint 9: Leaderboard & Milestones Service Unit Tests', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    service = new LeaderboardService();
  });

  it('should initialize with standard default participants and score logs', async () => {
    const list = await service.getLeaderboard();
    expect(list.length).toBeGreaterThan(0);
    
    // First place should be Kofi Mensah with 30 points
    expect(list[0].name).toBe('Kofi Mensah');
    expect(list[0].points).toBe(30);
  });

  it('should sort rankings strictly by points descending', async () => {
    const list = await service.getLeaderboard();
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].points).toBeGreaterThanOrEqual(list[i + 1].points);
    }
  });

  it('should support searching participants by name/email/position', async () => {
    const searchResults = await service.getLeaderboard('Sarah');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toBe('Sarah Chen');
  });

  it('should support filtering leaderboard by company name', async () => {
    const companyResults = await service.getLeaderboard(undefined, 'Stripe');
    expect(companyResults.length).toBe(1);
    expect(companyResults[0].company).toBe('Stripe Inc.');
  });

  it('should support filtering leaderboard by tier classification', async () => {
    const goldResults = await service.getLeaderboard(undefined, undefined, 'GOLD');
    // Kofi (30) and Alex (25) are GOLD (>= 25)
    expect(goldResults.length).toBe(2);
    expect(goldResults.every(p => p.points >= 25)).toBe(true);
  });

  it('should correctly adjust score and log the delta', async () => {
    const pId = 'p-3'; // Marcus Aurelius, starts at 5 pts
    const prevLeaderboard = await service.getLeaderboard();
    const prevPoints = prevLeaderboard.find(p => p.participantId === pId)?.points || 0;

    await service.adjustScore({
      participantId: pId,
      pointsDelta: 10,
      reasonCode: 'SPOT_AWARD',
      description: 'Spot trivia win'
    }, 'Test-Staff');

    const newLeaderboard = await service.getLeaderboard();
    const newPoints = newLeaderboard.find(p => p.participantId === pId)?.points;
    expect(newPoints).toBe(prevPoints + 10);

    const logs = await service.getScoreLogs(pId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].pointsDelta).toBe(10);
    expect(logs[0].reasonCode).toBe('SPOT_AWARD');
  });

  it('should unlock relevant milestones at proper score thresholds', async () => {
    const pId = 'p-5'; // Elena Rostova, starts at 0 pts (pending unranked)
    
    // 1. Award 6 points (should unlock Bronze)
    await service.adjustScore({
      participantId: pId,
      pointsDelta: 6,
      reasonCode: 'FEEDBACK'
    }, 'Test-Staff');

    let milestones = await service.getMilestones(pId);
    expect(milestones.some(m => m.milestoneName === 'BRONZE_PASS')).toBe(true);
    expect(milestones.some(m => m.milestoneName === 'SILVER_LOUNGE')).toBe(false);

    // 2. Award another 6 points -> 12 points (should unlock Silver)
    await service.adjustScore({
      participantId: pId,
      pointsDelta: 6,
      reasonCode: 'PHOTO_WALL'
    }, 'Test-Staff');

    milestones = await service.getMilestones(pId);
    expect(milestones.some(m => m.milestoneName === 'BRONZE_PASS')).toBe(true);
    expect(milestones.some(m => m.milestoneName === 'SILVER_LOUNGE')).toBe(true);
    expect(milestones.some(m => m.milestoneName === 'GOLD_RAFFLE_VIP')).toBe(false);

    // 3. Award another 15 points -> 27 points (should unlock Gold)
    await service.adjustScore({
      participantId: pId,
      pointsDelta: 15,
      reasonCode: 'SPOT_AWARD'
    }, 'Test-Staff');

    milestones = await service.getMilestones(pId);
    expect(milestones.some(m => m.milestoneName === 'GOLD_RAFFLE_VIP')).toBe(true);
  });

  it('should prevent claiming locked milestones and double claiming unlocked ones', async () => {
    const pId = 'p-2'; // Sarah Chen (15 points -> Bronze and Silver unlocked, Gold locked)

    // Verify Gold is locked
    const milestones = await service.getMilestones(pId);
    expect(milestones.some(m => m.milestoneName === 'GOLD_RAFFLE_VIP')).toBe(false);

    // Try claiming Gold - should throw NotFoundException
    await expect(service.claimMilestone({
      participantId: pId,
      milestoneName: 'GOLD_RAFFLE_VIP'
    })).rejects.toThrow();

    // Claim Bronze (unlocked) - should succeed
    const claimedBronze = await service.claimMilestone({
      participantId: pId,
      milestoneName: 'BRONZE_PASS'
    });
    expect(claimedBronze.claimed).toBe(true);

    // Try claiming Bronze again - should throw BadRequestException
    await expect(service.claimMilestone({
      participantId: pId,
      milestoneName: 'BRONZE_PASS'
    })).rejects.toThrow();
  });

  it('should aggregate accurate leaderboard dashboard statistics', async () => {
    const stats = await service.getStats();
    expect(stats.totalPointsAwarded).toBeGreaterThan(0);
    expect(stats.averagePointsPerAttendee).toBeGreaterThan(0);
    expect(stats.totalScoreAdjustments).toBeGreaterThan(0);
  });
});
