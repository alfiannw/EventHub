import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus, ParseIntPipe, Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../../sprint-1-auth/backend/src/auth/jwt-auth.guard';
import { RolesGuard } from '../../../sprint-1-auth/backend/src/auth/roles.guard';
import { Roles } from '../../../sprint-1-auth/backend/src/auth/roles.decorator';

@Controller('api/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAllEvents() {
    this.logger.log('Fetching all active events.');
    return this.eventsService.getAllEvents();
  }

  @Get(':id')
  async getEventById(@Param('id') id: string) {
    this.logger.log(`Fetching details for event: ${id}`);
    return this.eventsService.getEventById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Req() req: any, @Body() eventData: any) {
    const organizerId = req.user.id;
    this.logger.log(`Event creation triggered by user: ${organizerId}`);
    return this.eventsService.createEvent(organizerId, eventData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async updateEvent(@Param('id') id: string, @Body() updates: any) {
    this.logger.log(`Updating details for event: ${id}`);
    return this.eventsService.updateEvent(id, updates);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('id') id: string) {
    this.logger.log(`Deleting event: ${id}`);
    await this.eventsService.deleteEvent(id);
  }

  // --- SESSIONS ---
  @Get(':id/sessions')
  async getSessions(@Param('id') id: string) {
    return this.eventsService.getSessionsByEvent(id);
  }

  @Post(':id/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async addSession(@Param('id') eventId: string, @Body() sessionData: any) {
    this.logger.log(`Adding session agenda item to event ${eventId}`);
    return this.eventsService.addSession(eventId, sessionData);
  }

  // --- TABLES & SEATING ---
  @Get(':id/tables')
  async getTables(@Param('id') id: string) {
    const tables = await this.eventsService.getTablesByEvent(id);
    // Enrich tables with their seating assignments
    const enriched = await Promise.all(
      tables.map(async (table) => {
        const assignments = await this.eventsService.getSeatingAssignments(table.id);
        return {
          ...table,
          assignments,
        };
      })
    );
    return enriched;
  }

  @Post(':id/tables')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async generateTables(
    @Param('id') id: string,
    @Body('count') count: number,
    @Body('size') size?: number,
  ) {
    this.logger.log(`Generating ${count} seating tables for event: ${id}`);
    return this.eventsService.generateTables(id, count, size);
  }

  @Post('tables/:tableId/seats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @HttpCode(HttpStatus.CREATED)
  async assignSeat(
    @Param('tableId') tableId: string,
    @Body('guestId') guestId: string,
    @Body('guestName') guestName: string,
    @Body('seatNumber') seatNumber: number,
  ) {
    this.logger.log(`Assigning guest ${guestName} to table ${tableId} at seat ${seatNumber}`);
    return this.eventsService.assignSeat(tableId, guestId, guestName, seatNumber);
  }

  @Delete('tables/:tableId/seats/:seatNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignSeat(
    @Param('tableId') tableId: string,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
  ) {
    this.logger.log(`Unassigning seat ${seatNumber} at table ${tableId}`);
    await this.eventsService.unassignSeat(tableId, seatNumber);
  }
}
