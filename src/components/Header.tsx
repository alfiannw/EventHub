import React, { useState } from 'react';
import { Shield, Sparkles, UserCheck, Users, Calendar, MapPin, RefreshCw, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
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
  currentUser: any;
  onLogout: () => void;
}

export default function Header({
  eventConfig,
  activeRole,
  setActiveRole,
  participants,
  selectedParticipantId,
  setSelectedParticipantId,
  onRefresh,
  isRefreshing,
  currentUser,
  onLogout
}: HeaderProps) {
  
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const currentParticipant = participants.find(p => p.id === selectedParticipantId);

  return (
    <header className="bg-white border-b-[3px] border-[#141414] sticky top-0 z-50 shadow-none" id="app-header">
      {/* Role Selector Top Bar - Only visible to SUPER_ADMIN */}
      {currentUser && currentUser.role === 'SUPER_ADMIN' && (
        <div className="bg-[#141414] text-[#E4E3E0] text-xs px-4 py-2.5 flex flex-wrap justify-between items-center gap-4 border-b-2 border-[#141414]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5F237] inline-block animate-pulse shadow-[0_0_6px_#C5F237]"></span>
              <span className="font-mono tracking-wider text-[9px] text-slate-300 uppercase">EVENTHUB SECURE CONNECTION</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 border-l border-neutral-700 pl-3">
              ACTIVE AS: <strong className="text-white">{currentUser.name}</strong> 
              <span className="bg-[#2a2a2a] text-[#C5F237] text-[8px] font-black px-1.5 py-0.5 rounded ml-1 border border-neutral-700 tracking-wider">
                SUPER ADMIN
              </span>
            </span>
          </div>
          
          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[#141414]">
            <button
              onClick={() => setActiveRole('ADMIN')}
              className={`px-3 py-1 rounded-[8px] transition-all flex items-center gap-1.5 font-mono text-[9px] uppercase font-black border-2 cursor-pointer ${
                activeRole === 'ADMIN' 
                  ? 'bg-[#C5F237] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)]' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              title="Super Admin Audit Logs & Manager whitelist"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SUPER ADMIN</span>
            </button>
            
            <button
              onClick={() => setActiveRole('MANAGER')}
              className={`px-3 py-1 rounded-[8px] transition-all flex items-center gap-1.5 font-mono text-[9px] uppercase font-black border-2 cursor-pointer ${
                activeRole === 'MANAGER' 
                  ? 'bg-[#FFE600] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)]' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              title="Setup event schedule, lucky draws and view reporting"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EVENT MANAGER</span>
            </button>
            
            <button
              onClick={() => setActiveRole('STAFF')}
              className={`px-3 py-1 rounded-[8px] transition-all flex items-center gap-1.5 font-mono text-[9px] uppercase font-black border-2 cursor-pointer ${
                activeRole === 'STAFF' 
                  ? 'bg-[#38BDF8] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)]' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              title="Scan codes, award points, approve requests"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EVENT STAFF</span>
            </button>
            
            <button
              onClick={() => setActiveRole('PARTICIPANT')}
              className={`px-3 py-1 rounded-[8px] transition-all flex items-center gap-1.5 font-mono text-[9px] uppercase font-black border-2 cursor-pointer ${
                activeRole === 'PARTICIPANT' 
                  ? 'bg-[#F472B6] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)]' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              title="Manage RSVP, digital passes and activity dashboard"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PARTICIPANT</span>
            </button>
          </div>

          {/* Right side: Participant Dropdown Selector & Logout button */}
          <div className="flex items-center gap-3">
            {activeRole === 'PARTICIPANT' && (
              <div className="flex items-center gap-2 bg-[#2a2a2a] px-2.5 py-1 border border-neutral-700 rounded-[6px]">
                <span className="text-gray-400 text-[9px] font-mono uppercase font-bold">VIEWING AS:</span>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="bg-transparent text-white border-none rounded-none text-xs font-mono font-bold focus:ring-0 outline-none cursor-pointer py-0"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#141414] text-white">
                      {p.name} ({p.company || 'Attendee'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onLogout}
              className="bg-[#D9383A] hover:bg-[#B32426] text-white text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1.5 border border-red-950 rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#7F1D1D] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#7F1D1D]"
              title="Sign out securely"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Brand & Details Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        {/* Top brand row on mobile, full column on desktop */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            {/* EH Logo */}
            <div className="h-9 w-9 md:h-12 md:w-12 bg-[#C5F237] text-[#141414] border-2 border-[#141414] rounded-[8px] md:rounded-[12px] flex items-center justify-center font-extrabold text-base md:text-lg font-display shadow-[2px_2px_0px_0px_#141414] shrink-0">
              EH
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-base md:text-2xl font-extrabold text-[#141414] font-display tracking-tight uppercase flex items-center gap-1.5 leading-none md:leading-snug">
                EventHub <span className="text-[8px] md:text-[9px] font-mono bg-[#141414] text-white px-1.5 py-0.5 rounded-[4px] font-bold uppercase tracking-wider">PROD</span>
              </h1>
              <p className="hidden md:block text-xs font-sans text-slate-600 mt-1 font-medium leading-normal">
                {eventConfig?.name || 'Live Event & Gamification Platform'}
              </p>
            </div>
          </div>

          {/* Mobile Toggle & Direct Sign-Out */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[9px] font-mono font-bold uppercase py-1 px-2 border-2 border-[#141414] rounded-[6px] shadow-[1.5px_1.5px_0px_0px_#141414] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
            >
              <span>{isMobileExpanded ? 'Hide' : 'Info'}</span>
              {isMobileExpanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
            </button>

            {currentUser && currentUser.role !== 'SUPER_ADMIN' && (
              <button
                onClick={onLogout}
                className="bg-[#D9383A] hover:bg-[#B32426] text-white font-mono font-black uppercase text-[8px] h-[24px] px-2 flex items-center justify-center gap-1 border-2 border-[#141414] rounded-[6px] shadow-[1.5px_1.5px_0px_0px_#141414] transition-all cursor-pointer"
                title="Sign out securely"
              >
                <LogOut className="w-2.5 h-2.5" />
                <span>Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Event Quick Info & Action Buttons (Collapsible on mobile) */}
        <div className={`${isMobileExpanded ? 'flex' : 'hidden md:flex'} flex-col sm:flex-row sm:items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end border-t border-dashed border-slate-200 md:border-none pt-3 md:pt-0`}>
          {/* Mobile sub-text */}
          <p className="md:hidden text-[11px] font-sans text-slate-500 font-medium leading-normal">
            {eventConfig?.name || 'Live Event & Gamification Platform'}
          </p>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#141414]">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700 py-1">
              <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{eventConfig?.date ? new Date(eventConfig.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'July 15, 2026'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] max-w-xs truncate font-bold text-slate-700 py-1" title={eventConfig?.venue}>
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="truncate">{eventConfig?.venue?.split(',')[0] || 'Grand Ballroom'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-action-refresh"
            >
              <RefreshCw className={`w-3 md:w-3.5 h-3 md:h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>RE-SYNC</span>
            </button>

            {currentUser && currentUser.role !== 'SUPER_ADMIN' && (
              <button
                onClick={onLogout}
                className="hidden md:flex bg-[#D9383A] hover:bg-[#B32426] text-white font-mono font-black uppercase text-[11px] h-[38px] px-4 items-center justify-center gap-1.5 border-2 border-[#141414] rounded-[12px] shadow-[2px_2px_0px_0px_#141414] hover:shadow-[3px_3px_0px_0px_#141414] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#141414] transition-all cursor-pointer"
                title="Sign out securely"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
