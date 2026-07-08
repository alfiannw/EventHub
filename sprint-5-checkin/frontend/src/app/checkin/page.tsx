import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, ArrowRight, Scan, 
  MapPin, ShieldAlert, Award, Search, Users, Activity, 
  Clock, RotateCcw, Flame, CheckSquare, RefreshCw
} from 'lucide-react';

interface CheckInLog {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  qrCodeString: string;
  gateName: string;
  scannedBy: string;
  status: 'SUCCESS' | 'FAILED' | 'FLAGGED';
  failureReason?: string;
  checkedInAt: string;
}

const PRESET_TICKETS = [
  { id: 'qr-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', qr: 'EH-QR-ALEXRIVERA-7719', status: 'ACTIVE', checkedIn: true },
  { id: 'qr-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', qr: 'EH-QR-SARAHCHEN-1254', status: 'ACTIVE', checkedIn: true },
  { id: 'qr-3', name: 'Elena Rostova', email: 'elena.rostova@kaspersky.com', qr: 'EH-QR-ELENAROSTOVA-8120', status: 'REVOKED', checkedIn: false },
  { id: 'qr-4', name: 'Liam O\'Connor', email: 'liam.oc@atlassian.com', qr: 'EH-QR-LIAM-9902', status: 'ACTIVE', checkedIn: false }
];

