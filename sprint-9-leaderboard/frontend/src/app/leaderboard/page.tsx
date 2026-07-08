import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Search, 
  Plus, 
  Minus, 
  RefreshCw, 
  Zap, 
  Play, 
  Pause, 
  Gift, 
  Building2, 
  Sparkles, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  History, 
  ListFilter,
  UserCheck2,
  Award,
  Flame,
  Crown
} from 'lucide-react';
import { 
  LeaderboardEntryDto, 
  ScoreLogEntity, 
  MilestoneEntity, 
  LeaderboardStatsDto, 
  ReasonCodeType, 
  MilestoneType 
} from '../../../../backend/src/leaderboard/leaderboard.entity';
import { ClientLeaderboardService } from './client-service';

export default function LeaderboardSprintPage() {
  // In-memory service instantiation for high-fidelity client-only simulation capability
  const serviceRef = useRef(new ClientLeaderboardService());
  const service = serviceRef.current;

  // React State managers
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
  const [stats, setStats] = useState<LeaderboardStatsDto | null>(null);
  const [logs, setLogs] = useState<ScoreLogEntity[]>([]);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  
  // Scoring adjustments form state
  const [selectedAttendeeId, setSelectedAttendeeId] = useState('');
  const [scoreDelta, setScoreDelta] = useState(5);
  const [reasonCode, setReasonCode] = useState<ReasonCodeType>('SPOT_AWARD');
  const [customDescription, setCustomDescription] = useState('');
  const [staffActor, setStaffActor] = useState('Staff-Desk-Beta');

  // Milestone claim state
  const [selectedMilestoneAttendeeId, setSelectedMilestoneAttendeeId] = useState('');
  const [attendeeMilestones, setAttendeeMilestones] = useState<MilestoneEntity[]>([]);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');

  // Live simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIntervalId, setSimIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Load datasets
  const loadData = async () => {
    try {
      const lbRes = await fetch(`/api/sprint9/leaderboard?search=${encodeURIComponent(search)}&company=${encodeURIComponent(companyFilter)}&tier=${encodeURIComponent(tierFilter)}`);
      const stRes = await fetch('/api/sprint9/leaderboard/stats');
      const lgRes = await fetch('/api/sprint9/leaderboard/logs');

      if (lbRes.ok && stRes.ok && lgRes.ok) {
        const lb = await lbRes.json();
        const st = await stRes.json();
        const lg = await lgRes.json();

        setLeaderboard(lb);
        setStats(st);
        setLogs(lg);

        if (lb.length > 0 && !selectedAttendeeId) {
          setSelectedAttendeeId(lb[0].participantId);
        }
        if (lb.length > 0 && !selectedMilestoneAttendeeId) {
          setSelectedMilestoneAttendeeId(lb[0].participantId);
        }
        return;
      }
    } catch (e) {
      console.warn("Express API connection failed, falling back to in-memory service simulation:", e);
    }

    const lb = await service.getLeaderboard(search, companyFilter, tierFilter);
    const st = await service.getStats();
    const lg = await service.getScoreLogs();
    
    setLeaderboard(lb);
    setStats(st);
    setLogs(lg);

    // Default select state
    if (lb.length > 0 && !selectedAttendeeId) {
      setSelectedAttendeeId(lb[0].participantId);
    }
    if (lb.length > 0 && !selectedMilestoneAttendeeId) {
      setSelectedMilestoneAttendeeId(lb[0].participantId);
    }
  };

  // Run on filters or search modification
  useEffect(() => {
    loadData();
  }, [search, companyFilter, tierFilter]);

  // Handle select participant change for milestones panel
  useEffect(() => {
    if (selectedMilestoneAttendeeId) {
      const fetchMilestones = async () => {
        try {
          const res = await fetch(`/api/sprint9/leaderboard/milestones?participantId=${selectedMilestoneAttendeeId}`);
          if (res.ok) {
            const data = await res.json();
            setAttendeeMilestones(data);
            return;
          }
        } catch (e) {
          console.warn(e);
        }
        const fallback = await service.getMilestones(selectedMilestoneAttendeeId);
        setAttendeeMilestones(fallback);
      };
      fetchMilestones();
    }
  }, [selectedMilestoneAttendeeId, logs]);

  // Adjust Score Execution
  const handleAdjustScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendeeId) return;

    try {
      const res = await fetch('/api/sprint9/leaderboard/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': staffActor
        },
        body: JSON.stringify({
          participantId: selectedAttendeeId,
          pointsDelta: Number(scoreDelta),
          reasonCode,
          description: customDescription || `Manually granted points for ${reasonCode.replace('_', ' ')}`
        })
      });

      if (res.ok) {
        setCustomDescription('');
        showToast(`Success: Awarded ${scoreDelta > 0 ? '+' : ''}${scoreDelta} PTS!`);
        await loadData();
        return;
      }
    } catch (err: any) {
      console.warn("Express adjust score failed, falling back:", err);
    }

    try {
      await service.adjustScore({
        participantId: selectedAttendeeId,
        pointsDelta: scoreDelta,
        reasonCode,
        description: customDescription || `Manually granted points for ${reasonCode.replace('_', ' ')}`
      }, staffActor);

      setCustomDescription('');
      showToast(`Success: Awarded ${scoreDelta > 0 ? '+' : ''}${scoreDelta} PTS! (Simulation Only)`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Points adjustment failed.');
    }
  };

  // Claim Milestone Reward
  const handleClaimReward = async (milestoneName: MilestoneType) => {
    if (!selectedMilestoneAttendeeId) return;
    try {
      const res = await fetch('/api/sprint9/leaderboard/milestones/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': staffActor
        },
        body: JSON.stringify({
          participantId: selectedMilestoneAttendeeId,
          milestoneName
        })
      });

      if (res.ok) {
        setClaimSuccessMessage(`Successfully claimed reward for ${milestoneName.replace('_', ' ')}!`);
        setTimeout(() => setClaimSuccessMessage(''), 4000);
        await loadData();
        return;
      }
    } catch (e) {
      console.warn("Express claim failed, falling back:", e);
    }

    try {
      await service.claimMilestone({
        participantId: selectedMilestoneAttendeeId,
        milestoneName
      }, staffActor);

      setClaimSuccessMessage(`Successfully claimed reward for ${milestoneName.replace('_', ' ')}! (Simulation Only)`);
      setTimeout(() => setClaimSuccessMessage(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to claim reward.');
    }
  };

  // Reset Leaderboard
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the leaderboard? All custom score adjustments will be wiped.')) {
      try {
        const res = await fetch('/api/sprint9/leaderboard/reset', { method: 'POST' });
        if (res.ok) {
          setSearch('');
          setCompanyFilter('');
          setTierFilter('');
          showToast('Leaderboard state reset successfully.');
          await loadData();
          return;
        }
      } catch (e) {
        console.warn("Express reset failed, falling back:", e);
      }

      await service.resetLeaderboard();
      setSearch('');
      setCompanyFilter('');
      setTierFilter('');
      showToast('Leaderboard state reset to default benchmarks.');
      await loadData();
    }
  };

  // Dynamic Live Event Activity Simulator
  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(async () => {
        if (leaderboard.length === 0) return;

        const randomIdx = Math.floor(Math.random() * leaderboard.length);
        const participant = leaderboard[randomIdx];

        const deltas = [5, 10, -5];
        const randomDelta = deltas[Math.floor(Math.random() * deltas.length)];
        
        const reasons: ReasonCodeType[] = ['FEEDBACK', 'PHOTO_WALL', 'SONG_REQUEST', 'SPOT_AWARD'];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

        const descriptions = {
          FEEDBACK: 'Submitted a 5-star session rating.',
          PHOTO_WALL: 'Shared a high-res photo at the summit photo booth.',
          SONG_REQUEST: 'Queued a song request that the live band accepted.',
          SPOT_AWARD: 'Awarded spotlight trivia points by the MC.'
        };

        try {
          const res = await fetch('/api/sprint9/leaderboard/adjust', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-actor-name': 'SIMULATOR_BOT'
            },
            body: JSON.stringify({
              participantId: participant.participantId,
              pointsDelta: randomDelta,
              reasonCode: randomReason,
              description: descriptions[randomReason as keyof typeof descriptions] || 'Automated simulator bump.'
            })
          });

          if (res.ok) {
            showToast(`[LIVE UPDATE] ${participant.name} (${participant.company}) ${randomDelta > 0 ? 'gained' : 'lost'} ${Math.abs(randomDelta)} pts!`);
            await loadData();
            return;
          }
        } catch (e) {
          console.warn("Express sim adjust failed, falling back:", e);
        }

        await service.adjustScore({
          participantId: participant.participantId,
          pointsDelta: randomDelta,
          reasonCode: randomReason,
          description: descriptions[randomReason as keyof typeof descriptions] || 'Automated simulator bump.'
        }, 'SIMULATOR_BOT');

        showToast(`[LIVE UPDATE] ${participant.name} (${participant.company}) ${randomDelta > 0 ? 'gained' : 'lost'} ${Math.abs(randomDelta)} pts! (Simulation Only)`);
        await loadData();
      }, 3500);

      setSimIntervalId(interval);
      return () => clearInterval(interval);
    } else {
      if (simIntervalId) {
        clearInterval(simIntervalId);
        setSimIntervalId(null);
      }
    }
  }, [isSimulating, leaderboard]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? '' : prev);
    }, 3000);
  };

  // Helper colors for rankings
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-[#FFDF00]/20 border-[#FFDF00]', text: 'text-[#856404]', badge: 'bg-[#FFDF00] text-black font-extrabold' };
    if (rank === 2) return { bg: 'bg-slate-200/50 border-slate-400', text: 'text-slate-800', badge: 'bg-slate-300 text-slate-800' };
    if (rank === 3) return { bg: 'bg-[#CD7F32]/10 border-[#CD7F32]', text: 'text-[#6c4013]', badge: 'bg-[#CD7F32] text-white' };
    return { bg: 'bg-white border-[#141414]', text: 'text-slate-600', badge: 'bg-[#DFDEDA] text-slate-800' };
  };

  // Tiers threshold helper
  const getTierFromPoints = (points: number) => {
    if (points >= 25) return { name: 'Gold Category', color: 'bg-yellow-500', text: 'text-yellow-600 border-yellow-300 bg-yellow-50' };
    if (points >= 11) return { name: 'Silver Category', color: 'bg-slate-400', text: 'text-slate-600 border-slate-300 bg-slate-50' };
    if (points >= 5) return { name: 'Bronze Category', color: 'bg-orange-400', text: 'text-orange-600 border-orange-300 bg-orange-50' };
    return { name: 'Pending Boarding', color: 'bg-slate-200', text: 'text-slate-400 border-slate-200 bg-slate-100' };
  };

  // Filter top podium players
  const topPodium = leaderboard.slice(0, 3);
  const secondaryLeaderboard = leaderboard.slice(3);

  return (
    <div className="space-y-6 font-mono text-xs" id="sprint9-leaderboard-container">
      
      {/* Toast Alert bar */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white border-2 border-[#00FF00] p-4 flex items-center gap-3 shadow-xl max-w-sm rounded-none animate-bounce">
          <Zap className="w-5 h-5 text-[#00FF00] shrink-0 animate-pulse" />
          <span className="text-[11px] uppercase font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Deck */}
      <div className="tech-card bg-[#141414] p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-[#00FF00] stroke-[1.5]" />
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              Sprint 9: Leaderboard & Milestones Desk
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] mt-1 uppercase">
            [SaaS Engine] Active Participant points processing, Swag redemption verification, & real-time game simulation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Simulator Toggle Button */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex-1 md:flex-none py-2 px-4 border-2 font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
              isSimulating 
                ? 'bg-[#00FF00] border-[#00FF00] text-black hover:bg-[#00E000]' 
                : 'bg-transparent border-white text-white hover:bg-white/10'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Active Live Simulator' : 'Simulate Live Activity'}</span>
          </button>

          {/* Reset State Button */}
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none py-2 px-4 bg-red-600 border-2 border-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset State</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="tech-card p-4 bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Points Awarded</span>
            <span className="text-xl font-black text-slate-900">{stats?.totalPointsAwarded || 0} PTS</span>
          </div>
          <div className="p-2.5 bg-indigo-50 border border-indigo-200">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="tech-card p-4 bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Average Score Per Guest</span>
            <span className="text-xl font-black text-slate-900">{stats?.averagePointsPerAttendee || 0} PTS</span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200">
            <Flame className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="tech-card p-4 bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Active Score Logs</span>
            <span className="text-xl font-black text-slate-900">{stats?.totalScoreAdjustments || 0} Updates</span>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="tech-card p-4 bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Gold Tiers Unlocked</span>
            <span className="text-xl font-black text-slate-900">{stats?.unlockedMilestonesCount?.GOLD_RAFFLE_VIP || 0} Guests</span>
          </div>
          <div className="p-2.5 bg-yellow-50 border border-yellow-200">
            <Crown className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Main split sections: Leaderboard list vs Operations tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Interactive Boards (7cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top 3 Interactive Podium */}
          <div className="tech-card p-5 bg-gradient-to-b from-[#DFDEDA] to-[#CFCECA] border-[1.5px] border-[#141414]">
            <h3 className="font-bold text-slate-900 uppercase border-b border-black/20 pb-2 text-[10px] tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>Summit Podium standings</span>
            </h3>

            {/* Podium Graphics */}
            <div className="grid grid-cols-3 gap-3 pt-6 items-end">
              
              {/* Rank 2 (Silver) */}
              <div className="flex flex-col items-center">
                {topPodium[1] ? (
                  <>
                    <img 
                      src={topPodium[1].avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                      alt={topPodium[1].name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-400 mb-2"
                    />
                    <span className="text-[10px] font-bold text-slate-800 text-center truncate w-full">{topPodium[1].name}</span>
                    <span className="text-[9px] text-slate-500 uppercase">{topPodium[1].points} pts</span>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400">Empty</span>
                )}
                <div className="w-full bg-slate-300 border-[1.5px] border-[#141414] h-20 mt-2 flex flex-col justify-center items-center font-black text-slate-700 text-lg">
                  <span>2ND</span>
                </div>
              </div>

              {/* Rank 1 (Gold) */}
              <div className="flex flex-col items-center">
                {topPodium[0] ? (
                  <>
                    <Trophy className="w-5 h-5 text-yellow-500 animate-bounce mb-1 fill-yellow-200" />
                    <img 
                      src={topPodium[0].avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'} 
                      alt={topPodium[0].name} 
                      className="w-16 h-16 rounded-full object-cover border-4 border-yellow-400 mb-2"
                    />
                    <span className="text-[11px] font-black text-slate-900 text-center truncate w-full">{topPodium[0].name}</span>
                    <span className="text-[9px] font-bold text-yellow-700 uppercase bg-yellow-100 border border-yellow-300 px-1.5">{topPodium[0].points} pts</span>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400">Empty</span>
                )}
                <div className="w-full bg-[#FFDF00] border-[1.5px] border-[#141414] h-28 mt-2 flex flex-col justify-center items-center font-black text-black text-xl shadow-md">
                  <span>1ST</span>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="flex flex-col items-center">
                {topPodium[2] ? (
                  <>
                    <img 
                      src={topPodium[2].avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'} 
                      alt={topPodium[2].name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#CD7F32] mb-2"
                    />
                    <span className="text-[10px] font-bold text-slate-800 text-center truncate w-full">{topPodium[2].name}</span>
                    <span className="text-[9px] text-slate-500 uppercase">{topPodium[2].points} pts</span>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400">Empty</span>
                )}
                <div className="w-full bg-orange-200 border-[1.5px] border-[#141414] h-16 mt-2 flex flex-col justify-center items-center font-black text-amber-900 text-md">
                  <span>3RD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Lists */}
          <div className="tech-card p-5 bg-white">
            <div className="border-b border-[#141414] pb-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm uppercase">Checked-In Attendee Standings</h3>
                <span className="text-[9px] bg-black text-[#00FF00] px-2 py-0.5 font-bold uppercase">Live Boarding</span>
              </div>

              {/* Filtering / Searching Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search attendee..."
                    className="tech-input pl-8 w-full text-xs font-mono"
                  />
                </div>

                {/* Company filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    placeholder="Company filter..."
                    className="tech-input pl-8 w-full text-xs font-mono"
                  />
                </div>

                {/* Tier Filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <ListFilter className="w-3.5 h-3.5" />
                  </span>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="tech-input pl-8 w-full text-xs font-mono py-1 appearance-none cursor-pointer"
                  >
                    <option value="">All Tiers</option>
                    <option value="GOLD">Gold (25+ pts)</option>
                    <option value="SILVER">Silver (11-24 pts)</option>
                    <option value="BRONZE">Bronze (5-10 pts)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List Loop */}
            <div className="mt-4 space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">
                  No checked-in participants match filter criteria.
                </div>
              ) : (
                leaderboard.map((item) => {
                  const styles = getRankStyle(item.rank);
                  const tier = getTierFromPoints(item.points);

                  return (
                    <div
                      key={item.participantId}
                      className={`p-3 rounded-none border-[1.5px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${styles.bg}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span className={`h-6 w-6 rounded-none flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-black ${styles.badge}`}>
                          {item.rank}
                        </span>

                        {/* Avatar */}
                        <img
                          src={item.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={item.name}
                          className="w-9 h-9 rounded-none border border-[#141414] object-cover shrink-0"
                        />

                        {/* Name & Company */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-950 text-xs truncate">{item.name}</span>
                            {!item.checkedIn && (
                              <span className="bg-red-50 text-red-600 border border-red-200 text-[8px] font-bold px-1 rounded-none uppercase shrink-0">
                                Unchecked
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate uppercase">
                            {item.company} &bull; {item.position}
                          </p>
                        </div>
                      </div>

                      {/* Score Metrics */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pl-9 sm:pl-0">
                        {/* Milestone indicators */}
                        <div className="flex gap-1.5">
                          {item.unlockedMilestones.map((m, idx) => (
                            <span 
                              key={idx} 
                              title={`Unlocked reward: ${m}`}
                              className="text-[8px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-300 uppercase shrink-0"
                            >
                              {m === 'BRONZE_PASS' && 'Bronze Key'}
                              {m === 'SILVER_LOUNGE' && 'VIP Swag'}
                              {m === 'GOLD_RAFFLE_VIP' && 'Raffle VIP'}
                            </span>
                          ))}
                        </div>

                        {/* Point total */}
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-sm font-mono block">
                            {item.points} PTS
                          </span>
                          <span className={`text-[8px] uppercase border px-1.5 font-bold ${tier.text}`}>
                            {tier.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Operation Desk & Logs (5cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Point Adjust Desk */}
          <div className="tech-card p-5 bg-white">
            <h3 className="font-bold text-slate-950 uppercase border-b border-[#141414] pb-2 text-[10px] tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-black" />
              <span>Coordinators Scoring Desk</span>
            </h3>

            <form onSubmit={handleAdjustScore} className="mt-4 space-y-4 font-mono text-[11px]">
              
              {/* Select Guest */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Select Attendee</label>
                <select
                  value={selectedAttendeeId}
                  onChange={(e) => setSelectedAttendeeId(e.target.value)}
                  className="tech-input w-full p-2 text-xs"
                >
                  {leaderboard.map(p => (
                    <option key={p.participantId} value={p.participantId}>
                      {p.name} ({p.company}) - {p.points} pts
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjust Points Delta */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScoreDelta(5)}
                  className={`py-2 border font-bold text-xs ${scoreDelta === 5 ? 'bg-black text-white border-black' : 'border-slate-300 hover:bg-slate-50'}`}
                >
                  +5 Points
                </button>
                <button
                  type="button"
                  onClick={() => setScoreDelta(10)}
                  className={`py-2 border font-bold text-xs ${scoreDelta === 10 ? 'bg-black text-white border-black' : 'border-slate-300 hover:bg-slate-50'}`}
                >
                  +10 Points
                </button>
                <button
                  type="button"
                  onClick={() => setScoreDelta(-5)}
                  className={`py-2 border font-bold text-xs ${scoreDelta === -5 ? 'bg-black text-white border-black' : 'border-slate-300 hover:bg-slate-50'}`}
                >
                  -5 Points
                </button>
                <button
                  type="button"
                  onClick={() => setScoreDelta(-10)}
                  className={`py-2 border font-bold text-xs ${scoreDelta === -10 ? 'bg-black text-white border-black' : 'border-slate-300 hover:bg-slate-50'}`}
                >
                  -10 Points
                </button>
              </div>

              {/* Reason Code */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Reason Code</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value as ReasonCodeType)}
                  className="tech-input w-full p-2 text-xs"
                >
                  <option value="SPOT_AWARD">Spot Trivia Award</option>
                  <option value="CHECK_IN">QR Check-In Pass</option>
                  <option value="FEEDBACK">Feedback submission</option>
                  <option value="PHOTO_WALL">Photo Wall Sharing</option>
                  <option value="SONG_REQUEST">Song approval dedication</option>
                  <option value="MANUAL_CORRECTION">Manual Score Adjustment</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Description notes</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. Winner of the quiz segment."
                  className="tech-input w-full p-2 text-xs"
                />
              </div>

              {/* Staff signature */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Staff actor signature</label>
                <input
                  type="text"
                  value={staffActor}
                  onChange={(e) => setStaffActor(e.target.value)}
                  placeholder="Staff-Desk-01"
                  className="tech-input w-full p-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-black hover:bg-slate-800 text-white font-bold uppercase text-[10px] border-[1.5px] border-black transition-colors cursor-pointer"
              >
                Award / Revoke Points Delta
              </button>
            </form>
          </div>

          {/* Milestones Swag Redemption Verification */}
          <div className="tech-card p-5 bg-white">
            <h3 className="font-bold text-slate-950 uppercase border-b border-[#141414] pb-2 text-[10px] tracking-wider flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-black" />
              <span>Rewards & Swag Redemption</span>
            </h3>

            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Selected Guest profile</label>
                <select
                  value={selectedMilestoneAttendeeId}
                  onChange={(e) => setSelectedMilestoneAttendeeId(e.target.value)}
                  className="tech-input w-full p-2 text-xs font-mono"
                >
                  {leaderboard.map(p => (
                    <option key={p.participantId} value={p.participantId}>
                      {p.name} - {p.points} PTS
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestones list status */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Milestones reward eligibility</span>

                {attendeeMilestones.length === 0 ? (
                  <p className="text-slate-400 italic text-[10px]">No milestones unlocked yet. Build up points first.</p>
                ) : (
                  <div className="space-y-2">
                    {attendeeMilestones.map((milestone) => (
                      <div key={milestone.id} className="p-2.5 bg-slate-50 border border-slate-200 flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-slate-900 uppercase block">
                            {milestone.milestoneName === 'BRONZE_PASS' && 'Bronze Pass Reward (5 PTS)'}
                            {milestone.milestoneName === 'SILVER_LOUNGE' && 'VIP Silver Swag (11 PTS)'}
                            {milestone.milestoneName === 'GOLD_RAFFLE_VIP' && 'Gold Grand Raffle Ticket (21 PTS)'}
                          </span>
                          <span className="text-slate-400 text-[9px]">
                            Unlocked at {new Date(milestone.unlockedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {milestone.claimed ? (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 font-bold uppercase">
                            Redeemed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaimReward(milestone.milestoneName)}
                            className="bg-black hover:bg-slate-800 text-white font-bold px-2.5 py-1 uppercase text-[9px] cursor-pointer"
                          >
                            Redeem Swag
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {claimSuccessMessage && (
                <div className="p-2.5 bg-green-50 border border-green-300 text-green-700 font-bold uppercase text-[9px]">
                  {claimSuccessMessage}
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs panel */}
          <div className="tech-card p-5 bg-white">
            <h3 className="font-bold text-slate-950 uppercase border-b border-[#141414] pb-2 text-[10px] tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-black" />
              <span>Leaderboard Audit Trail</span>
            </h3>

            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-slate-400 italic text-center py-4">No audit logs yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-2 bg-slate-50 border border-slate-150 text-[9px] flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-900 uppercase">[{log.reasonCode}]</span>
                        <span className="text-[8px] text-slate-400">by {log.actorId}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.description}</p>
                    </div>
                    <span className={`px-1.5 py-0.2 font-bold uppercase shrink-0 ${log.pointsDelta > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {log.pointsDelta > 0 ? `+${log.pointsDelta}` : log.pointsDelta} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
