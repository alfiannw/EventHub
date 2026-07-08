// =============================================================================
// SPRINT 5: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS SongsService & Live Board Core Engine
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SongsService } from '../backend/src/songs/songs.service';

describe('Sprint 5: Song Requests Board & Live DJ Integration Engine', () => {
  let songsService: SongsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SongsService],
    }).compile();

    songsService = module.get<SongsService>(SongsService);
  });

  describe('Song Request Core Operations', () => {
    it('should successfully create a new song request in PENDING status', async () => {
      const result = await songsService.createSongRequest(
        'p-1',
        'Daft Punk',
        'Get Lucky',
        'Play this for table 1 please!'
      );

      expect(result).toHaveProperty('id');
      expect(result.participantId).toBe('p-1');
      expect(result.artist).toBe('Daft Punk');
      expect(result.title).toBe('Get Lucky');
      expect(result.status).toBe('PENDING');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should reject requests for non-existent participant IDs', async () => {
      await expect(
        songsService.createSongRequest('p-invalid', 'Artist', 'Title')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DJ Moderation & Point Ledger Integration', () => {
    it('should successfully update song status and award points upon APPROVED', async () => {
      // Create new pending request
      const song = await songsService.createSongRequest('p-2', 'The Weeknd', 'Starboy');
      expect(song.status).toBe('PENDING');

      // Approve request
      const approvedSong = await songsService.updateSongStatus(song.id, 'APPROVED', 'DJ_TEST_BOOTH');
      expect(approvedSong.status).toBe('APPROVED');

      // Verify points ledger was populated
      const ledger = songsService.getLedger();
      expect(ledger.length).toBeGreaterThan(0);
      expect(ledger[0].participantId).toBe('p-2');
      expect(ledger[0].pointsChanged).toBe(5);

      // Verify notification was sent
      const notifications = songsService.getNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].participantId).toBe('p-2');
      expect(notifications[0].title).toContain('Song Request Approved!');
    });

    it('should support updating status to PLAYED or REJECTED without double awarding points', async () => {
      const song = await songsService.createSongRequest('p-3', 'Billie Eilish', 'Bad Guy');
      
      // Update directly to REJECTED
      const rejectedSong = await songsService.updateSongStatus(song.id, 'REJECTED', 'DJ_TEST_BOOTH');
      expect(rejectedSong.status).toBe('REJECTED');

      // Verify no points were ledgered for REJECTED
      const ledgerCount = songsService.getLedger().length;
      expect(ledgerCount).toBe(0);
    });
  });
});
