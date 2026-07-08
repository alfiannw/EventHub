import { 
  ScoreLogEntity, 
  MilestoneEntity, 
  LeaderboardEntryDto, 
  AdjustScoreDto, 
  ClaimMilestoneDto, 
  LeaderboardStatsDto, 
  MilestoneType 
} from '../../../../backend/src/leaderboard/leaderboard.entity';

interface ParticipantMock {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  points: number;
  checkedIn: boolean;
  avatarUrl: string;
}

export class ClientLeaderboardService {
  private participants: ParticipantMock[] = [
    {
      id: 'p-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@meta.com',
      company: 'Meta Platforms Inc.',
      position: 'Senior Staff Engineer',
      points: 25,
      checkedIn: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@google.com',
      company: 'Google LLC',
      position: 'VP of Product Development',
      points: 15,
      checkedIn: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-3',
      name: 'Marcus Aurelius',
      email: 'marcus.a@netflix.com',
      company: 'Netflix Inc.',
      position: 'Director of Engineering',
      points: 5,
      checkedIn: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-4',
      name: 'Kofi Mensah',
      email: 'k.mensah@stripe.com',
      company: 'Stripe Inc.',
      position: 'Principal Product Designer',
      points: 30,
      checkedIn: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-5',
      name: 'Elena Rostova',
      email: 'elena.rostova@jetbrains.com',
      company: 'JetBrains s.r.o.',
      position: 'Developer Advocate',
      points: 0,
      checkedIn: false,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-6',
      name: 'Yuki Tanaka',
      email: 'tanaka.yuki@sony.co.jp',
      company: 'Sony Corporation',
      position: 'Lead UI Designer',
      points: 10,
      checkedIn: true,
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
    }
  ];

  private scoreLogs: ScoreLogEntity[] = [
    {
      id: 'log-score-1',
      participantId: 'p-1',
      pointsDelta: 25,
      currentTotal: 25,
      reasonCode: 'CHECK_IN',
      description: 'Initial event boarding check-in points.',
      actorId: 'Staff_GateKeeper_01',
      createdAt: new Date(Date.now() - 3600000 * 4)
    },
    {
      id: 'log-score-2',
      participantId: 'p-2',
      pointsDelta: 15,
      currentTotal: 15,
      reasonCode: 'FEEDBACK',
      description: 'High quality session feedback submitted.',
      actorId: 'Staff_Verification_Desk',
      createdAt: new Date(Date.now() - 3600000 * 2)
    }
  ];

  private milestones: MilestoneEntity[] = [
    {
      id: 'm-1',
      participantId: 'p-1',
      milestoneName: 'BRONZE_PASS',
      unlockedAt: new Date(Date.now() - 3600000 * 4),
      claimed: true,
      claimedAt: new Date(Date.now() - 3600000 * 3.5)
    },
    {
      id: 'm-2',
      participantId: 'p-1',
      milestoneName: 'SILVER_LOUNGE',
      unlockedAt: new Date(Date.now() - 3600000 * 3),
      claimed: false
    },
    {
      id: 'm-3',
      participantId: 'p-4',
      milestoneName: 'BRONZE_PASS',
      unlockedAt: new Date(Date.now() - 3600000 * 2),
      claimed: true,
      claimedAt: new Date(Date.now() - 3600000 * 1.5)
    },
    {
      id: 'm-4',
      participantId: 'p-4',
      milestoneName: 'SILVER_LOUNGE',
      unlockedAt: new Date(Date.now() - 3600000 * 1),
      claimed: false
    },
    {
      id: 'm-5',
      participantId: 'p-4',
      milestoneName: 'GOLD_RAFFLE_VIP',
      unlockedAt: new Date(Date.now() - 1800000),
      claimed: false
    }
  ];

