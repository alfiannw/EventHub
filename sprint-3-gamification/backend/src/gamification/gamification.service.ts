import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { 
  CompanyEntity, ParticipantEntity, ActivityRuleEntity, 
  ActivitySubmissionEntity, PointTransactionEntity, PrizeCategoryEntity, 
  PrizeEntity, LuckyDrawWinnerEntity, SongRequestEntity, 
  NotificationEntity, AuditLogEntity, ActivitySubmissionStatus, SongRequestStatus 
} from './gamification.entity';

@Injectable()
export class GamificationService {
  private companies: CompanyEntity[] = [];
  private participants: ParticipantEntity[] = [];
  private activityRules: ActivityRuleEntity[] = [];
  private activitySubmissions: ActivitySubmissionEntity[] = [];
  private ledger: PointTransactionEntity[] = [];
  private prizeCategories: PrizeCategoryEntity[] = [];
  private prizes: PrizeEntity[] = [];
  private winners: LuckyDrawWinnerEntity[] = [];
  private songRequests: SongRequestEntity[] = [];
  private notifications: NotificationEntity[] = [];
  private auditLogs: AuditLogEntity[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Companies
    const meta: CompanyEntity = { id: 'c-1', name: 'Meta Platforms Inc.', industry: 'Tech', createdAt: new Date() };
    const google: CompanyEntity = { id: 'c-2', name: 'Google LLC', industry: 'Tech', createdAt: new Date() };
    this.companies.push(meta, google);

    // 2. Seed Activity Rules
    this.activityRules.push(
      { id: 1, activityType: 'CHECK_IN', pointsReward: 5, description: 'Points granted upon QR or manual staff check-in.', createdAt: new Date() },
      { id: 2, activityType: 'SUBMIT_FEEDBACK', pointsReward: 5, description: 'Guest submits qualitative event feedback form.', createdAt: new Date() },
      { id: 3, activityType: 'SHARE_PHOTO', pointsReward: 5, description: 'Guest uploads photo proof of attendance.', createdAt: new Date() },
      { id: 4, activityType: 'INSTAGRAM_POST', pointsReward: 5, description: 'Guest shares story/post with event hashtag.', createdAt: new Date() },
      { id: 5, activityType: 'SONG_REQUEST', pointsReward: 5, description: 'Awarded points upon song request approval.', createdAt: new Date() },
      { id: 6, activityType: 'VIP_REGISTRATION', pointsReward: 10, description: 'Bonus award granted to designated key VIP profiles.', createdAt: new Date() }
    );

    // 3. Seed Participants
    const p1: ParticipantEntity = {
      id: 'p-1',
      companyId: 'c-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@meta.com',
      phone: '+1 (555) 123-4567',
      position: 'Senior Staff Engineer',
      qrCodeHash: 'QR_EH_1001_ALEX_RIVERA',
      checkedIn: true,
      checkedInAt: new Date(),
      currentPoints: 25,
      createdAt: new Date()
    };
    const p2: ParticipantEntity = {
      id: 'p-2',
      companyId: 'c-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@google.com',
      phone: '+1 (555) 987-6543',
      position: 'VP of Product Development',
      qrCodeHash: 'QR_EH_1002_SARAH_CHEN',
      checkedIn: true,
      checkedInAt: new Date(),
      currentPoints: 15,
      createdAt: new Date()
    };
    const p3: ParticipantEntity = {
      id: 'p-3',
      name: 'Elena Rostova',
      email: 'elena.rostova@jetbrains.com',
      qrCodeHash: 'QR_EH_1004_ELENA_ROSTOVA',
      checkedIn: false,
      currentPoints: 0,
      createdAt: new Date()
    };
    this.participants.push(p1, p2, p3);

    // 4. Seed Prize Categories (Bronze, Silver, Gold)
    const bronzeCat: PrizeCategoryEntity = { id: 'pc-1', name: 'Bronze Tier Selections', eligiblePointsMin: 0, tierLevel: 1, createdAt: new Date() };
    const silverCat: PrizeCategoryEntity = { id: 'pc-2', name: 'Silver Tier Selections', eligiblePointsMin: 11, tierLevel: 2, createdAt: new Date() };
    const goldCat: PrizeCategoryEntity = { id: 'pc-3', name: 'Gold Tier Selections', eligiblePointsMin: 21, tierLevel: 3, createdAt: new Date() };
    this.prizeCategories.push(bronzeCat, silverCat, goldCat);

    // 5. Seed Prizes
    this.prizes.push(
      { id: 'prz-1', categoryId: 'pc-3', name: 'Apple MacBook Pro 16"', totalQuantity: 1, remainingQuantity: 1, createdAt: new Date() },
      { id: 'prz-2', categoryId: 'pc-2', name: 'Apple iPad Pro 11"', totalQuantity: 2, remainingQuantity: 2, createdAt: new Date() },
      { id: 'prz-3', categoryId: 'pc-1', name: 'Sony WH-1000XM5 Headphones', totalQuantity: 3, remainingQuantity: 3, createdAt: new Date() }
    );

    // 6. Seed Point Ledger Entries for existing points
    this.ledger.push(
      { id: 'tx-1', participantId: 'p-1', pointsChanged: 5, runningBalance: 5, reason: 'Initial check-in points', createdAt: new Date() },
      { id: 'tx-2', participantId: 'p-1', pointsChanged: 20, runningBalance: 25, reason: 'Manual spot award', createdAt: new Date() },
      { id: 'tx-3', participantId: 'p-2', pointsChanged: 5, runningBalance: 5, reason: 'Initial check-in points', createdAt: new Date() },
      { id: 'tx-4', participantId: 'p-2', pointsChanged: 10, runningBalance: 15, reason: 'Feedback submission', createdAt: new Date() }
    );
  }

