import { LuckyDrawService } from '../backend/src/luckydraw/luckydraw.service';

describe('Sprint 11: Lucky Draw Wheel Service Unit Tests', () => {
  let service: LuckyDrawService;

  beforeEach(() => {
    service = new LuckyDrawService();
  });

  it('should initialize with standard default participants and a seeded winner', async () => {
    const list = await service.getCandidatesList();
    expect(list.length).toBe(6);

    const winners = await service.getWinnersLogs();
    expect(winners.length).toBe(1);
    expect(winners[0].participantName).toBe('Kofi Mensah');
    expect(winners[0].prizeTier).toBe('Major Prize');
  });

  it('should support searching candidates by name/email/position', async () => {
    const searchResults = await service.getCandidatesList('Sarah');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toBe('Sarah Chen');
  });

  it('should support filtering candidates by company name', async () => {
    const companyResults = await service.getCandidatesList(undefined, 'Stripe');
    expect(companyResults.length).toBe(1);
    expect(companyResults[0].company).toBe('Stripe Inc.');
  });

  it('should allow checked-in guests to win a lucky draw', async () => {
    const pId = 'p-2'; // Sarah Chen, checkedIn: true, 15 points
    
    const claim = await service.recordWinner({
      participantId: pId,
      prizeTier: 'Grand Prize',
      prizeName: 'MacBook Pro 14 M4 Pro'
    }, 'Test-Staff-Actor');

    expect(claim.participantId).toBe(pId);
    expect(claim.prizeTier).toBe('Grand Prize');
    expect(claim.prizeName).toBe('MacBook Pro 14 M4 Pro');
    expect(claim.actorId).toBe('Test-Staff-Actor');

    const updatedList = await service.getCandidatesList();
    const sarah = updatedList.find(p => p.participantId === pId);
    expect(sarah?.isWinner).toBe(true);
    expect(sarah?.prizeName).toBe('MacBook Pro 14 M4 Pro');
  });

  it('should block winning if the participant is not checked in', async () => {
    const pId = 'p-5'; // Elena Rostova, checkedIn: false

    await expect(service.recordWinner({
      participantId: pId,
      prizeTier: 'Grand Prize',
      prizeName: 'iPad'
    }, 'Test-Staff')).rejects.toThrow();
  });

  it('should block duplicate winnings for a single participant', async () => {
    const pId = 'p-2'; // Sarah Chen
    
    // First win
    await service.recordWinner({
      participantId: pId,
      prizeTier: 'Major Prize',
      prizeName: 'Headphones'
    }, 'Test-Staff');

    // Second win - fails
    await expect(service.recordWinner({
      participantId: pId,
      prizeTier: 'Grand Prize',
      prizeName: 'Laptop'
    }, 'Test-Staff')).rejects.toThrow();
  });

  it('should aggregate accurate statistics and support resetting winners', async () => {
    const stats = await service.getStats();
    expect(stats.totalWinners).toBe(1);
    expect(stats.winnersByTier['Major Prize']).toBe(1);
    expect(stats.totalEligibleCandidates).toBe(4); // 5 checked-in, 1 won, so 4 eligible candidates

    await service.resetWinners();
    const newStats = await service.getStats();
    expect(newStats.totalWinners).toBe(0);
    expect(newStats.winnersByTier['Major Prize']).toBe(0);
    expect(newStats.totalEligibleCandidates).toBe(5); // all 5 checked-in guests now eligible
  });
});
