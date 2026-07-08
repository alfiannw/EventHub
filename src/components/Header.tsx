import React from 'react';
import { Shield, Sparkles, UserCheck, Users, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { EventConfig, Participant } from '../types';

interface HeaderProps {
  eventConfig: EventConfig | null;
  activeRole: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT';
  setActiveRole: (role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT') => void;
  participants: Participant[];
  selectedParticipantId: string;
  setSelectedParticipantId: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({
  eventConfig,
  activeRole,
  setActiveRole,
  participants,
  selectedParticipantId,
  setSelectedParticipantId,
  onRefresh,
  isRefreshing
}: HeaderProps) {
  
  const currentParticipant = participants.find(p => p.id === selectedParticipantId);

  return (
    <header className="bg-[#D8D7D4] border-b-[1.5px] border-[#141414] sticky top-0 z-50 shadow-none" id="app-header">
      {/* Role Selector Top Bar */}
      <div className="bg-[#141414] text-[#E4E3E0] text-xs px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 border-b border-[#141414]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] inline-block animate-pulse shadow-[0_0_6px_#00FF00]"></span>
          <span className="font-mono tracking-wider text-[10px] text-gray-300 uppercase">SYSTEM STATUS: ACTIVE / LIVE CONNECTION</span>
        </div>
        
        {/* Role Switcher */}
        <div className="flex items-center gap-1 bg-[#141414]">
          <button
            onClick={() => setActiveRole('ADMIN')}
            className={`px-3 py-1 rounded-none transition-all flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold border ${
              activeRole === 'ADMIN' 
                ? 'bg-[#E4E3E0] text-[#141414] border-[#E4E3E0]' 
                : 'text-gray-400 border-transparent hover:text-[#E4E3E0]'
            }`}
            title="System administrator audit controls"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SUPER ADMIN</span>
          </button>
          
          <button
            onClick={() => setActiveRole('MANAGER')}
            className={`px-3 py-1 rounded-none transition-all flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold border ${
              activeRole === 'MANAGER' 
                ? 'bg-[#E4E3E0] text-[#141414] border-[#E4E3E0]' 
                : 'text-gray-400 border-transparent hover:text-[#E4E3E0]'
            }`}
            title="Setup event schedule, lucky draws and view reporting"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EVENT MANAGER</span>
          </button>
          
          <button
            onClick={() => setActiveRole('STAFF')}
            className={`px-3 py-1 rounded-none transition-all flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold border ${
              activeRole === 'STAFF' 
                ? 'bg-[#E4E3E0] text-[#141414] border-[#E4E3E0]' 
                : 'text-gray-400 border-transparent hover:text-[#E4E3E0]'
            }`}
            title="Scan codes, award points, approve requests"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EVENT STAFF</span>
          </button>
          
          <button
            onClick={() => setActiveRole('PARTICIPANT')}
            className={`px-3 py-1 rounded-none transition-all flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold border ${
              activeRole === 'PARTICIPANT' 
                ? 'bg-[#E4E3E0] text-[#141414] border-[#E4E3E0]' 
                : 'text-gray-400 border-transparent hover:text-[#E4E3E0]'
            }`}
            title="Manage RSVP, digital passes and activity dashboard"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PARTICIPANT</span>
          </button>
        </div>

        {/* Participant Dropdown Selector */}
        {activeRole === 'PARTICIPANT' && (
          <div className="flex items-center gap-2 bg-[#2a2a2a] px-2 py-0.5 border border-neutral-700">
            <span className="text-gray-400 text-[10px] font-mono uppercase">VIEWING AS:</span>
            <select
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              className="bg-transparent text-white border-none rounded-none text-xs font-mono font-medium focus:ring-0 outline-none cursor-pointer py-0.5"
            >
              {participants.map(p => (
                <option key={p.id} value={p.id} className="bg-[#141414] text-white">
                  {p.name} ({p.company || 'Attendee'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Brand & Details Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#141414] text-[#E4E3E0] border border-[#141414] rounded-none flex items-center justify-center font-black text-xl font-mono shadow-none">
              EH
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#141414] tracking-tighter uppercase flex items-center gap-2">
                EventHub <span className="text-[10px] font-mono opacity-60 underline">v1.2-PROD</span>
              </h1>
              <p className="text-xs font-serif-italic text-slate-700">
                {eventConfig?.name || 'Live Event & Gamification Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Event Quick Info */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-[#141414]">
          <div className="flex items-center gap-1.5 bg-[#CFCECA] border border-[#141414] rounded-none px-3 py-1.5 font-mono text-[11px] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#141414]" />
            <span>{eventConfig?.date ? new Date(eventConfig.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'July 15, 2026'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#CFCECA] border border-[#141414] rounded-none px-3 py-1.5 font-mono text-[11px] max-w-xs truncate font-medium" title={eventConfig?.venue}>
            <MapPin className="w-3.5 h-3.5 text-[#141414] shrink-0" />
            <span className="truncate">{eventConfig?.venue?.split(',')[0] || 'Grand Ballroom'}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-action-custom text-[11px] h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>RE-SYNC</span>
          </button>
        </div>
      </div>
    </header>
  );
}
