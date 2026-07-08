import React, { useState } from 'react';
import { 
  Printer, Award, Shield, FileText, Sliders, CheckCircle2, 
  XCircle, RefreshCw, Layers, Sparkles, Monitor, Download, 
  Settings, User, PlusCircle, Clock, CheckSquare, Trash2, Tag, Play
} from 'lucide-react';

interface PrintJob {
  id: string;
  participantId: string;
  participantName: string;
  participantCompany: string;
  participantPosition: string;
  templateType: 'STANDARD_PASS' | 'VIP_GOLD' | 'EXHIBITOR_MEDIA' | 'SPEAKER_PASS';
  printerId: string;
  status: 'PENDING' | 'PRINTED' | 'FAILED';
  printAttempts: number;
  failureReason?: string;
  printedAt?: string;
  createdAt: string;
}

const PRESET_PARTICIPANTS = [
  { id: 'p-1', name: 'Alex Rivera', company: 'Meta Platforms Inc.', position: 'Senior Infrastructure Eng.', points: 15 },
  { id: 'p-2', name: 'Sarah Chen', company: 'Google LLC', position: 'Lead AI Architect', points: 25 },
  { id: 'p-3', name: 'Elena Rostova', company: 'Kaspersky Lab', position: 'Security Analyst', points: 5 },
  { id: 'p-4', name: 'Liam O\'Connor', company: 'Atlassian', position: 'Principal Program Mgr.', points: 10 }
];

const PRINTERS = [
  { id: 'PRINTER_MAIN_01', name: 'Desk 1 - Thermal Zebra ZD620', status: 'ONLINE' },
  { id: 'PRINTER_VIP_LOBBY', name: 'VIP Lobby - Laser Jet Pro', status: 'ONLINE' },
  { id: 'PRINTER_MEDIA_STATION', name: 'Media Gate - Brother TD-4550', status: 'OFFLINE' }
];

