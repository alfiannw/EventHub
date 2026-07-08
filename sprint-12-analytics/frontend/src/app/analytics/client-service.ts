import { 
  AnalyticsOverviewDto, 
  AnalyticsTimelineDto, 
  AnalyticsDistributionDto, 
  LeaderboardRowDto, 
  AuditLogRowDto 
} from '../../../../backend/src/analytics/analytics.entity';

export class ClientAnalyticsService {
  private participants: any[] = [];
  private auditLogs: AuditLogRowDto[] = [];
  private timelines: AnalyticsTimelineDto[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const storedParticipants = localStorage.getItem('eh_luckydraw_participants');
      const storedWinners = localStorage.getItem('eh_luckydraw_winners');
      
      if (storedParticipants) {
        this.participants = JSON.parse(storedParticipants);
      } else {
        // Fallback seed
        this.participants = [
          { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', company: 'Meta Platforms Inc.', position: 'Senior Staff Engineer', points: 25, checkedIn: true, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', rsvpStatus: 'YES' },
          { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', company: 'Google LLC', position: 'VP of Product Development', points: 15, checkedIn: true, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', rsvpStatus: 'YES' },
          { id: 'p-3', name: 'Marcus Aurelius', email: 'marcus.a@netflix.com', company: 'Netflix Inc.', position: 'Director of Engineering', points: 5, checkedIn: true, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', rsvpStatus: 'YES' },
          { id: 'p-4', name: 'Kofi Mensah', email: 'k.mensah@stripe.com', company: 'Stripe Inc.', position: 'Principal Product Designer', points: 30, checkedIn: true, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', rsvpStatus: 'YES' },
          { id: 'p-5', name: 'Elena Rostova', email: 'elena.rostova@jetbrains.com', company: 'JetBrains s.r.o.', position: 'Developer Advocate', points: 0, checkedIn: false, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', rsvpStatus: 'NO' },
          { id: 'p-6', name: 'Yuki Tanaka', email: 'tanaka.yuki@sony.co.jp', company: 'Sony Corporation', position: 'Lead UI Designer', points: 10, checkedIn: true, avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', rsvpStatus: 'YES' }
        ];
        localStorage.setItem('eh_luckydraw_participants', JSON.stringify(this.participants));
      }

      const parsedWinners = storedWinners ? JSON.parse(storedWinners) : [];

      // Initial audit log seeds if empty
      const storedLogs = localStorage.getItem('eh_analytics_audit_logs');
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs);
      } else {
        this.auditLogs = [
          { id: 1, actorId: 'Admin-System', role: 'ADMIN', action: 'BOOT_SERVICE', severity: 'INFO', details: 'Event telemetry services synchronized successfully.', timestamp: new Date(Date.now() - 14400000).toISOString() },
          { id: 2, actorId: 'Staff-Desk-A', role: 'STAFF', action: 'CHECK_IN_GUEST', severity: 'SUCCESS', details: 'Guest Alex Rivera checked-in at Desk A.', timestamp: new Date(Date.now() - 10800000).toISOString() },
          { id: 3, actorId: 'Staff-Desk-B', role: 'STAFF', action: 'CHECK_IN_GUEST', severity: 'SUCCESS', details: 'Guest Sarah Chen checked-in at Desk B.', timestamp: new Date(Date.now() - 10200000).toISOString() }
        ];
        if (parsedWinners.length > 0) {
          parsedWinners.forEach((w: any, idx: number) => {
            this.auditLogs.push({
              id: 10 + idx,
              actorId: w.actorId || 'System-Spinner',
              role: 'SYSTEM',
              action: 'LUCKY_DRAW_WIN',
              severity: 'SUCCESS',
              details: `Participant ${w.participantName} won ${w.prizeTier}: ${w.prizeName}`,
              timestamp: w.drawnAt
            });
          });
        }
        this.saveAuditLogs();
      }

      // Timeline checkins & submissions seeds
      const storedTimelines = localStorage.getItem('eh_analytics_timelines');
      if (storedTimelines) {
        this.timelines = JSON.parse(storedTimelines);
      } else {
        this.timelines = [
          { timeLabel: '14:00', checkIns: 2, submissions: 4 },
          { timeLabel: '14:15', checkIns: 1, submissions: 3 },
          { timeLabel: '14:30', checkIns: 1, submissions: 5 },
          { timeLabel: '14:45', checkIns: 1, submissions: 2 }
        ];
        localStorage.setItem('eh_analytics_timelines', JSON.stringify(this.timelines));
      }
    }
  }

  private saveAuditLogs() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eh_analytics_audit_logs', JSON.stringify(this.auditLogs));
    }
  }

  private saveTimelines() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eh_analytics_timelines', JSON.stringify(this.timelines));
    }
  }

  private saveParticipants() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eh_luckydraw_participants', JSON.stringify(this.participants));
    }
  }

  async getOverview(): Promise<AnalyticsOverviewDto> {
    this.loadFromStorage();
    const totalRegistered = this.participants.length;
    const checkedInCount = this.participants.filter(p => p.checkedIn).length;
    const attendanceRate = totalRegistered > 0 ? parseFloat(((checkedInCount / totalRegistered) * 100).toFixed(1)) : 0;
    
    const totalPoints = this.participants.reduce((sum, p) => sum + (p.points || 0), 0);
    const avgPoints = checkedInCount > 0 ? parseFloat((totalPoints / checkedInCount).toFixed(1)) : 0;
    
    const activityCount = 14; 
    const songCount = 12;

    const storedWinners = typeof window !== 'undefined' ? localStorage.getItem('eh_luckydraw_winners') : null;
    const totalWinners = storedWinners ? JSON.parse(storedWinners).length : 0;

    return {
      totalRegistered,
      checkedInCount,
      attendanceRate,
      activityCount,
      totalPoints,
      avgPoints,
      songCount,
      totalWinners
    };
  }

  async getTimeline(): Promise<AnalyticsTimelineDto[]> {
    this.loadFromStorage();
    return this.timelines;
  }

  async getDistribution(): Promise<AnalyticsDistributionDto> {
    this.loadFromStorage();
    
    const doorPrizesSeed = [
      { category: 'Bronze Tier Selections', range: '0-10 pts', min: 0, max: 10 },
      { category: 'Silver Tier Selections', range: '11-20 pts', min: 11, max: 20 },
      { category: 'Gold Tier Selections', range: '21-99+ pts', min: 21, max: 999 }
    ];

    const doorPrizeTiers = doorPrizesSeed.map(tier => {
      const count = this.participants.filter(
        p => p.checkedIn && (p.points || 0) >= tier.min && (p.points || 0) <= tier.max
      ).length;
      return {
        category: tier.category,
        range: tier.range,
        count
      };
    });

    const companyMap: Record<string, { totalPoints: number; count: number }> = {};
    this.participants.forEach(p => {
      if (!companyMap[p.company]) {
        companyMap[p.company] = { totalPoints: 0, count: 0 };
      }
      companyMap[p.company].totalPoints += (p.points || 0);
      companyMap[p.company].count += 1;
    });

    const companyAverages = Object.entries(companyMap).map(([company, data]) => ({
      company,
      avgPoints: parseFloat((data.totalPoints / data.count).toFixed(1)),
      memberCount: data.count
    })).sort((a, b) => b.avgPoints - a.avgPoints);

    return {
      doorPrizeTiers,
      companyAverages
    };
  }

  async getLeaderboard(limit: number = 5, company?: string): Promise<LeaderboardRowDto[]> {
    this.loadFromStorage();
    let list = [...this.participants];
    if (company) {
      const c = company.toLowerCase();
      list = list.filter(p => p.company.toLowerCase().includes(c));
    }

    return list
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        company: p.company,
        points: p.points || 0,
        position: p.position || '',
        checkedIn: p.checkedIn
      }));
  }

  async getAuditLogs(severity?: string, limit: number = 10): Promise<AuditLogRowDto[]> {
    this.loadFromStorage();
    let logs = [...this.auditLogs];
    if (severity) {
      const s = severity.toUpperCase();
      logs = logs.filter(log => log.severity === s);
    }
    return logs.sort((a, b) => b.id - a.id).slice(0, limit);
  }

  async resetData(): Promise<void> {
    localStorage.removeItem('eh_analytics_audit_logs');
    localStorage.removeItem('eh_analytics_timelines');
    this.loadFromStorage();
  }

  async triggerSimulateCheckIn(participantId: string): Promise<void> {
    this.loadFromStorage();
    const p = this.participants.find(p => p.id === participantId);
    if (p && !p.checkedIn) {
      p.checkedIn = true;
      p.rsvpStatus = 'YES';
      const newLog: AuditLogRowDto = {
        id: this.auditLogs.length + 1,
        actorId: 'Staff-Simulator',
        role: 'STAFF',
        action: 'CHECK_IN_GUEST',
        severity: 'SUCCESS',
        details: `Simulated check-in for guest ${p.name} (${p.company}).`,
        timestamp: new Date().toISOString()
      };
      this.auditLogs.unshift(newLog);
      this.saveAuditLogs();
      this.saveParticipants();

      if (this.timelines.length > 0) {
        this.timelines[this.timelines.length - 1].checkIns += 1;
        this.saveTimelines();
      }
    }
  }

  async triggerSimulatePoints(participantId: string, delta: number): Promise<void> {
    this.loadFromStorage();
    const p = this.participants.find(p => p.id === participantId);
    if (p) {
      p.points = Math.max(0, (p.points || 0) + delta);
      const newLog: AuditLogRowDto = {
        id: this.auditLogs.length + 1,
        actorId: 'Staff-Simulator',
        role: 'STAFF',
        action: 'MANUAL_POINT_ADJUST',
        severity: 'INFO',
        details: `Adjusted points for ${p.name} by ${delta > 0 ? '+' : ''}${delta}. New balance: ${p.points} PTS.`,
        timestamp: new Date().toISOString()
      };
      this.auditLogs.unshift(newLog);
      this.saveAuditLogs();
      this.saveParticipants();

      if (this.timelines.length > 0 && delta > 0) {
        this.timelines[this.timelines.length - 1].submissions += 1;
        this.saveTimelines();
      }
    }
  }
}
