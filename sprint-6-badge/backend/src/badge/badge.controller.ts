import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { CreatePrintJobDto } from './badge.entity';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/badge')
export class BadgeController {
  private readonly logger = new Logger(BadgeController.name);

  constructor(private readonly badgeService: BadgeService) {}

  @Get('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async getAllJobs() {
    this.logger.log('Retrieving total badge printing queues.');
    return this.badgeService.getAllJobs();
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  async getJobById(@Param('id') id: string) {
    this.logger.log(`Retrieving status details for Badge Job: ${id}`);
    return this.badgeService.getJobById(id);
  }

  @Get('participant/:participantId')
  @UseGuards(JwtAuthGuard)
  async getJobsByParticipant(@Param('participantId') participantId: string) {
    this.logger.log(`Retrieving print histories for participant profile: ${participantId}`);
    return this.badgeService.getJobsByParticipant(participantId);
  }

  @Post('print')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async createPrintJob(@Req() req: any, @Body() dto: CreatePrintJobDto) {
    const actor = req.user?.username || 'REGISTRATION_DESK_ADMIN';
    this.logger.log(`Spooling fresh printing ticket for participant: ${dto.participantId} by desk: ${actor}`);
    return this.badgeService.createPrintJob(dto, actor);
  }

  @Put('jobs/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async updatePrintStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('success') success: boolean,
    @Body('failureReason') failureReason?: string
  ) {
    const actor = req.user?.username || 'PRINTER_DAEMON_SPOOL';
    this.logger.log(`Reporting print hardware response for Job ID: ${id} - Success: ${success}`);
    return this.badgeService.processPrintJob(id, success, actor, failureReason);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAuditLogs() {
    this.logger.log('Retrieving telemetry audit records for printing buffer pipelines.');
    return this.badgeService.getAuditLogs();
  }
}
