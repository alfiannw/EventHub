import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Trophy, Download, RotateCcw, AlertTriangle, Users, Play, CheckCircle2, Music, Filter, Award, ShieldCheck } from 'lucide-react';
import { LuckyDrawCategory, LuckyDrawWinner, Participant } from '../types';
import SearchableSelect, { SearchOption } from './SearchableSelect';

interface LuckyDrawProps {
  categories: LuckyDrawCategory[];
  winners: LuckyDrawWinner[];
  participants: Participant[];
  onDrawWinner: (categoryId: string) => Promise<{ winner: LuckyDrawWinner; eligibleCount: number }>;
  onResetWinners: () => Promise<void>;
}

export default function LuckyDraw({
  categories,
  winners,
  participants,
  onDrawWinner,
  onResetWinners
}: LuckyDrawProps) {
  
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');

  const getTierIcon = (index: number, name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('grand') || index === 0) return '🏆';
    if (lower.includes('gold') || index === 1) return '🥇';
    if (lower.includes('silver') || index === 2) return '🥈';
    if (lower.includes('bronze') || index === 3) return '🥉';
    return '🎁';
  };

  // Spinner Animation States
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinWinner, setSpinWinner] = useState<LuckyDrawWinner | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [forcedParticipantId, setForcedParticipantId] = useState<string>('');

  // Audio simulator (using Web Audio API for actual arcade bell chime sounds!)
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.15) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted/supported
    }
  };

  // Pre-calculate eligibility whenever category selection changes
  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const checkedInCount = participants.filter(p => p.checkedIn).length;
  
  useEffect(() => {
    if (activeCategory) {
      const wonIds = new Set(winners.map(w => w.participantId));
      const count = participants.filter(p => {
        return p.checkedIn && p.points >= activeCategory.eligiblePointsMin && !wonIds.has(p.id);
      }).length;
      setEligibleCount(count);
    }
  }, [selectedCategoryId, winners, participants, activeCategory]);

  const handleLaunchSpin = async () => {
    if (!selectedCategoryId || isSpinning) return;
    setErrorMessage('');
    
    try {
      // 1. Fetch real winner from server first (keeps database state accurate)
      const res = await onDrawWinner(selectedCategoryId);
      const winner = res.winner;
      
      // 2. Trigger spinning state
      setIsSpinning(true);
      setSpinWinner(winner);
      
      // Ring spinning tick sounds periodically during spin
      let currentFreq = 300;
      const tickInterval = setInterval(() => {
        playChime(currentFreq, 'triangle', 0.05);
        currentFreq = currentFreq === 300 ? 450 : 300;
      }, 100);

      // Increase rotation state to simulate momentum
      const extraRotations = 1440 + Math.floor(Math.random() * 360); // At least 4 full circles
      const targetRotation = wheelRotation + extraRotations;
      setWheelRotation(targetRotation);

      // 3. Stop spinner after 4 seconds
      setTimeout(() => {
        clearInterval(tickInterval);
        setIsSpinning(false);
        
        // Ring winner trumpet arcade sound
        playChime(523.25, 'sine', 0.12); // C5
        setTimeout(() => {
          playChime(659.25, 'sine', 0.12); // E5
          setTimeout(() => {
            playChime(783.99, 'sine', 0.12); // G5
            setTimeout(() => {
              playChime(1046.50, 'sine', 0.4); // C6
            }, 120);
          }, 120);
        }, 120);

        setShowWinnerModal(true);
      }, 4000);

    } catch (err: any) {
      setErrorMessage(err.message || "Failed to draw winner. Verify eligibility constraints.");
    }
  };

  const handleExportCSV = () => {
    if (winners.length === 0) return;
    
    const headers = ['Winner ID', 'Participant ID', 'Name', 'Company', 'Prize Tier', 'Prize Name', 'Drawn Timestamp'];
    const rows = winners.map((w, index) => [
      `W-${index + 1}`,
      w.participantId,
      w.participantName,
      w.participantCompany,
      w.prizeCategoryName,
      w.prizeName,
      w.drawnAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EventHub_LuckyDraw_Winners_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredWinners = selectedTierFilter === 'ALL'
    ? winners
    : winners.filter(w => w.prizeCategoryName === selectedTierFilter);

  return (
    <div className="space-y-6" id="lucky-draw-panel">
      
      {/* Upper Grid: Selection & Animated Wheel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="lucky-draw-wheel-dashboard">
        
        {/* Draw Options and Parameters Column */}
        <div className="lg:col-span-5 bg-white rounded-none border-[1.5px] border-[#141414] p-5 flex flex-col justify-between font-mono text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-black" />
                <span>Lucky Draw Configuration</span>
              </div>
              <span className="text-[9px] bg-black text-[#00FF00] font-mono px-2 py-0.5 uppercase font-bold">
                Tier-Based Draw
              </span>
            </h3>

            {/* Total Checked-In Info Banner */}
            <div className="bg-[#141414] text-slate-100 p-3.5 rounded-none space-y-1 border-[1.5px] border-black">
              <div className="flex justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
                <span>Active Audience pool:</span>
                <span className="text-[#00FF00] font-mono text-[13px] font-bold">{checkedInCount} Checked-In</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal uppercase">
                Only checked-in guests meeting point thresholds for each prize tier are eligible.
              </p>
            </div>

            {/* Interactive Prize Tier Selector Grid */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-black" />
                  <span>Select Target Prize Tier:</span>
                </label>
                <span className="text-[9px] text-slate-500 font-bold font-mono">
                  {categories.length} Prize Tiers
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {categories.map((cat, idx) => {
                  const isSelected = cat.id === selectedCategoryId;
                  const catWinnersCount = winners.filter(w => w.prizeCategoryName === cat.name).length;
                  const wonIds = new Set(winners.map(w => w.participantId));
                  const catEligible = participants.filter(p => p.checkedIn && p.points >= cat.eligiblePointsMin && !wonIds.has(p.id)).length;
                  const isQuotaFilled = catWinnersCount >= cat.quantity;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full text-left p-3 border-[1.5px] transition-all cursor-pointer font-mono relative ${
                        isSelected
                          ? 'bg-[#141414] text-white border-black shadow-[3px_3px_0px_0px_#00FF00]'
                          : 'bg-white text-slate-900 border-slate-300 hover:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getTierIcon(idx, cat.name)}</span>
                          <div>
                            <div className="font-bold text-xs uppercase flex items-center gap-1.5">
                              <span>{cat.name}</span>
                              {isSelected && (
                                <span className="text-[8px] bg-[#00FF00] text-black px-1.5 py-0.2 uppercase font-black">
                                  ACTIVE TIER
                                </span>
                              )}
                            </div>
                            <div className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>
                              {cat.prizeName}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase block ${
                            isQuotaFilled
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : isSelected
                              ? 'bg-white/10 text-[#00FF00] border-emerald-500/50'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {catWinnersCount}/{cat.quantity} Drawn
                          </span>
                          <span className={`text-[9px] block mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            Min {cat.eligiblePointsMin} PTS • {catEligible} Eligible
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secret Force Next Winner Selection */}
            <div className="bg-amber-50/70 border border-amber-300 p-3 space-y-2 rounded-none mt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 uppercase tracking-tight text-[9px] block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Secret Force Next Winner Selection</span>
                </span>
                <span className="text-[7px] font-mono text-amber-800 bg-amber-200/50 px-1 uppercase font-bold">Client Override</span>
              </div>

              {/* 1. Target Prize Tier Selection */}
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-amber-900 uppercase block">
                  1. Select Target Prize Tier:
                </label>
                <SearchableSelect
                  value={selectedCategoryId}
                  onChange={(val) => setSelectedCategoryId(val)}
                  disabled={isSpinning}
                  placeholder="🔍 SELECT PRIZE TIER..."
                  options={categories.map((cat, idx) => ({
                    value: cat.id,
                    label: `${getTierIcon(idx, cat.name)} ${cat.name.toUpperCase()}`,
                    sublabel: cat.prizeName,
                    badge: `MIN ${cat.eligiblePointsMin} PTS`
                  }))}
                />
              </div>

              {/* 2. Target Forced Winner Participant Selection */}
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-amber-900 uppercase block">
                  2. Select Forced Winner Participant:
                </label>
                <SearchableSelect
                  value={forcedParticipantId}
                  onChange={(val) => setForcedParticipantId(val)}
                  disabled={isSpinning}
                  placeholder="🔍 SEARCH NAME, COMPANY, OR ID..."
                  clearableText="-- FAIR RANDOM SELECTION --"
                  options={participants
                    .filter(p => p.checkedIn && !winners.some(w => w.participantId === p.id))
                    .map(p => ({
                      value: p.id,
                      label: `${p.name.toUpperCase()} (${p.company.toUpperCase()})`,
                      sublabel: `ID: ${p.id} • ${p.position || 'Guest'}`,
                      badge: `${p.points} PTS`
                    }))
                  }
                />
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="bg-rose-100 border border-[#141414] text-rose-800 p-3 rounded-none text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={handleLaunchSpin}
              disabled={isSpinning || eligibleCount === 0 || !activeCategory}
              className="btn-action-primary w-full text-xs py-3.5"
            >
              <Play className="w-4 h-4 text-black fill-black shrink-0" />
              <span>{isSpinning ? 'SPINNING WHEEL...' : `SPIN FOR ${activeCategory?.name.toUpperCase() || 'LUCKY DRAW'}`}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Animated Spinner Wheel Column */}
        <div className="lg:col-span-7 bg-white rounded-none border-[1.5px] border-[#141414] p-6 flex flex-col items-center justify-between relative overflow-hidden min-h-[350px]">
          
          {/* Active Prize Tier Banner */}
          {activeCategory && (
            <div className="w-full bg-[#DFDEDA] border border-black p-2.5 flex items-center justify-between text-xs font-mono font-bold mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{getTierIcon(categories.findIndex(c => c.id === activeCategory.id), activeCategory.name)}</span>
                <span className="text-slate-900 uppercase">Target Tier: <strong className="text-black underline">{activeCategory.name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-black text-white px-2 py-0.5">
                  Min {activeCategory.eligiblePointsMin} PTS
                </span>
                <span className="text-[10px] bg-[#00FF00] text-black px-2 py-0.5 font-bold">
                  {eligibleCount !== null ? `${eligibleCount} Candidates` : 'Calculating...'}
                </span>
              </div>
            </div>
          )}

          {/* Wheel Frame Wrapper */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2">
            
            {/* Pointer Pin Indicator */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-8 z-30 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-black drop-shadow-md"></div>
              <div className="h-2 w-2 rounded-full bg-slate-900 border border-white -mt-0.5"></div>
            </div>

            {/* Spinning Circle Canvas/CSS element */}
            <div 
              className="w-full h-full rounded-full border-[10px] border-slate-950 shadow-xl relative overflow-hidden transition-all duration-[4000ms] ease-[cubic-bezier(0.15,0.85,0.3,1)]"
              style={{ 
                transform: `rotate(${wheelRotation}deg)`,
                backgroundImage: 'conic-gradient(from 0deg, #141414 0deg 45deg, #CFCECA 45deg 90deg, #DFDEDA 90deg 135deg, #00FF00 135deg 180deg, #141414 180deg 225deg, #CFCECA 225deg 270deg, #DFDEDA 270deg 315deg, #00FF00 315deg 360deg)'
              }}
            >
              {/* Decorative inner rings */}
              <div className="absolute inset-4 rounded-full border-2 border-white/20"></div>
              <div className="absolute inset-8 rounded-full border border-white/10"></div>
              
              {/* Segment dividers line & label simulator */}
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white uppercase tracking-widest font-mono">
                <span className="transform rotate-0 translate-x-12">DRAW</span>
                <span className="transform rotate-45 translate-x-12 translate-y-12">WIN</span>
                <span className="transform rotate-90 translate-y-12">PRIZE</span>
                <span className="transform rotate-135 -translate-x-12 translate-y-12">TIER</span>
              </div>
            </div>

            {/* Shiny Central Hub Cap */}
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black border-[3px] border-[#00FF00] flex items-center justify-center text-[#00FF00] shadow-lg z-20">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          
          <p className="text-slate-600 text-[10px] font-mono mt-2 tracking-wider uppercase font-bold text-center">
            {isSpinning ? `Selecting Random Winner for ${activeCategory?.name || 'Prize Tier'}...` : 'Ready to launch wheel spin'}
          </p>
        </div>
      </div>

      {/* WINNER HISTORY DATABASE LOG */}
      <div className="bg-white rounded-none border-[1.5px] border-[#141414] p-5">
        <div className="border-b border-[#141414] pb-3 flex flex-wrap justify-between items-center gap-3 font-mono">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase flex items-center gap-2">
              <span>Draw Session Winner Log</span>
              <span className="text-[10px] bg-black text-[#00FF00] px-2 py-0.5 uppercase font-bold">
                {filteredWinners.length} {selectedTierFilter !== 'ALL' ? selectedTierFilter : 'Total'} Records
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Official timestamp log of drawn winners for tax audit compliance.</p>
          </div>

          <div className="flex gap-2 text-xs font-semibold">
            <button
              onClick={handleExportCSV}
              disabled={winners.length === 0}
              className="bg-white hover:bg-slate-100 text-black py-1.5 px-3 border-[1.5px] border-black font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
             <button
              onClick={async () => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 4000);
                  return;
                }
                setConfirmReset(false);
                await onResetWinners();
              }}
              disabled={winners.length === 0}
              className={`py-1.5 px-3 border-[1.5px] font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                confirmReset 
                  ? 'bg-amber-100 border-amber-400 text-amber-800 animate-pulse' 
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{confirmReset ? 'CONFIRM RESET? (CLICK AGAIN)' : 'Redraw / Reset All'}</span>
            </button>
          </div>
        </div>

        {/* PRIZE TIER FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-1 font-mono text-[10px]">
          <span className="text-slate-600 font-bold uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-black" /> Filter Tier:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('ALL')}
            className={`px-2.5 py-1 border transition-all uppercase font-bold cursor-pointer ${
              selectedTierFilter === 'ALL'
                ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#00FF00]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            All Tiers ({winners.length})
          </button>
          {categories.map((cat, idx) => {
            const count = winners.filter(w => w.prizeCategoryName === cat.name).length;
            const isSelected = selectedTierFilter === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedTierFilter(cat.name)}
                className={`px-2.5 py-1 border transition-all uppercase font-bold cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-black text-[#00FF00] border-black shadow-[2px_2px_0px_0px_#00FF00]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{getTierIcon(idx, cat.name)}</span>
                <span>{cat.name} ({count})</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 overflow-x-auto text-xs font-mono">
          {filteredWinners.length === 0 ? (
            <div className="py-8 text-center text-slate-400 italic font-mono text-[11px]">
              {winners.length === 0
                ? "No winners drawn in this event yet."
                : `No winners recorded for prize tier: ${selectedTierFilter}.`}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[1.5px] border-black text-slate-500 font-bold bg-[#DFDEDA] text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-3">Winner ID</th>
                  <th className="py-2 px-3">Participant</th>
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3">Prize Tier</th>
                  <th className="py-2 px-3">Prize Awarded</th>
                  <th className="py-2 px-3 text-right">Drawn At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 text-[11px]">
                {filteredWinners.map((winner, index) => (
                  <tr key={winner.id} className="hover:bg-[#DFDEDA]/30">
                    <td className="py-2.5 px-3 text-black font-bold">W-{filteredWinners.length - index}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 uppercase">{winner.participantName}</td>
                    <td className="py-2.5 px-3 text-slate-600 uppercase">{winner.participantCompany}</td>
                    <td className="py-2.5 px-3 text-slate-900 uppercase font-bold">
                      <span className="bg-black text-white px-1.5 py-0.5 text-[9px]">
                        {winner.prizeCategoryName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-black uppercase">{winner.prizeName}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-right font-mono text-[10px]">
                      {new Date(winner.drawnAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DYNAMIC MODAL REVEALING THE WINNER */}
      {showWinnerModal && spinWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#DFDEDA] border-[2px] border-black max-w-md w-full p-6 text-center text-slate-900 shadow-2xl space-y-6 relative overflow-hidden font-mono text-xs">
            
            <div className="relative z-10 space-y-4">
              <div className="h-14 w-14 rounded-none bg-black text-[#00FF00] border-[1.5px] border-black flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Trophy className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[9px] font-black uppercase bg-black text-[#00FF00] px-2 py-0.5 tracking-widest inline-block">LUCKY DRAW WINNER DRAWN</span>
                <h3 className="text-xl font-bold text-black uppercase tracking-tight mt-2">{spinWinner.prizeCategoryName}</h3>
                <p className="text-[11px] text-slate-700 mt-1 uppercase">Reward Item: <span className="font-bold text-black">{spinWinner.prizeName}</span></p>
              </div>

              {/* Big Border card holding details */}
              <div className="bg-white border-[1.5px] border-black p-5 rounded-none space-y-2">
                <div className="text-lg font-bold text-black uppercase tracking-tight">{spinWinner.participantName}</div>
                <div className="text-xs text-slate-600 uppercase">{spinWinner.participantCompany}</div>
                <div className="text-[9px] font-mono font-bold text-white bg-black px-3 py-1 rounded-none inline-block mt-2 border border-black uppercase">
                  ID: {spinWinner.participantId}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-2.5 rounded-none text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase border border-black"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
                  <span>Accept and Continue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
