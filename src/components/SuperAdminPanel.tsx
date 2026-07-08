import React, { useState } from 'react';
import { Shield, ShieldAlert, Cpu, HardDrive, Database, Activity, RefreshCw, Search } from 'lucide-react';
import { AuditLog } from '../types';

interface SuperAdminPanelProps {
  auditLogs: AuditLog[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function SuperAdminPanel({
  auditLogs,
  onRefresh,
  isRefreshing
}: SuperAdminPanelProps) {
  
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');

  // Simulated live performance indicators (Showcase DevOps/SaaS engineering!)
  const performanceStats = [
    { name: "Active WS Clients", value: "1,048 conn", status: "HEALTHY", icon: Activity, color: "text-[#00FF00] bg-black border-black" },
    { name: "Redis Cache Hit Rate", value: "94.2%", status: "HEALTHY", icon: HardDrive, color: "text-[#00FF00] bg-black border-black" },
    { name: "PostgreSQL Pool", value: "14 / 20 Active", status: "HEALTHY", icon: Database, color: "text-[#00FF00] bg-black border-black" },
    { name: "BullMQ Queue Latency", value: "12ms avg", status: "HEALTHY", icon: Cpu, color: "text-[#00FF00] bg-black border-black" }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6" id="super-admin-panel">
      
      {/* SaaS Infrastructure telemetry cards */}
      <div className="bg-[#141414] p-5 border-[1.5px] border-[#141414] text-slate-100 rounded-none space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00FF00]" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide text-[#00FF00]">Live Cluster Telemetry</h3>
              <p className="text-[9px] text-slate-400">AWS ECS container cluster status. Simulated rate limits: 100 req/min/IP.</p>
            </div>
          </div>
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-[#00FF00] hover:text-black hover:bg-[#00FF00] text-xs flex items-center gap-1.5 bg-transparent py-1.5 px-3 border border-[#00FF00] rounded-none cursor-pointer font-bold transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Telemetry Pulse</span>
          </button>
        </div>

        {/* Telemetry metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-black p-4 rounded-none border border-zinc-800 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-none flex items-center justify-center shrink-0 border border-zinc-700 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest block">{stat.name}</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5">{stat.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main audit log stream panel */}
      <div className="tech-card p-5 font-mono text-xs">
        <h3 className="font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-black" />
          <span>System Security Audit Logs ({filteredLogs.length})</span>
        </h3>

        {/* Filters and search row */}
        <div className="flex flex-col md:flex-row gap-3 text-xs mb-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs by actor, action, details..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="tech-input w-full pl-9"
            />
          </div>

          {/* Severity switcher */}
          <div className="flex bg-[#DFDEDA] p-1 rounded-none border-[1.5px] border-[#141414] font-bold text-slate-700 gap-1">
            {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-none transition-colors cursor-pointer text-[10px] uppercase tracking-wide font-mono ${
                  severityFilter === sev ? 'bg-black text-[#00FF00]' : 'hover:bg-slate-300'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Log rows streaming */}
        <div className="border-[1.5px] border-[#141414] bg-white rounded-none overflow-hidden max-h-[400px] overflow-y-auto text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-[#141414] text-slate-500 font-bold bg-[#DFDEDA] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor (Role)</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 italic">No audit logs match criteria.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const severityStyles = {
                    INFO: 'bg-slate-100 text-slate-700 border-slate-300',
                    SUCCESS: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    WARNING: 'bg-amber-100 text-amber-800 border-amber-300',
                    ERROR: 'bg-rose-100 text-rose-800 border-rose-300'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-[#DFDEDA]/30">
                      <td className="py-2.5 px-3 text-slate-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 uppercase">{log.actor}</span>
                        <span className="text-[9px] text-slate-400 block">{log.role}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-black uppercase">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-600 break-words max-w-sm">{log.details}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold border border-black uppercase ${severityStyles[log.severity]}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
