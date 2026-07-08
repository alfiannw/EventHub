// =============================================================================
// SPRINT 2: UNIT & INTEGRATION TESTS (JEST)
// TARGET: NestJS EventsService Testing
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventsService } from '../backend/src/events/events.service';

describe('Sprint 2: Event Management & Seating Core Engines', () => {
  let eventsService: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    eventsService = module.get<EventsService>(EventsService);
  });

  describe('Event Profile Creation', () => {
    it('should successfully create an event with correct branding attributes', async () => {
      const data = {
        title: 'Cybersecurity Symposium 2026',
        description: 'Global security standards convention.',
        startTime: new Date('2026-11-15T09:00:00Z'),
        endTime: new Date('2026-11-15T17:00:00Z'),
        venueName: 'Cyber Dome Hall',
        venueAddress: '404 Network Lane, Austin, TX',
        capacity: 300,
        themePreset: 'neon-cyber',
        brandPrimary: '#0A0B10',
        brandSecondary: '#FF007F'
      };

      const result = await eventsService.createEvent('u-1', data);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(data.title);
      expect(result.themePreset).toBe('neon-cyber');
      expect(result.brandSecondary).toBe('#FF007F');
    });

    it('should throw BadRequestException if end time precedes start time', async () => {
      const invalidData = {
        title: 'Invalid Timeline Event',
        startTime: new Date('2026-11-15T17:00:00Z'),
        endTime: new Date('2026-11-15T09:00:00Z'), // backwards
        venueName: 'Reverse Space',
      };

      await expect(
        eventsService.createEvent('u-1', invalidData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Multi-track Sessions / Agenda Schedule', () => {
    it('should register agenda sessions and list them sorted chronologically', async () => {
      const eventId = 'e-1'; // Seeded event ID

      const sessionLater = {
        title: 'Closing Panel Discussion',
        startTime: new Date('2026-09-10T16:00:00Z'),
        endTime: new Date('2026-09-10T17:00:00Z'),
        locationRoom: 'Main Hall',
      };

      const sessionEarlier = {
        title: 'Morning Introductory Coffee',
        startTime: new Date('2026-09-10T08:00:00Z'),
        endTime: new Date('2026-09-10T09:00:00Z'),
        locationRoom: 'Lobby',
      };

      await eventsService.addSession(eventId, sessionLater);
      await eventsService.addSession(eventId, sessionEarlier);

      const allSessions = await eventsService.getSessionsByEvent(eventId);
      
      // Sorted chronologically by startTime, so sessionEarlier should come before sessionLater
      const earlierIdx = allSessions.findIndex(s => s.title === 'Morning Introductory Coffee');
      const laterIdx = allSessions.findIndex(s => s.title === 'Closing Panel Discussion');
      
      expect(earlierIdx).toBeLessThan(laterIdx);
    });
  });

  describe('Seating Configurations & Table generation', () => {
    it('should dynamically generate tables up to requested specifications', async () => {
      const eventId = 'e-1';
      const initialTables = await eventsService.getTablesByEvent(eventId); // seeded with 5
      
      const newTables = await eventsService.generateTables(eventId, 3, 8); // add 3 tables of capacity 8
      
      expect(newTables.length).toBe(3);
      expect(newTables[0].tableNumber).toBe(6); // table number increments based on existing count
      expect(newTables[0].capacity).toBe(8);

      const allTables = await eventsService.getTablesByEvent(eventId);
      expect(allTables.length).toBe(initialTables.length + 3);
    });
  });

  describe('Seating Allocations & Capacity Auditing', () => {
    it('should successfully seat a guest in an unoccupied chair', async () => {
      const tableId = 't-2'; // seeded empty table
      const assignment = await eventsService.assignSeat(tableId, 'u-50', 'Bruce Wayne', 3);

      expect(assignment.guestName).toBe('Bruce Wayne');
      expect(assignment.seatNumber).toBe(3);
    });

    it('should reject guest seat allocation if seat is already occupied', async () => {
      const tableId = 't-1'; // table 1 has guest Sarah Connor at seat 1
      
      await expect(
        eventsService.assignSeat(tableId, 'u-51', 'Clark Kent', 1)
      ).rejects.toThrow(ConflictException);
    });

    it('should reject seating configuration if seat number is out of bounds', async () => {
      const tableId = 't-1'; // table capacity is 8
      
      await expect(
        eventsService.assignSeat(tableId, 'u-52', 'Barry Allen', 9)
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully empty a chair upon unassignment', async () => {
      const tableId = 't-1'; // seat 1 occupied
      await eventsService.unassignSeat(tableId, 1);
      
      const assignments = await eventsService.getSeatingAssignments(tableId);
      const isOccupied = assignments.some(a => a.seatNumber === 1);
      expect(isOccupied).toBe(false);
    });
  });
});
