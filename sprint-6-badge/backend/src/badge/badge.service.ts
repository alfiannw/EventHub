import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BadgePrintJobEntity, CreatePrintJobDto, BadgeTemplateType, PrintJobStatus } from './badge.entity';

@Injectable()
export class BadgeService {
  // Simulated hardware printing buffer and job registry
  private printJobs: BadgePrintJobEntity[] = [
    {
      id: 'job-1',
      participantId: 'p-1', // Alex Rivera
      templateType: 'STANDARD_PASS',
      printerId: 'PRINTER_MAIN_01',
      printedBy: 'RegistrationDesk_A',
      status: 'PRINTED',
      printAttempts: 1,
      printedAt: new Date(Date.now() - 3600000 * 3),
      createdAt: new Date(Date.now() - 3600000 * 3)
    },
    {
      id: 'job-2',
      participantId: 'p-2', // Sarah Chen
      templateType: 'VIP_GOLD',
      printerId: 'PRINTER_VIP_LOBBY',
      printedBy: 'RegistrationDesk_B',
      status: 'PRINTED',
      printAttempts: 1,
      printedAt: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 3600000)
    }
  ];

  private auditLogs: any[] = [];

  constructor() {
    this.logAuditEvent('SYSTEM', 'PRINTER_DAEMON', 'SERVICE_INITIALIZED', 'Thermal badge printing spooler connected to hardware drivers.', 'INFO');
  }

  async getAllJobs(): Promise<BadgePrintJobEntity[]> {
    return this.printJobs;
  }

  async getJobById(id: string): Promise<BadgePrintJobEntity> {
    const job = this.printJobs.find(j => j.id === id);
    if (!job) {
      throw new NotFoundException(`Print job with ID "${id}" not found.`);
    }
    return job;
  }

  async getJobsByParticipant(participantId: string): Promise<BadgePrintJobEntity[]> {
    return this.printJobs.filter(j => j.participantId === participantId);
  }

  async createPrintJob(dto: CreatePrintJobDto, actor: string = 'REGISTRATION_DESK'): Promise<BadgePrintJobEntity> {
    if (!dto.participantId) {
      throw new BadRequestException('Participant ID is required to generate a badge print job.');
    }

    const newJob: BadgePrintJobEntity = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: dto.participantId,
      templateType: dto.templateType || 'STANDARD_PASS',
      printerId: dto.printerId || 'PRINTER_MAIN_01',
      printedBy: actor,
      status: 'PENDING',
      printAttempts: 0,
      createdAt: new Date()
    };

    this.printJobs.unshift(newJob);

    this.logAuditEvent(
      actor,
      'REGISTRATION',
      'PRINT_JOB_QUEUED',
      `Queued a new ${newJob.templateType} badge for printing on ${newJob.printerId}`,
      'INFO',
      { jobId: newJob.id, participantId: dto.participantId }
    );

    return newJob;
  }

  async processPrintJob(id: string, success: boolean, actor: string = 'PRINTER_SPOOLER', failureReason?: string): Promise<BadgePrintJobEntity> {
    const job = await this.getJobById(id);

    job.printAttempts += 1;

    if (success) {
      job.status = 'PRINTED';
      job.printedAt = new Date();
      job.failureReason = undefined;

      this.logAuditEvent(
        actor,
        'PRINTER',
        'BADGE_PRINT_SUCCESS',
        `Badge successfully printed. Job ID: ${id}, Printer: ${job.printerId}`,
        'SUCCESS',
        { jobId: id, attempts: job.printAttempts }
      );
    } else {
      job.status = 'FAILED';
      job.failureReason = failureReason || 'Printer connection timeout or media jam.';

      this.logAuditEvent(
        actor,
        'PRINTER',
        'BADGE_PRINT_FAILED',
        `Badge printing failed. Reason: ${job.failureReason}`,
        'ERROR',
        { jobId: id, attempts: job.printAttempts }
      );
    }

    return job;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  private logAuditEvent(actorId: string, role: string, action: string, details: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', metadata?: any) {
    this.auditLogs.unshift({
      id: `log-badge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
      actorId,
      role,
      action,
      details,
      severity,
      metadata
    });
  }
}
