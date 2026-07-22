import React, { useState, useEffect, useRef } from 'react';
import SearchableSelect from '../../../../../src/components/SearchableSelect';
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
  Gift,
  Maximize2,
  Minimize2,
  Image,
  Trash2,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientLuckyDrawService } from './client-service';
import { LuckyDrawCandidateDto, LuckyDrawWinnerEntity, LuckyDrawStatsDto } from '../../../../backend/src/luckydraw/luckydraw.entity';

export default function LuckyDrawSprintPage() {
  const serviceRef = useRef(new ClientLuckyDrawService());
  const service = serviceRef.current;

  // React State managers
  const [candidates, setCandidates] = useState<LuckyDrawCandidateDto[]>([]);
  const [allCandidates, setAllCandidates] = useState<LuckyDrawCandidateDto[]>([]);
  const [winnersLogs, setWinnersLogs] = useState<LuckyDrawWinnerEntity[]>([]);
  const [stats, setStats] = useState<LuckyDrawStatsDto | null>(null);
  
  // Custom Prize Inventory Structures
  interface PrizeItem {
    id: string;
    name: string;
    quantity: number;
  }

  interface PrizeTier {
    id: string;
    name: string;
    eligiblePointsMin: number;
    prizes: PrizeItem[];
  }

  const [prizesConfig, setPrizesConfig] = useState<PrizeTier[]>([]);

  // Filtering & searching controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedPrizeTier, setSelectedPrizeTier] = useState<string>('Grand Prize');
  const [selectedPrizeName, setSelectedPrizeName] = useState<string>('');

  // Interactive Simulation Controls
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [staffActorName, setStaffActorName] = useState('Staff-Spinner-01');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Spinning parameters
  const [isSpinning, setIsSpinning] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  
  // Custom multi-spin batch states
  const [spinMode, setSpinMode] = useState<'single' | 'batch'>('single');
  const [batchSize, setBatchSize] = useState<number>(2);
  const [drawnWinnersBatch, setDrawnWinnersBatch] = useState<LuckyDrawWinnerEntity[] | null>(null);

  // Client choice (Rigging/Force Selection state)
  const [forcedWinnerId, setForcedWinnerId] = useState<string>('');

  // Fullscreen projection view states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wheelBgImage, setWheelBgImage] = useState<string>('');
  const [renderAngle, setRenderAngle] = useState(0);

  // Load Custom Background from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBg = localStorage.getItem('eh_luckydraw_bg_image');
      if (storedBg) {
        setWheelBgImage(storedBg);
      }
    }
  }, []);

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setWheelBgImage(base64String);
        localStorage.setItem('eh_luckydraw_bg_image', base64String);
        setSuccessMessage('Wheel spin background picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearBgImage = () => {
    setWheelBgImage('');
    localStorage.removeItem('eh_luckydraw_bg_image');
    setSuccessMessage('Custom background picture cleared!');
  };

  // Load / Save Inventory on Mount
  useEffect(() => {
    const DEFAULT_PRIZES: PrizeTier[] = [
      {
        id: 'tier-1',
        name: 'Grand Prize',
        eligiblePointsMin: 21,
        prizes: [
          { id: 'gp-1', name: 'MacBook Pro 14 M4 Pro', quantity: 2 },
          { id: 'gp-2', name: 'iPhone 16 Pro Max 256GB', quantity: 3 }
        ]
      },
      {
        id: 'tier-2',
        name: 'Major Prize',
        eligiblePointsMin: 11,
        prizes: [
          { id: 'mp-1', name: 'Sony WH-1000XM5 ANC Headphones', quantity: 4 },
          { id: 'mp-2', name: 'Keychron Q1 Mechanical Keyboard', quantity: 5 },
          { id: 'mp-3', name: 'Apple Watch Series 10', quantity: 3 }
        ]
      },
      {
        id: 'tier-3',
        name: 'Special Prize',
        eligiblePointsMin: 5,
        prizes: [
          { id: 'sp-1', name: 'Anker PowerBank 20,000mAh', quantity: 10 },
          { id: 'sp-2', name: 'JBL Go 4 Portable Speaker', quantity: 8 },
          { id: 'sp-3', name: 'NESPRESSO Coffee Maker', quantity: 2 }
        ]
      }
    ];

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('eh_luckydraw_prizes_inventory');
      if (stored) {
        try {
          setPrizesConfig(JSON.parse(stored));
        } catch (e) {
          setPrizesConfig(DEFAULT_PRIZES);
          localStorage.setItem('eh_luckydraw_prizes_inventory', JSON.stringify(DEFAULT_PRIZES));
        }
      } else {
        setPrizesConfig(DEFAULT_PRIZES);
        localStorage.setItem('eh_luckydraw_prizes_inventory', JSON.stringify(DEFAULT_PRIZES));
      }
    }
  }, []);

  const savePrizesInventory = (newConfig: PrizeTier[]) => {
    setPrizesConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eh_luckydraw_prizes_inventory', JSON.stringify(newConfig));
    }
  };

  const activeTierObj = prizesConfig.find(t => t.name === selectedPrizeTier);
  const eligiblePointsMin = activeTierObj ? activeTierObj.eligiblePointsMin : 0;
  const activeTierPrizes = activeTierObj ? activeTierObj.prizes : [];

  // Track prize count won so far
  const getDrawnCountForPrize = (prizeName: string) => {
    return winnersLogs.filter(w => w.prizeName.toLowerCase() === prizeName.toLowerCase()).length;
  };

  const selectedPrizeObj = activeTierPrizes.find(p => p.name === selectedPrizeName);
  const totalPrizeQty = selectedPrizeObj ? selectedPrizeObj.quantity : 1;
  const drawnPrizeCount = getDrawnCountForPrize(selectedPrizeName);
  const remainingQuantity = Math.max(0, totalPrizeQty - drawnPrizeCount);

  // Synchronize dynamic prize selection dropdown
  useEffect(() => {
    if (activeTierPrizes.length > 0) {
      const exists = activeTierPrizes.some(p => p.name === selectedPrizeName);
      if (!exists) {
        setSelectedPrizeName(activeTierPrizes[0].name);
      }
    } else {
      setSelectedPrizeName('');
    }
  }, [selectedPrizeTier, prizesConfig]);

  // Clamp batch size to remainingQuantity
  useEffect(() => {
    if (spinMode === 'batch') {
      if (batchSize > remainingQuantity) {
        setBatchSize(Math.max(2, remainingQuantity));
      }
    }
  }, [remainingQuantity, spinMode]);

  // Wheel Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
      const fullList = await service.getCandidatesList();
      
      const logs = await service.getWinnersLogs();
      const metrics = await service.getStats();

      setCandidates(list);
      setAllCandidates(fullList);
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
    const fsCanvas = fullscreenCanvasRef.current;

    const activeTierObj = prizesConfig.find(t => t.name === selectedPrizeTier);
    const eligiblePointsMin = activeTierObj ? activeTierObj.eligiblePointsMin : 0;

    // Filter only eligible checked-in and not yet drawn guests as sectors
    // Keep currently drawn winner(s) on the wheel while the popup modal is open to prevent visual shifts
    const eligiblePool = allCandidates.filter(p => {
      const isCurrentlyDrawn = !isSpinning && drawnWinnersBatch?.some(w => w.participantId === p.participantId);
      const isWinnerValue = isCurrentlyDrawn ? false : p.isWinner;
      return p.checkedIn && !isWinnerValue && p.points >= eligiblePointsMin;
    });

    const drawOnCanvas = (canv: HTMLCanvasElement | null) => {
      if (!canv) return;
      const ctx = canv.getContext('2d');
      if (!ctx) return;

      const size = canv.width;
      const center = size / 2;
      const radius = center - 10;

      // Fallback slices if empty pool
      const sectors = eligiblePool.length > 0 
        ? eligiblePool 
        : [{ name: 'EMPTY POOL', company: '' }, { name: 'ADD GUESTS', company: '' }];

      const numSectors = sectors.length;
      const arcSize = (2 * Math.PI) / numSectors;

      ctx.clearRect(0, 0, size, size);

      // Draw wheel segments
      for (let i = 0; i < numSectors; i++) {
        const angle = renderAngle + i * arcSize;
        
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
        ctx.lineWidth = size * 0.006;
        ctx.stroke();

        // Write text radially inside segment
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(angle + arcSize / 2);
        
        const colorIndex = i % 4;
        if (colorIndex === 0 && numSectors > 1) {
          ctx.fillStyle = '#00FF00'; // Neon lime pop on dark
        } else {
          ctx.fillStyle = '#141414'; // Cosmic black on light
        }

        const fontSize = Math.max(7, Math.floor(size * 0.035));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'right';
        
        const displayText = sectors[i].name.toUpperCase();
        const truncated = displayText.length > 18 ? displayText.substring(0, 16) + '..' : displayText;
        ctx.fillText(truncated, radius - (size * 0.06), fontSize / 3);
        ctx.restore();
      }

      // Outer decorative borders
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = size * 0.024;
      ctx.stroke();

      // Center hub cap circle
      ctx.beginPath();
      ctx.arc(center, center, size * 0.1, 0, 2 * Math.PI);
      ctx.fillStyle = '#141414';
      ctx.fill();
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = size * 0.008;
      ctx.stroke();

      // Small interior icon anchor on hub
      ctx.fillStyle = '#00FF00';
      ctx.font = `bold ${Math.max(8, Math.floor(size * 0.045))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WIN', center, center);
    };

    drawOnCanvas(canvas);
    drawOnCanvas(fsCanvas);
  }, [allCandidates, renderAngle, isFullscreen, selectedPrizeTier, prizesConfig, drawnWinnersBatch, isSpinning]);

  // Handle Spinning Animation Logic (Tactile momentum physics)
  const triggerWheelSpin = async () => {
    if (isSpinning) return;
    setErrorMessage('');
    setSuccessMessage('');
    setDrawnWinnersBatch(null);

    const activeTierObj = prizesConfig.find(t => t.name === selectedPrizeTier);
    const eligiblePointsMin = activeTierObj ? activeTierObj.eligiblePointsMin : 0;

    const eligiblePool = allCandidates.filter(p => p.checkedIn && !p.isWinner && p.points >= eligiblePointsMin);
    if (eligiblePool.length === 0) {
      playErrorChime();
      setErrorMessage('No checked-in candidates meet the points requirement for drawing.');
      return;
    }

    // Determine draw count
    const currentDrawCount = spinMode === 'batch' && remainingQuantity > 1
      ? Math.min(batchSize, remainingQuantity, eligiblePool.length)
      : 1;

    try {
      setIsSpinning(true);

      // Select random or pre-selected winner(s)
      const chosenCandidates: typeof eligiblePool = [];
      const availablePool = [...eligiblePool];

      // If there is a forced winner and they are eligible, ensure they are selected first!
      if (forcedWinnerId) {
        const forcedIndex = availablePool.findIndex(p => p.participantId === forcedWinnerId);
        if (forcedIndex !== -1) {
          chosenCandidates.push(availablePool[forcedIndex]);
          availablePool.splice(forcedIndex, 1);
        }
      }

      // Draw the remaining slots randomly
      const remainingDrawCount = currentDrawCount - chosenCandidates.length;
      for (let i = 0; i < remainingDrawCount; i++) {
        if (availablePool.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        chosenCandidates.push(availablePool[randomIndex]);
        availablePool.splice(randomIndex, 1);
      }

      if (chosenCandidates.length === 0) {
        throw new Error("No eligible candidates found for selection.");
      }

      // Track index of first winner to stop wheel needle visually on their segment
      const firstWinnerCandidate = chosenCandidates[0];
      const firstWinnerIndex = eligiblePool.findIndex(p => p.participantId === firstWinnerCandidate.participantId);

      // Spool physical deceleration physics animation
      const spins = Math.floor(6 + Math.random() * 3); // Number of full cycles
      const numSectors = eligiblePool.length;
      const arcSize = (2 * Math.PI) / numSectors;
      
      const targetSectorAngle = -arcSize * firstWinnerIndex - arcSize / 2 - Math.PI / 2;
      const startAngle = rotationAngleRef.current;

      // Normalize targetSectorAngle to be within [0, 2 * Math.PI)
      let normalizedTarget = targetSectorAngle % (2 * Math.PI);
      if (normalizedTarget < 0) {
        normalizedTarget += 2 * Math.PI;
      }

      // Calculate absolute target angle
      const baseRotation = Math.floor(startAngle / (2 * Math.PI)) * (2 * Math.PI);
      const minSpinAngle = spins * 2 * Math.PI;
      let targetRotationTotal = baseRotation + minSpinAngle + normalizedTarget;
      if (targetRotationTotal < startAngle + minSpinAngle) {
        targetRotationTotal += 2 * Math.PI;
      }

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
        setRenderAngle(nextRotation); // Butter smooth animation without spamming DB APIs!

        // Sound Tick Trigger: Tick every time a new segment boundary crosses the top pointer
        const angleDelta = Math.abs(nextRotation - lastTickAngle);
        if (angleDelta > arcSize) {
          playTickSound();
          lastTickAngle = nextRotation;
        }

        if (progress < 1) {
          animationFrameIdRef.current = requestAnimationFrame(animateWheel);
        } else {
          // Finished Spin!
          setIsSpinning(false);
          setForcedWinnerId(''); // Reset rigging selection so it doesn't persist
          playSuccessChime();

          // Persist batch to DB
          (async () => {
            try {
              const recordedWinners: LuckyDrawWinnerEntity[] = [];
              for (const candidate of chosenCandidates) {
                const claim = await service.recordWinner({
                  participantId: candidate.participantId,
                  prizeTier: selectedPrizeTier,
                  prizeName: selectedPrizeName
                }, staffActorName);
                recordedWinners.push(claim);
              }
              setDrawnWinnersBatch(recordedWinners);
              setSuccessMessage(`CONGRATULATIONS! Successfully drawn ${recordedWinners.length} winner(s).`);
              refreshData();
            } catch (err: any) {
              setErrorMessage(err.message || "Failed to persist winner records.");
            }
          })();
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
    if (!confirmReset) {
      setConfirmReset(true);
      // Automatically cancel confirmation if not pressed again within 4 seconds
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    setErrorMessage('');
    setSuccessMessage('');
    await service.resetWinners();
    playSound(150, 'sawtooth', 0.3);
    setSuccessMessage('Lucky draw winners state reset successfully.');
    refreshData();
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
        <div 
          className="lg:col-span-5 flex flex-col justify-between bg-white border-[1.5px] border-[#141414] p-5 font-mono text-xs relative overflow-hidden"
          style={wheelBgImage ? {
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.88)), url(${wheelBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414] pb-3 mb-2">
              <h3 className="font-bold text-slate-900 text-sm uppercase flex items-center gap-1.5">
                <Gift className="w-5 h-5 text-black" />
                <span>Interactive Spinner Wheel</span>
              </h3>
              
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 border border-black hover:bg-neutral-100 cursor-pointer text-slate-800 transition-colors bg-white rounded-none flex items-center gap-1 text-[9px] font-bold uppercase"
                title="Fullscreen Projector Mode"
              >
                <Maximize2 className="w-3.5 h-3.5 text-black" />
                <span>Fullscreen</span>
              </button>
            </div>

            {/* Spinner Target Configuration */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Prize Tier Selection</label>
                  <select
                    value={selectedPrizeTier}
                    onChange={(e) => {
                      setSelectedPrizeTier(e.target.value);
                    }}
                    disabled={isSpinning}
                    className="tech-input font-bold uppercase"
                  >
                    {prizesConfig.map((tier) => (
                      <option key={tier.id} value={tier.name}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
 
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Prize Name (Dropdown)</label>
                  <select
                    value={selectedPrizeName}
                    onChange={(e) => setSelectedPrizeName(e.target.value)}
                    disabled={isSpinning}
                    className="tech-input font-bold uppercase"
                  >
                    {activeTierPrizes.map((p) => {
                      const drawn = getDrawnCountForPrize(p.name);
                      const rem = Math.max(0, p.quantity - drawn);
                      return (
                        <option key={p.id} value={p.name}>
                          {p.name} ({rem}/{p.quantity} Left)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dynamic Batch Options if quantity > 1 */}
              {remainingQuantity > 1 && (
                <div className="bg-[#DFDEDA] border border-black p-3 space-y-2 rounded-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-black">Spin Mode (Remaining Stock: {remainingQuantity})</span>
                    <span className="text-[8px] font-mono text-[#00FF00] bg-black px-1 uppercase font-bold">Available</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-600 uppercase">Trigger Mode</label>
                      <select
                        value={spinMode}
                        onChange={(e) => setSpinMode(e.target.value as 'single' | 'batch')}
                        disabled={isSpinning}
                        className="tech-input py-1 text-[10px] font-black uppercase"
                      >
                        <option value="single">Spin One-by-One</option>
                        <option value="batch">Spin Batch (All at once)</option>
                      </select>
                    </div>

                    {spinMode === 'batch' && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-600 uppercase">Batch Winners Qty</label>
                        <select
                          value={batchSize}
                          onChange={(e) => setBatchSize(Number(e.target.value))}
                          disabled={isSpinning}
                          className="tech-input py-1 text-[10px] font-bold"
                        >
                          {Array.from({ length: Math.min(10, remainingQuantity) }, (_, i) => i + 1)
                            .filter(n => n >= 2)
                            .map((n) => (
                              <option key={n} value={n}>
                                {n} Winners
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inline Custom Prize Creator Form */}
              <div className="border border-slate-300 p-2.5 bg-slate-50 space-y-1.5 rounded-none">
                <span className="font-bold text-slate-700 uppercase tracking-tight text-[9px] block">
                  ➕ Add Custom Prize to selected Tier
                </span>
                <div className="grid grid-cols-12 gap-1.5">
                  <input
                    type="text"
                    placeholder="NEW PRIZE NAME (E.G. KEYBOARD)"
                    id="new-prize-name-input"
                    disabled={isSpinning}
                    className="col-span-6 tech-input text-[10px] uppercase placeholder-slate-400"
                  />
                  <input
                    type="number"
                    placeholder="QTY"
                    id="new-prize-qty-input"
                    disabled={isSpinning}
                    min="1"
                    defaultValue="1"
                    className="col-span-2 tech-input text-[10px]"
                  />
                  <button
                    type="button"
                    disabled={isSpinning}
                    onClick={() => {
                      const nameEl = document.getElementById('new-prize-name-input') as HTMLInputElement;
                      const qtyEl = document.getElementById('new-prize-qty-input') as HTMLInputElement;
                      if (nameEl && nameEl.value.trim() && qtyEl) {
                        const pName = nameEl.value.trim();
                        const pQty = Math.max(1, parseInt(qtyEl.value) || 1);
                        
                        const updated = prizesConfig.map(tier => {
                          if (tier.name === selectedPrizeTier) {
                            return {
                              ...tier,
                              prizes: [
                                ...tier.prizes,
                                { id: `custom-p-${Date.now()}`, name: pName, quantity: pQty }
                              ]
                            };
                          }
                          return tier;
                        });
                        
                        savePrizesInventory(updated);
                        nameEl.value = '';
                        qtyEl.value = '1';
                        setSuccessMessage(`Added "${pName}" with Qty ${pQty} to ${selectedPrizeTier}!`);
                      } else {
                        setErrorMessage('Please fill in both prize name and valid quantity.');
                      }
                    }}
                    className="col-span-4 bg-black hover:bg-neutral-800 text-white font-bold px-1.5 py-1 uppercase text-[8px] cursor-pointer flex items-center justify-center gap-1 border border-black disabled:opacity-50"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add Prize</span>
                  </button>
                </div>
              </div>

              {/* Client Choice: Rigging/Forced Winner Option */}
              <div className="bg-amber-50/70 border border-amber-300 p-2.5 space-y-2 rounded-none">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 uppercase tracking-tight text-[9px] block flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-500 animate-pulse" />
                    <span>Secret Force Next Winner selection</span>
                  </span>
                  <span className="text-[7px] font-mono text-amber-800 bg-amber-200/50 px-1 uppercase font-bold">Client Override</span>
                </div>

                {/* 1. Target Prize Tier Selection */}
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-amber-900 uppercase block">
                    1. Select Target Prize Tier:
                  </label>
                  <SearchableSelect
                    value={selectedPrizeTier}
                    onChange={(val) => {
                      setSelectedPrizeTier(val);
                      const tierObj = prizesConfig.find(t => t.name === val);
                      if (tierObj && tierObj.prizes.length > 0) {
                        setSelectedPrizeName(tierObj.prizes[0].name);
                      }
                      setSuccessMessage(`Target Prize Tier set to "${val.toUpperCase()}" for secret force selection.`);
                    }}
                    disabled={isSpinning}
                    placeholder="🔍 SELECT PRIZE TIER..."
                    options={prizesConfig.map(tier => ({
                      value: tier.name,
                      label: `🏆 ${tier.name.toUpperCase()}`,
                      sublabel: tier.prizes.map(p => p.name).join(', '),
                      badge: `MIN ${tier.eligiblePointsMin} PTS`
                    }))}
                  />
                </div>

                {/* 2. Target Forced Winner Participant Selection */}
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-amber-900 uppercase block">
                    2. Select Forced Winner Participant:
                  </label>
                  <SearchableSelect
                    value={forcedWinnerId}
                    onChange={(val) => {
                      setForcedWinnerId(val);
                      if (val) {
                        const chosen = candidates.find(p => p.participantId === val);
                        if (chosen) {
                          setSuccessMessage(`Secret override active: ${chosen.name.toUpperCase()} will win ${selectedPrizeTier.toUpperCase()} on next spin!`);
                        }
                      } else {
                        setSuccessMessage('Secret override removed. Draws are now fair random again.');
                      }
                    }}
                    disabled={isSpinning}
                    placeholder="🔍 SEARCH NAME, COMPANY, OR ID..."
                    clearableText="-- FAIR RANDOM SELECTION --"
                    options={candidates
                      .filter(p => p.checkedIn && !p.isWinner)
                      .map(p => ({
                        value: p.participantId,
                        label: `${p.name.toUpperCase()} (${p.company.toUpperCase()})`,
                        sublabel: `ID: ${p.participantId} • ${p.position || 'Guest'}`,
                        badge: `${p.points} PTS`
                      }))
                    }
                  />
                </div>
              </div>

              {/* Custom Wheel Background Picture Uploader */}
              <div className="border border-slate-300 p-2.5 bg-slate-50/80 space-y-1.5 rounded-none">
                <span className="font-bold text-slate-700 uppercase tracking-tight text-[9px] block flex items-center gap-1">
                  <Image className="w-3 h-3 text-slate-600" />
                  <span>Custom Wheel Background Picture</span>
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-white border border-slate-300 hover:border-black text-[9px] font-bold uppercase tracking-tight py-1 px-2 text-center text-slate-700 transition-colors block">
                    <Upload className="w-3 h-3 text-slate-500 inline mr-1 -mt-0.5" />
                    Upload Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgImageChange}
                      className="hidden"
                    />
                  </label>
                  {wheelBgImage && (
                    <button
                      type="button"
                      onClick={handleClearBgImage}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 p-1 font-bold text-[9px] uppercase cursor-pointer flex items-center justify-center h-full aspect-square"
                      title="Clear Background Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                            p.points >= eligiblePointsMin ? (
                              <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-400">
                                ✓ ELIGIBLE
                              </span>
                            ) : (
                              <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300" title={`Requires minimum ${eligiblePointsMin} PTS`}>
                                LOW PTS ({p.points}/{eligiblePointsMin})
                              </span>
                            )
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
                className={`flex-1 py-2 font-bold uppercase tracking-wide text-[9px] text-center cursor-pointer flex items-center justify-center gap-1 border transition-colors ${
                  confirmReset 
                    ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse' 
                    : 'bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border-rose-900'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{confirmReset ? 'CONFIRM RESET? (CLICK AGAIN)' : 'Reset All Winners'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* DYNAMIC MODAL REVEALING THE WINNERS (GRAND SPECTACLE) */}
      <AnimatePresence>
        {drawnWinnersBatch && drawnWinnersBatch.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#DFDEDA] border-[2.5px] border-black max-w-2xl w-full p-6 text-center text-slate-900 shadow-2xl space-y-6 relative overflow-hidden font-mono text-xs"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00FF00]" />

              <div className="space-y-4">
                <div className="h-14 w-14 rounded-none bg-black text-[#00FF00] border border-black flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Trophy className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <span className="text-[9px] font-black uppercase bg-black text-[#00FF00] px-2.5 py-0.5 tracking-widest inline-block">
                    {drawnWinnersBatch.length > 1 ? `${drawnWinnersBatch.length} WINNERS DRAWN IN BATCH` : 'LUCKY DRAW WINNER ALLOCATED'}
                  </span>
                  <h3 className="text-xl font-bold text-black uppercase tracking-tight mt-2">
                    {drawnWinnersBatch[0].prizeTier}
                  </h3>
                  <p className="text-[11px] text-slate-700 mt-1 uppercase">
                    Reward Item: <span className="font-bold text-black">{drawnWinnersBatch[0].prizeName}</span>
                  </p>
                </div>

                {/* Big Border card holding details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                  {drawnWinnersBatch.map((winner) => (
                    <div key={winner.id} className="bg-white border-[1.5px] border-black p-4 rounded-none text-left space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-sm font-black text-black uppercase tracking-tight truncate">
                        {winner.participantName}
                      </div>
                      <div className="text-[10px] text-slate-600 uppercase truncate">
                        {winner.participantCompany}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 mt-2">
                        <span className="text-[8px] font-mono text-slate-400">ID: {winner.participantId}</span>
                        <span className="text-[8px] font-mono font-bold text-white bg-black px-1.5 py-0.5 uppercase">WINNER</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setDrawnWinnersBatch(null)}
                    className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-2.5 rounded-none text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase border border-black"
                  >
                    <span>Accept & Continue</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN PROJECTOR DISPLAY OVERLAY */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-45 bg-neutral-950 text-white flex flex-col justify-between p-8 font-mono select-none overflow-hidden"
            style={wheelBgImage ? {
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${wheelBgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            {/* Header: Prize Info */}
            <div className="flex justify-between items-start border-b border-white/20 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] tracking-widest bg-emerald-500 text-black font-black px-2 py-0.5 uppercase">
                  PROJECTOR BROADCAST
                </span>
                <h1 className="text-3xl font-black tracking-tight text-white uppercase mt-1">
                  {selectedPrizeTier}
                </h1>
                <p className="text-sm font-bold text-[#00FF00] uppercase">
                  REWARD: {selectedPrizeName} ({remainingQuantity} LEFT)
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] tracking-widest text-slate-400 block uppercase">
                  ELIGIBLE PARTICIPANTS
                </span>
                <span className="text-2xl font-black text-white">
                  {candidates.filter(p => p.checkedIn && !p.isWinner).length} PRESENT
                </span>
              </div>
            </div>

            {/* Middle: Giant Wheel Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
              <div className="relative" style={{ width: '420px', height: '420px' }}>
                {/* Pointer Needle pin on giant wheel */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-12 z-30 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-[#00FF00] drop-shadow-xl"></div>
                  <div className="h-3.5 w-3.5 rounded-full bg-slate-900 border-2 border-white -mt-1 shadow-md"></div>
                </div>

                {/* Giant canvas for LCD projector */}
                <canvas
                  ref={fullscreenCanvasRef}
                  width={420}
                  height={420}
                  className="rounded-full shadow-[0_0_50px_rgba(0,255,0,0.15)] border-4 border-black bg-white"
                />

                {/* Centered Hub Cap */}
                <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-950 border-4 border-[#00FF00] shadow-xl z-20 flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-[#00FF00] animate-pulse" />
                </div>
              </div>

              <span className="text-xs text-slate-300 uppercase tracking-widest font-bold mt-6 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#00FF00] rounded-full animate-ping"></span>
                <span>{isSpinning ? 'SELECTING THE WINNERS...' : 'READY FOR MAIN SPIN INGRESS'}</span>
              </span>
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between items-center border-t border-white/20 pt-4">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="bg-neutral-900 hover:bg-neutral-800 border border-white/30 hover:border-white text-white font-bold py-2.5 px-6 uppercase text-xs cursor-pointer tracking-wider flex items-center gap-2 transition-all"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Exit Fullscreen</span>
              </button>

              <button
                type="button"
                onClick={triggerWheelSpin}
                disabled={isSpinning || candidates.filter(p => p.checkedIn && !p.isWinner).length === 0}
                className="bg-[#00FF00] hover:bg-[#00DD00] text-black font-black py-3 px-12 uppercase text-sm tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(0,255,0,0.3)] hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black text-black" />
                <span>{isSpinning ? 'SPINNING...' : 'LAUNCH DRAW SPIN'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
