import { 
  DoorPrizeClaimEntity, 
  DoorPrizeParticipantDto, 
  ClaimDoorPrizeDto, 
  DoorPrizeStatsDto 
} from '../../../../backend/src/doorprize/doorprize.entity';

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

export class ClientDoorPrizeService {
  private participants: ParticipantMock[] = [];
  private claims: DoorPrizeClaimEntity[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const storedParticipants = localStorage.getItem('eh_doorprize_participants');
      const storedClaims = localStorage.getItem('eh_doorprize_claims');

      if (storedParticipants) {
        this.participants = JSON.parse(storedParticipants);
      } else {
        this.participants = [
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
        this.saveToStorage();
      }

      if (storedClaims) {
        this.claims = JSON.parse(storedClaims);
      } else {
        this.claims = [
          {
            id: 'claim-1',
            participantId: 'p-1',
            participantName: 'Alex Rivera',
            participantCompany: 'Meta Platforms Inc.',
            eligibleTier: 'Gold Tier Selections',
            claimedAt: new Date(Date.now() - 7200000),
            actorId: 'Staff-Desk-A'
          }
        ];
        this.saveToStorage();
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eh_doorprize_participants', JSON.stringify(this.participants));
      localStorage.setItem('eh_doorprize_claims', JSON.stringify(this.claims));
    }
  }

  async getParticipantsList(
    search?: string,
    company?: string,
    tier?: 'GOLD' | 'SILVER' | 'BRONZE',
    claimed?: boolean
  ): Promise<DoorPrizeParticipantDto[]> {
    this.loadFromStorage();
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
      const eligibleTier = this.computeTierName(p.points);
      const tierLevel = this.computeTierLevel(p.points);
      const claim = this.claims.find(c => c.participantId === p.id);

      return {
        participantId: p.id,
        name: p.name,
        email: p.email,
        company: p.company,
        position: p.position,
        points: p.points,
        checkedIn: p.checkedIn,
        avatarUrl: p.avatarUrl,
        eligibleTier,
        tierLevel,
        claimed: !!claim,
        claimId: claim?.id,
        claimedAt: claim?.claimedAt ? new Date(claim.claimedAt) : undefined
      };
    }).filter(dto => {
      if (tier) {
        const mappedTier = dto.tierLevel === 3 ? 'GOLD' : dto.tierLevel === 2 ? 'SILVER' : 'BRONZE';
        if (mappedTier !== tier) return false;
      }
      if (claimed !== undefined) {
        if (dto.claimed !== claimed) return false;
      }
      return true;
    });
  }

  async claimPrize(dto: ClaimDoorPrizeDto, actorId: string = 'Staff-System'): Promise<DoorPrizeClaimEntity> {
    this.loadFromStorage();
    const participant = this.participants.find(p => p.id === dto.participantId);
    if (!participant) {
      throw new Error(`Participant with ID "${dto.participantId}" not found.`);
    }

    if (!participant.checkedIn) {
      throw new Error('Participant must be checked-in to be eligible for door prizes.');
    }

    const alreadyClaimed = this.claims.some(c => c.participantId === dto.participantId);
    if (alreadyClaimed) {
      throw new Error('This participant has already claimed a door prize.');
    }

    const calculatedTier = this.computeTierName(participant.points);
    if (dto.tier !== calculatedTier) {
      throw new Error(`Invalid tier verification: requested "${dto.tier}", but candidate is only eligible for "${calculatedTier}".`);
    }

    const newClaim: DoorPrizeClaimEntity = {
      id: `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantCompany: participant.company,
      eligibleTier: calculatedTier,
      claimedAt: new Date(),
      actorId
    };

    this.claims.unshift(newClaim);
    this.saveToStorage();
    return newClaim;
  }

  async getClaimsLogs(): Promise<DoorPrizeClaimEntity[]> {
    this.loadFromStorage();
    return this.claims;
  }

  async getStats(): Promise<DoorPrizeStatsDto> {
    this.loadFromStorage();
    const totalClaims = this.claims.length;
    
    const claimsByTier: Record<string, number> = {
      'Bronze Tier Selections': 0,
      'Silver Tier Selections': 0,
      'Gold Tier Selections': 0
    };
    this.claims.forEach(c => {
      claimsByTier[c.eligibleTier] = (claimsByTier[c.eligibleTier] || 0) + 1;
    });

    const eligibilityDistribution: Record<string, number> = {
      'Bronze Tier Selections': 0,
      'Silver Tier Selections': 0,
      'Gold Tier Selections': 0
    };
    
    let totalCheckedInEligible = 0;
    this.participants.forEach(p => {
      if (p.checkedIn) {
        totalCheckedInEligible++;
        const tierName = this.computeTierName(p.points);
        eligibilityDistribution[tierName] = (eligibilityDistribution[tierName] || 0) + 1;
      }
    });

    const claimRatePercent = totalCheckedInEligible > 0 
      ? Math.round((totalClaims / totalCheckedInEligible) * 1000) / 10 
      : 0;

    return {
      totalClaims,
      claimsByTier,
      eligibilityDistribution,
      totalCheckedInEligible,
      claimRatePercent
    };
  }

  async resetClaims(): Promise<void> {
    this.claims = [];
    // Reset points back to default seed for a clean state
    this.participants.forEach(p => {
      if (p.id === 'p-1') p.points = 25;
      else if (p.id === 'p-2') p.points = 15;
      else if (p.id === 'p-3') p.points = 5;
      else if (p.id === 'p-4') p.points = 30;
      else if (p.id === 'p-5') p.points = 0;
      else if (p.id === 'p-6') p.points = 10;
      p.checkedIn = p.id !== 'p-5';
    });
    this.saveToStorage();
  }

  // Helper score boundary functions matching database rules
  private computeTierName(points: number): string {
    if (points >= 21) return 'Gold Tier Selections';
    if (points >= 11) return 'Silver Tier Selections';
    return 'Bronze Tier Selections';
  }

  private computeTierLevel(points: number): number {
    if (points >= 21) return 3;
    if (points >= 11) return 2;
    return 1;
  }

  // Testing and simulation helper to adjust points
  async updateParticipantPoints(participantId: string, delta: number): Promise<void> {
    this.loadFromStorage();
    const p = this.participants.find(p => p.id === participantId);
    if (p) {
      p.points = Math.max(0, p.points + delta);
      this.saveToStorage();
    }
  }

  // Testing helper to check in participant
  async checkInParticipant(participantId: string): Promise<void> {
    this.loadFromStorage();
    const p = this.participants.find(p => p.id === participantId);
    if (p) {
      p.checkedIn = true;
      this.saveToStorage();
    }
  }
}
