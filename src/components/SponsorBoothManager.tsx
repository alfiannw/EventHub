import React, { useState, useEffect } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { 
  Users, TrendingUp, Award, Download, Trash2, Search, QrCode, Sparkles, 
  RefreshCw, MapPin, Building, Mail, Briefcase, Calendar, ShieldAlert, CheckCircle 
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  visitedAt: string;
}

interface BoothLeadGen {
  boothId: string;
  boothName: string;
  boothCode: string;
  leadsCount: number;
  leads: Lead[];
}

interface BoothTrafficItem {
  id: string;
  name: string;
  boothCode: string;
  location: string;
  totalVisits: number;
  uniqueVisitors: number;
  pointsDistributed: number;
}

interface SponsorStats {
  boothTraffic: BoothTrafficItem[];
  popularBooths: BoothTrafficItem[];
  leadGen: BoothLeadGen[];
  engagementRate: number;
  avgBoothsVisited: number;
  totalVisits: number;
  uniqueScannersCount: number;
  checkedInCount: number;
}

export default function SponsorBoothManager() {
  const [stats, setStats] = useState<SponsorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoothId, setSelectedBoothId] = useState<string>('ALL');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQRBooth, setSelectedQRBooth] = useState<{ name: string; boothCode: string; location?: string; points?: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/sponsor-booth/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setError('');
      } else {
        setError('Failed to fetch sponsor statistics.');
      }
    } catch (err) {
      console.error(err);
      setError('A connection error occurred while loading sponsor metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetVisits = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/sponsor-booth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchStats();
        setShowResetConfirm(false);
      } else {
        alert('Failed to reset visits.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    } finally {
      setResetting(false);
    }
  };

  // CSV Downloader for lead generation
  const downloadLeadsCSV = (boothId: string) => {
    if (!stats) return;

    let leadsToExport: { boothName: string; boothCode: string; name: string; email: string; company: string; position: string; visitedAt: string }[] = [];

    if (boothId === 'ALL') {
      stats.leadGen.forEach(bg => {
        bg.leads.forEach(l => {
          leadsToExport.push({
            boothName: bg.boothName,
            boothCode: bg.boothCode,
            name: l.name,
            email: l.email,
            company: l.company || 'N/A',
            position: l.position || 'N/A',
            visitedAt: new Date(l.visitedAt).toISOString()
          });
        });
      });
    } else {
      const bg = stats.leadGen.find(item => item.boothId === boothId);
      if (bg) {
        bg.leads.forEach(l => {
          leadsToExport.push({
            boothName: bg.boothName,
            boothCode: bg.boothCode,
            name: l.name,
            email: l.email,
            company: l.company || 'N/A',
            position: l.position || 'N/A',
            visitedAt: new Date(l.visitedAt).toISOString()
          });
        });
      }
    }

    if (leadsToExport.length === 0) {
      alert('No lead records found to export.');
      return;
    }

    // Generate CSV contents
    const headers = ['Sponsor Name', 'Booth Code', 'Lead Name', 'Email Address', 'Company/Organization', 'Designation/Position', 'Scan Timestamp'];
    const rows = leadsToExport.map(l => [
      `"${l.boothName.replace(/"/g, '""')}"`,
      `"${l.boothCode.replace(/"/g, '""')}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      `"${l.position.replace(/"/g, '""')}"`,
      `"${l.visitedAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sponsor_Leads_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !stats) {
    return (
      <div className="p-8 text-center bg-white border-[1.5px] border-[#141414] font-mono text-xs">
        <RefreshCw className="w-5 h-5 mx-auto animate-spin text-indigo-600 mb-2" />
        <span>Loading live Sponsor Booth analytics...</span>
      </div>
    );
  }

  // Calculate filtered leads
  const allLeads: { boothName: string; boothCode: string; lead: Lead }[] = [];
  if (stats) {
    stats.leadGen.forEach(bg => {
      bg.leads.forEach(l => {
        if (selectedBoothId === 'ALL' || bg.boothId === selectedBoothId) {
          const matchSearch = 
            l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.company && l.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
            bg.boothName.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (matchSearch) {
            allLeads.push({
              boothName: bg.boothName,
              boothCode: bg.boothCode,
              lead: l
            });
          }
        }
      });
    });
  }

  // Sort leads by latest visit
  allLeads.sort((a, b) => new Date(b.lead.visitedAt).getTime() - new Date(a.lead.visitedAt).getTime());

  return (
    <div className="space-y-6">
      
      {/* Title & Control Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border-[1.5px] border-[#141414]">
        <div className="font-mono">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-lg">★</span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sponsor Booth Engagement & Lead Console</h2>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Track real-time sponsor traffic, visitor demographics, lead lists, and distributor statistics.</p>
        </div>

        <div className="flex items-center gap-2 font-mono self-end sm:self-auto">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-slate-50 border border-slate-400 hover:bg-slate-100 text-slate-700 text-[10px] uppercase font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => downloadLeadsCSV('ALL')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-black border border-black flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All Leads</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-400 text-red-700 text-[10px] uppercase font-black flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Scans</span>
          </button>
        </div>
      </div>

      {/* Safety warning banner */}
      {error && (
        <div className="p-4 bg-red-100 border-[1.5px] border-red-900 text-red-900 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats KPI Widgets Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="tech-card p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500 text-[9px] uppercase font-black block tracking-wider">Total Scans</span>
                <span className="text-xl font-extrabold text-slate-900 block mt-1">{stats.totalVisits} visits</span>
              </div>
              <div className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-[8px] text-slate-400">Sum of scans across all booths</div>
          </div>

          <div className="tech-card p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500 text-[9px] uppercase font-black block tracking-wider">Unique Visitors</span>
                <span className="text-xl font-extrabold text-indigo-900 block mt-1">{stats.uniqueScannersCount} attendees</span>
              </div>
              <div className="p-1.5 bg-green-50 border border-green-200 text-green-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-[8px] text-slate-400">{stats.checkedInCount > 0 ? `${((stats.uniqueScannersCount / stats.checkedInCount) * 100).toFixed(1)}%` : '0%'} of checked-in attendees</div>
          </div>

          <div className="tech-card p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500 text-[9px] uppercase font-black block tracking-wider">Engagement Rate</span>
                <span className="text-xl font-extrabold text-emerald-950 block mt-1">{stats.engagementRate}%</span>
              </div>
              <div className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-[8px] text-slate-400">Engaged checked-in attendance</div>
          </div>

          <div className="tech-card p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500 text-[9px] uppercase font-black block tracking-wider">Average Booths</span>
                <span className="text-xl font-extrabold text-slate-900 block mt-1">{stats.avgBoothsVisited} visited</span>
              </div>
              <div className="p-1.5 bg-amber-50 border border-amber-200 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-[8px] text-slate-400">Scans per active participant</div>
          </div>
        </div>
      )}

      {/* Two-Column Analytics Layout */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Popularity ranking & Traffic details */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Popular booths section */}
            <div className="tech-card p-5 bg-white font-mono space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase border-b border-[#141414] pb-2 flex items-center justify-between">
                <span>🏆 Popularity Index</span>
                <span className="text-[9px] text-slate-500 font-normal normal-case">By total check-ins</span>
              </h3>

              <div className="space-y-4">
                {stats.popularBooths.map((booth, idx) => {
                  const maxVisits = Math.max(...stats.boothTraffic.map(b => b.totalVisits), 1);
                  const progressPercentage = (booth.totalVisits / maxVisits) * 100;

                  return (
                    <div key={booth.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-black border border-black ${
                            idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">{booth.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal">({booth.boothCode})</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{booth.totalVisits} scans</span>
                      </div>

                      <div className="relative w-full h-4 bg-slate-50 border border-slate-200">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            idx === 0 ? 'bg-yellow-400/80' : idx === 1 ? 'bg-indigo-400/80' : idx === 2 ? 'bg-amber-400/80' : 'bg-slate-400/80'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                        <span className="absolute right-2 top-0.5 text-[8px] font-bold text-slate-500">
                          {booth.uniqueVisitors} unique visitors
                        </span>
                      </div>
                    </div>
                  );
                })}

                {stats.popularBooths.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No booths found. Complete configuration in 00 Event Setup.
                  </div>
                )}
              </div>
            </div>

            {/* General Booth Traffic table */}
            <div className="tech-card p-5 bg-white font-mono space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase border-b border-[#141414] pb-2">
                📂 Booth Traffic Detail
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-500 uppercase tracking-wider font-extrabold">
                      <th className="py-2">Booth</th>
                      <th className="py-2 text-center">Total</th>
                      <th className="py-2 text-center">Unique</th>
                      <th className="py-2 text-right">Points Paid</th>
                      <th className="py-2 text-right">QR Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {stats.boothTraffic.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2">
                          <span className="font-bold block text-slate-900">{b.name}</span>
                          <span className="text-[8px] text-slate-400 font-serif">{b.location || 'Central Corridor'}</span>
                        </td>
                        <td className="py-2 text-center font-bold text-slate-900">{b.totalVisits}</td>
                        <td className="py-2 text-center">{b.uniqueVisitors}</td>
                        <td className="py-2 text-right text-indigo-600 font-bold">+{b.pointsDistributed}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => {
                              setSelectedQRBooth({
                                name: b.name,
                                boothCode: b.boothCode,
                                location: b.location || 'Central Corridor',
                                points: b.pointsDistributed > 0 ? b.pointsDistributed / Math.max(1, b.totalVisits) : 10
                              });
                              setCopiedCode(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 text-indigo-950 font-black text-[9px] uppercase transition-all cursor-pointer rounded-none"
                            title="Generate & View QR Code for this sponsor booth"
                          >
                            <QrCode className="w-3 h-3 text-indigo-600" />
                            <span>Get QR</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Panel: Lead Generation lists, filters, CSV exporter */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="tech-card p-5 bg-white font-mono space-y-4">
              <div className="border-b border-[#141414] pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase">📇 Real-time Lead Generation</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Track attendee details collected from booth scans.</p>
                </div>

                {/* Filter and export */}
                {selectedBoothId !== 'ALL' && (
                  <button
                    onClick={() => downloadLeadsCSV(selectedBoothId)}
                    className="px-2.5 py-1 text-[9px] bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 text-indigo-900 font-bold uppercase flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Booth Leads</span>
                  </button>
                )}
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400">Filter By Sponsor Booth</label>
                  <select
                    value={selectedBoothId}
                    onChange={(e) => setSelectedBoothId(e.target.value)}
                    className="w-full bg-white border border-[#141414] text-xs p-1.5 focus:outline-none font-bold"
                  >
                    <option value="ALL">Show All Sponsors ({stats.leadGen.reduce((sum, item) => sum + item.leadsCount, 0)} leads)</option>
                    {stats.leadGen.map(bg => (
                      <option key={bg.boothId} value={bg.boothId}>{bg.boothName} ({bg.leadsCount} leads)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400">Search Visitor Details</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, email, corporate..."
                      className="w-full bg-white border border-[#141414] text-xs p-1.5 pl-7 focus:outline-none font-bold"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  </div>
                </div>
              </div>

              {/* Leads Directory list */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">
                  Lead Entries ({allLeads.length} record{allLeads.length !== 1 ? 's' : ''} found)
                </span>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {allLeads.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-300 relative hover:bg-indigo-50/20 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-xs">{item.lead.name}</span>
                            <span className="bg-indigo-100 text-indigo-800 text-[8px] font-black uppercase px-1 py-0.5 border border-indigo-200">
                              {item.boothName} ({item.boothCode})
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{item.lead.email}</span>
                            </span>
                            {item.lead.company && (
                              <span className="flex items-center gap-1.5">
                                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.lead.company}</span>
                              </span>
                            )}
                            {item.lead.position && (
                              <span className="flex items-center gap-1.5 sm:col-span-2">
                                <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.lead.position}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[8px] text-slate-400 whitespace-nowrap bg-white border border-slate-200 px-1.5 py-0.5 font-sans">
                          {new Date(item.lead.visitedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {allLeads.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 text-slate-400 text-xs">
                      No leads matching filters. Try selecting another booth or typing another query.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-[2px] border-[#141414] max-w-md w-full p-6 font-mono space-y-4">
            <div className="flex items-start gap-3 text-red-700">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm uppercase">Reset Sponsor Visits Confirmation</h3>
                <p className="text-xs text-slate-500 mt-1">WARNING: This action is irreversible.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will clear all participant scan records from sponsor booths, reset sponsor point rewards, and remove corresponding activities from the feed. Ranks and scores will adjust immediately.
            </p>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-[#141414] hover:bg-slate-100 text-slate-800 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetVisits}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold border border-black cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Sponsor Booth QR Code Modal */}
      {selectedQRBooth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-[2px] border-[#141414] max-w-sm w-full p-6 font-mono space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedQRBooth(null)}
              className="absolute top-3 right-3 text-slate-500 hover:text-black font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b border-[#141414] pb-2 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Sponsor Verification Pass</span>
              <h3 className="font-black text-sm uppercase text-slate-900 tracking-tight">{selectedQRBooth.name}</h3>
              <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">Code: {selectedQRBooth.boothCode}</span>
            </div>

            {/* Live Local Client-Generated QR Code */}
            <div className="bg-white border-[1.5px] border-[#141414] p-4 flex flex-col items-center justify-center relative">
              <QRCodeDisplay
                value={selectedQRBooth.boothCode}
                size={250}
                className="w-48 h-48 border border-slate-100"
              />
              <div className="text-[8px] text-slate-500 mt-2 text-center font-mono font-bold select-all break-all max-w-full">
                CODE: {selectedQRBooth.boothCode}
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-bold">
              <div className="bg-slate-50 border border-slate-200 p-1.5">
                <span className="text-slate-400 block uppercase">Location</span>
                <span className="text-slate-800 uppercase text-[10px]">{selectedQRBooth.location || 'Exhibition Hall'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5">
                <span className="text-slate-400 block uppercase">Claim Value</span>
                <span className="text-emerald-700 text-[10px]">+{selectedQRBooth.points || 10} PTS</span>
              </div>
            </div>

            {/* Instructions & Actions */}
            <div className="space-y-2 text-xs">
              <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                Display this QR Code at your sponsor counter. Attendees scan it to register their visit and claim points.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedQRBooth.boothCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="py-1.5 border border-[#141414] hover:bg-slate-100 font-bold text-[10px] uppercase transition-colors cursor-pointer text-center"
                >
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(selectedQRBooth.boothCode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase transition-colors text-center border border-black flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Get Hi-Res</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
