import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Settings, Users, LogOut, Lock, CheckSquare, Eye } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col items-center justify-center font-mono p-4">
        <div className="w-full max-w-sm text-center space-y-4 bg-white border-[2px] border-[#141414] p-8">
          <Lock className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="font-bold uppercase text-xs">UNAUTHORIZED ACCESS</h2>
          <p className="text-[10px] text-slate-500 uppercase leading-relaxed">
            Your credentials or access session is invalid. Secure authentication is mandatory for corporate clusters.
          </p>
          <a
            href="/login"
            className="inline-block bg-[#141414] text-white hover:text-[#00FF00] font-bold text-[10px] uppercase tracking-wider py-2 px-4 border border-black"
          >
            RETURN TO DECRYPT GATE
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-mono flex flex-col">
      {/* Top Session Ribbon */}
      <header className="bg-black text-[#E4E3E0] border-b-[2px] border-black px-6 py-4 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-[#00FF00] text-black flex items-center justify-center font-bold text-[10px]">
            EH
          </div>
          <span className="font-bold uppercase tracking-wide">
            EVENTHUB SECURE CONSOLE v1.0.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 py-1 px-2 uppercase">
            OPERATOR: {user.name} ({user.role})
          </span>
          <button
            onClick={logout}
            className="text-rose-400 hover:text-white flex items-center gap-1.5 font-bold uppercase text-[10px] transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>TERMINATE</span>
          </button>
        </div>
      </header>

      {/* Main Console Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Welcome Block */}
        <div className="bg-white border-[1.5px] border-[#141414] p-5">
          <h2 className="text-sm font-bold uppercase text-black">Active Workspace Dashboard</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-0.5">
            Event Management, Real-Time Gamified Activities, and Live Drawer Cluster Systems
          </p>
        </div>

        {/* Modular Role-Based Rendering (RBAC Showcase) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. ADMIN AUDIT CONTROL BOARD (Admin Only) */}
          {hasRole(['ADMIN']) ? (
            <div className="bg-zinc-900 text-zinc-100 p-5 border-[1.5px] border-zinc-900 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-xs font-black uppercase text-[#00FF00] flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>01 Live Audit Control</span>
                </span>
                <span className="text-[8px] bg-[#00FF00] text-black px-1.5 py-0.5 font-bold uppercase">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal uppercase">
                Authorize changes on infrastructure metrics, check global postgres connection pool logs, and trigger reset keys.
              </p>
              <button className="w-full bg-[#00FF00] hover:bg-emerald-400 text-black font-bold py-2 text-[10px] uppercase">
                VIEW CLUSTER TELEMETRY
              </button>
            </div>
          ) : (
            <div className="bg-[#DFDEDA] border border-slate-300 p-5 opacity-40 flex flex-col justify-between min-h-[160px]">
              <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>01 Live Audit Control</span>
              </span>
              <p className="text-[9px] text-slate-500 uppercase leading-relaxed">
                Admin permissions missing. Request elevation from secure credentials to access central postgres telemetry.
              </p>
            </div>
          )}

          {/* 2. MANAGER INVITE HUB (Admin + Manager Only) */}
          {hasRole(['ADMIN', 'MANAGER']) ? (
            <div className="bg-white p-5 border-[1.5px] border-black space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    <span>02 Guest & Invitation Hub</span>
                  </span>
                  <span className="text-[8px] bg-black text-[#00FF00] px-1.5 py-0.5 font-bold uppercase">
                    MGR LEVEL
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal uppercase">
                  Bulk upload CSV invitation spreadsheets, manage seating arrangements, and configure lucky draw prizes.
                </p>
              </div>
              <button className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-2 text-[10px] uppercase">
                LAUNCH CSV IMPORTER
              </button>
            </div>
          ) : (
            <div className="bg-[#DFDEDA] border border-slate-300 p-5 opacity-40 flex flex-col justify-between min-h-[160px]">
              <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>02 Guest & Invitation Hub</span>
              </span>
              <p className="text-[9px] text-slate-500 uppercase leading-relaxed">
                Requires Manager or Administrator clearance. Access is authenticated and logged.
              </p>
            </div>
          )}

          {/* 3. STAFF DESK OPERATIONS (Admin, Manager, Staff Only) */}
          {hasRole(['ADMIN', 'MANAGER', 'STAFF']) ? (
            <div className="bg-white p-5 border-[1.5px] border-black space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>03 Verification & Desk</span>
                  </span>
                  <span className="text-[8px] bg-slate-100 border border-black text-black px-1.5 py-0.5 font-bold uppercase">
                    STAFF LEVEL
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal uppercase">
                  Process live guest desk registration, decode user QR passes on entrance scans, and print physical seat badges.
                </p>
              </div>
              <button className="w-full bg-white border border-black hover:bg-slate-50 text-black font-bold py-2 text-[10px] uppercase">
                LAUNCH SCANNING MODULE
              </button>
            </div>
          ) : (
            <div className="bg-[#DFDEDA] border border-slate-300 p-5 opacity-40 flex flex-col justify-between min-h-[160px]">
              <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>03 Verification & Desk</span>
              </span>
              <p className="text-[9px] text-slate-500 uppercase leading-relaxed">
                Staff operations restricted. Register as staff personnel to perform entrance operations.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
