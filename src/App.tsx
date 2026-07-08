import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationPortal from './components/RegistrationPortal';
import CheckInStation from './components/CheckInStation';
import LuckyDraw from './components/LuckyDraw';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SuperAdminPanel from './components/SuperAdminPanel';
import InvitationManager from './components/InvitationManager';
import EventPlanner from './components/EventPlanner';
import LeaderboardSprintPage from '../sprint-9-leaderboard/frontend/src/app/leaderboard/page';
import DoorPrizeSprintPage from '../sprint-10-doorprize/frontend/src/app/doorprize/page';
import LuckyDrawSprintPage from '../sprint-11-luckydraw/frontend/src/app/luckydraw/page';
import { Participant, SongRequest, ActivitySubmission, LuckyDrawWinner, AuditLog, EventConfig, DoorPrizeCategory, LuckyDrawCategory } from './types';
import { Calendar, MapPin, Award, Users, ShieldAlert, FileText, Settings, Play, Trophy, Gift, Sliders } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT'>('MANAGER');
  
  // Database States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [activitySubmissions, setActivitySubmissions] = useState<ActivitySubmission[]>([]);
  const [winners, setWinners] = useState<LuckyDrawWinner[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [doorPrizes, setDoorPrizes] = useState<DoorPrizeCategory[]>([]);
  const [luckyDraws, setLuckyDraws] = useState<LuckyDrawCategory[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Participant selection state
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');

  // Manager sub-tabs selection state
  const [managerSubTab, setManagerSubTab] = useState<'PLANNER' | 'ANALYTICS' | 'INVITATIONS' | 'LUCKY_DRAW' | 'LEADERBOARD' | 'DOOR_PRIZE'>('PLANNER');


  // Refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load everything
  const fetchAllData = async () => {
    try {
      const [
        resConfig,
        resParticipants,
        resActivities,
        resSongs,
        resWinners,
        resAudit,
        resStats,
        resDoorPrizes,
        resLuckyDrawConfig
      ] = await Promise.all([
        fetch('/api/event-config').then(r => r.json()),
        fetch('/api/participants').then(r => r.json()),
        fetch('/api/activities').then(r => r.json()),
        fetch('/api/songs').then(r => r.json()),
        fetch('/api/lucky-draw/winners').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/door-prizes').then(r => r.json()),
        fetch('/api/lucky-draw/config').then(r => r.json())
      ]);

      setEventConfig(resConfig);
      setParticipants(resParticipants);
      setActivitySubmissions(resActivities);
      setSongRequests(resSongs);
      setWinners(resWinners);
      setAuditLogs(resAudit);
      setStats(resStats);
      setDoorPrizes(resDoorPrizes);
      setLuckyDraws(resLuckyDrawConfig);

      // Default the participant selector if empty or outdated
      if (resParticipants.length > 0 && (!selectedParticipantId || !resParticipants.find(p => p.id === selectedParticipantId))) {
        setSelectedParticipantId(resParticipants[0].id);
      }
    } catch (err) {
      console.error("API Fetch Error - server may be offline:", err);
    }
  };

  // Initial load and live auto-poll for real-time multiplayer feel
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [selectedParticipantId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  // Mutation Handlers
  const handleRegisterParticipant = async (regData: any) => {
    const res = await fetch('/api/participants/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to register account.");
    }
    const participant = await res.json();
    setSelectedParticipantId(participant.id);
    await fetchAllData();
    return participant;
  };

  const handleLoginParticipant = async (loginData: any) => {
    const res = await fetch('/api/participants/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to login.");
    }
    const participant = await res.json();
    setSelectedParticipantId(participant.id);
    await fetchAllData();
    return participant;
  };

  const handleUpdateProfile = async (profileData: any) => {
    const res = await fetch('/api/participants/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update profile.");
    }
    await fetchAllData();
  };

  const handleRSVPSubmit = async (rsvpData: any) => {
    await fetch('/api/participants/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvpData)
    });
    await fetchAllData();
  };

  const handleCheckIn = async (participantId: string) => {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, staffActor: 'Staff-Desk-01' })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to check-in");
    }
    await fetchAllData();
  };

  const handleApproveActivity = async (submissionId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch('/api/activities/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, status, staffActor: 'Staff-Verification-Desk' })
    });
    await fetchAllData();
  };

  const handleAwardCustomPoints = async (participantId: string, activityType: string, description: string) => {
    await fetch('/api/activities/award-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, activityType, description, staffActor: 'Staff-Spot-Awarder' })
    });
    await fetchAllData();
  };

  const handleUpdateSongStatus = async (songId: string, status: 'APPROVED' | 'REJECTED' | 'PLAYED') => {
    await fetch('/api/songs/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, status, staffActor: 'Staff-Stage-Band' })
    });
    await fetchAllData();
  };

  const handleDrawWinner = async (categoryId: string) => {
    const res = await fetch('/api/lucky-draw/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Winner draw failed");
    }
    const result = await res.json();
    await fetchAllData();
    return result;
  };

  const handleResetWinners = async () => {
    await fetch('/api/lucky-draw/reset', { method: 'POST' });
    await fetchAllData();
  };

  const handleUpdateConfig = async (configUpdate: Partial<EventConfig>) => {
    await fetch('/api/event-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configUpdate)
    });
    await fetchAllData();
  };

  const handleBulkImport = async (guests: any[]) => {
    await fetch('/api/participants/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guests)
    });
    await fetchAllData();
  };

  const handleSubmitSongRequest = async (songData: any) => {
    await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...songData, participantId: selectedParticipantId })
    });
    await fetchAllData();
  };

  const handleSubmitActivity = async (activityData: any) => {
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...activityData, participantId: selectedParticipantId })
    });
    await fetchAllData();
  };

  // Safe current participant
  const currentParticipant = participants.find(p => p.id === selectedParticipantId);

  // Leaderboard lists
  const sortedLeaderboard = [...participants].sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-white" id="eventhub-root">
      
      {/* Universal header layout */}
      <Header
        eventConfig={eventConfig}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        participants={participants}
        selectedParticipantId={selectedParticipantId}
        setSelectedParticipantId={setSelectedParticipantId}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ROLE 1: SUPER ADMIN AUDIT PANELS */}
        {activeRole === 'ADMIN' && (
          <SuperAdminPanel
            auditLogs={auditLogs}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        {/* ROLE 2: EVENT MANAGER PANELS (Includes Analytics, Setup & Lucky Draw) */}
        {activeRole === 'MANAGER' && (
          <div className="space-y-6">
            
            {/* Manager navigation controls */}
            <div className="flex flex-wrap border-[1.5px] border-[#141414] bg-[#DFDEDA] p-1 rounded-none max-w-4xl gap-1">
              <button
                onClick={() => setManagerSubTab('PLANNER')}
                className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase font-black rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  managerSubTab === 'PLANNER' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#CFCECA]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>00 Event Setup</span>
              </button>

              <button
                onClick={() => setManagerSubTab('ANALYTICS')}
                className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase font-black rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  managerSubTab === 'ANALYTICS' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#CFCECA]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>01 Live Analytics</span>
              </button>
              
              <button
                onClick={() => setManagerSubTab('INVITATIONS')}
                className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase font-black rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  managerSubTab === 'INVITATIONS' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#CFCECA]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>02 RSVPs & Reminders</span>
              </button>
              
              <button
                onClick={() => setManagerSubTab('LUCKY_DRAW')}
                className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase font-black rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  managerSubTab === 'LUCKY_DRAW' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#CFCECA]'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>03 Lucky Draw Wheel</span>
              </button>

              <button
                onClick={() => setManagerSubTab('LEADERBOARD')}
                className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase font-black rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  managerSubTab === 'LEADERBOARD' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#CFCECA]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>04 Leaderboard & Swag</span>
              </button>

              <button
                onClick={() => setManagerSubTab('DOOR_PRIZE')}
                className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase font-black rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  managerSubTab === 'DOOR_PRIZE' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#CFCECA]'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>05 Door Prizes</span>
              </button>
            </div>

            {/* Sub-panels */}
            {managerSubTab === 'PLANNER' && (
              <EventPlanner
                onRefreshAll={handleRefresh}
              />
            )}

            {managerSubTab === 'ANALYTICS' && (
              <AnalyticsDashboard
                stats={stats}
                participants={participants}
                songRequests={songRequests}
                activitySubmissions={activitySubmissions}
                doorPrizes={doorPrizes}
              />
            )}

            {managerSubTab === 'INVITATIONS' && (
              <InvitationManager
                eventConfig={eventConfig}
                participants={participants}
                doorPrizes={doorPrizes}
                luckyDraws={luckyDraws}
                onUpdateConfig={handleUpdateConfig}
                onBulkImport={handleBulkImport}
              />
            )}

            {managerSubTab === 'LUCKY_DRAW' && (
              <LuckyDrawSprintPage />
            )}

            {managerSubTab === 'LEADERBOARD' && (
              <LeaderboardSprintPage />
            )}

            {managerSubTab === 'DOOR_PRIZE' && (
              <DoorPrizeSprintPage />
            )}
          </div>
        )}

        {/* ROLE 3: EVENT STAFF PANEL (Desk scan & Verification approvals) */}
        {activeRole === 'STAFF' && (
          <CheckInStation
            participants={participants}
            songRequests={songRequests}
            activitySubmissions={activitySubmissions}
            onCheckIn={handleCheckIn}
            onApproveActivity={handleApproveActivity}
            onAwardCustomPoints={handleAwardCustomPoints}
            onUpdateSongStatus={handleUpdateSongStatus}
            eventConfig={eventConfig}
          />
        )}

        {/* ROLE 4: PARTICIPANT VIEWS (RSVP or Dashboard) */}
        {activeRole === 'PARTICIPANT' && (
          <RegistrationPortal
            currentParticipant={currentParticipant}
            eventConfig={eventConfig}
            leaderboard={sortedLeaderboard}
            songRequests={songRequests}
            activitySubmissions={activitySubmissions}
            onSubmitRSVP={handleRSVPSubmit}
            onSubmitSongRequest={handleSubmitSongRequest}
            onSubmitActivity={handleSubmitActivity}
            onRegisterParticipant={handleRegisterParticipant}
            onLoginParticipant={handleLoginParticipant}
            onUpdateProfile={handleUpdateProfile}
            onSelectParticipant={setSelectedParticipantId}
          />
        )}
      </main>

      {/* Footer bar */}
      <footer className="bg-[#141414] border-t-[1.5px] border-[#141414] mt-12 py-4 px-4 text-[#E4E3E0] text-center text-[10px] font-mono">
        <p>EVENTHUB SAAS ARCHITECTURE / NESTJS + NEXTJS + POSTGRESQL + REDIS — AUTHORIZED PERSONNEL ONLY — LOGGED AS: super_admin_01</p>
      </footer>
    </div>
  );
}
