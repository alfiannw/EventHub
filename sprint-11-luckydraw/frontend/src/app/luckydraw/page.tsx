import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
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
  Download,
  Play,
  Volume2,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientLuckyDrawService } from './client-service';
import { LuckyDrawCandidateDto, LuckyDrawWinnerEntity, LuckyDrawStatsDto } from '../../../../backend/src/luckydraw/luckydraw.entity';

export default function LuckyDrawSprintPage() {
  const serviceRef = useRef(new ClientLuckyDrawService());
  const service = serviceRef.current;

  // React State managers
  const [candidates, setCandidates] = useState<LuckyDrawCandidateDto[]>([]);
  const [winnersLogs, setWinnersLogs] = useState<LuckyDrawWinnerEntity[]>([]);
  const [stats, setStats] = useState<LuckyDrawStatsDto | null>(null);
  
  // Filtering & searching controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedPrizeTier, setSelectedPrizeTier] = useState<string>('Grand Prize');
  const [selectedPrizeName, setSelectedPrizeName] = useState<string>('MacBook Pro 14 M4 Pro');

  // Interactive Simulation Controls
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [staffActorName, setStaffActorName] = useState('Staff-Spinner-01');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Spinning parameters
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnWinnerModal, setDrawnWinnerModal] = useState<LuckyDrawWinnerEntity | null>(null);

  // Wheel Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationAngleRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

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
    playSound(440, 'sine', 0.12); // A4
    setTimeout(() => playSound(554.37, 'sine', 0.12), 100); // C#5
    setTimeout(() => playSound(659.25, 'sine', 0.12), 200); // E5
    setTimeout(() => playSound(880, 'sine', 0.35), 300); // A5
  };

  const playTickSound = () => {
    playSound(700, 'triangle', 0.03);
  };

  const playErrorChime = () => {
    playSound(220, 'sawtooth', 0.15);
    setTimeout(() => playSound(180, 'sawtooth', 0.2), 100);
  };

  // Synchronize state from service
  const refreshData = async () => {
    try {
      const list = await service.getCandidatesList(
        searchTerm || undefined,
        selectedCompany || undefined
      );
      
      const logs = await service.getWinnersLogs();
      const metrics = await service.getStats();

      setCandidates(list);
      setWinnersLogs(logs);
      setStats(metrics);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [searchTerm, selectedCompany]);

  // Render Wheel on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    // Filter only eligible checked-in and not yet drawn guests as sectors
    const eligiblePool = candidates.filter(p => p.checkedIn && !p.isWinner);
    
    // Fallback slices if empty pool
    const sectors = eligiblePool.length > 0 
      ? eligiblePool 
      : [{ name: 'EMPTY POOL', company: '' }, { name: 'ADD GUESTS', company: '' }];

    const numSectors = sectors.length;
    const arcSize = (2 * Math.PI) / numSectors;

    ctx.clearRect(0, 0, size, size);

    // Draw wheel segments
    for (let i = 0; i < numSectors; i++) {
      const angle = rotationAngleRef.current + i * arcSize;
      
      // Alternating slice background colors matching high contrast slate design
      ctx.beginPath();
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      
      if (numSectors === 1) {
        ctx.fillStyle = '#141414';
      } else {
        const colorIndex = i % 4;
        if (colorIndex === 0) ctx.fillStyle = '#141414'; // Cosmic Slate
        else if (colorIndex === 1) ctx.fillStyle = '#CFCECA'; // Soft Gray
        else if (colorIndex === 2) ctx.fillStyle = '#DFDEDA'; // Warm Sand
        else ctx.fillStyle = '#FFFFFF'; // Crisp White
      }
      ctx.fill();
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Write text radially inside segment
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      
      // Determine text color based on slice background
      const colorIndex = i % 4;
      if (colorIndex === 0 && numSectors > 1) {
        ctx.fillStyle = '#00FF00'; // Neon lime pop on dark
      } else {
        ctx.fillStyle = '#141414'; // Cosmic black on light
      }

      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      
      const displayText = sectors[i].name.toUpperCase();
      // Clip if too long to avoid bleeding out of segment boundaries
      const truncated = displayText.length > 18 ? displayText.substring(0, 16) + '..' : displayText;
      ctx.fillText(truncated, radius - 15, 3);
      ctx.restore();
    }

    // Outer decorative borders
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center hub cap circle
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#141414';
    ctx.fill();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Small interior icon anchor on hub
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN', center, center);

  }, [candidates, rotationAngleRef.current]);

  // Handle Spinning Animation Logic (Tactile momentum physics)
  const triggerWheelSpin = async () => {
    if (isSpinning) return;
    setErrorMessage('');
    setSuccessMessage('');

    const eligiblePool = candidates.filter(p => p.checkedIn && !p.isWinner);
    if (eligiblePool.length === 0) {
      playErrorChime();
      setErrorMessage('No checked-in candidates eligible for drawing.');
      return;
    }

    try {
      setIsSpinning(true);

      // 1. Select a random eligible winner
      const randomIndex = Math.floor(Math.random() * eligiblePool.length);
      const chosenCandidate = eligiblePool[randomIndex];

      // 2. Persist winner allocation to DB
      const claim = await service.recordWinner({
        participantId: chosenCandidate.participantId,
        prizeTier: selectedPrizeTier,
        prizeName: selectedPrizeName
      }, staffActorName);

      // 3. Spool physical deceleration physics animation
      const spins = 6 + Math.random() * 3; // Number of full cycles
      const numSectors = eligiblePool.length;
      const arcSize = (2 * Math.PI) / numSectors;
      
      // Math: Align the chosen winner segment precisely at the 12 o'clock pointer (at Angle = -PI/2)
      // When the wheel finishes rotating at Angle `A`, the selected segment index `idx` aligns at the pointer if:
      // (A + idx * arc + arc/2) % 2PI = -PI/2 (approximately, in canvas coords)
      // Let's compute a gorgeous aesthetic target rotation.
      const targetSectorAngle = -arcSize * randomIndex - arcSize / 2 - Math.PI / 2;
      const startAngle = rotationAngleRef.current % (2 * Math.PI);
      const targetRotationTotal = startAngle + (spins * 2 * Math.PI) + targetSectorAngle;

      let currentRotation = startAngle;
      const duration = 4000; // 4 seconds spin
      const startTimestamp = performance.now();

      let lastTickAngle = startAngle;

      const animateWheel = (now: number) => {
        const elapsed = now - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic Deceleration Ease Out: 1 - (1 - x)^3
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const nextRotation = startAngle + (targetRotationTotal - startAngle) * easeOut;
        
        rotationAngleRef.current = nextRotation;

        // Sound Tick Trigger: Tick every time a new segment boundary crosses the top pointer
        const angleDelta = Math.abs(nextRotation - lastTickAngle);
        if (angleDelta > arcSize) {
          playTickSound();
          lastTickAngle = nextRotation;
        }

        refreshData(); // Re-render canvas via state loop update
        
        if (progress < 1) {
          animationFrameIdRef.current = requestAnimationFrame(animateWheel);
        } else {
          // Finished Spin!
          setIsSpinning(false);
          playSuccessChime();
          setDrawnWinnerModal(claim);
          setSuccessMessage(`CONGRATULATIONS to ${claim.participantName}! Drawn successfully.`);
          refreshData();
        }
      };

      animationFrameIdRef.current = requestAnimationFrame(animateWheel);

    } catch (err: any) {
      playErrorChime();
      setIsSpinning(false);
      setErrorMessage(err.message || 'Wheel spin processing failed.');
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
  const handleResetWinners = async () => {
    if (confirm('Are you sure you want to reset all drawn lucky draw winners? This restarts the draw session.')) {
      setErrorMessage('');
      setSuccessMessage('');
      await service.resetWinners();
      playSound(150, 'sawtooth', 0.3);
      setSuccessMessage('Lucky draw winners state reset successfully.');
      refreshData();
    }
  };

  // Export claims log to CSV
  const handleExportCSV = () => {
    if (winnersLogs.length === 0) return;
    const headers = ['Draw ID', 'Participant ID', 'Winner Name', 'Company', 'Prize Tier', 'Prize Name', 'Drawn At', 'Authorized Actor'];
    const rows = winnersLogs.map(w => [
      w.id,
      w.participantId,
      w.participantName,
      w.participantCompany,
      w.prizeTier,
      w.prizeName,
      w.drawnAt.toISOString ? w.drawnAt.toISOString() : String(w.drawnAt),
      w.actorId
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

  return (
    <div className="space-y-6" id="lucky-draw-wheel-dashboard">
      
      {/* 1. INTERACTIVE METRIC HERO STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center shrink-0 border border-black">
            <Trophy className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black">Total Winners</span>
            <div className="text-xl font-black text-black">{stats?.totalWinners || 0} drawn</div>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center shrink-0 border border-black">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black">Eligible Guests</span>
            <div className="text-xl font-black text-black">{stats?.totalEligibleCandidates || 0} present</div>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center shrink-0 border border-black">
            <TrendingUp className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black">Draw rate</span>
            <div className="text-xl font-black text-black">{stats?.drawRatePercent || 0}%</div>
          </div>
        </div>

        <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-white text-[#141414] flex items-center justify-center shrink-0 border border-black">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-600 uppercase font-black">Grand / Major / Special</span>
            <div className="text-xs font-bold text-black truncate flex gap-1">
              <span className="text-amber-600">G: {stats?.winnersByTier['Grand Prize'] || 0}</span> | 
              <span className="text-slate-600"> M: {stats?.winnersByTier['Major Prize'] || 0}</span> | 
              <span className="text-amber-800"> S: {stats?.winnersByTier['Special Prize'] || 0}</span>
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

      {/* 2. DUAL-GRID SECTION: WHEEL PREVIEW & DECK CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (5 SPANS): THE HIGH-FIDELITY SPINNER WHEEL */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border-[1.5px] border-[#141414] p-5 font-mono text-xs relative overflow-hidden">
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 flex items-center gap-1.5">
              <Gift className="w-5 h-5 text-black" />
              <span>Interactive Spinner Wheel</span>
            </h3>

            {/* Spinner Target Configuration */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Prize Tier Selection</label>
                  <select
                    value={selectedPrizeTier}
                    onChange={(e) => {
                      const tier = e.target.value;
                      setSelectedPrizeTier(tier);
                      if (tier === 'Grand Prize') setSelectedPrizeName('MacBook Pro 14 M4 Pro');
                      else if (tier === 'Major Prize') setSelectedPrizeName('Sony WH-1000XM5 ANC Headphones');
                      else setSelectedPrizeName('Keychron Q1 Mechanical Keyboard');
                    }}
                    disabled={isSpinning}
                    className="tech-input font-bold"
                  >
                    <option value="Grand Prize">Grand Prize</option>
                    <option value="Major Prize">Major Prize</option>
                    <option value="Special Prize">Special Prize</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Prize Name</label>
                  <input
                    type="text"
                    value={selectedPrizeName}
                    onChange={(e) => setSelectedPrizeName(e.target.value)}
                    disabled={isSpinning}
                    className="tech-input uppercase"
                  />
                </div>
              </div>
            </div>

            {/* TACTILE PHYSICAL CANVAS SPINNER WHEEL */}
            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="relative w-64 h-64">
                
                {/* Upper Pointer Needle Pin */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-8 z-30 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-[#00FF00] drop-shadow-md"></div>
                  <div className="h-2 w-2 rounded-full bg-slate-900 border border-white -mt-0.5"></div>
                </div>

                {/* Rotating HTML5 Canvas */}
                <canvas 
                  ref={canvasRef}
                  width={256}
                  height={256}
                  className="rounded-full shadow-lg border-2 border-black"
                />

                {/* Ambient Center Rim */}
                <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#141414] border-2 border-[#00FF00] shadow-md z-20 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-[#00FF00] animate-pulse" />
                </div>

              </div>

              <span className="text-[9px] text-slate-400 uppercase font-bold mt-3 tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-ping"></span>
                <span>{isSpinning ? 'SPINNING DE-ACCELERATING...' : 'AWAITING SPIN INGRESS'}</span>
              </span>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={triggerWheelSpin}
              disabled={isSpinning || candidates.filter(p => p.checkedIn && !p.isWinner).length === 0}
              className="w-full bg-black hover:bg-neutral-800 text-[#00FF00] font-black py-3 border border-black uppercase text-center transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-[#00FF00]" />
              <span>{isSpinning ? 'Spinning In Progress...' : 'Launch Spin Selection'}</span>
            </button>
          </div>

        </div>

        {/* MIDDLE COLUMN (7 SPANS): AUDIENCE POOL TABLE & CONTROL CARD */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white border-[1.5px] border-[#141414] p-4 space-y-4 font-mono text-xs">
            
            {/* SEARCH AND FILTERS TOOLBAR */}
            <div className="flex flex-wrap gap-3 items-center">
              
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="SEARCH ELIGIBLE BY NAME, POSITION, EMAIL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tech-input pl-9 uppercase placeholder-slate-400"
                />
              </div>

              <div>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="tech-input font-bold uppercase py-1 px-2.5"
                >
                  <option value="">All Companies</option>
                  {Array.from(new Set(candidates.map(p => p.company))).filter(Boolean).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* CANDIDATES TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-[1.5px] border-black bg-[#DFDEDA] text-[10px] font-black uppercase tracking-wider text-slate-700">
                    <th className="py-2.5 px-3">Attendee Profile</th>
                    <th className="py-2.5 px-3">Points</th>
                    <th className="py-2.5 px-3 text-center">In Wheel?</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic font-mono text-[11px]">
                        No matching checked-in candidates found.
                      </td>
                    </tr>
                  ) : (
                    candidates.map((p) => (
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
                        
                        <td className="py-3 px-3 font-mono font-extrabold text-black">
                          {p.points} PTS
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.isWinner ? (
                            <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 bg-slate-200 text-slate-600 border border-slate-300">
                              ALREADY WON
                            </span>
                          ) : p.checkedIn ? (
                            <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-400">
                              ✓ ELIGIBLE
                            </span>
                          ) : (
                            <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300">
                              NOT PRESENT
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {!p.checkedIn ? (
                              <button
                                onClick={() => handleQuickCheckIn(p.participantId)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[8px] py-1 px-2 border border-rose-400 font-bold uppercase transition-colors cursor-pointer"
                              >
                                Check In
                              </button>
                            ) : p.isWinner ? (
                              <span className="text-[9px] text-slate-500 italic uppercase truncate max-w-[100px]" title={p.prizeName}>
                                {p.prizeName}
                              </span>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAdjustPoints(p.participantId, 5)}
                                  className="p-1 border border-black hover:bg-slate-100 cursor-pointer text-slate-700"
                                  title="Add 5 points"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() => handleAdjustPoints(p.participantId, -5)}
                                  className="p-1 border border-black hover:bg-slate-100 cursor-pointer text-slate-700"
                                  title="Deduct 5 points"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* 3. DUAL-GRID FOOTER: HISTORIC WINNERS LOG & SANDBOX CONTROL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (8 SPANS): WINNERS LOG TABLE */}
        <div className="lg:col-span-8 bg-white border-[1.5px] border-[#141414] p-4 space-y-4 font-mono text-xs">
          
          <div className="flex justify-between items-center border-b border-black pb-2">
            <h3 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2">
              <Award className="w-4 h-4 text-black" />
              <span>Drawn Winners Log ({winnersLogs.length})</span>
            </h3>

            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={winnersLogs.length === 0}
                className="bg-white hover:bg-slate-50 text-black border border-black px-2.5 py-1 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[9px] font-black uppercase text-slate-500 bg-slate-50">
                  <th className="py-2 px-3">Winner ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3">Prize Tier</th>
                  <th className="py-2 px-3">Prize Name</th>
                  <th className="py-2 px-3 text-right">Drawn At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {winnersLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic font-mono text-[10px]">
                      No lucky draw winners drawn in this session yet.
                    </td>
                  </tr>
                ) : (
                  winnersLogs.map((winner) => (
                    <tr key={winner.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-black font-extrabold text-[10px]">{winner.id.split('-')[0].toUpperCase()}</td>
                      <td className="py-2 px-3 text-slate-900 font-bold uppercase">{winner.participantName}</td>
                      <td className="py-2 px-3 text-slate-500 uppercase">{winner.participantCompany}</td>
                      <td className="py-2 px-3 text-amber-700 font-bold uppercase">{winner.prizeTier}</td>
                      <td className="py-2 px-3 text-black font-extrabold uppercase">{winner.prizeName}</td>
                      <td className="py-2 px-3 text-slate-400 text-right text-[9px]">
                        {new Date(winner.drawnAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT COLUMN (4 SPANS): SANDBOX CONTROL CARD */}
        <div className="lg:col-span-4 bg-[#141414] text-[#E4E3E0] border-[1.5px] border-[#141414] p-4 space-y-4 font-mono text-xs">
          
          <h3 className="font-bold text-white uppercase text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#00FF00]" />
            <span>Sandbox Control Deck</span>
          </h3>

          <div className="space-y-3">
            
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Staff Actor Name</label>
              <input
                type="text"
                value={staffActorName}
                onChange={(e) => setStaffActorName(e.target.value)}
                className="tech-input bg-zinc-950 text-white border-zinc-700"
              />
            </div>

            {selectedParticipantId ? (
              (() => {
                const target = candidates.find(p => p.participantId === selectedParticipantId);
                return target ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-3 space-y-2">
                    <div className="flex justify-between font-bold text-[#E4E3E0] uppercase text-[11px]">
                      <span>Guest:</span>
                      <span className="text-white">{target.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase">
                      ID: {target.participantId} | Points: <span className="text-white">{target.points} PTS</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => handleAdjustPoints(target.participantId, 5)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white py-1 px-2 border border-zinc-600 font-bold uppercase text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-emerald-400" />
                        <span>Add 5</span>
                      </button>
                      <button
                        onClick={() => handleAdjustPoints(target.participantId, -5)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white py-1 px-2 border border-zinc-600 font-bold uppercase text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Minus className="w-3 h-3 text-rose-400" />
                        <span>Deduct 5</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      {!target.checkedIn ? (
                        <button
                          onClick={() => handleQuickCheckIn(target.participantId)}
                          className="w-full bg-[#00FF00] hover:bg-[#00CC00] text-black py-1.5 px-3 font-bold uppercase text-[9px] cursor-pointer border-0"
                        >
                          Check In Present
                        </button>
                      ) : target.isWinner ? (
                        <div className="text-center text-[10px] text-[#00FF00] bg-zinc-850 border border-[#00FF00] py-1 uppercase font-bold">
                          ✓ Won: {target.prizeName}
                        </div>
                      ) : (
                        <div className="text-center text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-900 py-1 uppercase">
                          ✓ Ready in wheel queue
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()
            ) : (
              <div className="bg-zinc-900/60 p-4 text-center border border-zinc-800 text-[10px] text-slate-400 italic">
                Select any guest in the main pool table to adjust details or run Sandbox quick actions.
              </div>
            )}

            <div className="border-t border-slate-800 pt-3 flex gap-2">
              <button
                onClick={handleResetWinners}
                className="flex-1 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-900 py-2 font-bold uppercase tracking-wide text-[9px] text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Winners</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* DYNAMIC MODAL REVEALING THE WINNER (GRAND SPECTACLE) */}
      <AnimatePresence>
        {drawnWinnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#DFDEDA] border-[2.5px] border-black max-w-md w-full p-6 text-center text-slate-900 shadow-2xl space-y-6 relative overflow-hidden font-mono text-xs"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00FF00]" />

              <div className="space-y-4">
                <div className="h-14 w-14 rounded-none bg-black text-[#00FF00] border border-black flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Trophy className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <span className="text-[9px] font-black uppercase bg-black text-[#00FF00] px-2.5 py-0.5 tracking-widest inline-block">
                    WINNER ALLOCATED SUCCESS
                  </span>
                  <h3 className="text-xl font-bold text-black uppercase tracking-tight mt-2">
                    {drawnWinnerModal.prizeTier}
                  </h3>
                  <p className="text-[11px] text-slate-700 mt-1 uppercase">
                    Reward Item: <span className="font-bold text-black">{drawnWinnerModal.prizeName}</span>
                  </p>
                </div>

                {/* Big Border card holding details */}
                <div className="bg-white border-[1.5px] border-black p-5 rounded-none space-y-2">
                  <div className="text-lg font-bold text-black uppercase tracking-tight">
                    {drawnWinnerModal.participantName}
                  </div>
                  <div className="text-xs text-slate-600 uppercase">
                    {drawnWinnerModal.participantCompany}
                  </div>
                  <div className="text-[9px] font-mono font-bold text-white bg-black px-3 py-1 rounded-none inline-block mt-2 border border-black uppercase">
                    ID: {drawnWinnerModal.participantId}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setDrawnWinnerModal(null)}
                    className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-2.5 rounded-none text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase border border-black"
                  >
                    <span>Accept & Clear Panel</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