  // --- PARTICIPANT MANAGEMENT & CHECK-IN ---
  async registerParticipant(data: Partial<ParticipantEntity>): Promise<ParticipantEntity> {
    if (!data.name || !data.email) {
      throw new BadRequestException('Name and email are required for registration.');
    }

    const emailLower = data.email.toLowerCase();
    const existing = this.participants.find(p => p.email.toLowerCase() === emailLower);
    if (existing) {
      throw new ConflictException(`A participant with email ${data.email} already exists.`);
    }

    const id = `p-${Date.now()}`;
    const qrCodeHash = `QR_${id}_${Math.floor(Math.random() * 100000)}`;

    const newParticipant: ParticipantEntity = {
      id,
      companyId: data.companyId,
      tableId: data.tableId,
      seatNumber: data.seatNumber,
      name: data.name,
      email: emailLower,
      phone: data.phone,
      position: data.position,
      avatarUrl: data.avatarUrl,
      qrCodeHash,
      checkedIn: false,
      currentPoints: 0,
      createdAt: new Date()
    };

    this.participants.push(newParticipant);
    this.addAuditLog('System', 'System Engine', 'PARTICIPANT_REGISTERED', `Registered participant ${data.name} (${emailLower})`, 'INFO');
    return newParticipant;
  }

  async checkInParticipant(participantId: string, staffActor: string = 'Staff-Checkin'): Promise<ParticipantEntity> {
    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new NotFoundException(`Participant with ID ${participantId} not found.`);
    }

    if (participant.checkedIn) {
      throw new ConflictException(`Participant is already checked in.`);
    }

    participant.checkedIn = true;
    participant.checkedInAt = new Date();

    // Award check-in points using Point Ledger
    const checkInRule = this.activityRules.find(r => r.activityType === 'CHECK_IN');
    const points = checkInRule ? checkInRule.pointsReward : 5;

    await this.postLedgerTransaction(participantId, points, `Check-in points awarded by ${staffActor}`);

