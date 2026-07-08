import { Controller, Get, Post, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CheckInService } from './checkin.service';
import { CheckInDto } from './checkin.entity';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/checkin')
export class CheckInController {
  private readonly logger = new Logger(CheckInController.name);

  constructor(private readonly checkInService: CheckInService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processCheckIn(@Req() req: any, @Body() dto: CheckInDto) {
    const actor = req.user?.username || dto.scannedBy || 'GATE_SCANNER_APP';
    this.logger.log(`Processing check-in scan for code: "${dto.qrCodeString}" at gate: "${dto.gateName || 'Main Entrance'}" by actor: "${actor}"`);
    return this.checkInService.checkIn({
      ...dto,
      scannedBy: actor
    });
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async getLogs() {
    this.logger.log('Retrieving check-in telemetry audit trail records.');
    return this.checkInService.getLogs();
  }

  @Get('logs/participant/:participantId')
  @UseGuards(JwtAuthGuard)
  async getLogsByParticipant(@Param('participantId') participantId: string) {
    this.logger.log(`Retrieving check-in logs history for participant: "${participantId}"`);
    return this.checkInService.getLogsByParticipant(participantId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async getStats() {
    this.logger.log('Compiling check-in KPIs and gate traffic analytics.');
    return this.checkInService.getStats();
  }
}
