import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationDto, UpdateRegistrationDto } from './registration.entity';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/registration')
export class RegistrationController {
  private readonly logger = new Logger(RegistrationController.name);

  constructor(private readonly registrationService: RegistrationService) {}

  @Get('participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async getAllParticipants() {
    this.logger.log('Retrieving full participant directory.');
    return this.registrationService.getAllParticipants();
  }

  @Get('participants/:id')
  @UseGuards(JwtAuthGuard)
  async getParticipantById(@Param('id') id: string) {
    this.logger.log(`Retrieving registration profile for ID: ${id}`);
    return this.registrationService.getParticipantById(id);
  }

  @Get('participants/email/:email')
  async getParticipantByEmail(@Param('email') email: string) {
    this.logger.log(`Checking registration existence for email: ${email}`);
    return this.registrationService.getParticipantByEmail(email);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Req() req: any, @Body() dto: RegistrationDto) {
    const actor = req.user?.username || 'REGISTRATION_PORTAL';
    this.logger.log(`Registering new participant: ${dto.name} (${dto.email}) triggered by ${actor}`);
    return this.registrationService.register(dto, actor);
  }

  @Put('participants/:id')
  @UseGuards(JwtAuthGuard)
  async updateParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationDto
  ) {
    const actor = req.user?.username || id;
    this.logger.log(`Updating participant profile for ID: ${id} by actor: ${actor}`);
    return this.registrationService.update(id, dto, actor);
  }

  @Delete('participants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteParticipant(@Req() req: any, @Param('id') id: string) {
    const actor = req.user?.username || 'ADMIN_COORDINATOR';
    this.logger.log(`Deleting participant ID: ${id} by administrator: ${actor}`);
    await this.registrationService.deleteParticipant(id, actor);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    this.logger.log('Fetching aggregated RSVP & Registration statistics.');
    return this.registrationService.getStats();
  }
}
