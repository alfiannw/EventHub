import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventEntity, EventSessionEntity, EventTableEntity, SeatingAssignmentEntity, EventStatus } from './event.entity';

@Injectable()
export class EventsService {
  private eventsTable: EventEntity[] = [];
  private sessionsTable: EventSessionEntity[] = [];
  private tablesTable: EventTableEntity[] = [];
  private assignmentsTable: SeatingAssignmentEntity[] = [];

  constructor() {
    this.seedInitialEvents();
  }

  private seedInitialEvents() {
    const defaultEvent: EventEntity = {
      id: 'e-1',
      organizerId: 'u-1',
      title: 'Global Tech Summit 2026',
      description: 'The premier annual developer ecosystem and SaaS platform symposium.',
      startTime: new Date('2026-09-10T09:00:00Z'),
      endTime: new Date('2026-09-11T18:00:00Z'),
      venueName: 'Metropolitan Convention Hall',
      venueAddress: '100 Silicon Valley Blvd, San Jose, CA',
      capacity: 500,
      status: 'PUBLISHED',
      themePreset: 'modern-slate',
      brandPrimary: '#141414',
      brandSecondary: '#00FF00',
      coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionA: EventSessionEntity = {
      id: 's-1',
      eventId: 'e-1',
      title: 'Keynote: Scalable Distributed Ledger Infrastructures',
      description: 'Unlocking sub-millisecond latencies under concurrent global workflows.',
      speakerName: 'Dr. Evelyn Martinez',
      speakerTitle: 'Chief Scientist, Quantum Systems',
      speakerBio: 'Evelyn holds 14 patents on distributed database consensus models.',
      locationRoom: 'Grand Ballroom A',
      startTime: new Date('2026-09-10T10:00:00Z'),
      endTime: new Date('2026-09-10T11:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionB: EventSessionEntity = {
      id: 's-2',
      eventId: 'e-1',
      title: 'Workshop: Advanced NestJS Architectures & CQRS',
      description: 'Structuring massive microservice endpoints without dependency noise.',
      speakerName: 'Kamil Mysliwiec',
      speakerTitle: 'Creator of NestJS Framework',
      locationRoom: 'Hackerspace Lab 4',
      startTime: new Date('2026-09-10T13:00:00Z'),
      endTime: new Date('2026-09-10T15:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.eventsTable.push(defaultEvent);
    this.sessionsTable.push(sessionA, sessionB);

    // Seed 5 tables for the seating chart demo
    for (let i = 1; i <= 5; i++) {
      this.tablesTable.push({
        id: `t-${i}`,
        eventId: 'e-1',
        tableName: i === 1 ? 'VIP Board Table' : `General Attendee Table ${i}`,
        tableNumber: i,
        capacity: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Seed some initial seating assignments
    this.assignmentsTable.push({
      id: 'sa-1',
      tableId: 't-1',
      guestId: 'u-2',
      guestName: 'Sarah Connor',
      seatNumber: 1,
      createdAt: new Date(),
    });
    this.assignmentsTable.push({
      id: 'sa-2',
      tableId: 't-1',
      guestId: 'u-3',
      guestName: 'John Doe',
      seatNumber: 2,
      createdAt: new Date(),
    });
  }

  // --- EVENTS CRUD ---
  async createEvent(organizerId: string, data: Partial<EventEntity>): Promise<EventEntity> {
    if (!data.title || !data.startTime || !data.endTime || !data.venueName) {
      throw new BadRequestException('Required event parameters missing: title, dates, and venue.');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (end <= start) {
      throw new BadRequestException('Event end time must follow the start time.');
    }

    const newEvent: EventEntity = {
      id: `e-${Date.now()}`,
      organizerId,
      title: data.title,
      description: data.description || '',
      startTime: start,
      endTime: end,
      venueName: data.venueName,
      venueAddress: data.venueAddress || '',
      capacity: data.capacity || 100,
      status: 'DRAFT',
      themePreset: data.themePreset || 'modern-slate',
      brandPrimary: data.brandPrimary || '#141414',
      brandSecondary: data.brandSecondary || '#00FF00',
      coverImageUrl: data.coverImageUrl,
      logoUrl: data.logoUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.eventsTable.push(newEvent);
    return newEvent;
  }

  async getAllEvents(): Promise<EventEntity[]> {
    return this.eventsTable;
  }

  async getEventById(id: string): Promise<EventEntity> {
    const event = this.eventsTable.find(e => e.id === id);
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found.`);
    }
    return event;
  }

  async updateEvent(id: string, updates: Partial<EventEntity>): Promise<EventEntity> {
    const event = await this.getEventById(id);
    const updated = {
      ...event,
      ...updates,
      updatedAt: new Date(),
    } as EventEntity;

    const index = this.eventsTable.findIndex(e => e.id === id);
    this.eventsTable[index] = updated;
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    const index = this.eventsTable.findIndex(e => e.id === id);
    if (index === -1) {
      throw new NotFoundException(`Event with ID ${id} not found.`);
    }
    this.eventsTable.splice(index, 1);
    // Cleanup related structures
    this.sessionsTable = this.sessionsTable.filter(s => s.eventId !== id);
    const tableIds = this.tablesTable.filter(t => t.eventId === id).map(t => t.id);
    this.tablesTable = this.tablesTable.filter(t => t.eventId !== id);
    this.assignmentsTable = this.assignmentsTable.filter(a => !tableIds.includes(a.tableId));
  }

  // --- SESSIONS (AGENDA) ---
  async addSession(eventId: string, sessionData: Partial<EventSessionEntity>): Promise<EventSessionEntity> {
    await this.getEventById(eventId); // Validate event exists

    if (!sessionData.title || !sessionData.startTime || !sessionData.endTime) {
      throw new BadRequestException('Session title, start and end times are required.');
    }

    const start = new Date(sessionData.startTime);
    const end = new Date(sessionData.endTime);
    if (end <= start) {
      throw new BadRequestException('Session end time must follow the start time.');
    }

    const newSession: EventSessionEntity = {
      id: `s-${Date.now()}`,
      eventId,
      title: sessionData.title,
      description: sessionData.description || '',
      speakerName: sessionData.speakerName,
      speakerTitle: sessionData.speakerTitle,
      speakerBio: sessionData.speakerBio,
      speakerAvatar: sessionData.speakerAvatar,
      locationRoom: sessionData.locationRoom || 'Main Stage',
      startTime: start,
      endTime: end,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessionsTable.push(newSession);
    return newSession;
  }

  async getSessionsByEvent(eventId: string): Promise<EventSessionEntity[]> {
    return this.sessionsTable
      .filter(s => s.eventId === eventId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // --- SEATING / TABLES STRUCTURES ---
  async generateTables(eventId: string, count: number, size: number = 10): Promise<EventTableEntity[]> {
    await this.getEventById(eventId);

    const generated: EventTableEntity[] = [];
    const existingCount = this.tablesTable.filter(t => t.eventId === eventId).length;

    for (let i = 1; i <= count; i++) {
      const tableNumber = existingCount + i;
      const newTable: EventTableEntity = {
        id: `t-${eventId}-${tableNumber}-${Date.now()}`,
        eventId,
        tableName: `Table ${tableNumber}`,
        tableNumber,
        capacity: size,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.tablesTable.push(newTable);
      generated.push(newTable);
    }

    return generated;
  }

  async getTablesByEvent(eventId: string): Promise<EventTableEntity[]> {
    return this.tablesTable
      .filter(t => t.eventId === eventId)
      .sort((a, b) => a.tableNumber - b.tableNumber);
  }

  async getSeatingAssignments(tableId: string): Promise<SeatingAssignmentEntity[]> {
    return this.assignmentsTable.filter(a => a.tableId === tableId);
  }

  async assignSeat(tableId: string, guestId: string, guestName: string, seatNumber: number): Promise<SeatingAssignmentEntity> {
    const table = this.tablesTable.find(t => t.id === tableId);
    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found.`);
    }

    if (seatNumber < 1 || seatNumber > table.capacity) {
      throw new BadRequestException(`Invalid seat number. Must be between 1 and ${table.capacity}.`);
    }

    // Check if seat is already occupied
    const seatOccupied = this.assignmentsTable.find(a => a.tableId === tableId && a.seatNumber === seatNumber);
    if (seatOccupied) {
      throw new ConflictException(`Seat ${seatNumber} at ${table.tableName} is already occupied.`);
    }

    // Check if guest is already seated at this table
    const guestAlreadySeated = this.assignmentsTable.find(a => a.tableId === tableId && a.guestId === guestId);
    if (guestAlreadySeated) {
      throw new BadRequestException(`Guest is already assigned to seat ${guestAlreadySeated.seatNumber} at this table.`);
    }

    const assignment: SeatingAssignmentEntity = {
      id: `sa-${Date.now()}`,
      tableId,
      guestId,
      guestName,
      seatNumber,
      createdAt: new Date(),
    };

    this.assignmentsTable.push(assignment);
    return assignment;
  }

  async unassignSeat(tableId: string, seatNumber: number): Promise<void> {
    const index = this.assignmentsTable.findIndex(a => a.tableId === tableId && a.seatNumber === seatNumber);
    if (index === -1) {
      throw new NotFoundException(`No active seating assignment found at seat ${seatNumber}.`);
    }
    this.assignmentsTable.splice(index, 1);
  }
}