  async getLeaderboard(search?: string, filterCompany?: string, filterTier?: string): Promise<LeaderboardEntryDto[]> {
    let list = [...this.participants];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.email.toLowerCase().includes(s) || 
        p.position.toLowerCase().includes(s)
      );
    }

    if (filterCompany) {
      const c = filterCompany.toLowerCase();
      list = list.filter(p => p.company.toLowerCase().includes(c));
    }

    if (filterTier) {
      list = list.filter(p => {
        if (filterTier === 'GOLD') return p.points >= 25;
        if (filterTier === 'SILVER') return p.points >= 11 && p.points < 25;
        if (filterTier === 'BRONZE') return p.points >= 5 && p.points < 11;
        return p.points < 5;
      });
    }

    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.checkedIn !== a.checkedIn) return (b.checkedIn ? 1 : 0) - (a.checkedIn ? 1 : 0);
      return a.name.localeCompare(b.name);
    });

    return list.map((p, idx) => {
      const unlocked = this.milestones
        .filter(m => m.participantId === p.id)
        .map(m => m.milestoneName);

      return {
        rank: idx + 1,
        participantId: p.id,
        name: p.name,
        email: p.email,
        company: p.company,
        position: p.position,
        points: p.points,
        checkedIn: p.checkedIn,
        avatarUrl: p.avatarUrl,
        unlockedMilestones: unlocked
      };
    });
  }

  async adjustScore(dto: AdjustScoreDto, actor: string = 'SYSTEM_DESK'): Promise<ScoreLogEntity> {
    const participant = this.participants.find(p => p.id === dto.participantId);
    if (!participant) {
      throw new Error(`Participant with ID "${dto.participantId}" not found.`);
    }

    const newPoints = Math.max(0, participant.points + dto.pointsDelta);
    participant.points = newPoints;
    
    if (dto.reasonCode === 'CHECK_IN' && dto.pointsDelta > 0) {
      participant.checkedIn = true;
    }

    const newLog: ScoreLogEntity = {
      id: `log-score-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: dto.participantId,
      pointsDelta: dto.pointsDelta,
      currentTotal: newPoints,
      reasonCode: dto.reasonCode,
      description: dto.description || `Points adjustment by ${actor}`,
      actorId: actor,
      createdAt: new Date()
    };

    this.scoreLogs.unshift(newLog);
    await this.evaluateMilestones(participant.id, newPoints);

    return newLog;
  }

  private async evaluateMilestones(participantId: string, currentTotal: number) {
    const activeMilestones = this.milestones.filter(m => m.participantId === participantId);
    
    const tryUnlock = (name: MilestoneType) => {
      const exists = activeMilestones.some(m => m.milestoneName === name);
      if (!exists) {
        this.milestones.push({
          id: `m-unlock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          participantId,
          milestoneName: name,
          unlockedAt: new Date(),
          claimed: false
        });
      }
    };

    const tryRevoke = (name: MilestoneType) => {
      this.milestones = this.milestones.filter(m => !(m.participantId === participantId && m.milestoneName === name));
    };

    if (currentTotal >= 5) {
      tryUnlock('BRONZE_PASS');
    } else {
      tryRevoke('BRONZE_PASS');
    }

    if (currentTotal >= 11) {
      tryUnlock('SILVER_LOUNGE');
    } else {
      tryRevoke('SILVER_LOUNGE');
    }

    if (currentTotal >= 21) {
      tryUnlock('GOLD_RAFFLE_VIP');
    } else {
      tryRevoke('GOLD_RAFFLE_VIP');
    }
  }

  async getScoreLogs(participantId?: string): Promise<ScoreLogEntity[]> {
    if (participantId) {
      return this.scoreLogs.filter(log => log.participantId === participantId);
    }
    return this.scoreLogs;
  }

  async getMilestones(participantId?: string): Promise<MilestoneEntity[]> {
    if (participantId) {
      return this.milestones.filter(m => m.participantId === participantId);
    }
    return this.milestones;
  }

  async claimMilestone(dto: ClaimMilestoneDto, actor: string = 'REGISTRATION_DESK'): Promise<MilestoneEntity> {
    const milestone = this.milestones.find(
      m => m.participantId === dto.participantId && m.milestoneName === dto.milestoneName
    );

    if (!milestone) {
      throw new Error(`Milestone reward "${dto.milestoneName}" is currently locked for this participant.`);
    }

    if (milestone.claimed) {
      throw new Error('Milestone reward has already been claimed.');
    }

    milestone.claimed = true;
    milestone.claimedAt = new Date();

    return milestone;
  }

  async getStats(): Promise<LeaderboardStatsDto> {
    const totalPoints = this.participants.reduce((sum, p) => sum + p.points, 0);
    const checkedInCount = this.participants.filter(p => p.checkedIn).length;
    const avgPoints = checkedInCount > 0 ? totalPoints / checkedInCount : 0;

    const milestonesCount: Record<MilestoneType, number> = {
      BRONZE_PASS: 0,
      SILVER_LOUNGE: 0,
      GOLD_RAFFLE_VIP: 0
    };

    this.milestones.forEach(m => {
      milestonesCount[m.milestoneName] = (milestonesCount[m.milestoneName] || 0) + 1;
    });

    const companyScores: Record<string, number> = {};
    this.participants.forEach(p => {
      companyScores[p.company] = (companyScores[p.company] || 0) + p.points;
    });

    return {
      totalPointsAwarded: totalPoints,
      averagePointsPerAttendee: Math.round(avgPoints * 10) / 10,
      unlockedMilestonesCount: milestonesCount,
      pointsDistributionByCompany: companyScores,
      totalScoreAdjustments: this.scoreLogs.length
    };
  }

  async resetLeaderboard() {
    this.participants.forEach(p => {
      p.points = p.id === 'p-5' ? 0 : 5;
      p.checkedIn = p.id !== 'p-5';
    });

    this.scoreLogs = [];
    this.milestones = [];
    
    await this.adjustScore({
      participantId: 'p-1',
      pointsDelta: 10,
      reasonCode: 'SPOT_AWARD',
      description: 'Reset session points buffer initialization'
    }, 'SYSTEM');
  }
}
