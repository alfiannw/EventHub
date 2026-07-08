import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Award, 
  Music, 
  Activity, 
  Download, 
  RotateCcw, 
  Filter, 
  Search, 
  Check, 
  ShieldAlert, 
  Plus, 
  Minus, 
  Zap, 
  Globe, 
  Server,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientAnalyticsService } from './client-service';
import { 
  AnalyticsOverviewDto, 
  AnalyticsTimelineDto, 
  AnalyticsDistributionDto, 
  LeaderboardRowDto, 
  AuditLogRowDto 
} from '../../../../backend/src/analytics/analytics.entity';

export default function AnalyticsSprintPage() {
  const serviceRef = useRef(new ClientAnalyticsService());
  const service = serviceRef.current;

  // State Management
  const [overview, setOverview] = useState<AnalyticsOverviewDto | null>(null);
  const [timelineData, setTimelineData] = useState<AnalyticsTimelineDto[]>([]);
  const [distribution, setDistribution] = useState<AnalyticsDistributionDto | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRowDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRowDto[]>([]);

  // Filtering / Controls
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [simulatedParticipantId, setSimulatedParticipantId] = useState('p-1');
  const [pointsDelta, setPointsDelta] = useState(10);

  // Status Alerts
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audio Feedbacks
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
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio support blocked
    }
  };

  const playChime = () => {
    playSound(523.25, 'sine', 0.1); // C5
    setTimeout(() => playSound(659.25, 'sine', 0.1), 80); // E5
    setTimeout(() => playSound(783.99, 'sine', 0.2), 160); // G5
  };

  const playClick = () => {
    playSound(400, 'triangle', 0.04);
  };

  const playResetChime = () => {
    playSound(180, 'sawtooth', 0.15);
    setTimeout(() => playSound(130, 'sawtooth', 0.2), 100);
  };

  // Re-fetch all dynamic reporting engines
  const refreshStats = async () => {
    try {
      const over = await service.getOverview();
      const time = await service.getTimeline();
      const dist = await service.getDistribution();
      const lead = await service.getLeaderboard(5, selectedCompany || undefined);
      const logs = await service.getAuditLogs(selectedSeverity || undefined, 10);

      setOverview(over);
      setTimelineData(time);
      setDistribution(dist);
      setLeaderboard(lead);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Error loading live analytics reporting streams:', err);
    }
  };

  useEffect(() => {
    refreshStats();
  }, [selectedCompany, selectedSeverity]);

  // =============================================================================
  // D3 LIVE FORCE NETWORK GRAPH VISUALIZATION
  // Render participants as interactive force nodes grouping by Company
  // =============================================================================
  const d3ContainerRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!d3ContainerRef.current || leaderboard.length === 0) return;

    // Remove existing drawings
    const svgElement = d3.select(d3ContainerRef.current);
    svgElement.selectAll('*').remove();

    const width = 240;
    const height = 210;

    // Create custom nodes representation of checked-in / non-checked-in guests
    const nodes = leaderboard.map((p, idx) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      points: p.points,
      checkedIn: p.checkedIn,
      x: 30 + idx * 40,
      y: 60 + (idx % 2) * 50
    }));

    // Setup visual containers
    const nodeGroup = svgElement.append('g').attr('class', 'nodes-layer');

    // Draw lines as connecting background anchors to the center hub
    const centerNode = { x: width / 2, y: height / 2 };
    
    // Draw background grid circles
    svgElement.append('circle')
      .attr('cx', centerNode.x)
      .attr('cy', centerNode.y)
      .attr('r', 65)
      .attr('fill', 'none')
      .attr('stroke', '#E4E3E0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    svgElement.append('circle')
      .attr('cx', centerNode.x)
      .attr('cy', centerNode.y)
      .attr('r', 35)
      .attr('fill', 'none')
      .attr('stroke', '#E4E3E0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Draw connector links
    nodes.forEach(node => {
      svgElement.append('line')
        .attr('x1', centerNode.x)
        .attr('y1', centerNode.y)
        .attr('x2', node.x)
        .attr('y2', node.y)
        .attr('stroke', node.checkedIn ? '#141414' : '#CFCECA')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', node.checkedIn ? 'none' : '4,4');
    });

    // Draw central hub node
    svgElement.append('circle')
      .attr('cx', centerNode.x)
      .attr('cy', centerNode.y)
      .attr('r', 10)
      .attr('fill', '#141414')
      .attr('stroke', '#00FF00')
      .attr('stroke-width', 1.5);

    svgElement.append('text')
      .attr('x', centerNode.x)
      .attr('y', centerNode.y + 1)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('fill', '#00FF00')
      .attr('font-size', '6px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('HUB');

    // Render guest nodes
    const nodeSelection = nodeGroup.selectAll('g.node-item')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);

    // Outer neon status ring
    nodeSelection.append('circle')
      .attr('r', (d: any) => 8 + (d.points * 0.15))
      .attr('fill', (d: any) => d.checkedIn ? '#00FF00' : '#DFDEDA')
      .attr('stroke', '#141414')
      .attr('stroke-width', 1.5);

    // Inner center point core
    nodeSelection.append('circle')
      .attr('r', 3)
      .attr('fill', '#141414');

    // Text name tooltips inside SVG
    nodeSelection.append('text')
      .attr('y', (d: any) => 16 + (d.points * 0.15))
      .attr('text-anchor', 'middle')
      .attr('fill', '#141414')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d: any) => d.name.split(' ')[0].toUpperCase());

    // Score pop
    nodeSelection.append('text')
      .attr('y', (d: any) => -12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '7px')
      .attr('font-family', 'monospace')
      .text((d: any) => `${d.points}P`);

  }, [leaderboard]);

  // Handle Simulation Checkin Ingress
  const handleSimulateCheckIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await service.triggerSimulateCheckIn(simulatedParticipantId);
      playChime();
      const target = leaderboard.find(p => p.id === simulatedParticipantId);
      setSuccessMessage(`SIMULATION SUCCESS: Checked in Guest ${target ? target.name : simulatedParticipantId}!`);
      refreshStats();
    } catch (err: any) {
      setErrorMessage('Check-in simulation failed.');
    }
  };

  // Handle Simulation Point Updates
  const handleSimulatePoints = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await service.triggerSimulatePoints(simulatedParticipantId, pointsDelta);
      playChime();
      const target = leaderboard.find(p => p.id === simulatedParticipantId);
      setSuccessMessage(`SIMULATION SUCCESS: Granted ${pointsDelta > 0 ? '+' : ''}${pointsDelta} PTS to ${target ? target.name : simulatedParticipantId}!`);
      refreshStats();
    } catch (err: any) {
      setErrorMessage('Points simulation failed.');
    }
  };

  // Reset entire metrics streams
  const handleResetMetrics = async () => {
    if (confirm('Are you sure you want to purge analytics logs? This resets attendance and point multipliers.')) {
      setErrorMessage('');
      setSuccessMessage('');
      await service.resetData();
      playResetChime();
      setSuccessMessage('Analytics reporting states cleared and seeds populated.');
      refreshStats();
    }
  };

  // Export Attendees CSV Deck
  const handleExportAttendeesCSV = () => {
    const headers = ['Guest ID', 'Full Name', 'Company Name', 'Job Designation', 'Check In Status', 'Points Ledger Balance'];
    const rows = leaderboard.map(p => [
      p.id,
      p.name,
      p.company,
      p.position,
      p.checkedIn ? 'PRESENT' : 'ABSENT',
      `${p.points} PTS`
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EventHub_Attendee_Telemetry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playClick();
  };

  return (
    <div className="space-y-6" id="sprint12-analytics-dashboard-suite">
      
      {/* 1. KEY TELEMETRY PERFORMANCE STRIPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center border border-black shrink-0">
            <Users className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Arrival Yield</span>
            <div className="text-lg font-black text-black">
              {overview?.checkedInCount || 0} / {overview?.totalRegistered || 0} Present
            </div>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center border border-black shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">RSVP Rate</span>
            <div className="text-lg font-black text-black">
              {overview?.attendanceRate || 0}% present
            </div>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-[#141414] text-[#E4E3E0] flex items-center justify-center border border-black shrink-0">
            <Award className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Average Points</span>
            <div className="text-lg font-black text-black">
              {overview?.avgPoints || 0} PTS
            </div>
          </div>
        </div>

        <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-4 flex items-center gap-4 font-mono">
          <div className="h-11 w-11 bg-white text-[#141414] flex items-center justify-center border border-black shrink-0">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Submission Engine</span>
            <div className="text-lg font-black text-black">
              {overview?.activityCount || 0} uploaded
            </div>
          </div>
        </div>

      </div>

      {/* DISMISSABLE FEEDBACK ALERTS */}
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
            <button onClick={() => setSuccessMessage('')} className="hover:text-emerald-700 cursor-pointer text-[10px] font-bold">[Dismiss]</button>
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
            <button onClick={() => setErrorMessage('')} className="hover:text-rose-700 cursor-pointer text-[10px] font-bold">[Dismiss]</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. LIVE CHARTS INTEGRATION DECK (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LINE & AREA CHART: TIMELINE ANALYSIS (7 spans) */}
        <div className="lg:col-span-8 bg-white border-[1.5px] border-[#141414] p-5 font-mono text-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#141414] pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase flex items-center gap-1.5">
                <Globe className="w-5 h-5 text-black" />
                <span>Arrival & Gamification Timelines</span>
              </h3>
              <span className="text-[10px] text-slate-500 italic uppercase">Recharts live ingress timelines</span>
            </div>
            <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse border border-black shrink-0" title="Live Streaming" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF00" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#141414" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E3E0" />
                <XAxis dataKey="timeLabel" stroke="#141414" style={{ fontSize: '10px' }} />
                <YAxis stroke="#141414" style={{ fontSize: '10px' }} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="checkIns" stroke="#00FF00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCheckins)" name="Arrivals Count" />
                <Area type="monotone" dataKey="submissions" stroke="#141414" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmissions)" name="Submissions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-end gap-4 text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00FF00] border border-black inline-block" />
              <span>Checked In Yield</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#141414] inline-block" />
              <span>Activity Uploads</span>
            </span>
          </div>
        </div>

        {/* INTERACTIVE D3 FORCE DIRECTED CLUSTER CHART (4 spans) */}
        <div className="lg:col-span-4 bg-white border-[1.5px] border-[#141414] p-5 font-mono text-xs flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase border-b border-[#141414] pb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-black" />
              <span>D3 Interactive Ingress Grid</span>
            </h3>
            <span className="text-[10px] font-serif-italic text-slate-500 leading-normal block">
              Vector anchors drawing checked-in nodes centered on the server hub. Radius encodes score.
            </span>
          </div>

          {/* D3 Vector Canvas Container */}
          <div className="flex items-center justify-center py-2 bg-[#DFDEDA]/10 border border-[#DFDEDA] mt-3">
            <svg 
              ref={d3ContainerRef}
              width={240}
              height={210}
              className="overflow-visible"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-2">
            <span>● Checked In (Neon)</span>
            <span>○ Absent (Warm)</span>
          </div>
        </div>

      </div>

      {/* 3. DUAL-GRID FOOTER SECTION: DISTRIBUTION AND SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (8 SPANS): RECHARTS BAR CHART - POINTS BY COMPANY & LIST */}
        <div className="lg:col-span-8 bg-white border-[1.5px] border-[#141414] p-5 font-mono text-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#141414] pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase flex items-center gap-1.5">
                <Award className="w-5 h-5 text-black" />
                <span>Company-wide Points Distribution</span>
              </h3>
              <span className="text-[10px] text-slate-500 italic uppercase">Recharts aggregate group comparisons</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportAttendeesCSV}
                className="bg-white hover:bg-slate-50 text-black border border-black px-2.5 py-1 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Telemetry CSV</span>
              </button>
            </div>
          </div>

          {/* Recharts Bar chart representation */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-7 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={distribution?.companyAverages || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3E0" />
                  <XAxis dataKey="company" stroke="#141414" style={{ fontSize: '9px' }} tickFormatter={(val) => val.split(' ')[0]} />
                  <YAxis stroke="#141414" style={{ fontSize: '9px' }} />
                  <RechartsTooltip />
                  <Bar dataKey="avgPoints" fill="#141414" radius={[0, 0, 0, 0]} name="Avg Points Score" barSize={30} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Door prize distribution text block list */}
            <div className="md:col-span-5 space-y-2.5 bg-[#DFDEDA]/30 border border-slate-300 p-4 font-mono text-xs">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">// DOOR PRIZE BUCKETS YIELD</span>
              
              <div className="space-y-2">
                {distribution?.doorPrizeTiers.map((tier, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] border-b border-dashed border-slate-300 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-800">{tier.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">{tier.range}</span>
                      <span className="bg-[#141414] text-white px-2 py-0.5 text-[9px] font-extrabold font-mono">{tier.count} guests</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (4 SPANS): SIMULATOR & AUDIT LOGGER */}
        <div className="lg:col-span-4 bg-[#141414] text-[#E4E3E0] border-[1.5px] border-[#141414] p-5 font-mono text-xs flex flex-col justify-between space-y-4">
          
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#00FF00]" />
              <span>Live Ingress Simulator</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Select Target Guest</label>
                <select
                  value={simulatedParticipantId}
                  onChange={(e) => setSimulatedParticipantId(e.target.value)}
                  className="tech-input bg-zinc-950 text-white border-zinc-700 w-full"
                >
                  {leaderboard.map(p => (
                    <option key={p.id} value={p.id} className="text-black bg-white">{p.name.toUpperCase()} ({p.company.split(' ')[0]})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSimulateCheckIn}
                  className="bg-zinc-800 hover:bg-zinc-700 text-[#00FF00] border border-zinc-600 font-bold py-2 uppercase text-[9px] text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3 text-[#00FF00]" />
                  <span>Check In</span>
                </button>

                <div className="flex gap-1">
                  <select
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(Number(e.target.value))}
                    className="tech-input bg-zinc-950 text-white border-zinc-700 text-center text-[10px] py-1 px-1"
                  >
                    <option value="5" className="text-black bg-white">+5 PTS</option>
                    <option value="10" className="text-black bg-white">+10 PTS</option>
                    <option value="20" className="text-black bg-white">+20 PTS</option>
                    <option value="-5" className="text-black bg-white">-5 PTS</option>
                  </select>
                  <button
                    onClick={handleSimulatePoints}
                    className="bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold px-2 py-1 flex-1 uppercase text-[10px] text-center cursor-pointer"
                  >
                    GO
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <button
              onClick={handleResetMetrics}
              className="w-full bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-900 py-2 font-bold uppercase tracking-wide text-[9px] text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Purge Analytics Streams</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. REAL-TIME AUDIT LOGS LEDGER VIEW */}
      <div className="bg-white border-[1.5px] border-[#141414] p-5 font-mono text-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#141414] pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-black" />
              <span>Security & Audit Telemetry Ledger</span>
            </h3>
            <span className="text-[10px] text-slate-500 italic uppercase">Double-entry audit logs</span>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="tech-input font-bold uppercase py-1 px-2.5 text-[10px]"
            >
              <option value="">All Severities</option>
              <option value="INFO">Info Logs</option>
              <option value="SUCCESS">Success Logs</option>
              <option value="WARNING">Warning Logs</option>
              <option value="ERROR">Error Logs</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-black bg-[#DFDEDA] text-[9px] font-black uppercase tracking-wider text-slate-700">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor ID (Role)</th>
                <th className="py-2.5 px-3">Log Details</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic font-mono text-[10px]">
                    No telemetry log rows found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#DFDEDA]/20 transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-extrabold text-[10px]">{String(log.id).padStart(4, '0')}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 border ${
                        log.severity === 'SUCCESS' ? 'bg-emerald-100 text-emerald-950 border-emerald-400' :
                        log.severity === 'WARNING' ? 'bg-amber-100 text-amber-950 border-amber-400' :
                        log.severity === 'ERROR' ? 'bg-rose-100 text-rose-950 border-rose-400' :
                        'bg-blue-50 text-blue-900 border-blue-300'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-black font-extrabold uppercase text-[10px]">{log.action}</td>
                    <td className="py-2 px-3 text-slate-900 font-bold uppercase text-[10px]">
                      {log.actorId} <span className="text-slate-400 font-normal">({log.role})</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-right text-[9px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
