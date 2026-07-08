import { DoorPrizeService } from '../backend/src/doorprize/doorprize.service';

describe('Sprint 10: Door Prize Engine Service Unit Tests', () => {
  let service: DoorPrizeService;

  beforeEach(() => {
    service = new DoorPrizeService();
  });

  it('should initialize with standard default participants and a seeded claim', async () => {
    const list = await service.getParticipantsList();
    expect(list.length).toBe(6);

    const claims = await service.getClaimsLogs();
    expect(claims.length).toBe(1);
    expect(claims[0].participantName).toBe('Alex Rivera');
    expect(claims[0].eligibleTier).toBe('Gold Tier Selections');
  });

  it('should compute correct tier eligibility based on points thresholds', async () => {
    const list = await service.getParticipantsList();
    
    // Alex Rivera starts with 25 points -> Gold Tier Selections (level 3)
    const alex = list.find(p => p.participantId === 'p-1');
    expect(alex?.eligibleTier).toBe('Gold Tier Selections');
    expect(alex?.tierLevel).toBe(3);

    // Sarah Chen starts with 15 points -> Silver Tier Selections (level 2)
    const sarah = list.find(p => p.participantId === 'p-2');
    expect(sarah?.eligibleTier).toBe('Silver Tier Selections');
    expect(sarah?.tierLevel).toBe(2);

    // Marcus Aurelius starts with 5 points -> Bronze Tier Selections (level 1)
    const marcus = list.find(p => p.participantId === 'p-3');
    expect(marcus?.eligibleTier).toBe('Bronze Tier Selections');
    expect(marcus?.tierLevel).toBe(1);
  });

  it('should support searching participants by name/email/position', async () => {
    const searchResults = await service.getParticipantsList('Marcus');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toBe('Marcus Aurelius');
  });

  it('should support filtering participants by company name', async () => {
    const companyResults = await service.getParticipantsList(undefined, 'Stripe');
    expect(companyResults.length).toBe(1);
    expect(companyResults[0].company).toBe('Stripe Inc.');
  });

  it('should support filtering participants by eligible tier', async () => {
    const goldResults = await service.getParticipantsList(undefined, undefined, 'GOLD');
    expect(goldResults.every(p => p.points >= 21)).toBe(true);
  });

  it('should support filtering participants by claim status', async () => {
    const claimedResults = await service.getParticipantsList(undefined, undefined, undefined, true);
    expect(claimedResults.length).toBe(1);
    expect(claimedResults[0].participantId).toBe('p-1');
  });

  it('should allow checked-in eligible guest to claim a door prize', async () => {
    const pId = 'p-2'; // Sarah Chen, checkedIn: true, 15 points, Silver
    
    const claim = await service.claimPrize({
      participantId: pId,
      tier: 'Silver Tier Selections'
    }, 'Test-Staff');

    expect(claim.participantId).toBe(pId);
    expect(claim.eligibleTier).toBe('Silver Tier Selections');
    expect(claim.actorId).toBe('Test-Staff');

    const updatedList = await service.getParticipantsList();
    const sarah = updatedList.find(p => p.participantId === pId);
    expect(sarah?.claimed).toBe(true);
    expect(sarah?.claimId).toBe(claim.id);
  });

  it('should block claiming a door prize if the participant is not checked in', async () => {
    const pId = 'p-5'; // Elena Rostova, checkedIn: false

    await expect(service.claimPrize({
      participantId: pId,
      tier: 'Bronze Tier Selections'
    }, 'Test-Staff')).rejects.toThrow();
  });

  it('should block duplicate claims for a single participant', async () => {
    const pId = 'p-2'; // Sarah Chen
    
    // First claim - succeeds
    await service.claimPrize({
      participantId: pId,
      tier: 'Silver Tier Selections'
    }, 'Test-Staff');

    // Second claim - fails
    await expect(service.claimPrize({
      participantId: pId,
      tier: 'Silver Tier Selections'
    }, 'Test-Staff')).rejects.toThrow();
  });

  it('should throw an error if the claimed tier does not match actual eligibility', async () => {
    const pId = 'p-2'; // Sarah Chen, Silver (15 points)

    // Try to claim Gold - should fail validation
    await expect(service.claimPrize({
      participantId: pId,
      tier: 'Gold Tier Selections'
    }, 'Test-Staff')).rejects.toThrow();
  });

  it('should aggregate accurate statistics and support resetting claims', async () => {
    const stats = await service.getStats();
    expect(stats.totalClaims).toBe(1);
    expect(stats.claimsByTier['Gold Tier Selections']).toBe(1);
    expect(stats.totalCheckedInEligible).toBe(5); // 5 checked-in guests in seed

    await service.resetClaims();
    const newStats = await service.getStats();
    expect(newStats.totalClaims).toBe(0);
    expect(newStats.claimsByTier['Gold Tier Selections']).toBe(0);
  });
});
