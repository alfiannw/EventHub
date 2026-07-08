// =============================================================================
// SPRINT 6: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS BadgeService Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BadgeService } from '../backend/src/badge/badge.service';

describe('Sprint 6: Badge Template Spooler & Printing Engines', () => {
  let service: BadgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeService],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
  });

  describe('Spooling Queue Registry', () => {
    it('should retrieve pre-seeded print jobs correctly', async () => {
      const jobs = await service.getAllJobs();
      expect(jobs.length).toBeGreaterThanOrEqual(2);
      expect(jobs[0].status).toBe('PRINTED');
    });

    it('should find print jobs by participant ID', async () => {
      const jobs = await service.getJobsByParticipant('p-1');
      expect(jobs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Print Spooler Dispatcher', () => {
    it('should queue a fresh print job with standard defaults', async () => {
      const job = await service.createPrintJob({
        participantId: 'p-4',
        templateType: 'SPEAKER_PASS',
        printerId: 'PRINTER_MAIN_01'
      }, 'Desk_01');

      expect(job.id).toBeDefined();
      expect(job.status).toBe('PENDING');
      expect(job.templateType).toBe('SPEAKER_PASS');
      expect(job.printAttempts).toBe(0);
    });

    it('should reject print job creation if participant ID is missing', async () => {
      await expect(
        service.createPrintJob({ participantId: '' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Hardware Response Callback Processor', () => {
    it('should record successful badge print state and increase attempt counts', async () => {
      const job = await service.createPrintJob({
        participantId: 'p-3',
        templateType: 'EXHIBITOR_MEDIA'
      });

      const processed = await service.processPrintJob(job.id, true, 'PRINTER_MAIN_01');
      expect(processed.status).toBe('PRINTED');
      expect(processed.printAttempts).toBe(1);
      expect(processed.printedAt).toBeDefined();
    });

    it('should record failed print state and log proper error details', async () => {
      const job = await service.createPrintJob({
        participantId: 'p-3',
        templateType: 'EXHIBITOR_MEDIA'
      });

      const failed = await service.processPrintJob(
        job.id, 
        false, 
        'PRINTER_MAIN_01', 
        'Paper sensor trigger failure - Ribbon jam.'
      );

      expect(failed.status).toBe('FAILED');
      expect(failed.printAttempts).toBe(1);
      expect(failed.failureReason).toBe('Paper sensor trigger failure - Ribbon jam.');
    });

    it('should throw NotFoundException on non-existent job ID updates', async () => {
      await expect(
        service.processPrintJob('job-nonexistent', true)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
