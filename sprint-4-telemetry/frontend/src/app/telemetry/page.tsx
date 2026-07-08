import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../sprint-1-auth/frontend/src/context/AuthContext';
import { 
  Shield, ShieldAlert, Activity, HardDrive, Database, Cpu, 
  RefreshCw, Search, Bell, BellOff, CheckCircle2, AlertTriangle, 
  PlusCircle, Server, Terminal, Lock, HelpCircle 
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  role: string;
  action: string;
  details: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  ipAddress?: string;
}

interface TelemetryMetrics {
  nodeId: string;
  activeWebsocketConnections: number;
  redisCacheHitRate: number;
  dbPoolActiveConnections: number;
  queueLatencyMs: number;
}

export default function TelemetrySaaSPage() {
  const { user } = useAuth(); // Simulated JWT auth context from Sprint 1

  // 1. Live Telemetry metrics
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    nodeId: 'node-aws-ecs-01',
    activeWebsocketConnections: 1048,
    redisCacheHitRate: 94.20,
    dbPoolActiveConnections: 14,
    queueLatencyMs: 12
  });

  // 2. Audit Trails state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-101',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actorId: 'System',
      role: 'System Engine',
      action: 'DATABASE_INITIALIZATION',
      details: 'EventHub database storage initialized with default configurations, point rules, and door prize thresholds.',
      severity: 'SUCCESS',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'log-102',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actorId: 'super_admin_01',
      role: 'SUPER_ADMIN',
      action: 'SAAS_METRICS_PULSE',
      details: 'Cluster telemetry checked and performance indexes validated as healthy.',
      severity: 'INFO',
      ipAddress: '192.168.1.50'
    },
    {
      id: 'log-103',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      actorId: 'Staff-Desk',
      role: 'Event Staff',
      action: 'PARTICIPANT_CHECKIN',
      details: 'Checked in participant Elena Rostova. Points credited.',
      severity: 'SUCCESS',
      ipAddress: '192.168.1.55'
    }
  ]);

  // 3. Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-101',
      title: 'Points Ledger Updated',
      message: 'You have been awarded +5 points for submitting your feedback.',
      isRead: false,
      createdAt: new Date(Date.now() - 1200000).toISOString()
    },
    {
      id: 'notif-102',
      title: 'Best Photo Spot Award!',
      message: 'Congratulations, you received +25 points for the Best Photo Spot Award.',
      isRead: true,
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ]);

  // UI interaction states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');
  
  // Custom manual event form states
  const [newEventAction, setNewEventAction] = useState('SECURITY_ALERT');
  const [newEventDetails, setNewEventDetails] = useState('');
  const [newEventSeverity, setNewEventSeverity] = useState<'INFO' | 'WARNING' | 'ERROR'>('WARNING');

  // Trigger dynamic metrics update (telemetry pulse orchestration)
  const triggerTelemetryPulse = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Random organic fluctuation around default baselines
      const activeConn = Math.floor(1000 + Math.random() * 120);
      const redisHit = parseFloat((92.0 + Math.random() * 5).toFixed(2));
      const dbPool = Math.floor(10 + Math.random() * 8);
      const queueLat = Math.floor(8 + Math.random() * 10);

      setMetrics({
        nodeId: 'node-aws-ecs-01',
        activeWebsocketConnections: activeConn,
        redisCacheHitRate: redisHit,
        dbPoolActiveConnections: dbPool,
        queueLatencyMs: queueLat
      });

      // Insert fresh system audit event
      const freshLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: 'System-Telemetry',
        role: 'SYSTEM',
        action: 'TELEMETRY_PULSE',
        details: `Dynamic telemetry check compiled. WS conn: ${activeConn}, Redis Hit: ${redisHit}%, DB Pool: ${dbPool}.`,
        severity: 'INFO',
        ipAddress: '127.0.0.1'
      };

      setAuditLogs(prev => [freshLog, ...prev]);
      setIsRefreshing(false);
    }, 800);
  };

  // Handle manual log injection
  const handleInjectEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDetails.trim()) return;

    const loggedUser = user?.username || 'super_admin_01';
    const loggedRole = user?.role || 'SUPER_ADMIN';

    const freshLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: loggedUser,
      role: loggedRole,
      action: newEventAction,
      details: newEventDetails,
      severity: newEventSeverity as any,
      ipAddress: '192.168.1.100'
    };

    setAuditLogs(prev => [freshLog, ...prev]);
    setNewEventDetails('');

    // Generate automatic warning notification to system operator
    if (newEventSeverity === 'ERROR' || newEventSeverity === 'WARNING') {
      const systemNotif: Notification = {
        id: `notif-${Date.now()}`,
        title: `Security Event: ${newEventAction}`,
        message: `Alert triggered by ${loggedUser}: ${newEventDetails}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [systemNotif, ...prev]);
    }
  };

  // Mark single notification read
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Mark all notifications read
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.actorId.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#00FF00]" />
            <h1 className="text-xl font-bold font-mono tracking-tight uppercase text-white">EventHub SaaS Telemetry Control</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Orchestration, Logging, & Live Notification Stream — Active Node: <span className="text-[#00FF00]">{metrics.nodeId}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0 font-mono text-xs">
          <div className="bg-black py-1.5 px-3 border border-zinc-800 rounded-none flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00FF00] animate-pulse"></span>
            <span className="text-zinc-400">Node Status:</span>
            <span className="text-white font-bold">ONLINE</span>
          </div>

          <button 
            onClick={triggerTelemetryPulse}
            disabled={isRefreshing}
            className="text-black bg-[#00FF00] hover:bg-emerald-400 text-xs flex items-center gap-1.5 py-1.5 px-4 font-bold rounded-none border border-emerald-500 cursor-pointer transition-all uppercase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'PULSING...' : 'TELEMETRY PULSE'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Metrics, Notifications, & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Metric Cards - Left Grid (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f0f0f] border border-zinc-800 p-5 font-mono">
            <h2 className="text-[#00FF00] font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>Container DevOps Performance Stats</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Metric 1 */}
              <div className="bg-black p-4 border border-zinc-800 flex items-center gap-4">
                <div className="h-10 w-10 bg-black border border-zinc-700 text-[#00FF00] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-widest font-bold">WS Connections</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5">
                    {metrics.activeWebsocketConnections} conn
                  </span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-black p-4 border border-zinc-800 flex items-center gap-4">
                <div className="h-10 w-10 bg-black border border-zinc-700 text-[#00FF00] flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-widest font-bold">Redis Cache Hit</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5">
                    {metrics.redisCacheHitRate}%
                  </span>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-black p-4 border border-zinc-800 flex items-center gap-4">
                <div className="h-10 w-10 bg-black border border-zinc-700 text-[#00FF00] flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-widest font-bold">Postgres SQL Pool</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5">
                    {metrics.dbPoolActiveConnections} / 20 Active
                  </span>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="bg-black p-4 border border-zinc-800 flex items-center gap-4">
                <div className="h-10 w-10 bg-black border border-zinc-700 text-[#00FF00] flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-widest font-bold">BullMQ Latency</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5">
                    {metrics.queueLatencyMs}ms avg
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Notifications Center (Right Column) */}
        <div className="space-y-6">
          <div className="bg-[#0f0f0f] border border-zinc-800 p-5">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
              <h2 className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00FF00]" />
                <span>In-App Notifications ({unreadCount})</span>
              </h2>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllNotificationsRead}
                  className="text-[#00FF00] hover:underline text-[10px] bg-transparent border-0 cursor-pointer font-mono font-bold"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                  <BellOff className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
                  <span>No notifications in sandbox</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 border border-zinc-800 font-mono text-xs transition-all relative ${
                      notif.isRead ? 'bg-black opacity-60' : 'bg-zinc-900 border-l-2 border-l-[#00FF00]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-[11px] text-white tracking-tight">{notif.title}</h4>
                      {!notif.isRead && (
                        <button 
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-[#00FF00] hover:text-white text-[9px] bg-transparent py-0.5 px-1.5 border border-zinc-700 cursor-pointer font-bold"
                        >
                          Read
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-zinc-600 text-[8px] block mt-2 text-right">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Grid Row 2: Audit Logs & Event Injector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Audit Log Stream - Left Grid (Span 2) */}
        <div className="lg:col-span-2 bg-[#0f0f0f] border border-zinc-800 p-5 font-mono text-xs">
          <div className="border-b border-zinc-800 pb-4 mb-4">
            <h2 className="text-white font-bold text-sm uppercase mb-3 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#00FF00]" />
              <span>System Security Audit Logs ({filteredLogs.length})</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter logs by actor, details..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="bg-black border border-zinc-800 text-slate-100 placeholder-zinc-500 py-2 pl-9 pr-4 text-xs font-mono w-full rounded-none outline-none focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]"
                />
              </div>

              {/* Severity Quick Tabs */}
              <div className="flex gap-1.5 overflow-x-auto text-[10px] font-bold">
                {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`py-2 px-3 border transition-all cursor-pointer rounded-none uppercase ${
                      severityFilter === sev
                        ? 'bg-[#00FF00] text-black border-emerald-500'
                        : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 font-mono">
                No matching logs found.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const sevColors = {
                  SUCCESS: 'text-[#00FF00] bg-emerald-950/40 border-emerald-900',
                  INFO: 'text-sky-400 bg-sky-950/40 border-sky-900',
                  WARNING: 'text-amber-400 bg-amber-950/40 border-amber-900',
                  ERROR: 'text-rose-500 bg-rose-950/40 border-rose-950'
                };
                return (
                  <div key={log.id} className={`p-3.5 border bg-black font-mono text-[11px] leading-relaxed relative ${sevColors[log.severity] || 'border-zinc-800 text-white'}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1.5 border-b border-zinc-900 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {log.role}
                        </span>
                        <span className="font-bold text-white font-mono">{log.actorId}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="text-white font-bold font-mono mr-1.5 uppercase tracking-wide text-[10px]">
                        [{log.action}]
                      </span>
                      <span className="text-zinc-300">{log.details}</span>
                    </div>

                    {log.ipAddress && (
                      <span className="absolute bottom-1.5 right-2 text-[8px] text-zinc-600 font-mono font-bold tracking-wider">
                        IP: {log.ipAddress}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Incident / Security Audit Injector */}
        <div className="bg-[#0f0f0f] border border-zinc-800 p-5 font-mono">
          <h2 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
            <PlusCircle className="w-4.5 h-4.5 text-[#00FF00]" />
            <span>Audit Event Injector</span>
          </h2>

          <form onSubmit={handleInjectEvent} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Action Type
              </label>
              <select
                value={newEventAction}
                onChange={(e) => setNewEventAction(e.target.value)}
                className="bg-black border border-zinc-800 text-white p-2.5 w-full rounded-none font-mono focus:border-[#00FF00]"
              >
                <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                <option value="INCIDENT_REPORT">INCIDENT_REPORT</option>
                <option value="MANUAL_LEDGER_ADJUST">MANUAL_LEDGER_ADJUST</option>
                <option value="RATE_LIMIT_EXCEEDED">RATE_LIMIT_EXCEEDED</option>
                <option value="WS_CLIENT_DISCONNECT">WS_CLIENT_DISCONNECT</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Incident Severity
              </label>
              <div className="flex gap-2">
                {(['INFO', 'WARNING', 'ERROR'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setNewEventSeverity(sev)}
                    className={`py-2 px-3 border text-[10px] font-bold flex-1 rounded-none uppercase text-center transition-all ${
                      newEventSeverity === sev
                        ? sev === 'ERROR' ? 'bg-rose-950 text-rose-400 border-rose-700' :
                          sev === 'WARNING' ? 'bg-amber-950 text-amber-400 border-amber-700' :
                          'bg-sky-950 text-sky-400 border-sky-700'
                        : 'bg-black text-zinc-500 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Log Details / Message
              </label>
              <textarea
                value={newEventDetails}
                onChange={(e) => setNewEventDetails(e.target.value)}
                placeholder="Describe the incident or system change..."
                rows={3}
                className="bg-black border border-zinc-800 text-slate-100 placeholder-zinc-500 p-2.5 font-mono w-full rounded-none outline-none focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="text-black bg-[#00FF00] hover:bg-emerald-400 py-2.5 w-full font-bold rounded-none border border-emerald-500 cursor-pointer transition-all uppercase text-center font-mono block"
            >
              COMMIT TO LEDGER
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
