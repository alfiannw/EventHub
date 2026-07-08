import { Controller, Get, Post, Query, HttpCode, ParseIntPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('sprint12/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  async getOverview() {
    return this.service.getOverview();
  }

  @Get('timeline')
  async getTimeline() {
    return this.service.getTimeline();
  }

  @Get('distribution')
  async getDistribution() {
    return this.service.getDistribution();
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit?: number,
    @Query('company') company?: string,
  ) {
    const lim = limit ? Number(limit) : 5;
    return this.service.getLeaderboard(lim, company);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('severity') severity?: string,
    @Query('limit') limit?: number,
  ) {
    const lim = limit ? Number(limit) : 10;
    return this.service.getAuditLogs(severity, lim);
  }

  @Post('reset')
  @HttpCode(200)
  async resetData() {
    await this.service.resetData();
    return { success: true, message: 'Analytics database states and seeds reset successfully.' };
  }
}
