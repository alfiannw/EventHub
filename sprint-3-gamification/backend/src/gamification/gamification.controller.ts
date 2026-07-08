import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Logger, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/gamification')
export class GamificationController {
  private readonly logger = new Logger(GamificationController.name);

  constructor(private readonly gamificationService: GamificationService) {}

  // --- LEADERS & PARTICIPANTS ---
  @Get('leaderboard')
  async getLeaderboard() {
    this.logger.log('Fetching active checked-in leaderboard standings');
    return this.gamificationService.getLeaderboard();
  }

  @Post('participants')
  @HttpCode(HttpStatus.CREATED)
  async registerParticipant(@Body() data: any) {
    this.logger.log(`Registering new participant: ${data.email}`);
    return this.gamificationService.registerParticipant(data);
  }

  @Post('participants/:id/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'MANAGER')
  async checkInParticipant(@Param('id') id: string, @Req() req: any) {
    const staffActor = req.user?.username || 'Staff-Desk';
    this.logger.log(`Checking in participant ${id} triggered by ${staffActor}`);
    return this.gamificationService.checkInParticipant(id, staffActor);
  }

  // --- DOUBLE ENTRY LEDGER ---
  @Get('participants/:id/ledger')
  @UseGuards(JwtAuthGuard)
  async getLedger(@Param('id') participantId: string) {
    this.logger.log(`Fetching points ledger history for participant: ${participantId}`);
    return this.gamificationService.getLedgerByParticipant(participantId);
  }

  // --- ACTIVITIES & MODERATION ---
  @Post('activities/submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async submitActivity(@Req() req: any, @Body() data: any) {
    const participantId = req.user.id;
    this.logger.log(`Activity submission from participant ${participantId} for ${data.activityType}`);
    return this.gamificationService.submitActivity(
      participantId, 
      data.activityType, 
      data.submissionText, 
      data.submissionMediaUrl
    );
  }

  @Get('activities/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async getSubmissions() {
    this.logger.log('Retrieving complete activity submission moderation list');
    return this.gamificationService.getSubmissionsByEvent();
  }

  @Post('activities/submissions/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async moderateActivity(
    @Param('id') submissionId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Req() req: any
  ) {
    const staffActor = req.user?.username || 'Staff-Moderator';
    this.logger.log(`Moderating submission ${submissionId} to ${status} by ${staffActor}`);
    return this.gamificationService.moderateActivity(submissionId, status, staffActor);
  }

  // --- LUCKY DRAW ---
  @Get('participants/:id/door-prize-tier')
  @UseGuards(JwtAuthGuard)
  async getEligibleDoorPrizeTier(@Param('id') participantId: string) {
    this.logger.log(`Auditing eligible door prize category tier for participant: ${participantId}`);
    return this.gamificationService.getEligibleDoorPrizeTier(participantId);
  }

  @Post('lucky-draw/draw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async drawLuckyDrawWinner(@Body('categoryId') categoryId: string, @Req() req: any) {
    const managerActor = req.user?.username || 'Manager-Spinner';
    this.logger.log(`Drawing lucky draw winner for Category: ${categoryId} by ${managerActor}`);
    return this.gamificationService.drawLuckyDrawWinner(categoryId, managerActor);
  }

  @Get('lucky-draw/winners')
  async getWinners() {
    return this.gamificationService.getWinners();
  }

  // --- SONG REQUESTS ---
  @Post('songs/request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addSongRequest(@Req() req: any, @Body() data: any) {
    const participantId = req.user.id;
    this.logger.log(`Participant ${participantId} requesting song: "${data.title}" by ${data.artist}`);
    return this.gamificationService.addSongRequest(participantId, data.artist, data.title, data.message);
  }

  @Get('songs')
  async getAllSongRequests() {
    return this.gamificationService.getAllSongRequests();
  }

  @Post('songs/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  async moderateSongRequest(
    @Param('id') songId: string,
    @Body('status') status: 'PENDING' | 'APPROVED' | 'PLAYED' | 'REJECTED',
    @Req() req: any
  ) {
    const staffActor = req.user?.username || 'Staff-Band';
    this.logger.log(`Moderating song request ${songId} to status ${status} by ${staffActor}`);
    return this.gamificationService.moderateSongRequest(songId, status, staffActor);
  }

  // --- NOTIFICATIONS ---
  @Get('participants/:id/notifications')
  @UseGuards(JwtAuthGuard)
  async getNotificationsByParticipant(@Param('id') participantId: string) {
    return this.gamificationService.getNotificationsByParticipant(participantId);
  }

  @Post('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markNotificationRead(@Param('id') notificationId: string) {
    await this.gamificationService.markNotificationRead(notificationId);
    return { success: true };
  }
}