export default function QrCheckInPage() {
  // 1. Initial Seeding Logs list
  const [logs, setLogs] = useState<CheckInLog[]>([
    {
      id: 'log-1',
      participantId: 'p-1',
      participantName: 'Alex Rivera',
      participantEmail: 'alex.rivera@meta.com',
      qrCodeString: 'EH-QR-ALEXRIVERA-7719',
      gateName: 'West VIP Entrance',
      scannedBy: 'GateKeeper_Pro_A',
      status: 'SUCCESS',
      checkedInAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'log-2',
      participantId: 'p-2',
      participantName: 'Sarah Chen',
      participantEmail: 'sarah.chen@google.com',
      qrCodeString: 'EH-QR-SARAHCHEN-1254',
      gateName: 'East General Gate',
      scannedBy: 'GateKeeper_Pro_B',
      status: 'SUCCESS',
      checkedInAt: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  // 2. Active scan inputs state
  const [scannedCode, setScannedCode] = useState('');
  const [selectedGate, setSelectedGate] = useState('West VIP Entrance');
  const [scannedBy, setScannedBy] = useState('Station_Delta_05');

  // 3. Simulated Checked In Status of the Roster
  const [roster, setRoster] = useState(PRESET_TICKETS);

  // 4. Verification HUD Screen
  const [hudResult, setHudResult] = useState<{
    status: 'SUCCESS' | 'FAILED' | 'FLAGGED';
    title: string;
    details: string;
    name?: string;
    email?: string;
    gamificationPoints?: number;
  } | null>(null);

  // 5. Toast alert
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleProcessCheckIn = (codeToScan: string) => {
    const code = codeToScan.trim();
    if (!code) {
      triggerToast('⚠️ Please enter or click a QR code string.');
      return;
    }

    const matchedTicket = roster.find(t => t.qr === code);

    // Scenario A: Ticket signature completely missing (Invalid ticket)
    if (!matchedTicket) {
      const newLog: CheckInLog = {
        id: `log-${Date.now()}`,
        participantId: 'UNKNOWN',
        participantName: 'Unknown Attendee',
        participantEmail: 'unknown@eventhub.com',
        qrCodeString: code,
        gateName: selectedGate,
        scannedBy,
        status: 'FAILED',
        failureReason: 'QR Code signature does not match any compiled ticket in system.',
        checkedInAt: new Date().toISOString()
      };

      setLogs(prev => [newLog, ...prev]);
      setHudResult({
        status: 'FAILED',
        title: 'VERIFICATION FAILURE',
        details: 'QR signature not recognized in the ticket registry database.'
      });
      triggerToast('❌ Denied: Unknown QR ticket signature.');
      return;
    }

    // Scenario B: Ticket has been revoked manually
    if (matchedTicket.status === 'REVOKED') {
      const newLog: CheckInLog = {
        id: `log-${Date.now()}`,
        participantId: matchedTicket.id,
        participantName: matchedTicket.name,
        participantEmail: matchedTicket.email,
        qrCodeString: code,
        gateName: selectedGate,
        scannedBy,
        status: 'FAILED',
        failureReason: 'Ticket security state is set to manually REVOKED.',
        checkedInAt: new Date().toISOString()
      };

      setLogs(prev => [newLog, ...prev]);
      setHudResult({
        status: 'FAILED',
        title: 'TICKET REVOKED',
        details: 'Security Notice: This attendee pass was manually voided and blacklisted.',
        name: matchedTicket.name,
        email: matchedTicket.email
      });
      triggerToast('❌ Denied: Ticket is manually revoked.');
      return;
    }

    // Scenario C: Already Checked In (Flagged / Security Alert)
    if (matchedTicket.checkedIn) {
      const newLog: CheckInLog = {
        id: `log-${Date.now()}`,
        participantId: matchedTicket.id,
        participantName: matchedTicket.name,
        participantEmail: matchedTicket.email,
        qrCodeString: code,
        gateName: selectedGate,
        scannedBy,
        status: 'FLAGGED',
        failureReason: 'Double scan detected. This ticket has already processed entry.',
        checkedInAt: new Date().toISOString()
      };

      setLogs(prev => [newLog, ...prev]);
      setHudResult({
        status: 'FLAGGED',
        title: 'DOUBLE SCAN DETECTED',
        details: 'Warning: This QR pass has already been validated. Security alert logged.',
        name: matchedTicket.name,
        email: matchedTicket.email
      });
      triggerToast('⚠️ Warning: Double check-in flag raised!');
      return;
    }

    // Scenario D: Clean Success Check-In
    setRoster(prev => prev.map(t => t.qr === code ? { ...t, checkedIn: true } : t));

    const newLog: CheckInLog = {
      id: `log-${Date.now()}`,
      participantId: matchedTicket.id,
      participantName: matchedTicket.name,
      participantEmail: matchedTicket.email,
      qrCodeString: code,
      gateName: selectedGate,
      scannedBy,
      status: 'SUCCESS',
      checkedInAt: new Date().toISOString()
    };

    setLogs(prev => [newLog, ...prev]);
    setHudResult({
      status: 'SUCCESS',
      title: 'ACCESS GRANTED',
      details: 'Check-in approved. Synchronized seating assignment complete.',
      name: matchedTicket.name,
      email: matchedTicket.email,
      gamificationPoints: 10 // Gamification integration bonus
    });
    triggerToast(`✅ ${matchedTicket.name} successfully checked in!`);
  };

  const resetRosterCheckins = () => {
    setRoster(prev => prev.map(t => ({ ...t, checkedIn: false })));
    setLogs([]);
    setHudResult(null);
    triggerToast('🔄 Reset simulation roster data.');
  };

  // Compile KPI figures
  const totalRegistered = roster.length;
  const checkedInCount = roster.filter(t => t.checkedIn).length;
  const attendancePercentage = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;
  const flaggedCount = logs.filter(l => l.status === 'FLAGGED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-950 border-l-4 border-emerald-500 text-white py-3 px-5 font-mono text-xs flex items-center gap-2 shadow-lg">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Scan className="w-6 h-6 text-slate-800" />
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-slate-900">QR Check-In Gate Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Sprint 5: Gate check-in verification, double-scan prevention, and live telemetry audit logging.
          </p>
        </div>

        <button
          onClick={resetRosterCheckins}
          className="mt-4 md:mt-0 bg-white hover:bg-slate-50 text-slate-700 font-mono text-xs font-bold py-2 px-4 border border-slate-200 inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Roster Checkins</span>
        </button>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-mono">
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Registered</div>
          <div className="text-2xl font-black mt-1 text-slate-900">{totalRegistered}</div>
          <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>Expected attendees</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Checked-In Count</div>
          <div className="text-2xl font-black mt-1 text-slate-900">{checkedInCount} <span className="text-xs text-slate-400">/ {totalRegistered}</span></div>
          <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Success verifications</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance Rate</div>
          <div className="text-2xl font-black mt-1 text-indigo-600">{attendancePercentage}%</div>
          <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>Real-time conversion</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flagged Incidents</div>
          <div className="text-2xl font-black mt-1 text-amber-600">{flaggedCount}</div>
          <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Double-scan exceptions</span>
          </div>
        </div>
      </div>

      {/* Primary Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Gate Setup & Manual Terminal Scanner */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              <span>01. Gate Point Configuration</span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Active Check-In Gate</label>
                <select
                  value={selectedGate}
                  onChange={(e) => setSelectedGate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none cursor-pointer"
                >
                  <option value="West VIP Entrance">West VIP Entrance</option>
                  <option value="East General Gate">East General Gate</option>
                  <option value="North Media Terminal">North Media Terminal</option>
                  <option value="Main Executive Lobby">Main Executive Lobby</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Scanner Terminal ID</label>
                <input
                  type="text"
                  value={scannedBy}
                  onChange={(e) => setScannedBy(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Scan className="w-4 h-4 text-slate-700" />
              <span>02. Gate Scanner Terminal</span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Scan Ticket String</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    placeholder="Scan QR or enter string..."
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 flex-1 rounded-none focus:border-slate-500 outline-none"
                  />
                  <button
                    onClick={() => handleProcessCheckIn(scannedCode)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 cursor-pointer"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>

              {/* Roster quick trigger list */}
              <div>
                <span className="block text-slate-500 text-[10px] font-bold uppercase mb-2">Simulate Quick Scanner Scans</span>
                <div className="grid grid-cols-2 gap-2">
                  {roster.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setScannedCode(item.qr);
                        handleProcessCheckIn(item.qr);
                      }}
                      className={`p-2.5 border text-left text-[10px] truncate cursor-pointer font-bold ${
                        item.checkedIn 
                          ? 'bg-slate-100 border-slate-300 text-slate-500' 
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      Scan {item.name.split(' ')[0]}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const randCode = `EH-QR-INVALID-${Math.floor(Math.random() * 9000)}`;
                      setScannedCode(randCode);
                      handleProcessCheckIn(randCode);
                    }}
                    className="p-2.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-left text-[10px] truncate cursor-pointer font-bold"
                  >
                    Scan Fake QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center column: Live Verification HUD Screen */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden font-mono sticky top-6">
            <div className="bg-[#111] p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="text-indigo-400 font-bold uppercase tracking-wider">Gate Access Terminal HUD</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            </div>

            <div className="p-6 space-y-6 min-h-[380px] flex flex-col justify-between">
              
              {!hudResult ? (
                <div className="my-auto text-center space-y-4 py-12">
                  <Scan className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Ticket Scan</h4>
                    <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-1">Submit a QR token string or click quick scanner button on left to verify access.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Status Indicator Icon & Title */}
                  <div className="text-center space-y-2">
                    {hudResult.status === 'SUCCESS' && <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />}
                    {hudResult.status === 'FAILED' && <XCircle className="w-12 h-12 text-rose-500 mx-auto" />}
                    {hudResult.status === 'FLAGGED' && <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />}
                    
                    <h3 className={`text-base font-black uppercase tracking-tight ${
                      hudResult.status === 'SUCCESS' ? 'text-emerald-400' :
                      hudResult.status === 'FAILED' ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {hudResult.title}
                    </h3>
                    <p className="text-[10px] text-slate-400">{hudResult.details}</p>
                  </div>

                  {/* Attendee Details Card */}
                  {hudResult.name && (
                    <div className="bg-slate-950 p-4 border border-slate-800 space-y-2">
                      <div className="text-[10px] text-slate-500 block uppercase tracking-wider">Verified Ticket Profile</div>
                      <div className="font-bold text-white text-sm">{hudResult.name}</div>
                      <div className="text-[10px] text-slate-400">{hudResult.email}</div>
                    </div>
                  )}

                  {/* Gamification bonus indicator */}
                  {hudResult.gamificationPoints && (
                    <div className="bg-emerald-950/40 border border-emerald-900/40 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] text-emerald-300 font-bold">GAMIFICATION POINTS BONUS</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400">+{hudResult.gamificationPoints} PTS</span>
                    </div>
                  )}

                  {/* Operational diagnostics log */}
                  <div className="text-[9px] text-slate-500 bg-[#090d16] p-3 border border-slate-800/60 flex items-center justify-between">
                    <span>GATE: {selectedGate}</span>
                    <span>TIMESTAMP: {new Date().toLocaleTimeString()}</span>
                  </div>

                </div>
              )}

              {/* Reset simulator HUD action */}
              {hudResult && (
                <button
                  onClick={() => setHudResult(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 text-[10px] font-bold uppercase transition-colors"
                >
                  CLEAR HUD
                </button>
              )}

            </div>
          </div>
        </div>

        {/* Right Side: Log Registry / Live scan audit logs */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>03. Live Check-In Audit Logs</span>
            </h3>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-[10px]">
                No check-in operations recorded in current terminal.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 font-mono text-xs">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 border ${
                      log.status === 'SUCCESS' ? 'bg-emerald-50/50 border-emerald-100 text-slate-800' :
                      log.status === 'FAILED' ? 'bg-rose-50/50 border-rose-100 text-slate-800' :
                      'bg-amber-50/50 border-amber-100 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold block">{log.participantName}</span>
                        <span className="text-[9px] text-slate-400 block">{log.qrCodeString}</span>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 uppercase border font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        log.status === 'FAILED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    {log.failureReason && (
                      <div className="text-[9px] text-rose-700 font-semibold mt-1">
                        Reason: {log.failureReason}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-200/40 flex justify-between text-[9px] text-slate-400">
                      <span>Gate: {log.gateName}</span>
                      <span>{new Date(log.checkedInAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
