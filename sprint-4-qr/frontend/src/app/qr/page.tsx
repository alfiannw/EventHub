import React, { useState } from 'react';
import { 
  QrCode, User, FileText, Settings, Key, AlertCircle, 
  CheckCircle2, RefreshCw, XCircle, ShieldCheck, Download, 
  Printer, Trash2, Search, Sliders, CalendarClock, EyeOff, Sparkles, Activity
} from 'lucide-react';

interface QrTicket {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  qrCodeString: string;
  format: 'QR_CODE' | 'BARCODE' | 'DATA_MATRIX';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  scansCount: number;
  lastScannedAt?: string;
  generatedAt: string;
  expiresAt: string;
}

const PRESET_PARTICIPANTS = [
  { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', company: 'Meta Platforms Inc.' },
  { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', company: 'Google LLC' },
  { id: 'p-3', name: 'Elena Rostova', email: 'elena.rostova@kaspersky.com', company: 'Kaspersky Lab' },
  { id: 'p-4', name: 'Liam O\'Connor', email: 'liam.oc@atlassian.com', company: 'Atlassian' }
];

export default function QrGenerationPage() {
  // 1. Core QR Tickets State
  const [tickets, setTickets] = useState<QrTicket[]>([
    {
      id: 'qr-1',
      participantId: 'p-1',
      participantName: 'Alex Rivera',
      participantEmail: 'alex.rivera@meta.com',
      qrCodeString: 'EH-QR-ALEXRIVERA-7719',
      format: 'QR_CODE',
      status: 'ACTIVE',
      scansCount: 0,
      generatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 48).toISOString()
    },
    {
      id: 'qr-2',
      participantId: 'p-2',
      participantName: 'Sarah Chen',
      participantEmail: 'sarah.chen@google.com',
      qrCodeString: 'EH-QR-SARAHCHEN-1254',
      format: 'QR_CODE',
      status: 'ACTIVE',
      scansCount: 2,
      lastScannedAt: new Date(Date.now() - 3600000).toISOString(),
      generatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 24).toISOString()
    },
    {
      id: 'qr-3',
      participantId: 'p-3',
      participantName: 'Elena Rostova',
      participantEmail: 'elena.rostova@kaspersky.com',
      qrCodeString: 'EH-QR-ELENAROSTOVA-8120',
      format: 'QR_CODE',
      status: 'REVOKED',
      scansCount: 1,
      lastScannedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      generatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 12).toISOString()
    }
  ]);

  // 2. Active QR Code Selection for Pass Visualizer
  const [selectedTicketId, setSelectedTicketId] = useState<string>('qr-1');

  // 3. New Ticket Generator Form State
  const [selectedPid, setSelectedPid] = useState('p-1');
  const [selectedFormat, setSelectedFormat] = useState<'QR_CODE' | 'BARCODE' | 'DATA_MATRIX'>('QR_CODE');
  const [expiryHours, setExpiryHours] = useState('72');

  // 4. Scanner Simulation State
  const [scannedCodeInput, setScannedCodeInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ticket?: QrTicket;
  } | null>(null);

  // 5. Global Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'>('ALL');

  // 6. Notifications Feed
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const handleGenerateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const targetParticipant = PRESET_PARTICIPANTS.find(p => p.id === selectedPid);
    if (!targetParticipant) {
      triggerToast('⚠️ Invalid participant selected.');
      return;
    }

    // Auto-expire older tickets of the same format for the same participant
    setTickets(prev => prev.map(t => {
      if (t.participantId === targetParticipant.id && t.status === 'ACTIVE' && t.format === selectedFormat) {
        return { ...t, status: 'EXPIRED' };
      }
      return t;
    }));

    const ticketId = `qr-${Date.now()}`;
    const qrString = `EH-QR-${targetParticipant.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: QrTicket = {
      id: ticketId,
      participantId: targetParticipant.id,
      participantName: targetParticipant.name,
      participantEmail: targetParticipant.email,
      qrCodeString: qrString,
      format: selectedFormat,
      status: 'ACTIVE',
      scansCount: 0,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * parseInt(expiryHours)).toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicketId(ticketId);
    setScannedCodeInput(qrString); // Pre-fill scanner simulator
    triggerToast(`🎉 Dynamic QR generated for ${targetParticipant.name}!`);
  };

  const handleRevoke = (id: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'REVOKED') return t;
        return { ...t, status: 'REVOKED' };
      }
      return t;
    }));
    triggerToast('🛑 QR Token permanently revoked and blacklisted.');
  };

  const handleScanSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCodeInput.trim()) {
      triggerToast('⚠️ Please enter or select a QR code string.');
      return;
    }

    const ticket = tickets.find(t => t.qrCodeString === scannedCodeInput.trim());

    if (!ticket) {
      setScanResult({
        success: false,
        message: 'Security Alert: QR Code signature not found in central registry.'
      });
      return;
    }

    if (ticket.status === 'REVOKED') {
      setScanResult({
        success: false,
        message: 'ACCESS DENIED: This ticket has been manually revoked.',
        ticket
      });
      return;
    }

    const isExpired = new Date(ticket.expiresAt).getTime() < Date.now() || ticket.status === 'EXPIRED';
    if (isExpired) {
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'EXPIRED' } : t));
      setScanResult({
        success: false,
        message: 'ACCESS DENIED: Security token expired.',
        ticket: { ...ticket, status: 'EXPIRED' }
      });
      return;
    }

    // Success scan
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          scansCount: t.scansCount + 1,
          lastScannedAt: new Date().toISOString()
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    const updatedTicket = updatedTickets.find(t => t.id === ticket.id)!;

    setScanResult({
      success: true,
      message: 'ACCESS GRANTED: Token signature verified successfully.',
      ticket: updatedTicket
    });

    triggerToast(`✅ Scan approved! Count: ${updatedTicket.scansCount}`);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.qrCodeString.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.participantEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const renderVisualQr = (text: string, status: string, format: string) => {
    const isRevoked = status === 'REVOKED';
    const isExpired = status === 'EXPIRED';
    
    if (format === 'BARCODE') {
      return (
        <div className={`p-4 bg-white border border-slate-200 flex flex-col justify-center items-center relative ${isRevoked ? 'opacity-30' : ''}`}>
          <div className="flex gap-1 h-20 items-end">
            {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1].map((w, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950 h-full" 
                style={{ width: `${w * 2}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-[9px] text-slate-500 mt-2 tracking-widest">{text}</span>
          {isRevoked && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
              <span className="bg-red-600 text-white font-mono font-black text-xs px-3 py-1.5 rotate-12 tracking-widest border border-white">VOID</span>
            </div>
          )}
        </div>
      );
    }

    if (format === 'DATA_MATRIX') {
      return (
        <div className={`p-4 bg-white border border-slate-200 flex flex-col justify-center items-center relative ${isRevoked ? 'opacity-30' : ''}`}>
          <div className="grid grid-cols-10 gap-[2px] w-28 h-28">
            {Array.from({ length: 100 }).map((_, idx) => {
              const isFilled = (idx * 17) % 3 === 0 || idx % 10 === 0 || idx > 90;
              return (
                <div 
                  key={idx} 
                  className={`${isFilled ? 'bg-slate-950' : 'bg-slate-100'} w-full h-full`} 
                />
              );
            })}
          </div>
          <span className="font-mono text-[9px] text-slate-500 mt-2 tracking-widest">{text}</span>
          {isRevoked && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
              <span className="bg-red-600 text-white font-mono font-black text-xs px-3 py-1.5 rotate-12 tracking-widest border border-white">VOID</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`p-4 bg-white border border-slate-200 flex flex-col justify-center items-center relative ${isRevoked ? 'opacity-30' : ''}`}>
        <svg className="w-28 h-28 mx-auto" viewBox="0 0 100 100" shapeRendering="crispEdges">
          <rect width="100" height="100" fill="white" />
          <path d="M 5,5 h 25 v 25 h -25 z M 10,10 h 15 v 15 h -15 z" fill="#090d16" />
          <path d="M 65,5 h 25 v 25 h -25 z M 70,10 h 15 v 15 h -15 z" fill="#090d16" />
          <path d="M 5,65 h 25 v 25 h -25 z M 10,70 h 15 v 15 h -15 z" fill="#090d16" />
          <path d="M 35,10 h 10 v 10 h -10 z M 50,5 h 10 v 10 h -10 z M 35,25 h 15 v 5 h -15 z" fill="#090d16" />
          <path d="M 10,35 h 10 v 15 h -10 z M 25,45 h 15 v 5 h -15 z M 5,55 h 20 v 5 h -20 z" fill="#090d16" />
          <path d="M 65,35 h 10 v 20 h -10 z M 80,45 h 15 v 10 h -15 z M 75,55 h 15 v 5 h -15 z" fill="#090d16" />
          <rect x="42" y="42" width="16" height="16" rx="1" fill="#090d16" />
          <text x="50" y="52" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">PASS</text>
        </svg>
        <span className="font-mono text-[9px] text-slate-500 mt-2 tracking-widest">{text}</span>
        {isRevoked && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent">
            <span className="bg-red-600 text-white font-mono font-black text-xs px-3 py-1.5 rotate-12 tracking-widest border border-white">VOID</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border-l-4 border-amber-500 text-white py-3 px-5 font-mono text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-slate-800" />
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-slate-900">QR Generation & Ticket Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Sprint 4: Instant visual pass compiling, multi-format ticketing, and real-time gate scanner validations.
          </p>
        </div>

        <div className="mt-4 md:mt-0 bg-white border border-slate-200 p-3 flex items-center gap-4 font-mono text-xs shadow-sm">
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Workspace</div>
            <div className="text-slate-800 font-bold">SPRINT 4 LOADED</div>
          </div>
          <div className="border-l border-slate-150 pl-4">
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Engine Mode</div>
            <div className="text-indigo-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
              <span>STANDALONE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Setup & Generation form */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Dynamic Generation Panel */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-700" />
              <span>01. Ticket Configurator</span>
            </h3>

            <form onSubmit={handleGenerateTicket} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Recipient Participant</label>
                <select
                  value={selectedPid}
                  onChange={(e) => setSelectedPid(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none cursor-pointer"
                >
                  {PRESET_PARTICIPANTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Barcode/QR Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['QR_CODE', 'BARCODE', 'DATA_MATRIX'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSelectedFormat(fmt)}
                      className={`py-2 text-[9px] text-center font-bold cursor-pointer border ${
                        selectedFormat === fmt 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {fmt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Token Expiry Window</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none cursor-pointer"
                >
                  <option value="12">12 Hours (Short Term)</option>
                  <option value="24">24 Hours (Standard)</option>
                  <option value="72">72 Hours (Event Scope)</option>
                  <option value="168">1 Week (Extended)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase py-3 tracking-widest cursor-pointer border-0 mt-2 transition-colors"
              >
                COMPILE NEW TICKET
              </button>
            </form>
          </div>

          {/* Real-time scan gate simulator */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700" />
              <span>02. Gate Scanner Simulator</span>
            </h3>

            <form onSubmit={handleScanSimulation} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Scan Ticket String</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedCodeInput}
                    onChange={(e) => setScannedCodeInput(e.target.value)}
                    placeholder="e.g. EH-QR-ALEXRIVERA-7719"
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 flex-1 rounded-none focus:border-slate-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 cursor-pointer"
                  >
                    SCAN
                  </button>
                </div>
              </div>
            </form>

            {/* Scan HUD results output */}
            {scanResult && (
              <div className={`mt-4 p-4 border font-mono text-xs space-y-2 ${
                scanResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {scanResult.success ? <ShieldCheck className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{scanResult.message}</span>
                </div>
                {scanResult.ticket && (
                  <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] space-y-1">
                    <div><span className="opacity-70">Attendee:</span> {scanResult.ticket.participantName}</div>
                    <div><span className="opacity-70">Format:</span> {scanResult.ticket.format}</div>
                    <div><span className="opacity-70">Scans Count:</span> {scanResult.ticket.scansCount} times</div>
                    <div><span className="opacity-70">Security:</span> {scanResult.ticket.status}</div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Middle column: Interactive Visual Digital Pass preview */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden font-mono sticky top-6">
            <div className="bg-[#111] p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-wider">Dynamic Security Pass</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                currentTicket.status === 'ACTIVE' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' :
                currentTicket.status === 'REVOKED' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' :
                'bg-amber-600/20 text-amber-400 border border-amber-500/30'
              }`}>
                {currentTicket.status}
              </span>
            </div>

            <div className="p-6 space-y-6 text-center">
              <div>
                <h4 className="text-base font-black uppercase text-white tracking-tight">{currentTicket.participantName}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentTicket.participantEmail}</p>
                <div className="bg-slate-950 px-3 py-1 border border-slate-800 text-[9px] text-slate-400 mt-2 inline-block">
                  TICKET ID: {currentTicket.id}
                </div>
              </div>

              {/* Dynamic QR Output rendered here */}
              <div className="my-6">
                {renderVisualQr(currentTicket.qrCodeString, currentTicket.status, currentTicket.format)}
              </div>

              {/* Seating and validation details */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 border border-slate-800 text-left text-[10px] text-slate-400">
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">Generated At</span>
                  <span>{new Date(currentTicket.generatedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">Expires At</span>
                  <span>{new Date(currentTicket.expiresAt).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[8px] text-slate-500 block uppercase">Integrity Status</span>
                  <span className={currentTicket.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {currentTicket.status === 'ACTIVE' ? 'VALID PASS' : 'INVALIDATED'}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[8px] text-slate-500 block uppercase">Verification Scans</span>
                  <span className="text-white font-bold">{currentTicket.scansCount} Active Scans</span>
                </div>
              </div>

              {/* Pass actions bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => triggerToast('📥 Simulating PDF export of security pass.')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 text-[9px] font-bold uppercase flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => triggerToast('🖨️ Thermal badge output dispatched to printing buffer.')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 text-[9px] font-bold uppercase flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Pass</span>
                </button>
                <button
                  onClick={() => handleRevoke(currentTicket.id)}
                  disabled={currentTicket.status === 'REVOKED'}
                  className={`py-2.5 text-[9px] font-bold uppercase flex flex-col items-center gap-1 cursor-pointer ${
                    currentTicket.status === 'REVOKED'
                      ? 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      : 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-900'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Log Directory / Issued Passes List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>03. Token Registry ({filteredTickets.length})</span>
            </h3>

            {/* Filter tools */}
            <div className="space-y-3 mb-4 font-mono text-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter directory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 py-2 pl-8 pr-3 w-full rounded-none outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex border border-slate-300 p-0.5 bg-slate-50">
                {(['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase cursor-pointer ${
                      statusFilter === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 font-mono text-xs">
              {filteredTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setScannedCodeInput(t.qrCodeString);
                  }}
                  className={`p-3 border cursor-pointer transition-colors ${
                    selectedTicketId === t.id 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold block">{t.participantName}</span>
                      <span className="text-[10px] text-slate-400">{t.participantEmail}</span>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 uppercase border font-bold ${
                      t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      t.status === 'REVOKED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/40 flex justify-between text-[9px] text-slate-500">
                    <span>Format: {t.format}</span>
                    <span>Scans: {t.scansCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
