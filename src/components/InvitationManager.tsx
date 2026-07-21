import React, { useState, useMemo, useRef } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  MapPin, 
  Plus, 
  CheckCircle, 
  Upload, 
  Send, 
  AlertCircle, 
  Edit2, 
  Search, 
  Download, 
  Filter, 
  Check, 
  X, 
  ChevronRight, 
  Trash2, 
  Layers, 
  FileSpreadsheet, 
  HelpCircle,
  Copy,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { EventConfig, Participant, DoorPrizeCategory, LuckyDrawCategory } from '../types';
import * as XLSX from 'xlsx';

interface InvitationManagerProps {
  eventConfig: EventConfig | null;
  participants: Participant[];
  doorPrizes: DoorPrizeCategory[];
  luckyDraws: LuckyDrawCategory[];
  onUpdateConfig: (config: Partial<EventConfig>) => Promise<void>;
  onBulkImport: (guests: any[]) => Promise<void>;
  onToggleApprove?: (id: string, approved: boolean) => Promise<void>;
}

export default function InvitationManager({
  eventConfig,
  participants,
  doorPrizes,
  luckyDraws,
  onUpdateConfig,
  onBulkImport,
  onToggleApprove
}: InvitationManagerProps) {
  
  // Tab states for Manager sub-module
  const [managerSubModule, setManagerSubModule] = useState<'ANALYTICS' | 'IMPORT' | 'BROADCAST'>('ANALYTICS');

  // Config edit states
  const [eventName, setEventName] = useState(eventConfig?.name || '');
  const [eventVenue, setEventVenue] = useState(eventConfig?.venue || '');
  const [eventDate, setEventDate] = useState(eventConfig?.date || '');
  const [eventTime, setEventTime] = useState(eventConfig?.time || '');
  const [appUrl, setAppUrl] = useState(eventConfig?.appUrl || '');
  const [configSuccess, setConfigSuccess] = useState(false);

  // Manual participant form states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualPosition, setManualPosition] = useState('');
  const [manualTable, setManualTable] = useState('');
  const [manualSeat, setManualSeat] = useState('');
  const [manualAddSuccess, setManualAddSuccess] = useState(false);
  const [manualAddError, setManualAddError] = useState('');

  // Bulk import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedGuests, setParsedGuests] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [bulkImportSuccess, setBulkImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Broadcast & Live preview states
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');
  const [checkedGuests, setCheckedGuests] = useState<Record<string, boolean>>({});
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable email / whatsapp subject & body templates
  const [emailSubject, setEmailSubject] = useState(
    `Exclusive Invitation: ${eventConfig?.name || 'EventHub Global Summit 2026'}`
  );
  const [emailBody, setEmailBody] = useState(
    `Dear [Name],\n\nYou are cordially invited to join us at the upcoming ${eventConfig?.name || 'EventHub Global Summit 2026'}.\n\nDetails:\nDate: [Date]\nTime: [Time]\nVenue: [Venue]\nGoogle Maps: [MapLink]\n\nPlease RSVP today to secure your attendance and table assignment.`
  );
  const [waMessage, setWaMessage] = useState(
    `🌟 *OFFICIAL E-INVITATION* 🌟\n\n` +
    `Dear *[Name]*,\n\n` +
    `You are cordially invited as our esteemed guest to attend the highly anticipated *${eventConfig?.name || 'EventHub Global Summit'}*.\n\n` +
    `Join us for a premium curated experience featuring forward-thinking presentations, valuable networking sessions with key industry leaders, and exclusive insights.\n\n` +
    `📅 *EVENT TIMELINE & DETAILS:*\n` +
    `• *Date:* [Date]\n` +
    `• *Time:* [Time]\n` +
    `• *Venue:* [Venue]\n\n` +
    `📍 *VENUE NAVIGATION:*\n` +
    `Get direct coordinates and routing on Google Maps here:\n` +
    `👉 [MapLink]\n\n` +
    `🎟️ *ACTION REQUIRED (RSVP):*\n` +
    `Please secure your attendance, select your food preferences, and lock in your priority table assignment through our secure portal below:\n` +
    `👉 [Link]\n` +
    `_(Your Guest Pass ID: *[ID]*)_\n\n` +
    `We look forward to welcoming you to this landmark event!\n\n` +
    `Warm regards,\n` +
    `*EventHub Executive Committee*`
  );

  // Synchronize input fields when eventConfig changes
  React.useEffect(() => {
    if (eventConfig) {
      setEventName(eventConfig.name);
      setEventVenue(eventConfig.venue);
      setEventDate(eventConfig.date);
      setEventTime(eventConfig.time);
      setAppUrl(eventConfig.appUrl || '');
    }
  }, [eventConfig]);

  // Set default selected participant when list loads
  React.useEffect(() => {
    if (participants.length > 0 && !selectedParticipantId) {
      setSelectedParticipantId(participants[0].id);
    }
  }, [participants, selectedParticipantId]);

  // Active selected participant
  const activeParticipant = useMemo(() => {
    return participants.find(p => p.id === selectedParticipantId) || participants[0];
  }, [participants, selectedParticipantId]);

  // Calculate Tracking Metrics (System tracks: Delivered, Opened, Registered, Declined)
  const stats = useMemo(() => {
    const total = participants.length;
    let delivered = 0;
    let opened = 0;
    let registered = 0;
    let declined = 0;
    let notSent = 0;

    participants.forEach(p => {
      // map rsvpStatus/invitationStatus
      const status = p.invitationStatus || 'NOT_SENT';
      if (status === 'REGISTERED' || p.rsvpStatus === 'YES') {
        registered++;
      } else if (status === 'DECLINED' || p.rsvpStatus === 'NO') {
        declined++;
      } else if (status === 'OPENED') {
        opened++;
      } else if (status === 'DELIVERED') {
        delivered++;
      } else {
        notSent++;
      }
    });

    const getPct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

    return {
      total,
      delivered: { count: delivered, pct: getPct(delivered) },
      opened: { count: opened, pct: getPct(opened) },
      registered: { count: registered, pct: getPct(registered) },
      declined: { count: declined, pct: getPct(declined) },
      notSent: { count: notSent, pct: getPct(notSent) }
    };
  }, [participants]);

  // Handle coordination submit
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateConfig({
        name: eventName,
        venue: eventVenue,
        date: eventDate,
        time: eventTime,
        appUrl: appUrl
      });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Download excel/csv template helper
  const handleDownloadTemplate = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Position', 'Table Number', 'Seat Number'];
    const sampleRows = [
      ['Elon Musk', 'elon.musk@spacex.com', '+1 (555) 012-3456', 'SpaceX', 'Chief Engineer', 'Table 1', 'Seat VIP-1'],
      ['Satya Nadella', 'satya.n@microsoft.com', '+1 (555) 789-1011', 'Microsoft', 'CEO', 'Table 1', 'Seat VIP-2'],
      ['Tim Cook', 'tcook@apple.com', '+1 (555) 121-2323', 'Apple Inc.', 'CEO', 'Table 2', 'Seat A-1'],
      ['Sheryl Sandberg', 'sheryl@leanin.org', '+1 (555) 999-8888', 'LeanIn.Org', 'Founder', 'Table 3', 'Seat B-2']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'event_guest_list_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process Excel/CSV Spreadsheet upload
  const processSpreadsheet = (file: File) => {
    setUploadError('');
    setParsedGuests([]);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Could not read file data.");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          throw new Error("No data found or missing header row in spreadsheet.");
        }

        // Parse headers and find columns mapping
        const rawHeaders = json[0] as string[];
        const headers = rawHeaders.map(h => (h || '').toString().trim().toLowerCase());

        const nameIdx = headers.findIndex(h => h.includes('name'));
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
        const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('mobile'));
        const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('org') || h.includes('firm'));
        const positionIdx = headers.findIndex(h => h.includes('position') || h.includes('title') || h.includes('role'));
        const tableIdx = headers.findIndex(h => h.includes('table'));
        const seatIdx = headers.findIndex(h => h.includes('seat'));

        if (nameIdx === -1 || emailIdx === -1) {
          throw new Error("Columns for 'Name' and 'Email' must be present in the spreadsheet header row.");
        }

        const list: any[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0 || !row[nameIdx]) continue;

          list.push({
            name: row[nameIdx]?.toString().trim() || '',
            email: row[emailIdx]?.toString().trim() || '',
            phone: phoneIdx !== -1 ? row[phoneIdx]?.toString().trim() || '' : '',
            company: companyIdx !== -1 ? row[companyIdx]?.toString().trim() || 'Independent' : 'Independent',
            position: positionIdx !== -1 ? row[positionIdx]?.toString().trim() || 'Attendee' : 'Attendee',
            tableNumber: tableIdx !== -1 ? row[tableIdx]?.toString().trim() || 'Table Pending' : 'Table Pending',
            seatNumber: seatIdx !== -1 ? row[seatIdx]?.toString().trim() || 'Seat Pending' : 'Seat Pending'
          });
        }

        if (list.length === 0) {
          throw new Error("No valid guest rows were parsed from the spreadsheet.");
        }

        setParsedGuests(list);
      } catch (err: any) {
        setUploadError(err.message || "Failed to process spreadsheet file.");
      }
    };

    reader.onerror = () => {
      setUploadError("Error reading spreadsheet file.");
    };

    reader.readAsBinaryString(file);
  };

  // Drag and drop spreadsheet
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSpreadsheet(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSpreadsheet(file);
    }
  };

  // Submit bulk imports to database
  const handleCommitBulkImport = async () => {
    if (parsedGuests.length === 0) return;
    try {
      await onBulkImport(parsedGuests);
      setImportedCount(parsedGuests.length);
      setBulkImportSuccess(true);
      setParsedGuests([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setBulkImportSuccess(false), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to import guests onto server database.");
    }
  };

  // Manual guest input form submit
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualAddError('');
    setManualAddSuccess(false);

    if (!manualName || !manualEmail) {
      setManualAddError("Name and Email are required fields.");
      return;
    }

    try {
      const newGuest = {
        name: manualName,
        email: manualEmail,
        phone: manualPhone,
        company: manualCompany || 'Self-Employed',
        position: manualPosition || 'Invited Guest',
        tableNumber: manualTable || 'Table Pending',
        seatNumber: manualSeat || 'Seat Pending',
        rsvpStatus: 'PENDING',
        invitationStatus: 'NOT_SENT'
      };

      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add participant.");
      }

      setManualAddSuccess(true);
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setManualCompany('');
      setManualPosition('');
      setManualTable('');
      setManualSeat('');
      
      // Trigger App.tsx to reload lists
      await onBulkImport([]);

      setTimeout(() => setManualAddSuccess(false), 3000);
    } catch (err: any) {
      setManualAddError(err.message || "Could not register guest.");
    }
  };

  // Send invitation to selected participant or checked guests
  const handleSendInvitations = async () => {
    // Collect active target ID list
    const targetIds = Object.keys(checkedGuests).filter(id => checkedGuests[id]);
    
    // If none are checked, default to the currently viewed participant
    const finalIds = targetIds.length > 0 ? targetIds : (activeParticipant ? [activeParticipant.id] : []);

    if (finalIds.length === 0) {
      setDispatchResult("[ERROR] No recipient selected. Check a guest or select one from the viewer.");
      return;
    }

    setIsDispatching(true);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: finalIds,
          channel: selectedChannel,
          emailSubject,
          emailBody,
          waMessage
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Broadcast server response error.");
      }

      const result = await res.json();
      if (result.warning) {
        setDispatchResult(`[WARNING] ${result.warning}`);
      } else {
        setDispatchResult(`[SUCCESS] Dispatched ${result.countSent} invitations successfully via ${selectedChannel}!`);
      }
      setCheckedGuests({});
      // Trigger App.tsx reload
      await onBulkImport([]);
    } catch (err: any) {
      setDispatchResult(`[ERROR] Broadcast failed: ${err.message}`);
    } finally {
      setIsDispatching(false);
      setTimeout(() => setDispatchResult(null), 5000);
    }
  };

  // Toggle checkout list
  const toggleCheckGuest = (id: string) => {
    setCheckedGuests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllVisibleGuests = (visibleList: Participant[]) => {
    const allChecked = visibleList.every(p => checkedGuests[p.id]);
    const next: Record<string, boolean> = { ...checkedGuests };
    visibleList.forEach(p => {
      next[p.id] = !allChecked;
    });
    setCheckedGuests(next);
  };

  // Generate and Download ICS Calendar file client-side
  const handleDownloadCalendarInvite = (participant: Participant) => {
    if (!participant) return;
    const title = eventConfig?.name || "EventHub Global Summit 2026";
    const venue = eventConfig?.venue || "Grand Ballroom, Tech Plaza";
    const rawDate = eventConfig?.date || "2026-07-15"; // e.g. "2026-07-15"
    
    // Format date for ICS (YYYYMMDD)
    const datePart = rawDate.replace(/-/g, "");

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventHub//NONSGML Invitation//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `LOCATION:${venue}`,
      `DESCRIPTION:Hello ${participant.name},\\n\\nYou are cordially invited to attend ${title}.\\n\\nYour Seating details: Table & seat assignment will be disclosed at Check-In upon arrival at the venue.\\n\\nManage your RSVP & View details here: ${window.location.origin}/rsvp?id=${participant.id}\\n\\nWe look forward to seeing you there!`,
      `DTSTART:${datePart}T090000`,
      `DTEND:${datePart}T170000`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_Calendar_Invite.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search guests for Broadcast Station
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // 1. Filter by search text
      const search = searchText.toLowerCase().trim();
      const matchSearch = !search || 
        p.name.toLowerCase().includes(search) || 
        p.email.toLowerCase().includes(search) || 
        p.company.toLowerCase().includes(search) || 
        p.id.toLowerCase().includes(search);

      if (!matchSearch) return false;

      // 2. Filter by status
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'AWAITING_APPROVAL') return p.approved === false;
      if (p.approved === false) return false;
      const status = p.invitationStatus || 'NOT_SENT';
      if (statusFilter === 'NOT_SENT' && status === 'NOT_SENT' && p.rsvpStatus === 'PENDING') return true;
      if (statusFilter === 'DELIVERED' && status === 'DELIVERED' && p.rsvpStatus === 'PENDING') return true;
      if (statusFilter === 'OPENED' && status === 'OPENED' && p.rsvpStatus === 'PENDING') return true;
      if (statusFilter === 'REGISTERED' && (status === 'REGISTERED' || p.rsvpStatus === 'YES')) return true;
      if (statusFilter === 'DECLINED' && (status === 'DECLINED' || p.rsvpStatus === 'NO')) return true;
      
      return false;
    });
  }, [participants, searchText, statusFilter]);

  // Construct Personalized Message Previews
  const personalizedEmailBody = useMemo(() => {
    if (!activeParticipant) return '';
    return emailBody
      .replace(/\[Name\]/g, activeParticipant.name)
      .replace(/\[Date\]/g, eventConfig?.date || '2026-07-15')
      .replace(/\[Time\]/g, eventConfig?.time || '09:00 AM - 05:00 PM')
      .replace(/\[Venue\]/g, eventConfig?.venue || 'Grand Ballroom')
      .replace(/\[MapLink\]/g, eventConfig?.googleMapsUrl || 'https://maps.google.com');
  }, [activeParticipant, emailBody, eventConfig]);

  const personalizedWaMessage = useMemo(() => {
    if (!activeParticipant) return '';
    const rsvpLink = `${window.location.origin}/rsvp?id=${activeParticipant.id}`;
    return waMessage
      .replace(/\[Name\]/g, activeParticipant.name)
      .replace(/\[Link\]/g, rsvpLink)
      .replace(/\[ID\]/g, activeParticipant.id)
      .replace(/\[Date\]/g, eventConfig?.date || '2026-07-15')
      .replace(/\[Time\]/g, eventConfig?.time || '09:00 AM - 05:00 PM')
      .replace(/\[Venue\]/g, eventConfig?.venue || 'Grand Ballroom')
      .replace(/\[MapLink\]/g, eventConfig?.googleMapsUrl || 'https://maps.google.com');
  }, [activeParticipant, waMessage, eventConfig]);

  const activeRsvpLink = useMemo(() => {
    if (!activeParticipant) return '';
    return `${window.location.origin}/rsvp?id=${activeParticipant.id}`;
  }, [activeParticipant]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeRsvpLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Quick helper to map status strings to badges
  const getStatusBadge = (status: string, rsvp: string, approved?: boolean) => {
    if (approved === false) {
      return <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 border border-amber-300 uppercase text-[8px] rounded-none">Pending Appr</span>;
    }
    if (rsvp === 'YES' || status === 'REGISTERED') {
      return <span className="bg-[#00FF00]/15 text-emerald-800 font-bold px-1.5 py-0.5 border border-[#00FF00]/40 uppercase text-[8px] rounded-none">Registered</span>;
    }
    if (rsvp === 'NO' || status === 'DECLINED') {
      return <span className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 border border-red-300 uppercase text-[8px] rounded-none">Declined</span>;
    }
    if (status === 'OPENED') {
      return <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 border border-sky-300 uppercase text-[8px] rounded-none">Opened</span>;
    }
    if (status === 'DELIVERED') {
      return <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 border border-amber-300 uppercase text-[8px] rounded-none">Delivered</span>;
    }
    return <span className="bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 border border-gray-300 uppercase text-[8px] rounded-none">Not Sent</span>;
  };

  return (
    <div className="space-y-6" id="invitation-manager-root">
      
      {/* 1. TOP MODULE NAVIGATION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#141414] pb-4 gap-4">
        <div>
          <h2 className="font-mono font-bold text-slate-900 text-lg uppercase flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#141414]" />
            <span>03. Invitation & RSVP Campaign Station</span>
          </h2>
          <p className="text-xs text-slate-500 font-serif-italic">
            Manage your campaign flow: add participants, import spreadsheets, coordinate multi-channel dispatches, and track real-time delivery status.
          </p>
        </div>

        <div className="flex bg-[#DFDEDA] border border-[#141414] p-0.5 font-mono text-[9px] font-black uppercase">
          <button
            onClick={() => setManagerSubModule('ANALYTICS')}
            className={`px-3 py-1.5 cursor-pointer ${managerSubModule === 'ANALYTICS' ? 'bg-[#141414] text-white' : 'text-slate-700 hover:bg-[#CFCECA]'}`}
          >
            Campaign Analytics
          </button>
          <button
            onClick={() => setManagerSubModule('IMPORT')}
            className={`px-3 py-1.5 cursor-pointer ${managerSubModule === 'IMPORT' ? 'bg-[#141414] text-white' : 'text-slate-700 hover:bg-[#CFCECA]'}`}
          >
            Add & Import Guests
          </button>
          <button
            onClick={() => setManagerSubModule('BROADCAST')}
            className={`px-3 py-1.5 cursor-pointer ${managerSubModule === 'BROADCAST' ? 'bg-[#141414] text-white' : 'text-slate-700 hover:bg-[#CFCECA]'}`}
          >
            Invitation Dispatch & Preview
          </button>
        </div>
      </div>

      {/* 2. SUBMODULE 1: CAMPAIGN ANALYTICS SUMMARY */}
      {managerSubModule === 'ANALYTICS' && (
        <div className="space-y-6" id="campaign-analytics-panel">
          
          {/* Tracking Metrics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 border border-[#141414] font-mono flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">TOTAL INVITED</span>
              <div>
                <span className="text-3xl font-black block text-slate-900 leading-none">{stats.total}</span>
                <span className="text-[8px] text-slate-400 block mt-1 uppercase">Guests on register</span>
              </div>
            </div>

            <div className="bg-white p-4 border border-[#141414] font-mono flex flex-col justify-between">
              <span className="text-[9px] text-amber-600 uppercase font-bold tracking-wider block mb-1">DELIVERED</span>
              <div>
                <span className="text-3xl font-black block text-slate-900 leading-none">{stats.delivered.count}</span>
                <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-none border border-slate-200">
                  <div className="bg-amber-500 h-full" style={{ width: `${stats.delivered.pct}%` }} />
                </div>
                <span className="text-[8px] text-slate-400 block mt-1 uppercase">{stats.delivered.pct}% of invitation list</span>
              </div>
            </div>

            <div className="bg-white p-4 border border-[#141414] font-mono flex flex-col justify-between">
              <span className="text-[9px] text-sky-600 uppercase font-bold tracking-wider block mb-1">OPENED</span>
              <div>
                <span className="text-3xl font-black block text-slate-900 leading-none">{stats.opened.count}</span>
                <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-none border border-slate-200">
                  <div className="bg-sky-500 h-full" style={{ width: `${stats.opened.pct}%` }} />
                </div>
                <span className="text-[8px] text-slate-400 block mt-1 uppercase">{stats.opened.pct}% of invitations opened</span>
              </div>
            </div>

            <div className="bg-white p-4 border border-[#141414] font-mono flex flex-col justify-between">
              <span className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider block mb-1">REGISTERED (YES)</span>
              <div>
                <span className="text-3xl font-black block text-emerald-700 leading-none">{stats.registered.count}</span>
                <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-none border border-slate-200">
                  <div className="bg-emerald-500 h-full" style={{ width: `${stats.registered.pct}%` }} />
                </div>
                <span className="text-[8px] text-slate-400 block mt-1 uppercase">{stats.registered.pct}% RSVP Acceptance rate</span>
              </div>
            </div>

            <div className="bg-white p-4 border border-[#141414] font-mono flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-[9px] text-red-600 uppercase font-bold tracking-wider block mb-1">DECLINED (NO)</span>
              <div>
                <span className="text-3xl font-black block text-red-700 leading-none">{stats.declined.count}</span>
                <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-none border border-slate-200">
                  <div className="bg-red-500 h-full" style={{ width: `${stats.declined.pct}%` }} />
                </div>
                <span className="text-[8px] text-slate-400 block mt-1 uppercase">{stats.declined.pct}% RSVP Decline rate</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Event Settings Panel */}
            <div className="lg:col-span-5 tech-card p-5">
              <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-[#141414]" />
                <span>Event Settings Coordination</span>
              </h3>

              <form onSubmit={handleConfigSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Event Summit Name *</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="tech-input w-full font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Venue Coordinates / Location *</label>
                  <input
                    type="text"
                    required
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    className="tech-input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="tech-input w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Session Duration Time *</label>
                    <input
                      type="text"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="tech-input w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Application Base URL (Production Link)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://eventhub.alfianwicaksono.com"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    className="tech-input w-full"
                  />
                  <p className="text-[9px] text-slate-500 font-serif-italic">
                    Digunakan sebagai tautan dasar (base URL) untuk tautan RSVP/Akses Digital di email undangan.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-action-primary w-full py-2.5"
                >
                  Update Global Configuration
                </button>

                {configSuccess && (
                  <div className="text-xs text-[#141414] font-bold flex items-center gap-1.5 mt-2 bg-[#00FF00]/20 border border-[#141414] p-2.5 rounded-none">
                    <CheckCircle className="w-4 h-4 text-[#141414] shrink-0" />
                    <span>[OK] Settings successfully synchronized with registration database!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Campaign Summary & Quick Guides */}
            <div className="lg:col-span-7 bg-[#DFDEDA] border-[1.5px] border-[#141414] p-5 font-mono text-xs flex flex-col justify-between">
              <div>
                <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#141414]" />
                  <span>Interactive Campaign Guidelines</span>
                </h3>
                <ul className="space-y-2.5 text-slate-700 font-mono text-[11px] list-disc pl-5 leading-relaxed">
                  <li><strong>Manual Guest Addition</strong>: Add intended attendees manually on the "Add & Import Guests" tab. They start as <span className="font-bold underline">Not Sent / RSVP Pending</span>.</li>
                  <li><strong>Spreadsheet Excel Uploads</strong>: Import bulk contacts in seconds. Real-time mapping detects headers and presents a preview table before database insertion.</li>
                  <li><strong>Delivered Status</strong>: Transmitting the invitation via Email or WhatsApp flags the campaign status as <span className="font-bold text-amber-600">Delivered</span>.</li>
                  <li><strong>Opened Status</strong>: Handled automatically by our server. When the guest clicks their registration link to open their dashboard, the state transitions to <span className="font-bold text-sky-600">Opened</span>.</li>
                  <li><strong>RSVP Reply Sync</strong>: Submitting the RSVP form automatically flags the guest as <span className="font-bold text-emerald-600">Registered (YES)</span> or <span className="font-bold text-red-600">Declined (NO)</span>.</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#141414] flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={() => setManagerSubModule('IMPORT')}
                  className="btn-action-custom bg-white py-2 px-4"
                >
                  Go to Guest Import
                </button>
                <button
                  onClick={() => setManagerSubModule('BROADCAST')}
                  className="btn-action-primary py-2 px-4"
                >
                  Open Invitation Station
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBMODULE 2: ADD & IMPORT GUESTS PANEL */}
      {managerSubModule === 'IMPORT' && (
        <div className="space-y-6" id="add-import-guests-panel">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            
            {/* MANUAL PARTICIPANT ADDITION FORM */}
            <div className="lg:col-span-5 tech-card p-5">
              <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#141414]" />
                <span>Manual Guest Entry Form</span>
              </h3>

              <form onSubmit={handleManualAddSubmit} className="space-y-3.5 font-mono">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tony Stark"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="tech-input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tony@starkindustries.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="tech-input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">WhatsApp / Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-0100"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="tech-input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Company</label>
                    <input
                      type="text"
                      placeholder="Stark Industries"
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                      className="tech-input w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Job Position</label>
                    <input
                      type="text"
                      placeholder="Chief Technology Officer"
                      value={manualPosition}
                      onChange={(e) => setManualPosition(e.target.value)}
                      className="tech-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Table Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="Table 1"
                      value={manualTable}
                      onChange={(e) => setManualTable(e.target.value)}
                      className="tech-input w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Seat Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="Seat VIP-5"
                      value={manualSeat}
                      onChange={(e) => setManualSeat(e.target.value)}
                      className="tech-input w-full"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-action-primary w-full py-2.5 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Guest to Campaign</span>
                </button>

                {manualAddSuccess && (
                  <div className="text-xs text-[#141414] font-bold flex items-center gap-1.5 mt-2 bg-[#00FF00]/20 border border-[#141414] p-2.5 rounded-none">
                    <CheckCircle className="w-4 h-4 text-[#141414] shrink-0" />
                    <span>[OK] Guest added manually as "Pending RSVP"!</span>
                  </div>
                )}

                {manualAddError && (
                  <div className="text-xs text-red-700 font-bold flex items-center gap-1.5 mt-2 bg-red-100 border border-red-400 p-2.5 rounded-none">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
                    <span>[ERROR] {manualAddError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* SPREADSHEET EXCEL/CSV BULK UPLOADER */}
            <div className="lg:col-span-7 tech-card p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#141414] pb-3">
                  <h3 className="font-mono font-bold text-slate-900 text-sm uppercase flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#141414]" />
                    <span>Upload Spreadsheet (Excel / CSV)</span>
                  </h3>
                  <button
                    onClick={handleDownloadTemplate}
                    className="font-mono font-bold uppercase text-[9px] text-[#141414] hover:underline flex items-center gap-1.5 cursor-pointer bg-white border border-[#141414] py-1 px-2.5"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Template</span>
                  </button>
                </div>

                <p className="text-slate-600 text-xs font-serif-italic">
                  Drag and drop a .xlsx Microsoft Excel workbook or standard .csv file. The parser maps columns like Name, Email, Phone, Company, and seating assignments.
                </p>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`bg-[#DFDEDA] border-[1.5px] border-dashed border-[#141414] p-6 text-center space-y-3 font-mono cursor-pointer transition-colors ${
                    isDragging ? 'bg-[#CFCECA]' : 'hover:bg-[#EAE9E6]'
                  }`}
                >
                  <Upload className="w-8 h-8 text-[#141414] mx-auto" />
                  <div>
                    <span className="font-bold block text-slate-800 text-[10px] uppercase">
                      {isDragging ? '[DROP SPREADSHEET FILE]' : '[CLICK OR DRAG FILE HERE TO UPLOAD]'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Supports Microsoft Excel (.xlsx) and CSV (.csv) files</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                  />
                </div>

                {/* Show Parsed Data Preview Table */}
                {parsedGuests.length > 0 && (
                  <div className="space-y-2 font-mono mt-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold uppercase text-indigo-700">Parsed Preview ({parsedGuests.length} guests detected):</span>
                      <button
                        onClick={() => setParsedGuests([])}
                        className="text-red-600 hover:underline uppercase text-[9px] font-bold"
                      >
                        Clear parsed
                      </button>
                    </div>

                    <div className="border border-[#141414] max-h-[140px] overflow-y-auto bg-white rounded-none">
                      <table className="w-full text-[9px] text-left border-collapse font-mono">
                        <thead>
                          <tr className="bg-[#DFDEDA] border-b border-[#141414] text-slate-800 uppercase font-black">
                            <th className="p-1 px-2">Name</th>
                            <th className="p-1 px-2">Email</th>
                            <th className="p-1 px-2">Company</th>
                            <th className="p-1 px-2 text-center">Table/Seat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedGuests.slice(0, 10).map((g, index) => (
                            <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="p-1 px-2 font-bold text-slate-900 truncate max-w-[100px]">{g.name}</td>
                              <td className="p-1 px-2 text-slate-500 truncate max-w-[130px]">{g.email}</td>
                              <td className="p-1 px-2 text-slate-700 truncate max-w-[100px]">{g.company}</td>
                              <td className="p-1 px-2 text-center text-slate-600">{g.tableNumber || '-'}/{g.seatNumber || '-'}</td>
                            </tr>
                          ))}
                          {parsedGuests.length > 10 && (
                            <tr className="bg-slate-50">
                              <td colSpan={4} className="p-1.5 px-2 font-bold text-center text-slate-500 text-[8px] uppercase">
                                ... and {parsedGuests.length - 10} more rows parsed
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={handleCommitBulkImport}
                      className="btn-action-primary w-full py-2 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit Import of {parsedGuests.length} Guests to Database</span>
                    </button>
                  </div>
                )}

                {/* Results/Error States */}
                {bulkImportSuccess && (
                  <div className="text-xs text-[#141414] font-bold flex items-center gap-1.5 mt-2 bg-[#00FF00]/20 border border-[#141414] p-2.5 rounded-none font-mono">
                    <CheckCircle className="w-4 h-4 text-[#141414] shrink-0" />
                    <span>[SUCCESS] Successfully imported {importedCount} new guests from spreadsheet!</span>
                  </div>
                )}

                {uploadError && (
                  <div className="text-xs text-red-700 font-bold flex items-center gap-1.5 mt-2 bg-red-100 border border-red-400 p-2.5 rounded-none font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>[ERROR] {uploadError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#141414] font-mono mt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Currently Pre-Registered Database Status:</span>
                <div className="bg-[#141414] text-[#E4E3E0] rounded-none p-3 text-[10px] font-mono leading-relaxed border border-[#141414]">
                  <div className="grid grid-cols-12 gap-2 font-bold text-[#00FF00] border-b border-neutral-700 pb-1 mb-1 text-[9px] uppercase">
                    <span className="col-span-3">Name</span>
                    <span className="col-span-4">Email</span>
                    <span className="col-span-3">No HP</span>
                    <span className="col-span-2 text-right">Status</span>
                  </div>
                  <div className="max-h-[140px] overflow-y-auto pr-1 space-y-0.5">
                    {participants.map((p, i) => (
                      <div key={p.id || i} className="grid grid-cols-12 gap-2 py-0.5 border-b border-neutral-900 text-[9px]">
                        <span className="text-[#E4E3E0] truncate col-span-3" title={p.name}>{p.name}</span>
                        <span className="text-gray-400 truncate col-span-4" title={p.email}>{p.email}</span>
                        <span className="text-gray-400 truncate col-span-3" title={p.phone || '-'}>{p.phone || '-'}</span>
                        <span className="text-[#00FF00] font-bold uppercase col-span-2 text-right">
                          {p.rsvpStatus === 'YES' ? 'YES' : p.rsvpStatus === 'NO' ? 'NO' : 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center font-bold text-[8px] text-gray-500 pt-1.5 uppercase border-t border-neutral-800 mt-1">
                    Total: {participants.length} guests are saved on real database.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBMODULE 3: INVITATION DISPATCH & LIVE PREVIEW PANEL */}
      {managerSubModule === 'BROADCAST' && (
        <div className="space-y-6" id="invitation-dispatch-station">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            
            {/* LEFT SIDE: PARTICIPANT SEARCH & LIST SELECTOR */}
            <div className="lg:col-span-5 bg-white border border-[#141414] p-4 flex flex-col justify-between max-h-[640px]">
              <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-2 flex items-center justify-between">
                  <span>Guest Campaign Roster</span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 py-0.5 px-2 border font-normal">
                    {filteredParticipants.length} shown
                  </span>
                </h3>

                {/* Filters Row */}
                <div className="space-y-2 font-mono">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Name, Email, or Company..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="tech-input pl-8 py-1.5 w-full text-[10px]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[8px] font-bold uppercase text-slate-400 mr-1">Filter:</span>
                    {['ALL', 'AWAITING_APPROVAL', 'NOT_SENT', 'DELIVERED', 'OPENED', 'REGISTERED', 'DECLINED'].map(filter => {
                      const isActive = statusFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => setStatusFilter(filter)}
                          className={`text-[8px] font-bold px-1.5 py-0.5 border uppercase transition-colors cursor-pointer ${
                            isActive 
                              ? 'bg-[#141414] border-[#141414] text-white' 
                              : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-[#DFDEDA]'
                          }`}
                        >
                          {filter.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bulk Select bar */}
                <div className="flex justify-between items-center bg-slate-50 p-1.5 border border-slate-200 text-[9px] font-mono">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filteredParticipants.length > 0 && filteredParticipants.every(p => checkedGuests[p.id])}
                      onChange={() => toggleAllVisibleGuests(filteredParticipants)}
                      className="rounded-none accent-black"
                    />
                    <span className="font-bold uppercase">Select All Visible ({filteredParticipants.length})</span>
                  </label>

                  <span className="font-bold uppercase text-indigo-700">
                    {Object.keys(checkedGuests).filter(k => checkedGuests[k]).length} Checked
                  </span>
                </div>

                {/* Participant roster roster list */}
                <div className="flex-1 overflow-y-auto border border-slate-200 divide-y divide-slate-100 min-h-[220px]">
                  {filteredParticipants.map(p => {
                    const isSelected = p.id === selectedParticipantId;
                    const isChecked = !!checkedGuests[p.id];
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedParticipantId(p.id)}
                        className={`p-2 flex items-center justify-between gap-2 font-mono transition-colors cursor-pointer text-[10px] ${
                          isSelected ? 'bg-[#DFDEDA]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleCheckGuest(p.id);
                            }}
                            className="rounded-none accent-black shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-black text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[9px] text-slate-500 truncate block">{p.company}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(p.invitationStatus || 'NOT_SENT', p.rsvpStatus, p.approved)}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}

                  {filteredParticipants.length === 0 && (
                    <div className="py-12 text-center text-slate-400 uppercase font-bold text-[10px]">
                      No participants match selection criteria.
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION: SEND MODULE */}
              <div className="pt-4 border-t border-[#141414] space-y-3.5 font-mono mt-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Channel Selection</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChannel('EMAIL')}
                      className={`py-2 rounded-none border text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedChannel === 'EMAIL'
                          ? 'bg-[#141414] border-[#141414] text-white'
                          : 'border-slate-300 text-slate-600 bg-white hover:bg-[#DFDEDA]'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Route</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedChannel('WHATSAPP')}
                      className={`py-2 rounded-none border text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedChannel === 'WHATSAPP'
                          ? 'bg-[#141414] border-[#141414] text-white'
                          : 'border-slate-300 text-slate-600 bg-white hover:bg-[#DFDEDA]'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp API</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSendInvitations}
                  disabled={isDispatching}
                  className="btn-action-primary w-full py-2.5 flex items-center justify-center gap-1.5 uppercase font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isDispatching ? 'Transmitting Broadcast...' : `Dispatch Campaign to Selected (${
                      Object.keys(checkedGuests).filter(k => checkedGuests[k]).length || 1
                    })`}
                  </span>
                </button>

                {dispatchResult && (
                  <div className={`text-[10px] p-2 border font-bold font-mono text-center uppercase ${
                    dispatchResult.includes('SUCCESS') ? 'bg-[#00FF00]/15 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-300 text-red-700'
                  }`}>
                    {dispatchResult}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: LIVE CAMPAIGN PREVIEW & EDITABLE TEMPLATES */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* EDITABLE DRAFT TEMPLATES */}
              <div className="bg-[#DFDEDA] border border-[#141414] p-4 font-mono text-[10px] space-y-3">
                <div className="flex justify-between items-center border-b border-[#141414] pb-1.5">
                  <span className="font-bold uppercase text-slate-600">Draft Channel Templates</span>
                  <span className="text-[9px] text-slate-400">Values like [Name], [Date], [Venue], [MapLink], [Link] populate automatically</span>
                </div>

                {selectedChannel === 'EMAIL' ? (
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-500 uppercase text-[8px]">EMAIL SUBJECT</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="tech-input w-full bg-white p-1 text-[10px]"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-500 uppercase text-[8px]">EMAIL BODY CONTENT</span>
                      <textarea
                        rows={4}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="tech-input w-full bg-white p-1 text-[10px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[8px]">WHATSAPP TEMPLATE MESSAGE</span>
                    <textarea
                      rows={5}
                      value={waMessage}
                      onChange={(e) => setWaMessage(e.target.value)}
                      className="tech-input w-full bg-white p-1 text-[10px]"
                    />
                  </div>
                )}
              </div>

              {/* LIVE CAMPAIGN INVITATION PREVIEW PANEL */}
              {activeParticipant ? (
                <div className="border border-[#141414] bg-white font-mono rounded-none overflow-hidden flex flex-col">
                  {/* Preview Top Header Bar */}
                  <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2.5 flex justify-between items-center text-[10px] border-b border-[#141414]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="font-bold uppercase tracking-wide">Live Dispatch Simulation Preview</span>
                    </div>
                    <span className="text-gray-400 uppercase text-[9px]">
                      Recipient: {activeParticipant.name} (ID: {activeParticipant.id})
                    </span>
                  </div>

                  {activeParticipant.approved === false && (
                    <div className="mx-5 mt-5 p-4 bg-amber-50 border-2 border-amber-500 text-amber-900 font-mono text-xs space-y-2.5">
                      <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-tight text-amber-700">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Awaiting Registration Approval</span>
                      </div>
                      <p className="text-[10px] text-slate-700 leading-relaxed">
                        This participant registered via the signup form but has not been approved yet. They are currently blocked from entering the Participant Hub.
                      </p>
                      <button
                        onClick={async () => {
                          if (onToggleApprove) {
                            await onToggleApprove(activeParticipant.id, true);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] uppercase text-[9px] tracking-wider w-full flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Participant Registration</span>
                      </button>
                    </div>
                  )}

                  {/* Visual simulated preview of Email/WA */}
                  <div className="p-5 space-y-4 text-xs bg-slate-50 border-b border-slate-200">
                    
                    {/* Simulated Metadata Header */}
                    <div className="bg-white p-3 border border-slate-200 space-y-1 text-[10px] text-slate-500 leading-relaxed shadow-sm">
                      <p><strong>Channel:</strong> {selectedChannel === 'EMAIL' ? '📧 EMAIL (HTML OUTBOUND)' : '💬 WHATSAPP API GATEWAY'}</p>
                      <p><strong>To:</strong> <span className="font-bold text-slate-800">{activeParticipant.name} &lt;{activeParticipant.email}&gt;</span></p>
                      {selectedChannel === 'EMAIL' && (
                        <p><strong>Subject:</strong> <span className="font-bold text-indigo-700">{emailSubject}</span></p>
                      )}
                    </div>

                    {/* Outer Invitation Container */}
                    <div className="bg-white border-2 border-[#141414] p-6 space-y-5 shadow-md">
                      
                      {/* Logo / Title Banner */}
                      <div className="text-center border-b-2 border-dashed border-slate-200 pb-4">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block font-mono">EH // DIGITAL CAMPAIGN PASS</span>
                        <h4 className="font-bold text-sm text-slate-900 uppercase mt-1 leading-tight">
                          {eventConfig?.name || "Global Tech Summit 2026"}
                        </h4>
                      </div>

                      {/* 1. Personalized Greeting */}
                      <div className="space-y-2">
                        <span className="font-bold text-indigo-800 uppercase text-[9px] tracking-wider block">[ 1. Personalized Greeting ]</span>
                        <p className="text-slate-600 leading-relaxed font-mono text-[10px] whitespace-pre-wrap">
                          {selectedChannel === 'EMAIL' ? personalizedEmailBody : personalizedWaMessage}
                        </p>
                      </div>

                      {/* 2. Seating, Table and personalized details */}
                      <div className="bg-slate-50 p-3 border border-slate-200 grid grid-cols-2 gap-4 text-[10px] font-mono leading-relaxed">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">CAMPAIGN TARGET GUEST</span>
                          <span className="font-bold text-slate-900 block">{activeParticipant.name}</span>
                          <span className="text-slate-500 text-[9px] block">{activeParticipant.position} at {activeParticipant.company}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase font-sans">SEATING ASSIGNMENT</span>
                          <span className="font-bold text-amber-600 block">Tersedia saat Check-In</span>
                          <span className="text-slate-500 text-[8.5px] block leading-tight mt-0.5">Silakan lakukan check-in di gate masuk untuk mendapatkan nomor meja dan kursi Anda.</span>
                        </div>
                      </div>

                      {/* 3. Event Agenda (sequential schedule list) */}
                      <div className="space-y-2">
                        <span className="font-bold text-indigo-800 uppercase text-[9px] tracking-wider block">[ 2. Agenda Timeline ]</span>
                        <div className="border border-slate-200 divide-y divide-slate-100 bg-slate-50 max-h-[140px] overflow-y-auto">
                          {eventConfig?.schedule && eventConfig.schedule.length > 0 ? (
                            eventConfig.schedule.map((item, i) => (
                              <div key={i} className="p-2 flex gap-3 text-[10px] font-mono">
                                <span className="font-bold text-slate-900 shrink-0 uppercase text-[9px]">{item.time}</span>
                                <span className="text-slate-600 font-mono text-[10px]">{item.activity}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-[9px]">No scheduled activities found in config.</div>
                          )}
                        </div>
                      </div>

                      {/* 4. Action: RSVP & Calendar Invite */}
                      <div className="space-y-2">
                        <span className="font-bold text-indigo-800 uppercase text-[9px] tracking-wider block">[ 3. Interactive Guest Actions ]</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-[10px]">
                          {/* Calendar file invite */}
                          <button
                            onClick={() => handleDownloadCalendarInvite(activeParticipant)}
                            className="bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 py-2.5 px-3 rounded-none flex items-center justify-center gap-2 cursor-pointer font-bold"
                            title="Generate and download .ics file"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-[#141414]" />
                            <span>Download Calendar Invite (.ics)</span>
                          </button>

                          {/* Registration Link / RSVP Button */}
                          <a
                            href={activeRsvpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#141414] text-white hover:bg-slate-800 py-2.5 px-3 rounded-none flex items-center justify-center gap-2 text-center cursor-pointer font-bold uppercase text-[9px] tracking-wider"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Confirm RSVP / Digital Pass</span>
                          </a>

                          {selectedChannel === 'WHATSAPP' && (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${activeParticipant.phone ? activeParticipant.phone.replace(/\D/g, '').replace(/^0/, '62') : ''}&text=${encodeURIComponent(personalizedWaMessage)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="col-span-1 sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-none flex items-center justify-center gap-2 text-center cursor-pointer font-bold uppercase text-[9px] tracking-wider border border-emerald-500 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all"
                            >
                              <Phone className="w-3.5 h-3.5 text-white animate-bounce" />
                              <span>📲 Kirim via WhatsApp Chat ({activeParticipant.phone || 'No Phone'})</span>
                            </a>
                          )}
                        </div>

                        {/* Copy Link Helper */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 text-[9px]">
                          <span className="text-slate-400 uppercase font-bold shrink-0">Invitation Link:</span>
                          <span className="text-slate-600 truncate flex-1 break-all select-all">{activeRsvpLink}</span>
                          <button
                            onClick={handleCopyLink}
                            className="text-[#141414] hover:text-indigo-800 p-1 shrink-0 bg-white border border-slate-200 flex items-center gap-1 font-bold uppercase text-[8px] cursor-pointer"
                          >
                            {copiedLink ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 5. Venue Coordinates & Map */}
                      <div className="space-y-2">
                        <span className="font-bold text-indigo-800 uppercase text-[9px] tracking-wider block">[ 4. Venue Coordinates & Location ]</span>
                        
                        <div className="border border-slate-300 p-3 flex flex-col sm:flex-row gap-3 bg-indigo-50/40 font-mono text-[10px] leading-relaxed">
                          <div className="bg-[#DFDEDA] border border-[#141414] w-full sm:w-28 h-18 shrink-0 flex flex-col justify-center items-center text-center p-2 relative overflow-hidden">
                            <MapPin className="w-5 h-5 text-indigo-700 animate-bounce" />
                            <span className="font-bold uppercase text-[7px] text-slate-800 tracking-tighter mt-1">SIMULATED MAP VIEW</span>
                            <div className="absolute inset-0 border border-slate-300 pointer-events-none" />
                          </div>

                          <div className="space-y-1">
                            <p className="font-black text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-indigo-700" />
                              <span>{eventConfig?.venue || 'Grand Ballroom'}</span>
                            </p>
                            <p className="text-slate-500 text-[9px]">Coordinates: 37.7749° N, 122.4194° W</p>
                            <p className="text-slate-600 text-[9px] italic leading-tight">Valet parking available at Tower Gate. Self-parking validated up to 8 hours.</p>
                            {eventConfig?.googleMapsUrl && (
                              <div className="pt-1">
                                <a
                                  href={eventConfig.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-[#141414] hover:bg-slate-800 text-white font-bold uppercase text-[8px] tracking-wider py-1 px-2 border border-black cursor-pointer"
                                >
                                  <span>📍 Get Position on Google Maps</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-[#141414] py-16 text-center font-mono text-xs uppercase font-bold text-slate-500">
                  Select a guest from the Campaign Roster to preview their personalized invitation template.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