    this.addAuditLog(staffActor, 'Event Staff', 'PARTICIPANT_CHECKIN', `Checked in participant ${participant.name} and awarded ${points} pts.`, 'SUCCESS');
    return participant;
  }

  async getParticipantById(id: string): Promise<ParticipantEntity> {
    const participant = this.participants.find(p => p.id === id);
    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found.`);
    }
    return participant;
  }

  async getLeaderboard(): Promise<ParticipantEntity[]> {
    return [...this.participants].sort((a, b) => b.currentPoints - a.currentPoints);
  }

  // --- DOUBLE-ENTRY POINTS LEDGER ---
  async postLedgerTransaction(
    participantId: string, 
    pointsChanged: number, 
    reason: string, 
    submissionId?: string
  ): Promise<PointTransactionEntity> {
    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new NotFoundException(`Participant with ID ${participantId} not found.`);
    }

    const newBalance = participant.currentPoints + pointsChanged;
    if (newBalance < 0) {
      throw new BadRequestException(`Ledger transaction failed: point balance cannot drop below zero.`);
    }

    // Atomic update
    participant.currentPoints = newBalance;

    const transaction: PointTransactionEntity = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      participantId,
      submissionId,
      pointsChanged,
      runningBalance: newBalance,
      reason,
      createdAt: new Date()
    };

    this.ledger.push(transaction);
    return transaction;
  }

  async getLedgerByParticipant(participantId: string): Promise<PointTransactionEntity[]> {
    await this.getParticipantById(participantId); // Validate participant exists
    return this.ledger
      .filter(t => t.participantId === participantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // --- ACTIVITY SUBMISSIONS & MODERATION ---
  async submitActivity(
    participantId: string, 
    activityType: string, 
    submissionText?: string, 
    submissionMediaUrl?: string
  ): Promise<ActivitySubmissionEntity> {
    const participant = await this.getParticipantById(participantId);
    
    const rule = this.activityRules.find(r => r.activityType === activityType);
    if (!rule) {
      throw new BadRequestException(`Invalid activity type: ${activityType}`);
    }

    const id = `act-${Date.now()}`;
    const autoApproved = activityType === 'SUBMIT_FEEDBACK' || activityType === 'CHECK_IN';

    const submission: ActivitySubmissionEntity = {
      id,
      participantId,
      activityRuleId: rule.id,
      submissionText,
      submissionMediaUrl,
      status: autoApproved ? 'APPROVED' : 'PENDING',
      createdAt: new Date()
    };

    this.activitySubmissions.push(submission);

    if (autoApproved) {
      await this.postLedgerTransaction(
        participantId, 
        rule.pointsReward, 
        `Auto-approved points for ${activityType}`, 
        id
      );
      this.addAuditLog('System', 'System Engine', 'ACTIVITY_AUTO_APPROVED', `Auto-approved activity submission for ${participant.name}`, 'SUCCESS');
    } else {
      this.addAuditLog('Participant', 'Event Participant', 'ACTIVITY_SUBMISSION', `${participant.name} submitted proof for ${activityType}`, 'INFO');
    }

    return submission;
  }

  async getSubmissionsByEvent(): Promise<ActivitySubmissionEntity[]> {
    return this.activitySubmissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async moderateActivity(
    submissionId: string, 
    status: 'APPROVED' | 'REJECTED', 
    staffActor: string = 'Staff-Moderator'
  ): Promise<ActivitySubmissionEntity> {
    const submission = this.activitySubmissions.find(s => s.id === submissionId);
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found.`);
    }

    if (submission.status !== 'PENDING') {
      throw new ConflictException(`Activity submission has already been processed.`);
    }

    submission.status = status;
    submission.reviewedBy = staffActor;
    submission.reviewedAt = new Date();

    const participant = await this.getParticipantById(submission.participantId);
    const rule = this.activityRules.find(r => r.id === submission.activityRuleId);

    if (status === 'APPROVED' && rule) {
      await this.postLedgerTransaction(
        submission.participantId, 
        rule.pointsReward, 
        `Approved ${rule.activityType} proof by ${staffActor}`, 
        submission.id
      );
      this.addAuditLog(staffActor, 'Event Staff', 'ACTIVITY_APPROVAL', `Approved ${rule.activityType} submission for ${participant.name}.`, 'SUCCESS');
    } else {
      this.addAuditLog(staffActor, 'Event Staff', 'ACTIVITY_REJECT', `Rejected ${rule?.activityType || 'unknown'} submission for ${participant.name}.`, 'WARNING');
    }

    return submission;
  }

  // --- DOOR PRIZE & LUCKY DRAW CORE ENGINE ---
  async getEligibleDoorPrizeTier(participantId: string): Promise<PrizeCategoryEntity> {
    const participant = await this.getParticipantById(participantId);
    const checkedIn = participant.checkedIn;
    const points = participant.currentPoints;

    if (!checkedIn) {
      throw new BadRequestException('Participant must be checked-in to be eligible for door prizes.');
    }

    // Find the highest eligible category where points >= category.eligiblePointsMin
    const sortedCategories = [...this.prizeCategories].sort((a, b) => b.eligiblePointsMin - a.eligiblePointsMin);
    const eligible = sortedCategories.find(c => points >= c.eligiblePointsMin);
    
    if (!eligible) {
      throw new NotFoundException('No eligible prize category tier found for current point balance.');
    }

    return eligible;
  }

  // Random drawing with pessimistic-locking replication to prevent duplicates and race conditions
  // (Utilizes an atomic in-memory block to ensure single winner per participant)
  async drawLuckyDrawWinner(categoryId: string, staffActor: string = 'Staff-Spinner'): Promise<LuckyDrawWinnerEntity> {
    const category = this.prizeCategories.find(c => c.id === categoryId);
    if (!category) {
      throw new NotFoundException(`Prize Category with ID ${categoryId} not found.`);
    }

    // Find a prize in this category that has remaining inventory
    const prize = this.prizes.find(p => p.categoryId === categoryId && p.remainingQuantity > 0);
    if (!prize) {
      throw new BadRequestException(`No active prizes with available remaining quantities found under category: ${category.name}.`);
    }

    // Pessimistic filter on candidates:
    // 1. Checked-in
    // 2. Points >= category.eligiblePointsMin
    // 3. Has NOT won any prize in the entire event yet (single-prize constraint)
    const wonParticipantIds = new Set(this.winners.map(w => w.participantId));
    const candidates = this.participants.filter(p => {
      return p.checkedIn && p.currentPoints >= category.eligiblePointsMin && !wonParticipantIds.has(p.id);
    });

    if (candidates.length === 0) {
      throw new BadRequestException(`No eligible checked-in participants matching point threshold ${category.eligiblePointsMin} points who haven't won yet.`);
    }

    // Pick random candidate
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winnerParticipant = candidates[randomIndex];

    // Atomic locks simulated: decrement prize remaining
    prize.remainingQuantity -= 1;

    const winnerRecord: LuckyDrawWinnerEntity = {
      id: `win-${Date.now()}`,
      participantId: winnerParticipant.id,
      prizeId: prize.id,
      drawnAt: new Date()
    };

    this.winners.push(winnerRecord);

    // Create a system-wide notification for the participant
    this.createNotification(
      winnerParticipant.id, 
      'LUCKY DRAW WINNER!', 
      `Congratulations! You have won the "${prize.name}" prize under the ${category.name} draw.`
    );

    this.addAuditLog(
      staffActor, 
      'Event Manager', 
      'LUCKY_DRAW_WINNER', 
      `Drawn winner: ${winnerParticipant.name} won "${prize.name}" under ${category.name}!`, 
      'SUCCESS'
    );

    return winnerRecord;
  }

  async getWinners(): Promise<any[]> {
    return this.winners.map(w => {
      const p = this.participants.find(part => part.id === w.participantId);
      const prize = this.prizes.find(prz => prz.id === w.prizeId);
      const cat = prize ? this.prizeCategories.find(c => c.id === prize.categoryId) : null;
      return {
        id: w.id,
        participantId: w.participantId,
        participantName: p ? p.name : 'Unknown',
        participantEmail: p ? p.email : 'Unknown',
        prizeId: w.prizeId,
        prizeName: prize ? prize.name : 'Unknown',
        categoryName: cat ? cat.name : 'Unknown',
        drawnAt: w.drawnAt
      };
    });
  }

  // --- SONG REQUEST BOARD ---
  async addSongRequest(participantId: string, artist: string, title: string, message?: string): Promise<SongRequestEntity> {
    const participant = await this.getParticipantById(participantId);
    if (!participant.checkedIn) {
      throw new BadRequestException('Must be checked-in to request a song.');
    }

    if (!artist || !title) {
      throw new BadRequestException('Artist and title are required for song request.');
    }

    const request: SongRequestEntity = {
      id: `song-${Date.now()}`,
      participantId,
      artist,
      title,
      message,
      status: 'PENDING',
      createdAt: new Date()
    };

    this.songRequests.push(request);
    this.addAuditLog('Participant', 'Event Participant', 'SONG_REQUEST_SUBMIT', `Song requested: "${title}" by ${artist} by ${participant.name}.`, 'INFO');
    return request;
  }

  async getAllSongRequests(): Promise<SongRequestEntity[]> {
    return this.songRequests.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async moderateSongRequest(songId: string, status: SongRequestStatus, staffActor: string = 'Staff-Band'): Promise<SongRequestEntity> {
    const song = this.songRequests.find(s => s.id === songId);
    if (!song) {
      throw new NotFoundException(`Song request with ID ${songId} not found.`);
    }

    const prevStatus = song.status;
    song.status = status;

    const participant = await this.getParticipantById(song.participantId);

    // Award points if status transitions to APPROVED for the first time
    if (status === 'APPROVED' && prevStatus !== 'APPROVED' && prevStatus !== 'PLAYED') {
      const songRule = this.activityRules.find(r => r.activityType === 'SONG_REQUEST');
      const points = songRule ? songRule.pointsReward : 5;

      await this.postLedgerTransaction(
        song.participantId, 
        points, 
        `Approved song request points: "${song.title}" by ${song.artist}`
      );

      this.createNotification(
        song.participantId, 
        'Song Request Approved!', 
        `Your song request "${song.title}" has been approved by the live band. Keep rockin'!`
      );

      this.addAuditLog(staffActor, 'Event Staff', 'SONG_APPROVED', `Approved song request for ${participant.name} and awarded ${points} points.`, 'SUCCESS');
    } else {
      this.addAuditLog(staffActor, 'Event Staff', 'SONG_STATUS_CHANGE', `Changed song status for "${song.title}" to ${status}`, 'INFO');
    }

    return song;
  }

  // --- PARTICIPANT NOTIFICATIONS ---
  createNotification(participantId: string, title: string, message: string): NotificationEntity {
    const notification: NotificationEntity = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId,
      title,
      message,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.push(notification);
    return notification;
  }

  async getNotificationsByParticipant(participantId: string): Promise<NotificationEntity[]> {
    await this.getParticipantById(participantId); // Validate participant
    return this.notifications
      .filter(n => n.participantId === participantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (!notif) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found.`);
    }
    notif.isRead = true;
  }

  // --- TELEMETRY AUDIT LEDGER ---
  addAuditLog(actorId: string, role: string, action: string, details: string, severity: AuditLogEntity['severity']) {
    const log: AuditLogEntity = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId,
      role,
      action,
      severity,
      details,
      timestamp: new Date()
    };
    this.auditLogs.unshift(log);
  }

  async getAuditLogs(): Promise<AuditLogEntity[]> {
    return this.auditLogs;
  }
}
