import { Controller, Get, Post, Body, Param, Req, UseGuards, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  // --- PARTICIPANT NOTIFICATIONS ---
  @Get('notifications/participant/:participantId')
  @UseGuards(JwtAuthGuard)
  async getNotificationsByParticipant(@Param('participantId') participantId: string) {
    this.logger.log(`Fetching in-app notifications for participant: ${participantId}`);
    return this.telemetryService.getNotificationsByParticipant(participantId);
  }

  @Post('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markNotificationRead(@Param('id') id: string) {
    this.logger.log(`Marking notification ${id} as read`);
    return this.telemetryService.markNotificationRead(id);
  }

  @Post('notifications/participant/:participantId/read-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAllReadByParticipant(@Param('participantId') participantId: string) {
    this.logger.log(`Marking all notifications read for participant: ${participantId}`);
    await this.telemetryService.markAllReadByParticipant(participantId);
    return { success: true };
  }

  // --- SECURITY AUDIT TRAILS ---
  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAuditLogs(
    @Query('severity') severity?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number
  ) {
    this.logger.log(`Admin streaming audit logs. Filters - Severity: ${severity}, Query: ${search}`);
    return this.telemetryService.getAuditLogs(severity, search, limit ? Number(limit) : 100);
  }

  @Post('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async createAuditEvent(@Req() req: any, @Body() data: any) {
    const actorId = req.user?.username || 'Unknown-Admin';
    const role = req.user?.role || 'ADMIN';
    this.logger.log(`Recording manual security audit event: ${data.action} triggered by ${actorId}`);
    return this.telemetryService.logAuditEvent(
      actorId,
      role,
      data.action,
      data.details,
      data.severity || 'INFO',
      data.metadata,
      req.ip
    );
  }

  // --- CLUSTER METRICS TELEMETRY ---
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getLatestMetrics() {
    return this.telemetryService.getLatestMetrics();
  }

  @Post('pulse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async triggerTelemetryPulse() {
    this.logger.log('Triggering automated cluster DevOps telemetry check');
    return this.telemetryService.triggerTelemetryPulse();
  }
}
