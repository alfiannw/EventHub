import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Logger, Query } from '@nestjs/common';
import { QrService } from './qr.service';
import { GenerateQrDto } from './qr.entity';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/qr')
export class QrController {
  private readonly logger = new Logger(QrController.name);

  constructor(private readonly qrService: QrService) {}

  @Get('tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async getAllTickets() {
    this.logger.log('Retrieving full generated QR ticket directory.');
    return this.qrService.getAllTickets();
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async getTicketById(@Param('id') id: string) {
    this.logger.log(`Retrieving QR ticket for ID: ${id}`);
    return this.qrService.getTicketById(id);
  }

  @Get('participant/:participantId')
  @UseGuards(JwtAuthGuard)
  async getTicketsByParticipant(@Param('participantId') participantId: string) {
    this.logger.log(`Retrieving QR tickets belonging to participant: ${participantId}`);
    return this.qrService.getTicketsByParticipant(participantId);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async generateQr(@Req() req: any, @Body() dto: GenerateQrDto) {
    const actor = req.user?.username || 'ADMIN_COORDINATOR';
    this.logger.log(`Generating fresh secure QR token for participant ID: ${dto.participantId} by actor: ${actor}`);
    return this.qrService.generateQr(dto, actor);
  }

  @Put('tickets/:id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async revokeQr(@Req() req: any, @Param('id') id: string) {
    const actor = req.user?.username || 'ADMIN_COORDINATOR';
    this.logger.log(`Revoking and invalidating QR ticket ID: ${id} by administrator: ${actor}`);
    return this.qrService.revokeQr(id, actor);
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanAndValidateQr(@Req() req: any, @Body('code') code: string) {
    const actor = req.user?.username || 'CHECKIN_GATE_PORTAL';
    this.logger.log(`Validating QR Code authentication: "${code}" scan triggered.`);
    return this.qrService.scanAndValidateQr(code, actor);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAuditLogs() {
    this.logger.log('Retrieving telemetry audit trail logs for QR scanner pipeline.');
    return this.qrService.getAuditLogs();
  }
}
