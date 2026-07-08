import { Controller, Get, Post, Body, Query, Headers, HttpCode } from '@nestjs/common';
import { DoorPrizeService } from './doorprize.service';
import { ClaimDoorPrizeDto } from './doorprize.entity';

@Controller('sprint10/doorprize')
export class DoorPrizeController {
  constructor(private readonly service: DoorPrizeService) {}

  @Get()
  async getParticipants(
    @Query('search') search?: string,
    @Query('company') company?: string,
    @Query('tier') tier?: 'GOLD' | 'SILVER' | 'BRONZE',
    @Query('claimed') claimed?: string,
  ) {
    const isClaimed = claimed === 'true' ? true : claimed === 'false' ? false : undefined;
    return this.service.getParticipantsList(search, company, tier, isClaimed);
  }

  @Post('claim')
  @HttpCode(201)
  async claimPrize(
    @Body() dto: ClaimDoorPrizeDto,
    @Headers('x-actor-name') actor?: string,
  ) {
    return this.service.claimPrize(dto, actor);
  }

  @Get('logs')
  async getClaimsLogs() {
    return this.service.getClaimsLogs();
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Post('reset')
  @HttpCode(200)
  async resetClaims() {
    await this.service.resetClaims();
    return { success: true, message: 'Door prize claims and state have been reset successfully.' };
  }
}
