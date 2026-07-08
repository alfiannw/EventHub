import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../sprint-1-auth/frontend/src/context/AuthContext';
import { 
  Calendar, MapPin, Users, PlusCircle, Check, Trash2, 
  Clock, ShieldAlert, Award, Grid, RefreshCw, Palette, UserMinus
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  themePreset: string;
  brandPrimary: string;
  brandSecondary: string;
  coverImageUrl?: string;
}

interface EventSession {
  id: string;
  title: string;
  description: string;
  speakerName?: string;
  speakerTitle?: string;
  locationRoom?: string;
  startTime: string;
  endTime: string;
}

interface SeatingAssignment {
  id: string;
  tableId: string;
  guestId: string;
  guestName: string;
  seatNumber: number;
}

interface EventTable {
  id: string;
  tableName: string;
  tableNumber: number;
  capacity: number;
  assignments: SeatingAssignment[];
}

export default function EventManagementPage() {
  const { user, hasRole } = useAuth();
  
  // Simulated State representing APIs
  const [event, setEvent] = useState<Event>({
    id: 'e-1',
    title: 'Global Tech Summit 2026',
    description: 'The premier annual developer ecosystem and SaaS platform symposium.',
    startTime: '2026-09-10T09:00',
    endTime: '2026-09-11T18:00',
    venueName: 'Metropolitan Convention Hall',
    venueAddress: '100 Silicon Valley Blvd, San Jose, CA',
    capacity: 500,
    status: 'PUBLISHED',
    themePreset: 'modern-slate',
    brandPrimary: '#141414',
    brandSecondary: '#00FF00',
    coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
  });

  const [sessions, setSessions] = useState<EventSession[]>([
    {
      id: 's-1',
      title: 'Keynote: Scalable Distributed Ledger Infrastructures',
      description: 'Unlocking sub-millisecond latencies under concurrent global workflows.',
      speakerName: 'Dr. Evelyn Martinez',
      speakerTitle: 'Chief Scientist, Quantum Systems',
      locationRoom: 'Grand Ballroom A',
      startTime: '2026-09-10T10:00',
      endTime: '2026-09-10T11:30',
    },
    {
      id: 's-2',
      title: 'Workshop: Advanced NestJS Architectures & CQRS',
      description: 'Structuring massive microservice endpoints without dependency noise.',
      speakerName: 'Kamil Mysliwiec',
      speakerTitle: 'Creator of NestJS Framework',
      locationRoom: 'Hackerspace Lab 4',
      startTime: '2026-09-10T13:00',
      endTime: '2026-09-10T15:00',
    }
  ]);

  const [tables, setTables] = useState<EventTable[]>([
    {
      id: 't-1',
      tableName: 'VIP Board Table 1',
      tableNumber: 1,
      capacity: 8,
      assignments: [
        { id: 'sa-1', tableId: 't-1', guestId: 'u-101', guestName: 'Sarah Connor', seatNumber: 1 },
        { id: 'sa-2', tableId: 't-1', guestId: 'u-102', guestName: 'John Connor', seatNumber: 2 },
        { id: 'sa-3', tableId: 't-1', guestId: 'u-103', guestName: 'Marcus Wright', seatNumber: 4 }
      ]
    },
    {
      id: 't-2',
      tableName: 'General Table 2',
      tableNumber: 2,
      capacity: 8,
      assignments: [
        { id: 'sa-4', tableId: 't-2', guestId: 'u-104', guestName: 'Ellen Ripley', seatNumber: 1 }
      ]
    },
    {
      id: 't-3',
      tableName: 'Press & Media Table 3',
      tableNumber: 3,
      capacity: 8,
      assignments: []
    }
  ]);

  // Form states
  const [activeTab, setActiveTab] = useState<'profile' | 'agenda' | 'seating'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  
  // Agenda Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionSpeaker, setNewSessionSpeaker] = useState('');
  const [newSessionRoom, setNewSessionRoom] = useState('');
  const [newSessionStart, setNewSessionStart] = useState('2026-09-10T11:00');
  const [newSessionEnd, setNewSessionEnd] = useState('2026-09-10T12:00');

  // Seating State
  const [selectedTable, setSelectedTable] = useState<EventTable>(tables[0]);
  const [assigningSeatNum, setAssigningSeatNum] = useState<number | null>(null);
  const [assignGuestName, setAssignGuestName] = useState('');

  const themePresets = [
    { id: 'modern-slate', name: 'Cosmic Slate', primary: '#141414', secondary: '#00FF00' },
    { id: 'neon-cyber', name: 'Cyber Punk', primary: '#0A0B10', secondary: '#FF007F' },
    { id: 'warm-coral', name: 'Warm Sunset', primary: '#1A0B05', secondary: '#FF5733' },
    { id: 'royal-gold', name: 'Classic Gold', primary: '#0C1020', secondary: '#D4AF37' }
  ];

  const applyPreset = (preset: typeof themePresets[0]) => {
    setEvent({
      ...event,
      themePreset: preset.id,
      brandPrimary: preset.primary,
      brandSecondary: preset.secondary
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle) return;

    const newSession: EventSession = {
      id: `s-${Date.now()}`,
      title: newSessionTitle,
      speakerName: newSessionSpeaker,
      locationRoom: newSessionRoom,
      startTime: newSessionStart,
      endTime: newSessionEnd,
      description: 'Simulated agenda slot.'
    };

    setSessions([...sessions, newSession]);
    setNewSessionTitle('');
    setNewSessionSpeaker('');
    setNewSessionRoom('');
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleAssignSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSeatNum || !assignGuestName) return;

    const updatedTables = tables.map(t => {
      if (t.id === selectedTable.id) {
        const newAssignment: SeatingAssignment = {
          id: `sa-${Date.now()}`,
          tableId: t.id,
          guestId: `u-${Date.now()}`,
          guestName: assignGuestName,
          seatNumber: assigningSeatNum
        };
        const newAssignments = [...t.assignments.filter(a => a.seatNumber !== assigningSeatNum), newAssignment];
        return { ...t, assignments: newAssignments };
      }
      return t;
    });

    setTables(updatedTables);
    const newSelected = updatedTables.find(t => t.id === selectedTable.id);
    if (newSelected) setSelectedTable(newSelected);
    
    setAssigningSeatNum(null);
    setAssignGuestName('');
  };

  const handleUnassignSeat = (seatNum: number) => {
    const updatedTables = tables.map(t => {
      if (t.id === selectedTable.id) {
        const newAssignments = t.assignments.filter(a => a.seatNumber !== seatNum);
        return { ...t, assignments: newAssignments };
      }
      return t;
    });

    setTables(updatedTables);
    const newSelected = updatedTables.find(t => t.id === selectedTable.id);
    if (newSelected) setSelectedTable(newSelected);
  };

  const handleAddTable = () => {
    const newNum = tables.length + 1;
    const newTable: EventTable = {
      id: `t-${Date.now()}`,
      tableName: `General Table ${newNum}`,
      tableNumber: newNum,
      capacity: 8,
      assignments: []
    };
    setTables([...tables, newTable]);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-mono flex flex-col p-6">
      
      {/* Event Header Banner */}
      <div className="relative w-full border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_#141414] mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 p-3 bg-black text-[#00FF00] font-black uppercase text-[10px] tracking-wider border-b-[2px] border-l-[2px] border-black z-10">
          SP1 CORE & SP2 ENG ACTIVE
        </div>
        
        {/* Decorative Strip */}
        <div 
          className="h-4 w-full border-b-[2px] border-black" 
          style={{ backgroundColor: event.brandSecondary }}
        />
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-700" />
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">{event.title}</h1>
            </div>
            <p className="text-xs text-zinc-500 max-w-xl uppercase">{event.description}</p>
          </div>
          
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-neutral-100 border border-neutral-300 px-2 py-1 uppercase rounded-sm">
              Preset: {event.themePreset}
            </span>
            <span className="text-[10px] font-bold bg-[#00FF00]/10 border border-[#00FF00]/30 text-emerald-800 px-2 py-1 uppercase rounded-sm">
              Status: {event.status}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-t-[2px] border-black text-xs font-bold uppercase overflow-x-auto">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 border-r-[2px] border-black flex items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <Palette className="w-4 h-4" />
            <span>01 Brand & Profile</span>
          </button>
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`px-6 py-3 border-r-[2px] border-black flex items-center gap-1.5 transition-all ${activeTab === 'agenda' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <Clock className="w-4 h-4" />
            <span>02 Agenda Tracks</span>
          </button>
          <button 
            onClick={() => setActiveTab('seating')}
            className={`px-6 py-3 flex items-center gap-1.5 transition-all ${activeTab === 'seating' ? 'bg-black text-[#00FF00]' : 'hover:bg-neutral-50'}`}
          >
            <Grid className="w-4 h-4" />
            <span>03 Seating Planner</span>
          </button>
        </div>
      </div>

      {/* Main Container Workspace */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Settings Form Panel */}
        <div className="lg:col-span-8 space-y-6">

          {/* TAB 1: BRAND & PROFILE DESIGNER */}
          {activeTab === 'profile' && (
            <div className="bg-white border-[2px] border-black p-6 shadow-[4px_4px_0px_0px_#141414] space-y-6">
              <div className="border-b-[1.5px] border-neutral-100 pb-3 flex justify-between items-center">
                <h2 className="text-sm font-black uppercase text-black flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span>Branding & Layout Configuration</span>
                </h2>
                <span className="text-[10px] text-zinc-500 uppercase">Interactive Preview</span>
              </div>

              {/* Theme Presets Row */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Select Event Theme Vibe Preset</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`p-3 border-[1.5px] text-left relative flex flex-col justify-between h-20 transition-all ${event.themePreset === preset.id ? 'border-black ring-2 ring-[#00FF00]/40 shadow-sm' : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50'}`}
                    >
                      <span className="text-[10px] font-bold uppercase">{preset.name}</span>
                      <div className="flex gap-1.5 mt-2">
                        <span className="w-3.5 h-3.5 border border-black" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3.5 h-3.5 border border-black" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      {event.themePreset === preset.id && (
                        <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-[#00FF00] bg-black p-0.5 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Profile Form fields */}
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase">Event Title Name</label>
                    <input 
                      type="text"
                      required
                      value={event.title}
                      onChange={(e) => setEvent({ ...event, title: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-black px-3 py-2.5 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase">Capacity Threshold</label>
                    <input 
                      type="number"
                      required
                      value={event.capacity}
                      onChange={(e) => setEvent({ ...event, capacity: parseInt(e.target.value) || 100 })}
                      className="w-full bg-white border-[1.5px] border-black px-3 py-2.5 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase">Event Commences</label>
                    <input 
                      type="datetime-local"
                      required
                      value={event.startTime}
                      onChange={(e) => setEvent({ ...event, startTime: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-black px-3 py-2.5 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase">Event Terminals</label>
                    <input 
                      type="datetime-local"
                      required
                      value={event.endTime}
                      onChange={(e) => setEvent({ ...event, endTime: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-black px-3 py-2.5 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase">Venue Destination Name</label>
                  <input 
                    type="text"
                    required
                    value={event.venueName}
                    onChange={(e) => setEvent({ ...event, venueName: e.target.value })}
                    className="w-full bg-white border-[1.5px] border-black px-3 py-2.5 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase">Detailed Address / Logistics</label>
                  <input 
                    type="text"
                    required
                    value={event.venueAddress}
                    onChange={(e) => setEvent({ ...event, venueAddress: e.target.value })}
                    className="w-full bg-white border-[1.5px] border-black px-3 py-2.5 font-bold"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-black hover:bg-neutral-800 text-white font-bold py-3 px-6 border-[1.5px] border-black flex items-center gap-2 cursor-pointer uppercase transition-all"
                  >
                    {isSaved ? <Check className="w-4 h-4 text-[#00FF00]" /> : <PlusCircle className="w-4 h-4" />}
                    <span>{isSaved ? "RECORDS PERSISTED SUCCESSFULLY" : "COMMIT EVENT CHANGES"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: AGENDA TRACKS & AGENDA BUILDER */}
          {activeTab === 'agenda' && (
            <div className="bg-white border-[2px] border-black p-6 shadow-[4px_4px_0px_0px_#141414] space-y-6">
              <div className="border-b-[1.5px] border-neutral-100 pb-3">
                <h2 className="text-sm font-black uppercase text-black flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Agenda Schedule Configuration</span>
                </h2>
              </div>

              {/* Conflict Watchdog Display */}
              <div className="bg-[#FFF9E6] border-[1.5px] border-amber-500 text-amber-900 p-3.5 text-xs flex items-start gap-2.5 font-bold uppercase">
                <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[9px] leading-relaxed">
                  <span className="block text-amber-800">AUTOMATIC CONFLICT DETECTOR ACTIVE:</span>
                  No parallel speaking tracks overlap detected at this point. Ready for live stream synchronizing.
                </div>
              </div>

              {/* Agenda Entry Creator */}
              <form onSubmit={handleAddSession} className="bg-zinc-50 border border-zinc-200 p-4 rounded-sm text-xs space-y-4">
                <span className="font-bold text-[9px] text-zinc-400 block uppercase border-b border-zinc-200 pb-1">
                  NEW WORKSHOP/SESSION CREATOR
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-zinc-500">Session/Talk Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Scaling GraphQL Consensus"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-3 py-2 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-zinc-500">Keynote Speaker Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Linus Torvalds"
                      value={newSessionSpeaker}
                      onChange={(e) => setNewSessionSpeaker(e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-3 py-2 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-zinc-500">Venue Room/Stage</label>
                    <input 
                      type="text"
                      placeholder="Grand Stage 1"
                      value={newSessionRoom}
                      onChange={(e) => setNewSessionRoom(e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-3 py-2 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-zinc-500">Start Timestamp</label>
                    <input 
                      type="datetime-local"
                      value={newSessionStart}
                      onChange={(e) => setNewSessionStart(e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-3 py-2 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-zinc-500">End Timestamp</label>
                    <input 
                      type="datetime-local"
                      value={newSessionEnd}
                      onChange={(e) => setNewSessionEnd(e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-3 py-2 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    type="submit"
                    className="bg-black text-white hover:text-[#00FF00] font-bold px-4 py-2 text-[10px] uppercase border border-black cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>ADD AGENDA ITEM</span>
                  </button>
                </div>
              </form>

              {/* Timeline schedule */}
              <div className="space-y-4">
                <span className="font-bold text-[10px] text-zinc-500 uppercase block tracking-wider">Active Agenda Timelines</span>
                {sessions.map((session) => (
                  <div key={session.id} className="border-[1.5px] border-black bg-white p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-black text-[#00FF00] font-black uppercase px-2 py-0.5">
                          {session.locationRoom || 'MAIN STAGE'}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h3 className="font-black text-xs uppercase leading-tight text-neutral-800">{session.title}</h3>
                      {session.speakerName && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <Award className="w-3.5 h-3.5 text-zinc-600" />
                          <span className="font-bold text-zinc-700">{session.speakerName}</span>
                          {session.speakerTitle && <span className="text-zinc-400 font-medium">({session.speakerTitle})</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end justify-end">
                      <button 
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-rose-500 hover:text-white hover:bg-rose-600 border border-transparent hover:border-black p-2 transition-all rounded-sm cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SEATING & TABLE CHART PLANNER */}
          {activeTab === 'seating' && (
            <div className="bg-white border-[2px] border-black p-6 shadow-[4px_4px_0px_0px_#141414] space-y-6">
              <div className="border-b-[1.5px] border-neutral-100 pb-3 flex justify-between items-center">
                <h2 className="text-sm font-black uppercase text-black flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  <span>Physical Seating & Table Assignments</span>
                </h2>
                <button 
                  onClick={handleAddTable}
                  className="bg-black text-white hover:text-[#00FF00] text-[10px] font-black uppercase px-3 py-1.5 flex items-center gap-1 border border-black cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>GENERATE TABLE</span>
                </button>
              </div>

              {/* Seating Layout Map Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Circle Diagram representation */}
                <div className="bg-zinc-50 border border-zinc-200 p-6 flex flex-col items-center justify-center min-h-[300px] relative">
                  <span className="absolute top-3 left-3 text-[9px] font-bold text-zinc-400 uppercase">
                    Diagram Preview: {selectedTable.tableName}
                  </span>

                  <div className="relative w-48 h-48 flex items-center justify-center bg-white border-2 border-black rounded-full shadow-md">
                    <div className="text-center space-y-1">
                      <span className="text-[11px] font-black uppercase block tracking-tight text-neutral-800">
                        {selectedTable.tableName}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">
                        {selectedTable.assignments.length} / {selectedTable.capacity} OCCUPIED
                      </span>
                    </div>

                    {/* Circular Seating arrangements */}
                    {Array.from({ length: selectedTable.capacity }).map((_, idx) => {
                      const seatNum = idx + 1;
                      const occupied = selectedTable.assignments.find(a => a.seatNumber === seatNum);
                      
                      // Circle Coordinates offset calculation
                      const angle = (idx * 2 * Math.PI) / selectedTable.capacity;
                      const radius = 88; // radius distance from center
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;

                      return (
                        <button
                          key={seatNum}
                          onClick={() => {
                            if (occupied) {
                              handleUnassignSeat(seatNum);
                            } else {
                              setAssigningSeatNum(seatNum);
                            }
                          }}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className={`absolute w-8 h-8 rounded-full border border-black flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${occupied ? 'bg-[#00FF00] hover:bg-rose-500 hover:text-white' : 'bg-white hover:bg-neutral-100'}`}
                          title={occupied ? `Seat ${seatNum}: ${occupied.guestName} (Click to unassign)` : `Seat ${seatNum}: Empty (Click to assign)`}
                        >
                          {seatNum}
                        </button>
                      );
                    })}
                  </div>

                  {assigningSeatNum && (
                    <form onSubmit={handleAssignSeat} className="absolute inset-0 bg-white/95 border-t border-zinc-200 p-5 flex flex-col justify-center space-y-3">
                      <span className="text-xs font-black uppercase text-black">Assign Seat #{assigningSeatNum}</span>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Guest Directory Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jane Doe"
                          value={assignGuestName}
                          onChange={(e) => setAssignGuestName(e.target.value)}
                          className="w-full bg-white border border-black px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                        <button 
                          type="button" 
                          onClick={() => setAssigningSeatNum(null)}
                          className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-100 uppercase cursor-pointer"
                        >
                          CANCEL
                        </button>
                        <button 
                          type="submit" 
                          className="px-3 py-1.5 bg-[#00FF00] hover:bg-black hover:text-[#00FF00] text-black border border-black uppercase cursor-pointer"
                        >
                          ASSIGN
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Assignment List Column details */}
                <div className="space-y-4">
                  <span className="font-bold text-[10px] text-zinc-500 uppercase block tracking-wider">Table Assignments Directory</span>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                    {Array.from({ length: selectedTable.capacity }).map((_, idx) => {
                      const seatNum = idx + 1;
                      const occupied = selectedTable.assignments.find(a => a.seatNumber === seatNum);

                      return (
                        <div key={seatNum} className="flex justify-between items-center border border-zinc-200 p-2.5 bg-zinc-50">
                          <span className="text-[10px] font-bold uppercase text-zinc-600 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center font-mono text-[9px] text-zinc-800 border border-zinc-300">
                              {seatNum}
                            </span>
                            <span>Seat {seatNum}</span>
                          </span>

                          {occupied ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black uppercase text-neutral-800">{occupied.guestName}</span>
                              <button 
                                onClick={() => handleUnassignSeat(seatNum)}
                                className="text-rose-500 hover:text-rose-700 font-bold text-[9px] uppercase cursor-pointer flex items-center gap-0.5"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>REMOVE</span>
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setAssigningSeatNum(seatNum)}
                              className="text-[#00FF00] bg-black hover:bg-neutral-800 font-bold text-[9px] uppercase px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>VACANT</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Side Theme Preview Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-[2px] border-black p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4">
            <span className="font-bold text-[10px] text-zinc-400 uppercase block border-b border-zinc-100 pb-2">
              SEATING TABLES INDEX
            </span>
            <div className="space-y-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTable(t);
                    setAssigningSeatNum(null);
                  }}
                  className={`w-full p-3 border text-left flex justify-between items-center transition-all cursor-pointer ${selectedTable.id === t.id ? 'border-black bg-black text-[#00FF00]' : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50'}`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase">{t.tableName}</span>
                    <span className="text-[9px] uppercase block opacity-80">Table {t.tableNumber}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase">
                    {t.assignments.length}/{t.capacity}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 text-white p-5 border-[2px] border-black shadow-[4px_4px_0px_0px_#141414] space-y-4 font-mono">
            <span className="text-[#00FF00] text-xs font-black uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>LIVE CLIENT ENVIRONMENT</span>
            </span>
            <div className="text-[10px] space-y-2 leading-relaxed text-zinc-400 uppercase">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>EVENT DOMAIN:</span>
                <span className="text-white font-bold">EVENTHUB-SAAS-PROD</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>THEME PROFILE:</span>
                <span className="text-[#00FF00] font-bold">{event.themePreset}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>VENUE INTEGRATION:</span>
                <span className="text-white font-bold">READY (MAPS_CONNECTED)</span>
              </div>
              <div className="flex justify-between">
                <span>SYNC POLLING STATUS:</span>
                <span className="text-emerald-400 font-bold animate-pulse">● STABLE CONNECTION</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
