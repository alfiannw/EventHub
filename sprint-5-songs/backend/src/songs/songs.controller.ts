import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { SongsService } from './songs.service';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';
import { SongRequestStatus } from './songs.entity';

@Controller('api/songs')
export class SongsController {
  private readonly logger = new Logger(SongsController.name);

  constructor(private readonly songsService: SongsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllSongs(@Query('status') status?: SongRequestStatus) {
    this.logger.log(`Fetching song requests list. Filter status: ${status || 'NONE'}`);
    return this.songsService.getAllSongs(status);
  }

  @Get('participant/:participantId')
  @UseGuards(JwtAuthGuard)
  async getSongsByParticipant(@Param('participantId') participantId: string) {
    this.logger.log(`Fetching song requests submitted by participant: ${participantId}`);
    return this.songsService.getSongsByParticipant(participantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSongRequest(@Req() req: any, @Body() data: any) {
    const participantId = req.user?.id || 'p-1';
    this.logger.log(`Creating song request for participant ${participantId}: "${data.title}" by ${data.artist}`);
    return this.songsService.createSongRequest(participantId, data.artist, data.title, data.message);
  }

  @Post('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  async updateSongStatus(@Req() req: any, @Body() body: { songId: string; status: SongRequestStatus }) {
    const staffActor = req.user?.username || 'DJ_BOOTH';
    this.logger.log(`DJ/Staff updating song request ${body.songId} status to ${body.status}`);
    return this.songsService.updateSongStatus(body.songId, body.status, staffActor);
  }
}
