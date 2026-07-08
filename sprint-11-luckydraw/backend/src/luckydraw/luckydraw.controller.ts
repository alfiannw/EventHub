import { Controller, Get, Post, Body, Query, Headers, HttpCode } from '@nestjs/common';
import { LuckyDrawService } from './luckydraw.service';
import { RecordWinnerDto } from './luckydraw.entity';

@Controller('sprint11/luckydraw')
export class LuckyDrawController {
  constructor(private readonly service: LuckyDrawService) {}

  @Get('candidates')
  async getCandidates(
    @Query('search') search?: string,
    @Query('company') company?: string,
  ) {
    return this.service.getCandidatesList(search, company);
  }

  @Post('winner')
  @HttpCode(201)
  async recordWinner(
    @Body() dto: RecordWinnerDto,
    @Headers('x-actor-name') actor?: string,
  ) {
    return this.service.recordWinner(dto, actor);
  }

  @Get('winners')
  async getWinners() {
    return this.service.getWinnersLogs();
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Post('reset')
  @HttpCode(200)
  async resetWinners() {
    await this.service.resetWinners();
    return { success: true, message: 'Lucky draw winners list and state has been reset successfully.' };
  }
}
