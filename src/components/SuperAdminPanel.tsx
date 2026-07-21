import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Cpu, HardDrive, Database, Activity, RefreshCw, Search, Plus, Trash, Ban, Check, UserX, Mail, User, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'AUDIT_LOGS' | 'WHITELIST' | 'ACCESS_CONTROL'>('AUDIT_LOGS');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');

  // New administrative state
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [staffWhitelist, setStaffWhitelist] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [isWhitelistLoading, setIsWhitelistLoading] = useState(false);
  const [isStaffWhitelistLoading, setIsStaffWhitelistLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const fetchWhitelist = async () => {
    setIsWhitelistLoading(true);
    try {
      const res = await fetch('/api/admin/whitelist');
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsWhitelistLoading(false);
    }
  };

  const fetchStaffWhitelist = async () => {
    setIsStaffWhitelistLoading(true);
    try {
      const res = await fetch('/api/admin/staff-whitelist');
      if (res.ok) {
        const data = await res.json();
        setStaffWhitelist(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStaffWhitelistLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
    fetchStaffWhitelist();
    fetchUsers();
  }, []);

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const res = await fetch('/api/admin/whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data);
        setNewEmail('');
        fetchUsers(); // Sync the users listing
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add email to whitelist");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStaffWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail.trim()) return;
    try {
      const res = await fetch('/api/admin/staff-whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newStaffEmail.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setStaffWhitelist(data);
        setNewStaffEmail('');
        fetchUsers(); // Sync the users listing
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add email to staff whitelist");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveWhitelist = async (email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the whitelist? This will also revoke their active manager account.`)) return;
    try {
      const res = await fetch('/api/admin/whitelist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStaffWhitelist = async (email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the staff whitelist? This will also revoke their active staff account.`)) return;
    try {
      const res = await fetch('/api/admin/staff-whitelist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setStaffWhitelist(data);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRevoke = async (targetId: string, targetType: string, currentRevokedStatus: boolean) => {
    const actionWord = currentRevokedStatus ? 'RESTORE' : 'REVOKE';
    if (!window.confirm(`Are you sure you want to ${actionWord} access for this account?`)) return;
    
    try {
      const res = await fetch('/api/admin/users/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          targetType,
          revoke: !currentRevokedStatus
        })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to change revocation status");
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6" id="super-admin-panel">
      
      {/* Sub-navigation Controls for Superadmin */}
      <div className="flex border-3 border-[#141414] rounded-2xl overflow-hidden bg-[#DFDEDA] shadow-[4px_4px_0px_0px_#141414]">
        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`flex-1 py-3 px-4 font-mono text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'AUDIT_LOGS' ? 'bg-black text-[#C5F237]' : 'text-slate-800 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Stream</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('WHITELIST');
            fetchWhitelist();
            fetchStaffWhitelist();
          }}
          className={`flex-1 py-3 px-4 font-mono text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'WHITELIST' ? 'bg-black text-[#FFE600]' : 'text-slate-800 hover:bg-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>System Whitelists</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('ACCESS_CONTROL');
            fetchUsers();
          }}
          className={`flex-1 py-3 px-4 font-mono text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ACCESS_CONTROL' ? 'bg-black text-[#38BDF8]' : 'text-slate-800 hover:bg-slate-200'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>Access Revocation</span>
        </button>
      </div>

      {activeTab === 'AUDIT_LOGS' && (
        <>
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
        </>
      )}

      {activeTab === 'WHITELIST' && (
        <div className="space-y-6">
          {/* Main header */}
          <div className="tech-card p-6">
            <div className="border-b border-[#141414] pb-4">
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FFE600] stroke-black stroke-2" />
                <span>Unified System Whitelists</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authorize administrative registrations by adding email addresses to the Event Manager or Event Staff safe-lists.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Event Manager Whitelist Card */}
            <div className="tech-card p-6 flex flex-col justify-between">
              <div>
                <div className="border-b border-[#141414] pb-3 mb-4">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#FFE600]" />
                    <span>Event Manager Whitelist</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Allows signup as Event Manager. Removing an email automatically revokes their active session.
                  </p>
                </div>

                {/* Add Form */}
                <form onSubmit={handleAddWhitelist} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[9px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                      Whitelisted Manager Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="manager@eventhub.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="tech-input w-full text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#FFE600] hover:bg-[#FFE600]/80 text-[#141414] py-2.5 px-4 border-2 border-[#141414] rounded-xl font-mono text-xs uppercase font-black tracking-wider transition-all shadow-[2px_2px_0px_0px_#141414] hover:shadow-[1px_1px_0px_0px_#141414] cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Table */}
                <div className="border-2 border-[#141414] rounded-xl bg-white overflow-hidden shadow-[2px_2px_0px_0px_#141414] max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#141414] text-slate-700 font-black bg-[#DFDEDA] text-[9px] uppercase tracking-wider font-mono">
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs font-mono">
                      {isWhitelistLoading ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-500 italic text-[11px]">Loading...</td>
                        </tr>
                      ) : whitelist.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400 italic text-[11px]">No managers whitelisted.</td>
                        </tr>
                      ) : (
                        whitelist.map((email) => {
                          const isRegistered = users.some(u => u.email.toLowerCase() === email.toLowerCase());
                          return (
                            <tr key={email} className="hover:bg-slate-50 text-[11px]">
                              <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[150px]" title={email}>{email}</td>
                              <td className="py-2 px-3">
                                {isRegistered ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                    Active
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWhitelist(email)}
                                  className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                >
                                  <Trash className="w-3.5 h-3.5 inline" />
                                </button>
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

            {/* Event Staff Whitelist Card */}
            <div className="tech-card p-6 flex flex-col justify-between">
              <div>
                <div className="border-b border-[#141414] pb-3 mb-4">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C5F237]" />
                    <span>Event Staff Whitelist</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Allows signup as Event Staff. Removing an email automatically revokes their active session.
                  </p>
                </div>

                {/* Add Form */}
                <form onSubmit={handleAddStaffWhitelist} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[9px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                      Whitelisted Staff Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="staff@eventhub.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="tech-input w-full text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#C5F237] hover:bg-[#C5F237]/80 text-[#141414] py-2.5 px-4 border-2 border-[#141414] rounded-xl font-mono text-xs uppercase font-black tracking-wider transition-all shadow-[2px_2px_0px_0px_#141414] hover:shadow-[1px_1px_0px_0px_#141414] cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Table */}
                <div className="border-2 border-[#141414] rounded-xl bg-white overflow-hidden shadow-[2px_2px_0px_0px_#141414] max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#141414] text-slate-700 font-black bg-[#DFDEDA] text-[9px] uppercase tracking-wider font-mono">
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs font-mono">
                      {isStaffWhitelistLoading ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-500 italic text-[11px]">Loading...</td>
                        </tr>
                      ) : staffWhitelist.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400 italic text-[11px]">No staff whitelisted.</td>
                        </tr>
                      ) : (
                        staffWhitelist.map((email) => {
                          const isRegistered = users.some(u => u.email.toLowerCase() === email.toLowerCase());
                          return (
                            <tr key={email} className="hover:bg-slate-50 text-[11px]">
                              <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[150px]" title={email}>{email}</td>
                              <td className="py-2 px-3">
                                {isRegistered ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                    Active
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffWhitelist(email)}
                                  className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                >
                                  <Trash className="w-3.5 h-3.5 inline" />
                                </button>
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

          </div>
        </div>
      )}

      {activeTab === 'ACCESS_CONTROL' && (
        <div className="tech-card p-6">
          <div className="border-b border-[#141414] pb-4 mb-6">
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight flex items-center gap-2">
              <UserX className="w-5 h-5 text-[#38BDF8] stroke-black stroke-2" />
              <span>Unified Access Revocation Center</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Revoke login and participation privileges for both Event Managers and Attendees instantly. Revoked users are barred from logging in or using any part of the system.
            </p>
          </div>

          {/* User Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user or attendee by name, email, or role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="tech-input w-full pl-11"
            />
          </div>

          {/* Unified Users Table */}
          <div className="border-2 border-[#141414] rounded-2xl bg-white overflow-hidden shadow-[4px_4px_0px_0px_#141414]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#141414] text-slate-700 font-black bg-[#DFDEDA] text-[10px] uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Connection Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs font-mono">
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">Synchronizing access registry...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No matching users found in registry.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuperAdmin = u.role === 'SUPER_ADMIN';
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 ${u.revoked ? 'bg-red-50/40' : ''}`}>
                        <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                            u.role === 'SUPER_ADMIN' 
                              ? 'bg-purple-100 text-purple-800 border-purple-300' 
                              : u.role === 'EVENT_MANAGER' 
                                ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                : u.role === 'EVENT_STAFF'
                                  ? 'bg-lime-100 text-lime-800 border-lime-300'
                                  : 'bg-pink-100 text-pink-800 border-pink-300'
                          }`}>
                            {u.role === 'SUPER_ADMIN' 
                              ? 'SUPER ADMIN' 
                              : u.role === 'EVENT_MANAGER' 
                                ? 'MANAGER' 
                                : u.role === 'EVENT_STAFF'
                                  ? 'STAFF'
                                  : 'ATTENDEE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.revoked ? (
                            <span className="bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                              Access Blocked
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                              Authorised
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isSuperAdmin ? (
                            <span className="text-[10px] font-bold text-slate-400 uppercase italic px-2">Protected</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleRevoke(u.id, u.type, u.revoked)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ml-auto cursor-pointer font-mono border ${
                                u.revoked
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 shadow-[2px_2px_0px_0px_#065F46]'
                                  : 'bg-red-600 hover:bg-red-700 text-white border-red-800 shadow-[2px_2px_0px_0px_#7F1D1D]'
                              } active:translate-y-0.5 active:shadow-none`}
                            >
                              {u.revoked ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Restore Access</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Revoke Access</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
