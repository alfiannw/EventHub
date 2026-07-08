import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';
import { GuestImportEntity, ReminderChannel, ReminderInterval } from './invitations.entity';

@Controller('api/invitations')
export class InvitationsController {
  private readonly logger = new Logger(InvitationsController.name);

  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getSettings() {
    this.logger.log('Fetching event configuration settings.');
    return this.invitationsService.getSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async updateSetting(
    @Req() req: any, 
    @Body() body: { key: string; value: string }
  ) {
    const actor = req.user?.username || 'COORDINATOR';
    this.logger.log(`Updating setting: "${body.key}" to "${body.value}" by ${actor}`);
    await this.invitationsService.updateSetting(body.key, body.value, actor);
    return { success: true };
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async bulkImportGuests(
    @Req() req: any, 
    @Body() body: { guests: GuestImportEntity[] }
  ) {
    const actor = req.user?.username || 'COORDINATOR';
    this.logger.log(`Importing guest list in bulk. Count: ${body.guests?.length || 0} by ${actor}`);
    const result = await this.invitationsService.bulkImportGuests(body.guests, actor);
    return { success: true, count: result.length, imported: result };
  }

  @Post('reminders/broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async broadcastReminder(
    @Req() req: any, 
    @Body() body: { channel: ReminderChannel; intervalStage: ReminderInterval }
  ) {
    const actor = req.user?.username || 'COORDINATOR';
    this.logger.log(`Triggering broadcast of reminder stage: ${body.intervalStage} via ${body.channel} by ${actor}`);
    const recipientCount = await this.invitationsService.broadcastReminder(body.channel, body.intervalStage, actor);
    return { success: true, recipientCount };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    this.logger.log('Calculating invitation & RSVP delivery statistics.');
    return this.invitationsService.getStats();
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getReminderLogs() {
    this.logger.log('Retrieving delivery Logs stream for campaigns.');
    return this.invitationsService.getReminderLogs();
  }

  @Get('guests')
  @UseGuards(JwtAuthGuard)
  async getGuestsList() {
    this.logger.log('Retrieving guest roster with RSVP standing.');
    return this.invitationsService.getParticipantsList();
  }
}
