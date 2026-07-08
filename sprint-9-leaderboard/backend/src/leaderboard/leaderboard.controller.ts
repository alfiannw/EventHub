import { Controller, Get, Post, Body, Query, Headers, HttpCode } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { AdjustScoreDto, ClaimMilestoneDto } from './leaderboard.entity';

@Controller('sprint9/leaderboard')
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('search') search?: string,
    @Query('company') company?: string,
    @Query('tier') tier?: string,
  ) {
    return this.service.getLeaderboard(search, company, tier);
  }

  @Post('adjust')
  async adjustScore(
    @Body() dto: AdjustScoreDto,
    @Headers('x-actor-name') actor?: string,
  ) {
    return this.service.adjustScore(dto, actor);
  }

  @Get('logs')
  async getScoreLogs(@Query('participantId') participantId?: string) {
    return this.service.getScoreLogs(participantId);
  }

  @Get('milestones')
  async getMilestones(@Query('participantId') participantId?: string) {
    return this.service.getMilestones(participantId);
  }

  @Post('milestones/claim')
  @HttpCode(200)
  async claimMilestone(
    @Body() dto: ClaimMilestoneDto,
    @Headers('x-actor-name') actor?: string,
  ) {
    return this.service.claimMilestone(dto, actor);
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Post('reset')
  @HttpCode(200)
  async resetLeaderboard() {
    await this.service.resetLeaderboard();
    return { success: true, message: 'Leaderboard points and adjustment logs reset successfully.' };
  }
}