export default function BadgePrintingPage() {
  // 1. Badge Print jobs state
  const [jobs, setJobs] = useState<PrintJob[]>([
    {
      id: 'job-1',
      participantId: 'p-1',
      participantName: 'Alex Rivera',
      participantCompany: 'Meta Platforms Inc.',
      participantPosition: 'Senior Infrastructure Eng.',
      templateType: 'STANDARD_PASS',
      printerId: 'PRINTER_MAIN_01',
      status: 'PRINTED',
      printAttempts: 1,
      printedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'job-2',
      participantId: 'p-2',
      participantName: 'Sarah Chen',
      participantCompany: 'Google LLC',
      participantPosition: 'Lead AI Architect',
      templateType: 'VIP_GOLD',
      printerId: 'PRINTER_VIP_LOBBY',
      status: 'PRINTED',
      printAttempts: 1,
      printedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  // 2. Active configuration settings
  const [selectedPid, setSelectedPid] = useState('p-1');
  const [selectedTemplate, setSelectedTemplate] = useState<'STANDARD_PASS' | 'VIP_GOLD' | 'EXHIBITOR_MEDIA' | 'SPEAKER_PASS'>('STANDARD_PASS');
  const [selectedPrinter, setSelectedPrinter] = useState('PRINTER_MAIN_01');

  // 3. Selection pointer for active preview pass
  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');

  // 4. Hardware simulate animation states
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgressMsg, setPrintProgressMsg] = useState('');

  // 5. Global feedback notification toasts
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const activeParticipantDetails = PRESET_PARTICIPANTS.find(p => p.id === selectedPid) || PRESET_PARTICIPANTS[0];

  const handleQueueJob = (e: React.FormEvent) => {
    e.preventDefault();
    const participant = PRESET_PARTICIPANTS.find(p => p.id === selectedPid);
    if (!participant) return;

    const jobId = `job-${Date.now()}`;
    const newJob: PrintJob = {
      id: jobId,
      participantId: participant.id,
      participantName: participant.name,
      participantCompany: participant.company,
      participantPosition: participant.position,
      templateType: selectedTemplate,
      printerId: selectedPrinter,
      status: 'PENDING',
      printAttempts: 0,
      createdAt: new Date().toISOString()
    };

    setJobs(prev => [newJob, ...prev]);
    setSelectedJobId(jobId);
    triggerToast(`📥 Spooled print ticket for ${participant.name} in buffer.`);
  };

  const handleSimulatePrint = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const printer = PRINTERS.find(p => p.id === job.printerId);
    if (printer?.status === 'OFFLINE') {
      setJobs(prev => prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'FAILED',
            printAttempts: j.printAttempts + 1,
            failureReason: 'Physical printer is OFFLINE or disconnected.'
          };
        }
        return j;
      }));
      triggerToast('❌ Error: Selected hardware printer is currently offline.');
      return;
    }

    setIsPrinting(true);
    setPrintProgressMsg('Establishing hardware connection...');

    setTimeout(() => {
      setPrintProgressMsg('Compiling raster vector layout layout matrices...');
      
      setTimeout(() => {
        setPrintProgressMsg('Transmitting bytecode to thermal spooler...');
        
        setTimeout(() => {
          setJobs(prev => prev.map(j => {
            if (j.id === jobId) {
              return {
                ...j,
                status: 'PRINTED',
                printAttempts: j.printAttempts + 1,
                printedAt: new Date().toISOString(),
                failureReason: undefined
              };
            }
            return j;
          }));
          setIsPrinting(false);
          setPrintProgressMsg('');
          triggerToast(`🖨️ Success! Badge printed for ${job.participantName}.`);
        }, 800);
      }, 800);
    }, 700);
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    triggerToast('🗑️ Cleared print job from registry cache.');
  };

  const getTemplateStyle = (type: string) => {
    switch (type) {
      case 'VIP_GOLD':
        return {
          bg: 'bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700',
          badgeText: 'text-amber-950 font-black',
          badgeBg: 'bg-yellow-200 border-yellow-300',
          accentColor: 'text-amber-200',
          title: 'VIP PASS',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]'
        };
      case 'EXHIBITOR_MEDIA':
        return {
          bg: 'bg-gradient-to-br from-teal-800 via-emerald-700 to-emerald-900',
          badgeText: 'text-emerald-950 font-black',
          badgeBg: 'bg-emerald-200 border-emerald-300',
          accentColor: 'text-emerald-200',
          title: 'EXHIBITOR PASS',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]'
        };
      case 'SPEAKER_PASS':
        return {
          bg: 'bg-gradient-to-br from-indigo-900 via-violet-800 to-indigo-950',
          badgeText: 'text-indigo-950 font-black',
          badgeBg: 'bg-indigo-200 border-indigo-300',
          accentColor: 'text-indigo-200',
          title: 'SPEAKER PASS',
          glow: 'shadow-[0_0_15px_rgba(99,102,241,0.25)]'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950',
          badgeText: 'text-slate-950 font-black',
          badgeBg: 'bg-slate-200 border-slate-300',
          accentColor: 'text-slate-400',
          title: 'STANDARD PASS',
          glow: 'shadow-lg'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-950 border-l-4 border-amber-500 text-white py-3 px-5 font-mono text-xs flex items-center gap-2 shadow-lg">
          <CheckSquare className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6 text-slate-800" />
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-slate-900">Thermal Badge Printing Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Sprint 6: Dynamic layout templates, physical hardware printers simulation, and automated batch printing controls.
          </p>
        </div>

        <div className="mt-4 md:mt-0 bg-white border border-slate-200 p-3 flex items-center gap-4 font-mono text-xs shadow-sm">
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Printer Queue status</div>
            <div className="text-indigo-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
              <span>SPOOLING ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Column 1: Configurator Setup Form */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-700" />
              <span>01. Badge Configurator</span>
            </h3>

            <form onSubmit={handleQueueJob} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Select Attendee Profile</label>
                <select
                  value={selectedPid}
                  onChange={(e) => {
                    setSelectedPid(e.target.value);
                    // Dynamically map default templates based on position
                    const target = PRESET_PARTICIPANTS.find(p => p.id === e.target.value);
                    if (target?.name.includes('Sarah')) {
                      setSelectedTemplate('VIP_GOLD');
                    } else if (target?.name.includes('Elena')) {
                      setSelectedTemplate('EXHIBITOR_MEDIA');
                    } else if (target?.name.includes('Liam')) {
                      setSelectedTemplate('SPEAKER_PASS');
                    } else {
                      setSelectedTemplate('STANDARD_PASS');
                    }
                  }}
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
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Pass Template layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'STANDARD_PASS', label: 'Standard Pass' },
                    { id: 'VIP_GOLD', label: 'VIP Pass' },
                    { id: 'EXHIBITOR_MEDIA', label: 'Exhibitor' },
                    { id: 'SPEAKER_PASS', label: 'Speaker' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t.id as any)}
                      className={`p-2.5 text-[10px] text-left border font-bold cursor-pointer ${
                        selectedTemplate === t.id 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-850'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Select Thermal Printer Hardware</label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none cursor-pointer"
                >
                  {PRINTERS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase py-3 tracking-widest cursor-pointer border-0 mt-2 transition-colors"
              >
                SPOOL PRINT TICKET
              </button>
            </form>
          </div>

          {/* Active Printer Hardwares Status panel */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-slate-700" />
              <span>02. Active Local Printers</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {PRINTERS.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold block text-slate-800">{p.name}</span>
                    <span className="text-[9px] text-slate-400">ID: {p.id}</span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase border px-1.5 py-0.5 ${
                    p.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Column 2: Live Badge design compiler and printer visual simulation */}
        <div className="lg:col-span-4">
          
          <div className="sticky top-6 space-y-6">
            
            {/* Real-time Badge Preview design wrapper */}
            {currentJob && (() => {
              const style = getTemplateStyle(currentJob.templateType);
              return (
                <div className={`text-white overflow-hidden rounded-lg font-mono relative transition-all duration-300 ${style.bg} ${style.glow}`}>
                  
                  {/* Decorative pass cutout dots */}
                  <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 rounded-full z-10 border-r border-slate-200"></div>
                  <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 rounded-full z-10 border-l border-slate-200"></div>

                  <div className="bg-slate-950/40 p-4 border-b border-white/10 flex justify-between items-center text-xs">
                    <span className="text-white/60 text-[9px] font-bold tracking-widest uppercase">EVENTHUB LANYARD PASS</span>
                    <span className="text-white/80 text-[10px] font-black tracking-widest">JULY 2026</span>
                  </div>

                  <div className="p-8 text-center space-y-6">
                    
                    {/* Badge Template classification banner */}
                    <div className="mx-auto flex justify-center">
                      <span className={`px-4 py-1.5 border text-xs font-black tracking-widest uppercase rounded-full ${style.badgeBg} ${style.badgeText}`}>
                        {style.title}
                      </span>
                    </div>

                    {/* Participant demographic */}
                    <div className="space-y-1">
                      <h2 className="text-xl font-black uppercase text-white tracking-tight">{currentJob.participantName}</h2>
                      <p className="text-xs text-white/80 font-bold">{currentJob.participantPosition}</p>
                      <p className={`text-[10px] font-bold ${style.accentColor}`}>{currentJob.participantCompany}</p>
                    </div>

                    {/* Embedded barcode verification token representation */}
                    <div className="bg-white p-3 border border-white/10 flex flex-col items-center justify-center rounded max-w-[200px] mx-auto opacity-95">
                      <div className="flex gap-1 h-12 items-end">
                        {[1, 2, 4, 1, 3, 2, 1, 3, 1, 4, 1, 2, 1, 3, 1].map((w, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-900 h-full" 
                            style={{ width: `${w * 1.5}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[8px] text-slate-500 font-bold tracking-widest mt-1.5">PASS-ID-{currentJob.id.toUpperCase().substring(0, 8)}</span>
                    </div>

                    {/* Operational diagnostic status */}
                    <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2 text-left text-[9px] text-white/50">
                      <div>
                        <span className="block text-[7px] uppercase tracking-wider text-white/45">Printer Dispatch</span>
                        <span className="text-white font-bold">{currentJob.printerId}</span>
                      </div>
                      <div>
                        <span className="block text-[7px] uppercase tracking-wider text-white/45">Registry Status</span>
                        <span className={`font-bold uppercase ${currentJob.status === 'PRINTED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {currentJob.status}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Simulated interactive printer controls */}
            {currentJob && (
              <div className="bg-white border border-slate-200 p-6 shadow-sm font-mono text-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                  <span className="font-bold text-slate-800 uppercase">Print Control Terminal</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 uppercase ${
                    currentJob.status === 'PRINTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Job: {currentJob.status}
                  </span>
                </div>

                {isPrinting ? (
                  <div className="space-y-3 bg-slate-900 text-white p-4 border border-slate-850">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-400">
                      <span>HARDWARE FEEDBACK LOG</span>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <p className="text-[11px] font-bold tracking-tight animate-pulse">{printProgressMsg}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimulatePrint(currentJob.id)}
                      className="bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 uppercase flex items-center justify-center gap-1.5 cursor-pointer border-0 transition-colors"
                    >
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Simulate Print</span>
                    </button>
                    <button
                      onClick={() => triggerToast('📥 Exporting high fidelity raster PDF print layout.')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 uppercase flex items-center justify-center gap-1.5 cursor-pointer border border-slate-250 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Column 3: Spooled Registry Queue listing */}
        <div className="lg:col-span-4">
          
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>03. Buffer Spooler Queue ({jobs.length})</span>
            </h3>

            {jobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-[10px]">
                No print jobs queued in registry cache.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 font-mono text-xs">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`p-3 border cursor-pointer transition-colors ${
                      selectedJobId === job.id 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold block truncate max-w-[150px]">{job.participantName}</span>
                        <span className="text-[9px] text-slate-400 block">{job.participantCompany}</span>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 uppercase border font-bold ${
                        job.status === 'PRINTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        job.status === 'FAILED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    {job.failureReason && (
                      <div className="text-[9px] text-rose-600 font-semibold mt-1">
                        Err: {job.failureReason}
                      </div>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex justify-between items-center text-[9px] text-slate-400">
                      <span>Printer: {job.printerId.replace('PRINTER_', '')}</span>
                      <div className="flex items-center gap-2">
                        <span>Attempts: {job.printAttempts}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.id);
                          }}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
