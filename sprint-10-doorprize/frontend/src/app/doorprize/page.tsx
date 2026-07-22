import React, { useState, useEffect, useRef } from 'react';
import { 
  Gift, 
  Search, 
  Filter, 
  Check, 
  RotateCcw, 
  Activity, 
  UserCheck, 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  Plus, 
  Minus, 
  Zap, 
  Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientDoorPrizeService } from './client-service';
import { DoorPrizeParticipantDto, DoorPrizeClaimEntity, DoorPrizeStatsDto } from '../../../../backend/src/doorprize/doorprize.entity';

export default function DoorPrizeSprintPage() {
  const serviceRef = useRef(new ClientDoorPrizeService());
  const service = serviceRef.current;

  // React State managers
  const [participants, setParticipants] = useState<DoorPrizeParticipantDto[]>([]);
  const [claimsLogs, setClaimsLogs] = useState<DoorPrizeClaimEntity[]>([]);
  const [stats, setStats] = useState<DoorPrizeStatsDto | null>(null);
  
  // Filtering & searching controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'GOLD' | 'SILVER' | 'BRONZE'>('ALL');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState<'ALL' | 'CLAIMED' | 'UNCLAIMED'>('ALL');

  // Interactive Simulation Controls
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [pointsAdjustDelta, setPointsAdjustDelta] = useState<number>(5);
  const [staffActorName, setStaffActorName] = useState('Staff-Desk-01');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Audio simulator (Web Audio API)
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked by browser gesture
    }
  };

  const playSuccessChime = () => {
    playSound(400, 'sine', 0.1);
    setTimeout(() => playSound(600, 'sine', 0.1), 80);
    setTimeout(() => playSound(900, 'sine', 0.25), 160);
  };

  const playErrorChime = () => {
    playSound(220, 'sawtooth', 0.15);
    setTimeout(() => playSound(180, 'sawtooth', 0.2), 100);
  };

  // Synchronize state from service
  const refreshData = async () => {
    try {
      const isClaimed = selectedClaimStatus === 'CLAIMED' ? true : selectedClaimStatus === 'UNCLAIMED' ? false : undefined;
      const tierParam = selectedTier === 'ALL' ? undefined : selectedTier;
      
      const list = await service.getParticipantsList(
        searchTerm || undefined,
        selectedCompany || undefined,
        tierParam,
        isClaimed
      );
      
      const logs = await service.getClaimsLogs();
      const metrics = await service.getStats();

      setParticipants(list);
      setClaimsLogs(logs);
      setStats(metrics);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [searchTerm, selectedCompany, selectedTier, selectedClaimStatus]);

  // Handle a manual prize claim
  const handleClaimPrize = async (pId: string, tierName: string) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const claim = await service.claimPrize({
        participantId: pId,
        tier: tierName
      }, staffActorName);

      playSuccessChime();
      setSuccessMessage(`Successfully claimed ${tierName} for candidate! (Claim ID: ${claim.id})`);
      refreshData();
    } catch (err: any) {
      playErrorChime();
      setErrorMessage(err.message || 'Claim failed due to points verification mismatch.');
    }
  };

  // Adjust points helper for sandbox testing
  const handleAdjustPoints = async (pId: string, delta: number) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await service.updateParticipantPoints(pId, delta);
      playSound(320 + (delta * 10), 'triangle', 0.08);
      refreshData();
    } catch (err: any) {
      setErrorMessage('Failed to adjust points.');
    }
  };

  // Check In participant helper for sandbox testing
  const handleQuickCheckIn = async (pId: string) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await service.checkInParticipant(pId);
      playSound(550, 'sine', 0.1);
      setSuccessMessage('Participant successfully checked in!');
      refreshData();
    } catch (err: any) {
      setErrorMessage('Failed to check in.');
    }
  };

  // Reset all redemptions
  const handleResetClaims = async () => {
    if (confirm('Are you sure you want to reset all claimed door prizes? Points will be set back to seeded default levels.')) {
      setErrorMessage('');
      setSuccessMessage('');
      await service.resetClaims();
      playSound(150, 'sawtooth', 0.3);
      setSuccessMessage('Redemptions reset successfully.');
      refreshData();
    }
  };

  // Helper to retrieve detailed prize item info for each tier level
  const getPrizeDetails = (tierLevel: number, tierName?: string) => {
    if (tierLevel === 3 || (tierName && tierName.toLowerCase().includes('gold'))) {
      return {
        item: 'Smart Watch Pro & VIP Merch Kit',
        category: 'Gold Tier Reward',
        badgeColor: 'bg-amber-100 text-amber-950 border-amber-300',
        icon: '🏆'
      };
    }
    if (tierLevel === 2 || (tierName && tierName.toLowerCase().includes('silver'))) {
      return {
        item: 'ANC Wireless Earbuds & Tumbler',
        category: 'Silver Tier Reward',
        badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
        icon: '🎧'
      };
    }
    return {
      item: 'Event Souvenir Pack & Tote Bag',
      category: 'Bronze Tier Reward',
      badgeColor: 'bg-orange-50 text-orange-950 border-orange-300',
      icon: '🎁'
    };
  };

  // Export claims log to CSV
  const handleExportCSV = () => {
    if (claimsLogs.length === 0) return;
    const headers = ['Claim ID', 'Participant ID', 'Attendee Name', 'Company', 'Eligible Tier', 'Prize Item', 'Claimed At', 'Authorized Actor'];
    const rows = claimsLogs.map(c => {
      const prize = getPrizeDetails(0, c.eligibleTier);
      return [
        c.id,
        c.participantId,
        c.participantName,
        c.participantCompany,
        c.eligibleTier,
        prize.item,
        c.claimedAt.toISOString ? c.claimedAt.toISOString() : String(c.claimedAt),
        c.actorId
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EventHub_DoorPrize_Claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const companiesList = Array.from(new Set(participants.map(p => p.company))).filter(Boolean);

  return (
    <div className="space-y-6" id="door-prize-dashboard">
      
      {/* 1. INTERACTIVE METRIC HERO STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center shrink-0 border border-black">
            <Gift className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black">Total Claims</span>
            <div className="text-xl font-black text-black">{stats?.totalClaims || 0} claimed</div>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center shrink-0 border border-black">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black">Checked-In Guests</span>
            <div className="text-xl font-black text-black">{stats?.totalCheckedInEligible || 0} present</div>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center shrink-0 border border-black">
            <TrendingUp className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black">Claim Rate</span>
            <div className="text-xl font-black text-black">{stats?.claimRatePercent || 0}%</div>
          </div>
        </div>

        <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-white text-[#141414] flex items-center justify-center shrink-0 border border-black">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-600 uppercase font-black">Gold / Silver / Bronze</span>
            <div className="text-xs font-bold text-black truncate flex gap-1">
              <span className="text-amber-600">G: {stats?.eligibilityDistribution['Gold Tier Selections'] || 0}</span> | 
              <span className="text-slate-600"> S: {stats?.eligibilityDistribution['Silver Tier Selections'] || 0}</span> | 
              <span className="text-amber-800"> B: {stats?.eligibilityDistribution['Bronze Tier Selections'] || 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ERROR / SUCCESS DISMISSABLE TOASTS */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-100 border-[1.5px] border-emerald-900 text-emerald-950 font-mono text-xs font-bold flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-800" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="hover:text-emerald-700 cursor-pointer text-[10px] uppercase font-bold">[Dismiss]</button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-rose-100 border-[1.5px] border-rose-900 text-rose-950 font-mono text-xs font-bold flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-800" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="hover:text-rose-700 cursor-pointer text-[10px] uppercase font-bold">[Dismiss]</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DUAL-GRID SECTION: MAIN CLAIMS TABLE AND SIDEBAR CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (8 SPANS): SEARCH, FILTERS, AND ATTENDEES LIST */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white border-[1.5px] border-[#141414] p-4 space-y-4 font-mono text-xs">
            
            {/* SEARCH AND FILTERS TOOLBAR */}
            <div className="flex flex-wrap gap-3 items-center">
              
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="SEARCH ATTENDEE BY NAME, POSITION, EMAIL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tech-input pl-9 uppercase placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as any)}
                  className="tech-input font-bold uppercase py-1 px-2.5"
                >
                  <option value="ALL">All Tiers</option>
                  <option value="GOLD">Gold (21+ pts)</option>
                  <option value="SILVER">Silver (11-20 pts)</option>
                  <option value="BRONZE">Bronze (0-10 pts)</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedClaimStatus}
                  onChange={(e) => setSelectedClaimStatus(e.target.value as any)}
                  className="tech-input font-bold uppercase py-1 px-2.5"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CLAIMED">Claimed</option>
                  <option value="UNCLAIMED">Unclaimed</option>
                </select>
              </div>

            </div>

            {/* MAIN ATTENDEES TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-[1.5px] border-black bg-[#DFDEDA] text-[10px] font-black uppercase tracking-wider text-slate-700">
                    <th className="py-2.5 px-3">Attendee Profile</th>
                    <th className="py-2.5 px-3">Points</th>
                    <th className="py-2.5 px-3 text-center">Eligibility Tier</th>
                    <th className="py-2.5 px-3">Prize Reward Info</th>
                    <th className="py-2.5 px-3 text-right">Actions / Redemptions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic font-mono text-[11px]">
                        No matching checked-in event attendees found.
                      </td>
                    </tr>
                  ) : (
                    participants.map((p) => {
                      const prize = getPrizeDetails(p.tierLevel, p.eligibleTier);
                      return (
                        <tr 
                          key={p.participantId} 
                          className={`hover:bg-[#DFDEDA]/20 transition-colors ${
                            selectedParticipantId === p.participantId ? 'bg-amber-50/70 border-l-[3px] border-amber-500' : ''
                          }`}
                          onClick={() => setSelectedParticipantId(p.participantId)}
                        >
                          <td className="py-3 px-3 flex items-center gap-3">
                            <img
                              src={p.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-none border border-black shrink-0 bg-slate-100 object-cover"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-[#141414] uppercase truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {!p.checkedIn && (
                                  <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-1 border border-rose-300">ABSENT</span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-500 uppercase truncate">
                                {p.company} — {p.position}
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-black">{p.points} PTS</span>
                              <div className="flex gap-0.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAdjustPoints(p.participantId, 5); }}
                                  className="p-0.5 border border-black hover:bg-slate-100 cursor-pointer text-slate-700"
                                  title="Add 5 Points"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAdjustPoints(p.participantId, -5); }}
                                  className="p-0.5 border border-black hover:bg-slate-100 cursor-pointer text-slate-700"
                                  title="Deduct 5 Points"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block font-black text-[9px] uppercase px-2 py-0.5 border ${
                              p.tierLevel === 3 ? 'bg-amber-100 text-amber-950 border-amber-400' :
                              p.tierLevel === 2 ? 'bg-slate-100 text-slate-950 border-slate-400' :
                              'bg-orange-50 text-orange-950 border-orange-400'
                            }`}>
                              {p.eligibleTier}
                            </span>
                          </td>

                          {/* PRIZE ITEM / REWARD INFO COLUMN */}
                          <td className="py-3 px-3 font-mono">
                            <div className="min-w-[190px]">
                              <div className="font-extrabold text-[#141414] text-[11px] uppercase flex items-center gap-1.5">
                                <span className="text-xs shrink-0">{prize.icon}</span>
                                <span className="truncate">{prize.item}</span>
                              </div>
                              <div className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">
                                🎁 Redeemable Item
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.claimed ? (
                                <div className="flex flex-col items-end">
                                  <span className="bg-emerald-100 text-emerald-950 text-[9px] font-black px-2 py-0.5 border border-emerald-400 flex items-center gap-1 select-none">
                                    <Check className="w-3 h-3 text-emerald-800 stroke-[3]" />
                                    <span>CLAIMED</span>
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-bold font-mono mt-0.5 truncate max-w-[120px]">
                                    {prize.item.split('&')[0]}
                                  </span>
                                  {p.claimedAt && (
                                    <span className="text-[8px] text-slate-400 font-mono mt-0.2">
                                      {new Date(p.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              ) : !p.checkedIn ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleQuickCheckIn(p.participantId); }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[9px] py-1 px-2 border border-rose-400 font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Check In Guest
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleClaimPrize(p.participantId, p.eligibleTier); }}
                                  className="bg-black hover:bg-neutral-800 text-[#00FF00] text-[9px] py-1.5 px-3 border border-black font-extrabold uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <span>Redeem</span>
                                  <span className="text-[8px] opacity-80">({prize.item.split('&')[0]})</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (4 SPANS): LIVE CLAIM LOGS, CONTROLS, AND SANDBOX */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* SANDBOX OVERRIDE CONTROL DECK */}
          <div className="bg-white border-[1.5px] border-[#141414] p-4 space-y-4 font-mono text-xs">
            <h3 className="font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-black animate-pulse" />
              <span>Sandbox Control Deck</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase">Staff Authority Name</label>
                <input
                  type="text"
                  value={staffActorName}
                  onChange={(e) => setStaffActorName(e.target.value)}
                  className="tech-input uppercase"
                />
              </div>

              {selectedParticipantId ? (
                (() => {
                  const target = participants.find(p => p.participantId === selectedParticipantId);
                  return target ? (
                    <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-3 space-y-2">
                      <div className="flex justify-between font-bold text-black uppercase">
                        <span>Selected Guest:</span>
                        <span className="text-[#141414]">{target.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 uppercase">
                        ID: {target.participantId} | Current Points: <span className="font-black text-black">{target.points} PTS</span>
                      </div>

                      <div className="text-[10px] font-bold text-amber-950 bg-amber-100 p-2 border border-amber-300 uppercase flex items-center gap-1.5">
                        <span className="text-xs">{getPrizeDetails(target.tierLevel, target.eligibleTier).icon}</span>
                        <div className="truncate">
                          <span className="block text-[8px] text-amber-800 font-extrabold">Eligible Reward Item:</span>
                          <span className="truncate block font-black">{getPrizeDetails(target.tierLevel, target.eligibleTier).item}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleAdjustPoints(target.participantId, pointsAdjustDelta)}
                          className="bg-white hover:bg-slate-100 text-black py-1 px-2 border border-black font-bold uppercase text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                          <span>Add {pointsAdjustDelta} pts</span>
                        </button>
                        <button
                          onClick={() => handleAdjustPoints(target.participantId, -pointsAdjustDelta)}
                          className="bg-white hover:bg-slate-100 text-black py-1 px-2 border border-black font-bold uppercase text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-rose-700" />
                          <span>Deduct {pointsAdjustDelta} pts</span>
                        </button>
                      </div>

                      <div className="pt-1">
                        {!target.checkedIn ? (
                          <button
                            onClick={() => handleQuickCheckIn(target.participantId)}
                            className="w-full bg-[#141414] hover:bg-neutral-800 text-white py-1.5 px-3 border border-black font-bold uppercase text-[9px] cursor-pointer"
                          >
                            Check-In Guest
                          </button>
                        ) : !target.claimed ? (
                          <button
                            onClick={() => handleClaimPrize(target.participantId, target.eligibleTier)}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 px-3 border border-emerald-900 font-black uppercase text-[9px] cursor-pointer"
                          >
                            Redeem {target.eligibleTier}
                          </button>
                        ) : (
                          <div className="text-center text-[10px] text-emerald-800 bg-white border border-emerald-300 py-1 font-bold uppercase">
                            ✓ Redemptions Processed
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()
              ) : (
                <div className="bg-[#DFDEDA] p-4 text-center border-[1.5px] border-[#141414] text-[10px] text-slate-500 italic">
                  Select any guest in the left table to instantly adjust points, view active eligibility category, or trigger redemptions!
                </div>
              )}

              <div className="border-t border-slate-300 pt-3 flex gap-2">
                <button
                  onClick={handleResetClaims}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border-[1.5px] border-rose-300 py-2 font-bold uppercase tracking-wide text-[9px] text-center cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Purge Claims</span>
                </button>
              </div>

            </div>
          </div>

          {/* CHRONOLOGICAL CLAIM AUDIT TRAILS */}
          <div className="bg-[#141414] text-slate-100 border-[1.5px] border-[#141414] p-4 space-y-3 font-mono text-xs">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-[#E4E3E0] uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#00FF00]" />
                <span>Claim Audit logs ({claimsLogs.length})</span>
              </h3>

              <div className="flex gap-1.5">
                <button
                  onClick={handleExportCSV}
                  disabled={claimsLogs.length === 0}
                  className="hover:text-white text-[#00FF00] font-black cursor-pointer uppercase text-[9px] flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
                  title="Export CSV logs"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 text-[10px] scrollbar-thin">
              {claimsLogs.length === 0 ? (
                <p className="text-slate-500 italic text-center py-4">No prizes claimed in this session yet.</p>
              ) : (
                claimsLogs.map((log) => {
                  const prize = getPrizeDetails(0, log.eligibleTier);
                  return (
                    <div key={log.id} className="bg-neutral-900 border border-slate-800 p-2.5 space-y-1">
                      <div className="flex justify-between items-center text-slate-400 font-bold uppercase">
                        <span className="text-[#00FF00] truncate max-w-[150px]">{log.participantName}</span>
                        <span>{log.id.split('-')[0]}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase truncate">
                        Company: {log.participantCompany}
                      </div>
                      <div className="bg-neutral-800 p-1.5 border border-neutral-700 text-[9px] flex items-center gap-1.5 text-amber-300">
                        <span>{prize.icon}</span>
                        <span className="font-extrabold truncate">{prize.item}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[8px]">
                        <span className="font-black text-white">{log.eligibleTier}</span>
                        <span>By {log.actorId}</span>
                      </div>
                      <div className="text-right text-[8px] text-slate-500 font-mono">
                        {new Date(log.claimedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
