import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../sprint-1-auth/frontend/src/context/AuthContext';
import { 
  Award, Trophy, HelpCircle, Check, X, ShieldAlert, Sparkles, Flame,
  Music, Radio, Heart, Bell, BellOff, ArrowUpRight, History, Play,
  User, Search, RefreshCw, Send, PlusCircle, CheckCircle, ListTodo
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  checkedIn: boolean;
  currentPoints: number;
  qrCodeHash: string;
}

interface ActivityRule {
  id: number;
  activityType: string;
  pointsReward: number;
  description: string;
}

interface ActivitySubmission {
  id: string;
  participantId: string;
  participantName: string;
  activityType: string;
  description: string;
  content?: string;
  mediaUrl?: string;
  pointsAwarded: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

interface LedgerEntry {
  id: string;
  participantId: string;
  pointsChanged: number;
  runningBalance: number;
  reason: string;
  createdAt: string;
}

interface PrizeCategory {
  id: string;
  name: string;
  eligiblePointsMin: number;
  tierLevel: number;
}

interface Prize {
  id: string;
  categoryId: string;
  name: string;
  totalQuantity: number;
  remainingQuantity: number;
}

interface Winner {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  prizeName: string;
  categoryName: string;
  drawnAt: string;
}

interface SongRequest {
  id: string;
  participantId: string;
  participantName: string;
  artist: string;
  title: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'PLAYED' | 'REJECTED';
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function GamificationSaaSPage() {
  const { user } = useAuth(); // Simulated user context from Sprint 1 Auth

  // State mimicking live API responses
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', company: 'Meta Platforms Inc.', position: 'Senior Staff Engineer', checkedIn: true, currentPoints: 25, qrCodeHash: 'QR_EH_1001_ALEX' },
    { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', company: 'Google LLC', position: 'VP of Product Development', checkedIn: true, currentPoints: 15, qrCodeHash: 'QR_EH_1002_SARAH' },
    { id: 'p-3', name: 'Kofi Mensah', email: 'k.mensah@stripe.com', company: 'Stripe Inc.', position: 'Principal Product Designer', checkedIn: true, currentPoints: 30, qrCodeHash: 'QR_EH_1003_KOFI' },
    { id: 'p-4', name: 'Elena Rostova', email: 'elena.rostova@jetbrains.com', company: 'JetBrains s.r.o.', position: 'Developer Advocate', checkedIn: false, currentPoints: 0, qrCodeHash: 'QR_EH_1004_ELENA' },
    { id: 'p-5', name: 'Yuki Tanaka', email: 'tanaka.yuki@sony.co.jp', company: 'Sony Corporation', position: 'Lead UI Designer', checkedIn: true, currentPoints: 10, qrCodeHash: 'QR_EH_1005_YUKI' }
  ]);

  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([
    { id: 'act-1', participantId: 'p-1', participantName: 'Alex Rivera', activityType: 'SHARE_PHOTO', description: 'Uploaded photo at Main Keynote stage', mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop', pointsAwarded: 5, status: 'APPROVED', submittedAt: '2026-07-07T09:30' },
    { id: 'act-2', participantId: 'p-3', participantName: 'Kofi Mensah', activityType: 'INSTAGRAM_POST', description: 'Shared event Instagram story with hashtag #EventHub2026', mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop', pointsAwarded: 5, status: 'APPROVED', submittedAt: '2026-07-07T09:35' },
    { id: 'act-3', participantId: 'p-1', participantName: 'Alex Rivera', activityType: 'SUBMIT_FEEDBACK', description: 'Submitted event registration day feedback', content: 'Extremely fast check-in experience! The digital event pass and instant QR badge printer are brilliant.', pointsAwarded: 5, status: 'APPROVED', submittedAt: '2026-07-07T09:45' },
    { id: 'act-4', participantId: 'p-2', participantName: 'Sarah Chen', activityType: 'SHARE_PHOTO', description: 'Uploaded photo from VIP networking session', mediaUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop', pointsAwarded: 5, status: 'PENDING', submittedAt: '2026-07-07T10:15' }
  ]);

  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { id: 'tx-1', participantId: 'p-1', pointsChanged: 5, runningBalance: 5, reason: 'Initial check-in points', createdAt: '2026-07-07T08:45' },
    { id: 'tx-2', participantId: 'p-1', pointsChanged: 15, runningBalance: 20, reason: 'Approved keynote photo proof', createdAt: '2026-07-07T09:30' },
    { id: 'tx-3', participantId: 'p-1', pointsChanged: 5, runningBalance: 25, reason: 'Approved feedback submission', createdAt: '2026-07-07T09:45' },
    { id: 'tx-4', participantId: 'p-3', pointsChanged: 5, runningBalance: 5, reason: 'Initial check-in points', createdAt: '2026-07-07T09:12' },
    { id: 'tx-5', participantId: 'p-3', pointsChanged: 25, runningBalance: 30, reason: 'Best Stage Photo Spot Award', createdAt: '2026-07-07T10:00' }
  ]);

  const [prizeCategories] = useState<PrizeCategory[]>([
    { id: 'pc-1', name: 'Bronze Tier Selections', eligiblePointsMin: 0, tierLevel: 1 },
    { id: 'pc-2', name: 'Silver Tier Selections', eligiblePointsMin: 11, tierLevel: 2 },
    { id: 'pc-3', name: 'Gold Tier Selections', eligiblePointsMin: 21, tierLevel: 3 }
  ]);

  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 'prz-1', categoryId: 'pc-3', name: 'Apple MacBook Pro 16"', totalQuantity: 1, remainingQuantity: 1 },
    { id: 'prz-2', categoryId: 'pc-2', name: 'Apple iPad Pro 11"', totalQuantity: 2, remainingQuantity: 2 },
    { id: 'prz-3', categoryId: 'pc-1', name: 'Sony WH-1000XM5 Headphones', totalQuantity: 3, remainingQuantity: 3 }
  ]);

  const [winners, setWinners] = useState<Winner[]>([
    { id: 'win-1', participantId: 'p-3', participantName: 'Kofi Mensah', participantCompany: 'Stripe Inc.', prizeName: 'Sony WH-1000XM5 Headphones', categoryName: 'Bronze Tier Selections', drawnAt: '2026-07-07T11:45' }
  ]);

  const [songRequests, setSongRequests] = useState<SongRequest[]>([
    { id: 'song-1', participantId: 'p-1', participantName: 'Alex Rivera', artist: 'Daft Punk', title: 'One More Time', message: "Let's kickstart this summit! Perfect networking mood.", status: 'APPROVED', createdAt: '2026-07-07T09:15' },
    { id: 'song-2', participantId: 'p-2', participantName: 'Sarah Chen', artist: 'Coldplay', title: 'A Sky Full of Stars', message: 'Dedicated to the organizers!', status: 'PLAYED', createdAt: '2026-07-07T09:25' },
    { id: 'song-3', participantId: 'p-3', participantName: 'Kofi Mensah', artist: 'The Weeknd', title: 'Blinding Lights', message: 'High energy for panel Q&A!', status: 'PENDING', createdAt: '2026-07-07T09:40' }
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'not-1', title: 'Points Ledger Updated', message: 'You have been awarded +5 points for submitting your feedback.', isRead: false, createdAt: '2026-07-07T09:45' },
    { id: 'not-2', title: 'Best Photo Spot Award!', message: 'Congratulations, you received +25 points for the Best Photo Spot Award.', isRead: true, createdAt: '2026-07-07T10:00' }
  ]);

  // Screen UI state
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'moderation' | 'draw' | 'songs'>('leaderboard');
  const [selectedPartId, setSelectedPartId] = useState<string>('p-1');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom spot award inputs
  const [customAwardPoints, setCustomAwardPoints] = useState<number>(5);
  const [customAwardReason, setCustomAwardReason] = useState<string>('');

  // Lucky Draw Draw States
  const [selectedDrawCatId, setSelectedDrawCatId] = useState<string>('pc-3');
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnWinner, setDrawnWinner] = useState<Winner | null>(null);

  // Song Request Input state
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongMsg, setNewSongMsg] = useState('');

  // Active profile based on selector
  const activeParticipant = participants.find(p => p.id === selectedPartId);

  // Handle manual points spot award
  const handleSpotAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAwardReason) return;

    const points = Number(customAwardPoints);
    
    // 1. Update Participant
    setParticipants(prev => prev.map(p => {
      if (p.id === selectedPartId) {
        return { ...p, currentPoints: p.currentPoints + points };
      }
      return p;
    }));

    // 2. Insert ledger entry
    const newTx: LedgerEntry = {
      id: `tx-${Date.now()}`,
      participantId: selectedPartId,
      pointsChanged: points,
      runningBalance: (activeParticipant?.currentPoints || 0) + points,
      reason: `Manual spot award: ${customAwardReason}`,
      createdAt: new Date().toISOString()
    };
    setLedger(prev => [newTx, ...prev]);

    // 3. Add notification
    const newNot: Notification = {
      id: `not-${Date.now()}`,
      title: 'Manual Award Credited',
      message: `You received +${points} points for "${customAwardReason}"`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNot, ...prev]);

    setCustomAwardReason('');
  };

  // Moderate Submissions (Photo uploads / post verification)
  const handleModerateSubmission = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status };
      }
      return s;
    }));

    const sub = submissions.find(s => s.id === id);
    if (sub && status === 'APPROVED') {
      // Award Points
      setParticipants(prev => prev.map(p => {
        if (p.id === sub.participantId) {
          return { ...p, currentPoints: p.currentPoints + sub.pointsAwarded };
        }
        return p;
      }));

      // Insert Ledger
      const currentPts = participants.find(p => p.id === sub.participantId)?.currentPoints || 0;
      const newTx: LedgerEntry = {
        id: `tx-${Date.now()}`,
        participantId: sub.participantId,
        pointsChanged: sub.pointsAwarded,
        runningBalance: currentPts + sub.pointsAwarded,
        reason: `Approved activity: ${sub.description}`,
        createdAt: new Date().toISOString()
      };
      setLedger(prev => [newTx, ...prev]);
    }
  };

  // Spinning / Lucky Draw
  const handleTriggerDraw = () => {
    const category = prizeCategories.find(c => c.id === selectedDrawCatId);
    if (!category) return;

    const prize = prizes.find(p => p.categoryId === selectedDrawCatId && p.remainingQuantity > 0);
    if (!prize) {
      alert(`No available items of prize in category ${category.name}`);
      return;
    }

    // Filter checked-in, eligible points, and not won yet
    const alreadyWonIds = new Set(winners.map(w => w.participantId));
    const eligibleParticipants = participants.filter(p => {
      return p.checkedIn && p.currentPoints >= category.eligiblePointsMin && !alreadyWonIds.has(p.id);
    });

    if (eligibleParticipants.length === 0) {
      alert(`No checked-in, eligible participants found for ${category.name} draw. (Threshold >= ${category.eligiblePointsMin} points, who haven't won yet)`);
      return;
    }

    setIsSpinning(true);
    setDrawnWinner(null);

    // Simulate standard slot/wheel spin delay
    setTimeout(() => {
      const winnerPart = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
      
      // Update inventory
      setPrizes(prev => prev.map(p => {
        if (p.id === prize.id) {
          return { ...p, remainingQuantity: p.remainingQuantity - 1 };
        }
        return p;
      }));

      const newWinner: Winner = {
        id: `win-${Date.now()}`,
        participantId: winnerPart.id,
        participantName: winnerPart.name,
        participantCompany: winnerPart.company,
        prizeName: prize.name,
        categoryName: category.name,
        drawnAt: new Date().toISOString()
      };

      setWinners(prev => [newWinner, ...prev]);
      setDrawnWinner(newWinner);
      setIsSpinning(false);

      // Notify winner
      const newNot: Notification = {
        id: `not-${Date.now()}`,
        title: 'Lucky Draw Winner!',
        message: `Congratulations! You won the "${prize.name}" in the ${category.name} draw!`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNot, ...prev]);

    }, 2500);
  };

  // Song request Submission
  const handleRequestSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle || !newSongArtist) return;

    const req: SongRequest = {
      id: `song-${Date.now()}`,
      participantId: selectedPartId,
      participantName: activeParticipant?.name || 'Anonymous',
      artist: newSongArtist,
      title: newSongTitle,
      message: newSongMsg,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setSongRequests(prev => [...prev, req]);
    setNewSongTitle('');
    setNewSongArtist('');
    setNewSongMsg('');
  };

  // Moderate Song request status
  const handleModerateSong = (id: string, status: 'APPROVED' | 'PLAYED' | 'REJECTED') => {
    setSongRequests(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status };
      }
      return s;
    }));

    const song = songRequests.find(s => s.id === id);
    if (song && status === 'APPROVED') {
      // Award points for approved song requests
      setParticipants(prev => prev.map(p => {
        if (p.id === song.participantId) {
          return { ...p, currentPoints: p.currentPoints + 5 };
        }
        return p;
      }));

      // Insert ledger transaction
      const currentPts = participants.find(p => p.id === song.participantId)?.currentPoints || 0;
      const newTx: LedgerEntry = {
        id: `tx-${Date.now()}`,
        participantId: song.participantId,
        pointsChanged: 5,
        runningBalance: currentPts + 5,
        reason: `Approved song request: "${song.title}" by ${song.artist}`,
        createdAt: new Date().toISOString()
      };
      setLedger(prev => [newTx, ...prev]);
    }
  };

  // Filters participants
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leaderboardSorted = [...participants].sort((a, b) => b.currentPoints - a.currentPoints);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-mono flex flex-col p-6">
      
      {/* Event Header Banner */}
      <div className="relative w-full border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_#141414] mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 p-3 bg-black text-[#00FF00] font-black uppercase text-[10px] tracking-wider border-b-[2px] border-l-[2px] border-black z-10">
          SP3 GAMIFICATION & LEDGER ACTIVE
        </div>
        
        {/* Decorative Strip */}
        <div className="h-4 w-full border-b-[2px] border-black bg-emerald-500" />
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5.5 h-5.5 text-emerald-600 animate-bounce" />
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Gamified Points & Lucky Draw Core</h1>
            </div>
            <p className="text-xs text-zinc-500 max-w-xl uppercase">Double-entry ledger, dynamic wheel draw spinner, and real-time auditable point streams.</p>
          </div>
          
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-[#141414] text-[#00FF00] px-2 py-1 uppercase rounded-sm border border-black">
              LEDGER VERIFIED: ACTIVE
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-t-[2px] border-black text-xs font-bold uppercase overflow-x-auto">
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 border-r-[2px] border-black flex items-center gap-1.5 transition-all ${activeTab === 'leaderboard' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <Trophy className="w-4 h-4" />
            <span>01 Leaderboard & Ledger</span>
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-3 border-r-[2px] border-black flex items-center gap-1.5 transition-all ${activeTab === 'moderation' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>02 Proofs & Spot Awards</span>
          </button>
          <button 
            onClick={() => setActiveTab('draw')}
            className={`px-6 py-3 border-r-[2px] border-black flex items-center gap-1.5 transition-all ${activeTab === 'draw' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>03 Wheel Spinner</span>
          </button>
          <button 
            onClick={() => setActiveTab('songs')}
            className={`px-6 py-3 flex items-center gap-1.5 transition-all ${activeTab === 'songs' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <Music className="w-4 h-4" />
            <span>04 Songs Requests</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT WORKSPACE PANELS */}
        <div className="lg:col-span-8 space-y-6">

          {/* TAB 1: LEADERBOARD & DOUBLE-ENTRY LEDGER LOGS */}
          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Leaderboard Standings column */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5 flex justify-between items-center">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Summit Leaderboard Standings</span>
                  </h2>
                  <span className="text-[9px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold uppercase px-1.5 py-0.5">
                    Live polling
                  </span>
                </div>

                <div className="space-y-2">
                  {leaderboardSorted.map((part, index) => {
                    const isGold = part.currentPoints >= 21;
                    const isSilver = part.currentPoints >= 11 && part.currentPoints < 21;

                    return (
                      <div 
                        key={part.id} 
                        onClick={() => setSelectedPartId(part.id)}
                        className={`p-3 border flex justify-between items-center transition-all cursor-pointer ${selectedPartId === part.id ? 'border-black bg-neutral-100 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${index === 0 ? 'bg-amber-100 border-amber-400 text-amber-800' : index === 1 ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-neutral-100 border-neutral-300 text-neutral-600'}`}>
                            {index + 1}
                          </span>
                          <div className="space-y-0.5">
                            <span className="text-xs font-black uppercase flex items-center gap-1">
                              {part.name}
                              {part.checkedIn ? (
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" title="Checked in" />
                              ) : null}
                            </span>
                            <span className="text-[9px] text-zinc-400 block uppercase font-bold">{part.company}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 border ${isGold ? 'bg-amber-100 border-amber-300 text-amber-800' : isSilver ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                            {isGold ? 'GOLD' : isSilver ? 'SILVER' : 'BRONZE'}
                          </span>
                          <span className="text-xs font-black bg-black text-[#00FF00] px-2 py-0.5">
                            {part.currentPoints} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Ledger entries stream */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>Point Ledger: {activeParticipant?.name}</span>
                  </h2>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Participant Hash ID:</span>
                    <span className="font-bold text-neutral-800">{activeParticipant?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Verified Points:</span>
                    <span className="font-bold text-emerald-600">{activeParticipant?.currentPoints} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">QR Code Hash:</span>
                    <span className="font-mono text-[9px] font-bold select-all bg-neutral-100 border border-zinc-300 px-1 py-0.5">{activeParticipant?.qrCodeHash}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider">Double-Entry Transaction stream</span>
                  {ledger.filter(tx => tx.participantId === selectedPartId).length === 0 ? (
                    <span className="text-[10px] text-zinc-400 uppercase block text-center py-6 border border-dashed border-zinc-200">No transactions recorded yet</span>
                  ) : (
                    ledger
                      .filter(tx => tx.participantId === selectedPartId)
                      .map((tx) => (
                        <div key={tx.id} className="border border-zinc-200 p-2.5 bg-zinc-50 flex justify-between items-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-neutral-800 block leading-tight">{tx.reason}</span>
                            <span className="text-[8px] text-zinc-400 block font-mono">
                              {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Balance: {tx.runningBalance} pts
                            </span>
                          </div>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 border ${tx.pointsChanged > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-rose-50 border-rose-300 text-rose-700'}`}>
                            {tx.pointsChanged > 0 ? `+${tx.pointsChanged}` : tx.pointsChanged}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PROOFS MODERATION & SPOT AWARDS */}
          {activeTab === 'moderation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Activity Proof Moderation Queue */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-emerald-600" />
                    <span>Uploads & Hashtags Moderation Queue</span>
                  </h2>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {submissions.filter(s => s.status === 'PENDING').length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-200 text-zinc-400 uppercase space-y-2">
                      <Check className="w-8 h-8 text-emerald-600 mx-auto bg-emerald-50 p-1.5 border border-emerald-300 rounded-full" />
                      <span className="text-[10px] block font-bold">ALL PENDING SUBMISSIONS CLEARED!</span>
                    </div>
                  ) : (
                    submissions
                      .filter(s => s.status === 'PENDING')
                      .map((sub) => (
                        <div key={sub.id} className="border border-black p-4 bg-zinc-50 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-black text-[#00FF00] font-black uppercase px-2 py-0.5">
                                {sub.activityType}
                              </span>
                              <span className="text-[9px] block text-zinc-400 font-bold uppercase mt-1">Submitted by: {sub.participantName}</span>
                            </div>
                            <span className="text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5">
                              +{sub.pointsAwarded} PTS
                            </span>
                          </div>

                          <p className="text-[11px] font-bold text-neutral-800 uppercase">{sub.description}</p>
                          
                          {sub.mediaUrl && (
                            <img src={sub.mediaUrl} alt="Proof upload" className="w-full h-32 object-cover border border-zinc-300 rounded-sm" />
                          )}
                          
                          {sub.content && (
                            <p className="p-3 bg-white border border-zinc-200 font-sans text-xs text-zinc-600 italic">"{sub.content}"</p>
                          )}

                          <div className="flex justify-end gap-2 text-[10px] font-bold pt-1.5 border-t border-zinc-200">
                            <button 
                              onClick={() => handleModerateSubmission(sub.id, 'REJECTED')}
                              className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 uppercase cursor-pointer"
                            >
                              REJECT PROOF
                            </button>
                            <button 
                              onClick={() => handleModerateSubmission(sub.id, 'APPROVED')}
                              className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 uppercase cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>APPROVE & CREDIT</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}

                  {/* History of approved/rejected */}
                  {submissions.filter(s => s.status !== 'PENDING').length > 0 && (
                    <div className="space-y-2 pt-4">
                      <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider">Processed Submissions History</span>
                      {submissions
                        .filter(s => s.status !== 'PENDING')
                        .slice(0, 3)
                        .map(sub => (
                          <div key={sub.id} className="border border-zinc-200 p-2 bg-white flex justify-between items-center text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-neutral-700 block">{sub.description} ({sub.participantName})</span>
                              <span className="text-[8px] text-zinc-400 block uppercase font-mono">Status: {sub.status} • type: {sub.activityType}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 border ${sub.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                              {sub.status === 'APPROVED' ? `+${sub.pointsAwarded}` : '0'} PTS
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Spot Awards & Manual Ledger Adjustments */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Staff Spot Award Center</span>
                  </h2>
                </div>

                <div className="bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-900 font-bold uppercase leading-relaxed flex gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[9px]">
                    <span className="block text-amber-800">SECURE TRANSACTION CONTROLS ACTIVE:</span>
                    All manual points issued here will immediately write an unalterable transaction directly into the participant's double-entry point transactions ledger.
                  </div>
                </div>

                <form onSubmit={handleSpotAward} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase">Target Participant Profile</label>
                    <select 
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full bg-white border border-black px-3 py-2 font-bold"
                    >
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.company}) - Balance: {p.currentPoints} pts</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-1.5">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase">Award Quantity</label>
                      <select 
                        value={customAwardPoints}
                        onChange={(e) => setCustomAwardPoints(Number(e.target.value))}
                        className="w-full bg-white border border-black px-3 py-2 font-bold"
                      >
                        <option value={5}>+5 PTS</option>
                        <option value={10}>+10 PTS</option>
                        <option value={15}>+15 PTS</option>
                        <option value={20}>+20 PTS</option>
                        <option value={25}>+25 PTS (Spot Bonus)</option>
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase">Reason / Justification Text</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Best stage selfie, Active session participation"
                        value={customAwardReason}
                        onChange={(e) => setCustomAwardReason(e.target.value)}
                        className="w-full bg-white border border-black px-3 py-2 font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button 
                      type="submit"
                      className="bg-black text-white hover:text-[#00FF00] font-bold py-3 px-5 border border-black flex items-center gap-1.5 cursor-pointer uppercase transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>ISSUE SPOT AWARD NOW</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: LUCKY DRAW SPINNER & SELECTION MECHANISMS */}
          {activeTab === 'draw' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Dynamic Draw Spinner Box */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Lucky Draw Spin Console</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase block tracking-wide">Select Draw Prize Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {prizeCategories.map(cat => {
                      const prize = prizes.find(p => p.categoryId === cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedDrawCatId(cat.id);
                            setDrawnWinner(null);
                          }}
                          className={`p-2.5 border text-left relative flex flex-col justify-between h-24 transition-all cursor-pointer ${selectedDrawCatId === cat.id ? 'border-black bg-neutral-50 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'}`}
                        >
                          <span className="text-[9px] font-black uppercase leading-tight">{cat.name}</span>
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-500 block font-bold truncate">Prize: {prize ? prize.name : 'No prizes'}</span>
                            <span className="text-[8px] text-emerald-600 block font-bold uppercase">Threshold: &ge; {cat.eligiblePointsMin} pts</span>
                          </div>
                          {selectedDrawCatId === cat.id && (
                            <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-[#00FF00] bg-black p-0.5 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated spinning animation */}
                <div className="bg-zinc-950 text-white p-6 border border-black rounded-sm flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
                  {isSpinning ? (
                    <div className="text-center space-y-3">
                      <RefreshCw className="w-10 h-10 text-[#00FF00] animate-spin mx-auto" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#00FF00] font-black uppercase tracking-widest block animate-pulse">LOCKING CORES...</span>
                        <span className="text-[8px] text-zinc-500 uppercase font-mono block">FETCHING ELIGIBLE UNCHECKED UNIQUE CANDIDATES</span>
                      </div>
                    </div>
                  ) : drawnWinner ? (
                    <div className="text-center space-y-4 animate-fade-in">
                      <div className="w-12 h-12 bg-[#00FF00]/10 border border-[#00FF00]/30 rounded-full flex items-center justify-center mx-auto text-[#00FF00]">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] bg-black text-[#00FF00] font-black uppercase px-2 py-0.5 border border-[#00FF00]">WINNER DRAWN SUCCESS</span>
                        <h3 className="text-lg font-black uppercase tracking-tight">{drawnWinner.participantName}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">{drawnWinner.participantCompany}</p>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase leading-tight">Won: "{drawnWinner.prizeName}"</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block">SPINNER STANDBY</span>
                        <span className="text-[8px] text-zinc-600 uppercase font-mono block">SELECT A CATEGORY & HIT THE SPIN BUTTON</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleTriggerDraw}
                  disabled={isSpinning}
                  className="w-full bg-black hover:bg-neutral-800 disabled:bg-zinc-300 text-[#00FF00] disabled:text-zinc-500 font-black py-3.5 border border-black uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>{isSpinning ? 'SELECTING LUCKY WINNER...' : 'SPIN THE LUCKY DRAW WHEEL'}</span>
                </button>
              </div>

              {/* Winner Log & Prizes Inventory */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5 flex justify-between items-center">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-emerald-600" />
                    <span>Winners Registry & Prizes Inventory</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider">Prizes Inventory Stocks</span>
                  <div className="space-y-1.5">
                    {prizes.map(prz => (
                      <div key={prz.id} className="flex justify-between items-center border border-zinc-200 p-2 text-xs bg-zinc-50">
                        <span className="font-bold text-neutral-800 uppercase">{prz.name}</span>
                        <div className="flex gap-2 items-center">
                          <span className="text-[8px] font-bold uppercase text-zinc-400">Inventory:</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 border ${prz.remainingQuantity === 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                            {prz.remainingQuantity} / {prz.totalQuantity} LEFT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wider">Unrepeating Winner Log</span>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {winners.length === 0 ? (
                      <span className="text-[10px] text-zinc-400 uppercase block text-center py-6 border border-dashed border-zinc-200">No winners drawn yet</span>
                    ) : (
                      winners.map(w => (
                        <div key={w.id} className="border border-emerald-300 bg-emerald-50/40 p-2.5 flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <span className="font-black text-neutral-800 block uppercase">{w.participantName} ({w.participantCompany})</span>
                            <span className="text-[8px] text-zinc-500 block uppercase leading-none font-mono">Drawn at: {new Date(w.drawnAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[9px] font-black bg-black text-[#00FF00] px-1.5 py-0.5 border border-black uppercase">{w.prizeName}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SONG REQUESTS MODERATION & SUBMISSIONS */}
          {activeTab === 'songs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Request form for active participant */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-emerald-600" />
                    <span>Submit A Song Request</span>
                  </h2>
                </div>

                <form onSubmit={handleRequestSong} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase">Song Title Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. One More Time"
                        value={newSongTitle}
                        onChange={(e) => setNewSongTitle(e.target.value)}
                        className="w-full bg-white border border-black px-3 py-2 font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase">Band/Artist Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Daft Punk"
                        value={newSongArtist}
                        onChange={(e) => setNewSongArtist(e.target.value)}
                        className="w-full bg-white border border-black px-3 py-2 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase">Message to Live Band / Dedication (Optional)</label>
                    <textarea 
                      placeholder="e.g. Play this for the engineering team! Cheers!"
                      value={newSongMsg}
                      onChange={(e) => setNewSongMsg(e.target.value)}
                      className="w-full bg-white border border-black px-3 py-2 font-bold h-20"
                    />
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5" />
                      <span>APPROVED REQUESTS EARN +5 PTS!</span>
                    </span>
                    <button 
                      type="submit"
                      className="bg-black text-white hover:text-[#00FF00] font-bold py-2.5 px-4 border border-black flex items-center gap-1 cursor-pointer uppercase transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SEND TO LIVE BAND</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Moderation Queue for Live Band */}
              <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
                <div className="border-b-[1.5px] border-neutral-100 pb-2.5">
                  <h2 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>Live Band Control & Queue Board</span>
                  </h2>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {songRequests.length === 0 ? (
                    <span className="text-10px text-zinc-400 uppercase block text-center py-8 border border-dashed border-zinc-200">No song requests received yet</span>
                  ) : (
                    songRequests.map((song) => {
                      const isPending = song.status === 'PENDING';
                      const isApproved = song.status === 'APPROVED';
                      const isPlayed = song.status === 'PLAYED';

                      return (
                        <div key={song.id} className="border border-black p-3.5 bg-zinc-50 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black uppercase leading-tight text-neutral-800">"{song.title}"</h4>
                              <span className="text-[9px] text-zinc-500 block uppercase font-bold">Artist: {song.artist} • By: {song.participantName}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 border ${isPlayed ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : isApproved ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-zinc-100 border-zinc-300 text-zinc-600'}`}>
                              {song.status}
                            </span>
                          </div>

                          {song.message && (
                            <p className="p-2 bg-white border border-zinc-200 text-[10px] text-zinc-600 font-sans italic">"{song.message}"</p>
                          )}

                          {isPending && (
                            <div className="flex justify-end gap-1.5 text-[9px] font-black pt-1.5 border-t border-zinc-200">
                              <button 
                                onClick={() => handleModerateSong(song.id, 'REJECTED')}
                                className="px-2.5 py-1 border border-rose-300 bg-rose-50 text-rose-700 uppercase cursor-pointer"
                              >
                                DECLINE
                              </button>
                              <button 
                                onClick={() => handleModerateSong(song.id, 'APPROVED')}
                                className="px-2.5 py-1 border border-emerald-300 bg-emerald-50 text-emerald-700 uppercase cursor-pointer flex items-center gap-0.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>APPROVE</span>
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <div className="flex justify-end pt-1">
                              <button 
                                onClick={() => handleModerateSong(song.id, 'PLAYED')}
                                className="bg-black text-[#00FF00] hover:text-white font-black px-3 py-1 text-[9px] border border-black uppercase cursor-pointer flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                <span>MARK AS PLAYED</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR PANELS */}
        <div className="lg:col-span-4 space-y-6">

          {/* Quick Participant Profile Switcher */}
          <div className="bg-white border-[2px] border-black p-4 shadow-[4px_4px_0px_0px_#141414] space-y-3">
            <span className="font-bold text-[9px] text-zinc-400 block uppercase border-b border-zinc-100 pb-2">
              Select Active Participant
            </span>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute top-2.5 left-2.5" />
              <input 
                type="text"
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 pl-8 pr-3 py-2 text-xs font-bold uppercase rounded-sm"
              />
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {filteredParticipants.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPartId(p.id);
                    setDrawnWinner(null);
                  }}
                  className={`w-full p-2 border text-left flex justify-between items-center transition-all cursor-pointer ${selectedPartId === p.id ? 'border-black bg-black text-[#00FF00]' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'}`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase block truncate max-w-[150px]">{p.name}</span>
                    <span className="text-[8px] uppercase block opacity-80">{p.company}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-[#00FF00]/10 px-1.5 border border-[#00FF00]/30 text-[#00FF00]">
                    {p.currentPoints} PTS
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic In-App Notifications Drawer */}
          <div className="bg-white border-[2px] border-black p-4 shadow-[4px_4px_0px_0px_#141414] space-y-3">
            <div className="border-b border-zinc-100 pb-2 flex justify-between items-center">
              <span className="font-bold text-[9px] text-zinc-400 block uppercase">
                Notifications Inbox
              </span>
              <span className="text-[8px] bg-rose-100 border border-rose-300 text-rose-800 font-bold px-1.5 py-0.5 uppercase">
                {notifications.filter(n => !n.isRead).length} unread
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {notifications.length === 0 ? (
                <span className="text-[10px] text-zinc-400 uppercase block text-center py-4">No notifications</span>
              ) : (
                notifications.map(not => (
                  <div 
                    key={not.id} 
                    onClick={() => setNotifications(prev => prev.map(n => n.id === not.id ? { ...n, isRead: true } : n))}
                    className={`p-2.5 border text-xs relative flex flex-col gap-1 transition-all cursor-pointer ${not.isRead ? 'border-zinc-200 bg-zinc-50 opacity-70' : 'border-amber-400 bg-amber-50/40'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-neutral-800 uppercase block pr-4">{not.title}</span>
                      {not.isRead ? (
                        <BellOff className="w-3 h-3 text-zinc-400" />
                      ) : (
                        <Bell className="w-3 h-3 text-amber-500 animate-swing" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-tight uppercase font-sans font-medium">{not.message}</p>
                    <span className="text-[8px] text-zinc-400 font-mono block text-right">{new Date(not.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live System Diagnostics */}
          <div className="bg-zinc-950 text-white p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_#141414] space-y-3 font-mono">
            <span className="text-[#00FF00] text-xs font-black uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Double-Entry Logs Engine</span>
            </span>
            <div className="text-[9px] space-y-2 leading-relaxed text-zinc-400 uppercase">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>CONCURRENT CONNECTIONS:</span>
                <span className="text-white font-bold">1,048 ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>DATABASE LATENCY:</span>
                <span className="text-[#00FF00] font-bold">1.4ms (OK)</span>
              </div>
              <div className="flex justify-between">
                <span>LEDGER DRIFT PROTECTION:</span>
                <span className="text-emerald-400 font-bold">● PERFECT ALIGNMENT</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
