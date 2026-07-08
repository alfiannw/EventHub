import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { 
  LuckyDrawWinnerEntity, 
  LuckyDrawCandidateDto, 
  RecordWinnerDto, 
  LuckyDrawStatsDto 
} from './luckydraw.entity';

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

@Injectable()
export class LuckyDrawService {
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

  private winners: LuckyDrawWinnerEntity[] = [
    {
      id: 'winner-1',
      participantId: 'p-4',
      participantName: 'Kofi Mensah',
      participantCompany: 'Stripe Inc.',
      prizeTier: 'Major Prize',
      prizeName: 'Sony WH-1000XM5 ANC Headphones',
      drawnAt: new Date(Date.now() - 3600000),
      actorId: 'Staff-Desk-B'
    }
  ];

  async getCandidatesList(search?: string, company?: string): Promise<LuckyDrawCandidateDto[]> {
    let list = [...this.participants];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.email.toLowerCase().includes(s) || 
        p.position.toLowerCase().includes(s)
      );
    }

    if (company) {
      const c = company.toLowerCase();
      list = list.filter(p => p.company.toLowerCase().includes(c));
    }

    return list.map(p => {
      const winnerRecord = this.winners.find(w => w.participantId === p.id);
      return {
        participantId: p.id,
        name: p.name,
        email: p.email,
        company: p.company,
        position: p.position,
        points: p.points,
        checkedIn: p.checkedIn,
        avatarUrl: p.avatarUrl,
        isWinner: !!winnerRecord,
        prizeName: winnerRecord?.prizeName
      };
    });
  }

  async recordWinner(dto: RecordWinnerDto, actorId: string = 'Staff-System'): Promise<LuckyDrawWinnerEntity> {
    const participant = this.participants.find(p => p.id === dto.participantId);
    if (!participant) {
      throw new NotFoundException(`Participant with ID "${dto.participantId}" not found.`);
    }

    if (!participant.checkedIn) {
      throw new BadRequestException('Participant must be checked-in to be eligible for lucky draw drawings.');
    }

    const alreadyWon = this.winners.some(w => w.participantId === dto.participantId);
    if (alreadyWon) {
      throw new BadRequestException('This participant has already won a lucky draw prize.');
    }

    const newWinner: LuckyDrawWinnerEntity = {
      id: `winner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantCompany: participant.company,
      prizeTier: dto.prizeTier,
      prizeName: dto.prizeName,
      drawnAt: new Date(),
      actorId
    };

    this.winners.unshift(newWinner);
    return newWinner;
  }

  async getWinnersLogs(): Promise<LuckyDrawWinnerEntity[]> {
    return this.winners;
  }

  async getStats(): Promise<LuckyDrawStatsDto> {
    const totalWinners = this.winners.length;

    const winnersByTier: Record<string, number> = {
      'Grand Prize': 0,
      'Major Prize': 0,
      'Special Prize': 0
    };
    this.winners.forEach(w => {
      if (winnersByTier[w.prizeTier] !== undefined) {
        winnersByTier[w.prizeTier]++;
      } else {
        winnersByTier[w.prizeTier] = 1;
      }
    });

    const totalEligibleCandidates = this.participants.filter(p => p.checkedIn && !this.winners.some(w => w.participantId === p.id)).length;

    const totalCheckedIn = this.participants.filter(p => p.checkedIn).length;
    const drawRatePercent = totalCheckedIn > 0 
      ? Math.round((totalWinners / totalCheckedIn) * 1000) / 10 
      : 0;

    return {
      totalWinners,
      winnersByTier,
      totalEligibleCandidates,
      drawRatePercent
    };
  }

  async resetWinners(): Promise<void> {
    this.winners = [];
  }

  // Testing helper to adjust points
  async updateParticipantPoints(participantId: string, delta: number): Promise<void> {
    const p = this.participants.find(p => p.id === participantId);
    if (p) {
      p.points = Math.max(0, p.points + delta);
    }
  }

  // Testing helper to check in participant
  async checkInParticipant(participantId: string): Promise<void> {
    const p = this.participants.find(p => p.id === participantId);
    if (p) {
      p.checkedIn = true;
    }
  }
}
