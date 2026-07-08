import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SongRequestEntity, SongRequestStatus, ParticipantOverviewEntity } from './songs.entity';

@Injectable()
export class SongsService {
  private songs: SongRequestEntity[] = [];
  
  // Mock participant database for status checks and points awarding
  private participants: ParticipantOverviewEntity[] = [
    { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', currentPoints: 25 },
    { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', currentPoints: 42 },
    { id: 'p-3', name: 'Elena Rostova', email: 'elena.rostova@kaspersky.com', currentPoints: 12 }
  ];

  // In-memory mock audit logs and notifications streams
  private auditLogs: any[] = [];
  private notifications: any[] = [];
  private ledger: any[] = [];

  constructor() {
    this.seedInitialSongs();
  }

  private seedInitialSongs() {
    this.songs.push(
      {
        id: 'song-101',
        participantId: 'p-1',
        artist: 'The Weeknd',
        title: 'Blinding Lights',
        message: 'Play this during the networking break!',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'song-102',
        participantId: 'p-2',
        artist: 'Dua Lipa',
        title: 'Levitating',
        message: 'For Table 4!',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        id: 'song-103',
        participantId: 'p-3',
        artist: 'Daft Punk',
        title: 'One More Time',
        message: 'Let’s close the event with this jam!',
        status: 'PLAYED',
        createdAt: new Date(Date.now() - 5400000)
      }
    );
  }

  // --- SONGS CORE API ---
  async getAllSongs(status?: SongRequestStatus): Promise<SongRequestEntity[]> {
    if (status) {
      return this.songs
        .filter(s => s.status === status)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    return [...this.songs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSongsByParticipant(participantId: string): Promise<SongRequestEntity[]> {
    return this.songs
      .filter(s => s.participantId === participantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSongRequest(participantId: string, artist: string, title: string, message?: string): Promise<SongRequestEntity> {
    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new NotFoundException(`Participant with ID ${participantId} not found.`);
    }

    const song: SongRequestEntity = {
      id: `song-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId,
      artist: artist.trim(),
      title: title.trim(),
      message: message?.trim(),
      status: 'PENDING',
      createdAt: new Date()
    };

    this.songs.unshift(song);

    // Audit log
    this.logAuditEvent('System', 'SYSTEM', 'SONG_REQUESTED', `Participant ${participant.name} requested "${title}" by ${artist}`, 'INFO');
    
    return song;
  }

  async updateSongStatus(songId: string, status: SongRequestStatus, staffActor: string = 'DJ_BOOTH'): Promise<SongRequestEntity> {
    const song = this.songs.find(s => s.id === songId);
    if (!song) {
      throw new NotFoundException(`Song request with ID ${songId} not found.`);
    }

    const prevStatus = song.status;
    if (prevStatus === status) {
      return song; // No change
    }

    song.status = status;

    const participant = this.participants.find(p => p.id === song.participantId);
    const participantName = participant ? participant.name : 'Unknown Participant';

    // Double-entry point trigger: Award points (+5) upon approval
    if (status === 'APPROVED' && prevStatus === 'PENDING') {
      const pointsReward = 5;
      if (participant) {
        participant.currentPoints += pointsReward;
        
        // Ledger entry
        this.ledger.push({
          id: `ledger-${Date.now()}`,
          participantId: song.participantId,
          pointsChanged: pointsReward,
          runningBalance: participant.currentPoints,
          reason: `Approved Song Request: "${song.title}" by ${song.artist}`,
          createdAt: new Date()
        });
      }

      // Generate in-app notification
      this.notifications.push({
        id: `notif-${Date.now()}`,
        participantId: song.participantId,
        title: 'Song Request Approved! 🎵',
        message: `Your song request "${song.title}" was approved. You earned +${pointsReward} points!`,
        isRead: false,
        createdAt: new Date()
      });

      // Log success event to Audit
      this.logAuditEvent(
        staffActor,
        'EVENT_STAFF',
        'SONG_APPROVED',
        `Approved song request "${song.title}" by ${song.artist} for ${participantName}. Awarded ${pointsReward} pts.`,
        'SUCCESS',
        { songId, pointsReward, newBalance: participant?.currentPoints }
      );
    } else {
      // Log generic status changes
      this.logAuditEvent(
        staffActor,
        'EVENT_STAFF',
        'SONG_STATUS_UPDATE',
        `Updated song "${song.title}" status from ${prevStatus} to ${status}.`,
        status === 'REJECTED' ? 'WARNING' : 'INFO',
        { songId, prevStatus, status }
      );
    }

    return song;
  }

  // Helper mock functions
  private logAuditEvent(actorId: string, role: string, action: string, details: string, severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', metadata?: any) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
      actorId,
      role,
      action,
      details,
      severity,
      metadata
    });
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  getLedger() {
    return this.ledger;
  }

  getNotifications() {
    return this.notifications;
  }
}
