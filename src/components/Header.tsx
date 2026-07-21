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
          {/* Joint KSO Logo Layout */}
          <div className="flex items-center gap-2.5 md:gap-4 select-none py-1">
            {/* Left Brand Text */}
            <div className="flex flex-col text-[#141414] text-left">
              <span className="font-sans font-black tracking-tight uppercase text-[10px] md:text-[18px] leading-[0.95]">
                KERJASAMA
              </span>
              <span className="font-sans font-black tracking-tight uppercase text-[10px] md:text-[18px] leading-[0.95]">
                OPERASI
              </span>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 md:h-12 w-[1.5px] md:w-[2px] bg-[#141414] shrink-0" />

            {/* Right Logos Stack */}
            <div className="flex flex-col gap-0.5 md:gap-1 text-left">
              <div className="flex items-center gap-3 md:gap-6">
                {/* SUCOFINDO */}
                <div className="flex flex-col items-center">
                  {/* Three globes + checkmark SVG */}
                  <div className="relative h-6 md:h-9 w-12 md:w-16">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      {/* Globe 1 */}
                      <circle cx="28" cy="25" r="16" fill="none" stroke="#0092c7" strokeWidth="2" />
                      <path d="M 28,9 A 16,16 0 0,0 28,41" fill="none" stroke="#0092c7" strokeWidth="1.5" />
                      <path d="M 28,9 A 16,16 0 0,1 28,41" fill="none" stroke="#0092c7" strokeWidth="1.5" />
                      <line x1="12" y1="25" x2="44" y2="25" stroke="#0092c7" strokeWidth="1.5" />
                      <path d="M 15,17 Q 28,22 41,17" fill="none" stroke="#0092c7" strokeWidth="1" />
                      <path d="M 15,33 Q 28,28 41,33" fill="none" stroke="#0092c7" strokeWidth="1" />

                      {/* Globe 2 */}
                      <circle cx="48" cy="25" r="16" fill="none" stroke="#0092c7" strokeWidth="2" />
                      <path d="M 48,9 A 16,16 0 0,0 48,41" fill="none" stroke="#0092c7" strokeWidth="1.5" />
                      <path d="M 48,9 A 16,16 0 0,1 48,41" fill="none" stroke="#0092c7" strokeWidth="1.5" />
                      <line x1="32" y1="25" x2="64" y2="25" stroke="#0092c7" strokeWidth="1.5" />
                      <path d="M 35,17 Q 48,22 61,17" fill="none" stroke="#0092c7" strokeWidth="1" />
                      <path d="M 35,33 Q 48,28 61,33" fill="none" stroke="#0092c7" strokeWidth="1" />

                      {/* Globe 3 */}
                      <circle cx="68" cy="25" r="16" fill="none" stroke="#0092c7" strokeWidth="2" />
                      <path d="M 68,9 A 16,16 0 0,0 68,41" fill="none" stroke="#0092c7" strokeWidth="1.5" />
                      <path d="M 68,9 A 16,16 0 0,1 68,41" fill="none" stroke="#0092c7" strokeWidth="1.5" />
                      <line x1="52" y1="25" x2="84" y2="25" stroke="#0092c7" strokeWidth="1.5" />
                      <path d="M 55,17 Q 68,22 81,17" fill="none" stroke="#0092c7" strokeWidth="1" />
                      <path d="M 55,33 Q 68,28 81,33" fill="none" stroke="#0092c7" strokeWidth="1" />

                      {/* Checkmark Badge on Top Right */}
                      <g transform="translate(64, 1)">
                        <circle cx="10" cy="10" r="9" fill="#0c4a6e" />
                        <path d="M 6,10 L 9,13 L 15,7" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                  <span className="font-sans font-black tracking-[0.1em] text-[5.5px] md:text-[9px] text-[#141414] uppercase leading-none mt-0.5">
                    SUCOFINDO
                  </span>
                </div>

                {/* SURVEYOR INDONESIA */}
                <div className="flex flex-col items-center">
                  {/* Single globe + checkmark SVG */}
                  <div className="relative h-6 md:h-9 w-8 md:w-11">
                    <svg viewBox="0 0 60 50" className="w-full h-full">
                      {/* Globe */}
                      <circle cx="30" cy="25" r="16" fill="none" stroke="#0066b2" strokeWidth="2" />
                      <path d="M 30,9 A 16,16 0 0,0 30,41" fill="none" stroke="#0066b2" strokeWidth="1.5" />
                      <path d="M 30,9 A 16,16 0 0,1 30,41" fill="none" stroke="#0066b2" strokeWidth="1.5" />
                      <line x1="14" y1="25" x2="46" y2="25" stroke="#0066b2" strokeWidth="1.5" />
                      <path d="M 17,17 Q 30,22 43,17" fill="none" stroke="#0066b2" strokeWidth="1" />
                      <path d="M 17,33 Q 30,28 43,33" fill="none" stroke="#0066b2" strokeWidth="1" />
                      {/* Stylized S line */}
                      <path d="M 30,12 C 23,16 23,22 30,25 C 37,28 37,34 30,38" fill="none" stroke="#0066b2" strokeWidth="2" strokeLinecap="round" />

                      {/* Checkmark Badge on Top Right */}
                      <g transform="translate(34, 1)">
                        <circle cx="10" cy="10" r="9" fill="#0c4a6e" />
                        <path d="M 6,10 L 9,13 L 15,7" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                  <span className="font-sans font-black tracking-normal text-[5.5px] md:text-[8px] text-[#0066b2] uppercase leading-none mt-0.5 whitespace-nowrap">
                    SURVEYOR INDONESIA
                  </span>
                </div>
              </div>

              {/* Tagline across both */}
              <div className="text-[6.5px] md:text-[10.5px] text-[#0066b2] italic font-medium tracking-wide leading-none border-t border-slate-100 pt-0.5 md:pt-1 font-serif">
                Professional, Connecting, Integrated
              </div>
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
