// =============================================================================
// SPRINT 3: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS GamificationService Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { GamificationService } from '../backend/src/gamification/gamification.service';

describe('Sprint 3: Gamification, Points & Lucky Draw Core Engines', () => {
  let gamificationService: GamificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamificationService],
    }).compile();

    gamificationService = module.get<GamificationService>(GamificationService);
  });

  describe('Participant Registration & Profile Creation', () => {
    it('should successfully register a participant and generate a secure QR code hash', async () => {
      const data = {
        name: 'Bruce Wayne',
        email: 'bruce.wayne@waynecorp.com',
        phone: '+1 (555) 555-0100',
        position: 'CEO',
        companyId: 'c-1'
      };

      const result = await gamificationService.registerParticipant(data);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(data.name);
      expect(result.email).toBe(data.email);
      expect(result.qrCodeHash).toContain('QR_');
      expect(result.checkedIn).toBe(false);
      expect(result.currentPoints).toBe(0);
    });

    it('should fail registration if email is already registered (no duplicates)', async () => {
      const duplicateData = {
        name: 'Alex Duplicate',
        email: 'alex.rivera@meta.com', // Seeded email
      };

      await expect(
        gamificationService.registerParticipant(duplicateData)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Participant QR / Manual Check-In Points', () => {
    it('should check in a guest, mark checkedIn true, and automatically award check-in points', async () => {
      // Elena (p-3) is seeded as checkedIn: false, currentPoints: 0
      const elena = await gamificationService.checkInParticipant('p-3', 'Staff-GateA');

      expect(elena.checkedIn).toBe(true);
      expect(elena.checkedInAt).toBeInstanceOf(Date);
      expect(elena.currentPoints).toBe(5); // awarded standard CHECK_IN points

      // Verify transaction exists in ledger
      const ledger = await gamificationService.getLedgerByParticipant('p-3');
      expect(ledger.length).toBe(1);
      expect(ledger[0].pointsChanged).toBe(5);
      expect(ledger[0].reason).toContain('Check-in points awarded');
    });

    it('should reject check-in if the participant is already checked-in', async () => {
      // Alex (p-1) is already checked-in
      await expect(
        gamificationService.checkInParticipant('p-1')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Double-Entry Ledger Integrity', () => {
    it('should correctly process ledger transactions and dynamically keep participant points matching', async () => {
      // Alex (p-1) has 25 points
      const tx = await gamificationService.postLedgerTransaction('p-1', 10, 'Special session bonus points');

      expect(tx.runningBalance).toBe(35);
      const participant = await gamificationService.getParticipantById('p-1');
      expect(participant.currentPoints).toBe(35);
    });

    it('should prevent ledger inserts that would drop a participant below zero points', async () => {
      // Sarah (p-2) has 15 points
      await expect(
        gamificationService.postLedgerTransaction('p-2', -20, 'Deduction mistake')
      ).rejects.toThrow(BadRequestException);

      // Verify balance remains unchanged
      const participant = await gamificationService.getParticipantById('p-2');
      expect(participant.currentPoints).toBe(15);
    });
  });

  describe('Activity Submissions & Moderation', () => {
    it('should automatically approve feedback submissions and instantly credit points', async () => {
      // Elena (p-3) has 0 points initially (re-instantiated in beforeEach)
      const sub = await gamificationService.submitActivity('p-3', 'SUBMIT_FEEDBACK', 'Superb conference planning!');

      expect(sub.status).toBe('APPROVED');
      const participant = await gamificationService.getParticipantById('p-3');
      expect(participant.currentPoints).toBe(5); // +5 feedback points
    });

    it('should put photo submissions into PENDING moderation state', async () => {
      const sub = await gamificationService.submitActivity('p-1', 'SHARE_PHOTO', 'Keynote stage selfie', 'http://media.url/selfie.jpg');

      expect(sub.status).toBe('PENDING');
      expect(sub.submissionMediaUrl).toBe('http://media.url/selfie.jpg');
    });

    it('should award points upon staff approval of a pending submission', async () => {
      // Create pending photo submission
      const sub = await gamificationService.submitActivity('p-2', 'SHARE_PHOTO', 'Buffet photo');
      
      const approved = await gamificationService.moderateActivity(sub.id, 'APPROVED', 'Staff-Moderator-Alice');
      expect(approved.status).toBe('APPROVED');
      expect(approved.reviewedBy).toBe('Staff-Moderator-Alice');

      const participant = await gamificationService.getParticipantById('p-2');
      expect(participant.currentPoints).toBe(20); // Seeded 15 + 5 for approved photo
    });

    it('should not award points and log warning audit trail if staff rejects a submission', async () => {
      const sub = await gamificationService.submitActivity('p-2', 'INSTAGRAM_POST', 'Offtopic post');
      
      const rejected = await gamificationService.moderateActivity(sub.id, 'REJECTED');
      expect(rejected.status).toBe('REJECTED');

      const participant = await gamificationService.getParticipantById('p-2');
      expect(participant.currentPoints).toBe(15); // Unchanged (back to 15 from fresh mock)
    });
  });

  describe('Door Prize & Lucky Draw Spinner Core', () => {
    it('should correctly audit door prize tier eligibility matching points thresholds', async () => {
      // Kofi is checked-in and has 30 points (seeded) => Gold Tier Selections (min points 21)
      // Note: we need to register Kofi to mock a checked-in high pointer
      const kofi = await gamificationService.registerParticipant({
        name: 'Kofi HighPointer',
        email: 'kofi.high@stripe.com'
      });
      await gamificationService.checkInParticipant(kofi.id); // gives 5 pts
      await gamificationService.postLedgerTransaction(kofi.id, 20, 'Add 20 pts to reach Gold'); // total 25 pts

      const tier = await gamificationService.getEligibleDoorPrizeTier(kofi.id);
      expect(tier.name).toBe('Gold Tier Selections');
      expect(tier.tierLevel).toBe(3);
    });

    it('should select an eligible random winner, decrement prize inventory, and prevent duplicate wins', async () => {
      // Alex (p-1, 25pts) is eligible for Gold draw (pc-3). 
      // Draw winner under Gold Tier (pc-3) - prize Apple MacBook Pro 16"
      const result = await gamificationService.drawLuckyDrawWinner('pc-3', 'Staff-Spinner-Main');

      expect(result).toHaveProperty('id');
      expect(result.participantId).toBe('p-1'); // only checked-in participant >= 21 pts in seed data
      
      // Winner list check
      const winners = await gamificationService.getWinners();
      expect(winners.length).toBe(2); // seeded win-1 + this win
      expect(winners[1].participantName).toBe('Alex Rivera');
      expect(winners[1].prizeName).toBe('Apple MacBook Pro 16"');

      // Strict single-win rule: Alex should not be drawn again!
      await expect(
        gamificationService.drawLuckyDrawWinner('pc-3')
      ).rejects.toThrow(BadRequestException); // no eligible participants left!
    });
  });

  describe('Song Request Board & Points', () => {
    it('should request a song, approve it, transition status to APPROVED, and credit request points', async () => {
      // Sarah (p-2) requests Coldplay
      const req = await gamificationService.addSongRequest('p-2', 'Coldplay', 'Yellow', 'For the staff!');
      expect(req.status).toBe('PENDING');

      const approved = await gamificationService.moderateSongRequest(req.id, 'APPROVED');
      expect(approved.status).toBe('APPROVED');

      const participant = await gamificationService.getParticipantById('p-2');
      expect(participant.currentPoints).toBe(20); // Seeded 15 + 5 for approved song request

      const ledger = await gamificationService.getLedgerByParticipant('p-2');
      expect(ledger[0].reason).toContain('Approved song request points');
    });
  });
});
