import React, { useState } from 'react';
import { 
  UserPlus, Mail, Phone, Calendar, MapPin, Search, 
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Shield, 
  ListFilter, Eye, Trash2, ArrowRight, Award, Plus, Check, X, Ticket
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  rsvpStatus: 'YES' | 'NO' | 'PENDING';
  checkedIn: boolean;
  points: number;
  tableNumber: string;
  seatNumber: string;
  createdAt: string;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
];

export default function RegistrationSprintPage() {
  // 1. Core State
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'p-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@meta.com',
      phone: '+1 555-0192',
      company: 'Meta Platforms Inc.',
      position: 'VP Engineering',
      rsvpStatus: 'YES',
      checkedIn: false,
      points: 25,
      tableNumber: 'Table 1',
      seatNumber: 'Seat A-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@google.com',
      phone: '+1 555-0144',
      company: 'Google LLC',
      position: 'Principal PM',
      rsvpStatus: 'PENDING',
      checkedIn: false,
      points: 0,
      tableNumber: 'Unassigned',
      seatNumber: 'Unassigned',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-3',
      name: 'Elena Rostova',
      email: 'elena.rostova@kaspersky.com',
      phone: '+7 901-1234',
      company: 'Kaspersky Lab',
      position: 'Senior Security Analyst',
      rsvpStatus: 'YES',
      checkedIn: true,
      points: 15,
      tableNumber: 'Table 3',
      seatNumber: 'Seat B-1',
      createdAt: new Date().toISOString()
    }
  ]);

  // 2. Active Selection (for the digital pass view)
  const [selectedId, setSelectedId] = useState<string>('p-1');

  // 3. Form Input State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formRsvp, setFormRsvp] = useState<'YES' | 'NO'>('YES');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);

  // 4. Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'ALL' | 'YES' | 'NO' | 'PENDING'>('ALL');

  // 5. Toast alerts
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      triggerToast('⚠️ Please enter Name and Email Address.');
      return;
    }

    const emailNormalized = formEmail.toLowerCase().trim();
    if (participants.some(p => p.email.toLowerCase() === emailNormalized)) {
      triggerToast('⚠️ Email is already registered.');
      return;
    }

    let tableNumber = 'Unassigned';
    let seatNumber = 'Unassigned';
    if (formRsvp === 'YES') {
      tableNumber = `Table ${Math.floor(Math.random() * 8) + 1}`;
      seatNumber = `Seat ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}-${Math.floor(Math.random() * 8) + 1}`;
    }

    const newParticipant: Participant = {
      id: `p-${Date.now()}`,
      name: formName.trim(),
      email: emailNormalized,
      phone: formPhone.trim() || '+1 555-0100',
      company: formCompany.trim() || 'Individual',
      position: formPosition.trim() || 'Attendee',
      rsvpStatus: formRsvp,
      checkedIn: false,
      points: formRsvp === 'YES' ? 5 : 0,
      tableNumber,
      seatNumber,
      createdAt: new Date().toISOString()
    };

    setParticipants(prev => [...prev, newParticipant]);
    setSelectedId(newParticipant.id);

    // reset fields
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormPosition('');
    triggerToast(`🎉 Registration profile created for "${newParticipant.name}"!`);
  };

  const toggleRSVP = (id: string, status: 'YES' | 'NO' | 'PENDING') => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        let tableNumber = p.tableNumber;
        let seatNumber = p.seatNumber;
        let points = p.points;

        if (status === 'YES') {
          tableNumber = `Table ${Math.floor(Math.random() * 8) + 1}`;
          seatNumber = `Seat ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}-${Math.floor(Math.random() * 8) + 1}`;
          if (points === 0) points = 5;
        } else {
          tableNumber = 'Unassigned';
          seatNumber = 'Unassigned';
        }

        return { ...p, rsvpStatus: status, tableNumber, seatNumber, points };
      }
      return p;
    }));
    triggerToast('🔄 RSVP status modified successfully.');
  };

  const handleDelete = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) {
      setSelectedId('');
    }
    triggerToast('🗑️ Participant record deleted.');
  };

  // Calculations
  const totalCount = participants.length;
  const yesCount = participants.filter(p => p.rsvpStatus === 'YES').length;
  const pendingCount = participants.filter(p => p.rsvpStatus === 'PENDING').length;
  const noCount = participants.filter(p => p.rsvpStatus === 'NO').length;

  const currentPass = participants.find(p => p.id === selectedId) || participants[0];

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = rsvpFilter === 'ALL' || p.rsvpStatus === rsvpFilter;
    return matchesSearch && matchesFilter;
  });

  const generatePassQR = (text: string) => {
    return (
      <svg className="w-36 h-36 mx-auto" viewBox="0 0 100 100" shapeRendering="crispEdges">
        <rect width="100" height="100" fill="white" />
        <path d="M 5,5 h 25 v 25 h -25 z M 10,10 h 15 v 15 h -15 z" fill="#0f172a" />
        <path d="M 65,5 h 25 v 25 h -25 z M 70,10 h 15 v 15 h -15 z" fill="#0f172a" />
        <path d="M 5,65 h 25 v 25 h -25 z M 10,70 h 15 v 15 h -15 z" fill="#0f172a" />
        <path d="M 35,10 h 10 v 10 h -10 z M 50,5 h 10 v 10 h -10 z M 35,25 h 15 v 5 h -15 z" fill="#020617" />
        <path d="M 10,35 h 10 v 15 h -10 z M 25,45 h 15 v 5 h -15 z M 5,55 h 20 v 5 h -20 z" fill="#1e293b" />
        <path d="M 65,35 h 10 v 20 h -10 z M 80,45 h 15 v 10 h -15 z M 75,55 h 15 v 5 h -15 z" fill="#1e293b" />
        <rect x="42" y="42" width="16" height="16" rx="2" fill="#0f172a" />
        <text x="50" y="52" fill="#00FF00" fontSize="8" fontWeight="bold" textAnchor="middle">REG</text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border-l-4 border-emerald-500 text-white py-3 px-5 font-mono text-xs flex items-center gap-2 shadow-lg rounded-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-slate-800" />
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-slate-900">Participant Registration Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Sprint 3: High-efficiency registration, dynamic table seating, and instantaneous RSVP tracking.
          </p>
        </div>

        <div className="mt-4 md:mt-0 bg-white border border-slate-200 p-3 flex items-center gap-4 font-mono text-xs">
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Workspace Mode</div>
            <div className="text-slate-800 font-bold">SPRINT 3 ACTIVE</div>
          </div>
          <div className="border-l border-slate-100 pl-4">
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status</div>
            <div className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              <span>ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Registered</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Active Guest Roster</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Confirmed (YES)</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{yesCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">{totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0}% of Total</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Declined (NO)</span>
          <span className="text-2xl font-black text-slate-500 mt-1 block">{noCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Unavailable Seats</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Awaiting (PENDING)</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Pending Responses</span>
        </div>
      </div>

      {/* Main Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: RSVP Form & Digital Badge Pass */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Registration Form */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-slate-700" />
              <span>01. Direct Registration Form</span>
            </h3>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Liam O'Connor"
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. liam@atlassian.com"
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +1 555-0100"
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Company Affiliation</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Atlassian"
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="e.g. Engineering Lead"
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-2.5 w-full rounded-none focus:border-slate-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">RSVP Target Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormRsvp('YES')}
                      className={`py-2 text-center font-bold uppercase cursor-pointer border ${
                        formRsvp === 'YES' 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      Attending
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormRsvp('NO')}
                      className={`py-2 text-center font-bold uppercase cursor-pointer border ${
                        formRsvp === 'NO' 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase py-3 tracking-widest cursor-pointer border-0 mt-2 transition-colors"
              >
                PROVISION REGISTRATION
              </button>
            </form>
          </div>

          {/* Digital Pass Preview Card */}
          {currentPass && (
            <div className="bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden relative">
              
              {/* Card top banner style */}
              <div className="bg-[#111] p-4 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
                <div className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">Dynamic Attendee Pass</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded-none uppercase font-bold">
                  {currentPass.rsvpStatus === 'YES' ? 'Confirmed' : 'Decline'}
                </span>
              </div>

              {/* Card main contents */}
              <div className="p-6 space-y-6 font-mono">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-slate-800 border border-slate-700 overflow-hidden rounded-none shrink-0">
                    <img 
                      src={PRESET_AVATARS[0]} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase text-white tracking-tight">{currentPass.name}</h4>
                    <p className="text-xs text-slate-400">{currentPass.position}</p>
                    <p className="text-xs text-emerald-400 mt-1 font-bold">{currentPass.company}</p>
                  </div>
                </div>

                {/* Seating Grid Details */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Table Number</span>
                    <span className="text-white font-bold">{currentPass.tableNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Seat Assignment</span>
                    <span className="text-white font-bold">{currentPass.seatNumber}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[9px] text-slate-500 block uppercase">Participant ID</span>
                    <span className="text-slate-300 font-bold text-[10px] truncate block">{currentPass.id}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[9px] text-slate-500 block uppercase">Reward Points</span>
                    <span className="text-emerald-400 font-bold">{currentPass.points} PTS</span>
                  </div>
                </div>

                {/* QR Generation Area */}
                {currentPass.rsvpStatus === 'YES' && (
                  <div className="bg-white p-3.5 max-w-[160px] mx-auto border border-slate-800">
                    {generatePassQR(currentPass.id)}
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 text-center italic">
                  Digital Event Pass issued on behalf of the Event Coordination network.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right column: Interactive Directory roster list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3 flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-slate-700" />
              <span>02. Live Participant Directory ({filteredParticipants.length})</span>
            </h3>

            {/* Directory control bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5 font-mono text-xs">
              <div className="md:col-span-7 relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 py-2 pl-9 pr-4 w-full rounded-none focus:border-slate-500 outline-none"
                />
              </div>

              <div className="md:col-span-5 flex border border-slate-300 p-0.5 bg-slate-50">
                {(['ALL', 'YES', 'NO', 'PENDING'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRsvpFilter(tab)}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase cursor-pointer transition-colors ${
                      rsvpFilter === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Main scrollable list of registered participants */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 font-mono text-xs">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">
                  No registered participants found in this selection.
                </div>
              ) : (
                filteredParticipants.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedId(p.id)}
                    className={`p-3.5 border transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      selectedId === p.id 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{p.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase ${
                          p.rsvpStatus === 'YES' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          p.rsvpStatus === 'NO' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {p.rsvpStatus}
                        </span>
                        {p.checkedIn && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                            Checked In
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                        <span className={`${selectedId === p.id ? 'text-slate-300' : 'text-slate-600'}`}>{p.email}</span>
                        <span className="text-slate-300">|</span>
                        <span className={`${selectedId === p.id ? 'text-slate-300' : 'text-slate-600'}`}>{p.company}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-emerald-500">{p.tableNumber}</span>
                      </div>
                    </div>

                    {/* Quick status change toggles & Action controls */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleRSVP(p.id, 'YES')}
                        title="Change RSVP to Attending"
                        className={`w-7 h-7 flex items-center justify-center border cursor-pointer ${
                          p.rsvpStatus === 'YES' 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-emerald-600'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleRSVP(p.id, 'PENDING')}
                        title="Change RSVP to Pending"
                        className={`w-7 h-7 flex items-center justify-center border cursor-pointer ${
                          p.rsvpStatus === 'PENDING' 
                            ? 'bg-amber-500 text-white border-amber-400' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-amber-500'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleRSVP(p.id, 'NO')}
                        title="Change RSVP to Decline"
                        className={`w-7 h-7 flex items-center justify-center border cursor-pointer ${
                          p.rsvpStatus === 'NO' 
                            ? 'bg-rose-500 text-white border-rose-400' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-rose-500'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <div className="h-6 w-px bg-slate-300 mx-1"></div>

                      <button
                        onClick={() => handleDelete(p.id)}
                        title="Delete Participant"
                        className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
