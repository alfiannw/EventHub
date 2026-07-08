import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Calendar, MapPin, Plus, CheckCircle, Upload, Send, 
  AlertCircle, Edit2, ListChecks, Search, RefreshCw, Sparkles, 
  Clock, Shield, BarChart3, ArrowRight, UserPlus, FileJson, Check, X,
  Trash2, MessageSquare, Volume2
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  tableNumber: string;
  seatNumber: string;
  rsvpStatus: 'PENDING' | 'YES' | 'NO';
  checkedIn: boolean;
}

interface ReminderLog {
  id: string;
  guestName: string;
  channel: 'EMAIL' | 'WHATSAPP';
  intervalStage: 'H-7' | 'H-3' | 'H-1' | 'DAY-OF';
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt: string;
}

export default function InvitationsCoordinationPage() {
  // 1. Initial configuration states
  const [eventName, setEventName] = useState('EventHub Global Tech Summit 2026');
  const [eventVenue, setEventVenue] = useState('Grand Ballroom, Plaza Hotel, San Francisco');
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [eventTime, setEventTime] = useState('09:00 AM');
  
  // 2. Guest Roster State
  const [guests, setGuests] = useState<Guest[]>([
    { id: 'p-1', name: 'Alex Rivera', email: 'alex.rivera@meta.com', phone: '+1 555-0192', company: 'Meta Platforms Inc.', position: 'VP Engineering', tableNumber: 'Table 1', seatNumber: 'Seat A-1', rsvpStatus: 'YES', checkedIn: false },
    { id: 'p-2', name: 'Sarah Chen', email: 'sarah.chen@google.com', phone: '+1 555-0144', company: 'Google LLC', position: 'Principal Product Manager', tableNumber: 'Table 1', seatNumber: 'Seat A-2', rsvpStatus: 'PENDING', checkedIn: false },
    { id: 'p-3', name: 'Elena Rostova', email: 'elena.rostova@kaspersky.com', phone: '+7 901-1234', company: 'Kaspersky Lab', position: 'Senior Security Analyst', tableNumber: 'Table 3', seatNumber: 'Seat B-1', rsvpStatus: 'YES', checkedIn: true },
    { id: 'p-4', name: 'Michael Novak', email: 'm.novak@tesla.com', phone: '+1 555-9876', company: 'Tesla Inc.', position: 'Battery Cell Specialist', tableNumber: 'Table 2', seatNumber: 'Seat C-5', rsvpStatus: 'NO', checkedIn: false }
  ]);

  // 3. Campaign Log state
  const [deliveryLogs, setDeliveryLogs] = useState<ReminderLog[]>([
    { id: 'rem-1', guestName: 'Alex Rivera', channel: 'EMAIL', intervalStage: 'H-7', status: 'DELIVERED', sentAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'rem-2', guestName: 'Elena Rostova', channel: 'WHATSAPP', intervalStage: 'H-7', status: 'DELIVERED', sentAt: new Date(Date.now() - 3600000 * 1).toISOString() }
  ]);

  // 4. Form inputs for manual additions
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestCompany, setNewGuestCompany] = useState('');

  // 5. Campaign setup state
  const [selectedChannel, setSelectedChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [selectedInterval, setSelectedInterval] = useState<'H-7' | 'H-3' | 'H-1' | 'DAY-OF'>('H-3');

  // 6. Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'ALL' | 'PENDING' | 'YES' | 'NO'>('ALL');

  // 7. Toast Alerts state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Pre-configured templates for live preview
  const templates = {
    'H-7': {
      title: "Event RSVP Notification",
      body: `Dear Guest, You are cordially invited to ${eventName}. Please confirm your attendance details by clicking the RSVP registration link below. Registration code: EH-GUEST.`
    },
    'H-3': {
      title: "Summit Entrance Reminders",
      body: `Hi there! Only 3 days left until the ${eventName}. Get your digital wallet pass, view coordinates, and check table seating charts inside your dashboard today!`
    },
    'H-1': {
      title: "Urgent Seating Notice",
      body: `Dear Attendee, The Summit kicks off tomorrow at ${eventTime}! Your QR check-in and digital entry card are ready. Please have your QR pass ready at reception Desk doors.`
    },
    'DAY-OF': {
      title: "Live Event Day Welcome",
      body: `Welcome to ${eventName}! Check-in desks are open at ${eventVenue.split(',')[0]}. Complete live feedback, photos, and live song streams to gain points!`
    }
  };

  const activeTemplate = templates[selectedInterval];

  // Action: Save configuration changes
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast("💾 Saved coordinate updates & summit settings successfully!");
  };

  // Action: Add individual custom guest
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newGuestEmail.trim()) return;

    // Duplicate check
    if (guests.some(g => g.email.toLowerCase() === newGuestEmail.trim().toLowerCase())) {
      triggerToast("⚠️ Guest with this email is already on the list.");
      return;
    }

    const newGuest: Guest = {
      id: `p-${Date.now()}`,
      name: newGuestName.trim(),
      email: newGuestEmail.trim().toLowerCase(),
      phone: '+1 555-0100',
      company: newGuestCompany.trim() || 'Individual',
      position: 'Attendee',
      tableNumber: 'Table ' + (Math.floor(Math.random() * 5) + 1),
      seatNumber: 'Seat ' + (Math.floor(Math.random() * 10) + 1),
      rsvpStatus: 'PENDING',
      checkedIn: false
    };

    setGuests(prev => [...prev, newGuest]);
    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestCompany('');
    triggerToast(`👤 "${newGuest.name}" added to the invitation database.`);
  };

  // Action: Bulk import preset executives
  const handleBulkImport = () => {
    const presetExecutives: Guest[] = [
      { id: 'p-101', name: "John Doe", email: "john.doe@apple.com", phone: "+1 555-0192", company: "Apple Inc.", position: "VP Marketing", tableNumber: "Table 1", seatNumber: "Seat VIP-1", rsvpStatus: "PENDING", checkedIn: false },
      { id: 'p-102', name: "Jane Smith", email: "jane.smith@microsoft.com", phone: "+1 555-0144", company: "Microsoft Corp.", position: "Director of Product", tableNumber: "Table 1", seatNumber: "Seat VIP-2", rsvpStatus: "PENDING", checkedIn: false },
      { id: 'p-103', name: "Yvan Leblanc", email: "yvan.leblanc@ubisoft.com", phone: "+33 6 1234 5678", company: "Ubisoft", position: "Creative Director", tableNumber: "Table 3", seatNumber: "Seat B-5", rsvpStatus: "PENDING", checkedIn: false },
      { id: 'p-104', name: "Siddharth Nair", email: "s.nair@infosys.com", phone: "+91 98765 43210", company: "Infosys Ltd.", position: "Lead Architect", tableNumber: "Table 5", seatNumber: "Seat C-1", rsvpStatus: "PENDING", checkedIn: false }
    ];

    // Filter out existing duplicates
    const nonDuplicates = presetExecutives.filter(pe => !guests.some(g => g.email.toLowerCase() === pe.email.toLowerCase()));
    
    if (nonDuplicates.length === 0) {
      triggerToast("⚠️ All preset executive accounts are already imported.");
      return;
    }

    setGuests(prev => [...prev, ...nonDuplicates]);
    triggerToast(`📥 Bulk imported ${nonDuplicates.length} elite tech executives into the summit directory.`);
  };

  // Action: Dispatch campaign reminders
  const handleBroadcastReminders = () => {
    // Standard rule: Send to guests who have rsvp pending, or RSVP YES but not checked-in yet
    const targetGuests = guests.filter(g => {
      if (selectedInterval === 'H-7') {
        return g.rsvpStatus === 'PENDING';
      }
      return g.rsvpStatus === 'PENDING' || (g.rsvpStatus === 'YES' && !g.checkedIn);
    });

    if (targetGuests.length === 0) {
      triggerToast(`ℹ️ No matching guests qualify for the ${selectedInterval} reminder.`);
      return;
    }

    // Create delivery logs
    const newLogs: ReminderLog[] = targetGuests.map(g => {
      // 95% delivery success rate
      const status: 'DELIVERED' | 'FAILED' = Math.random() > 0.05 ? 'DELIVERED' : 'FAILED';
      return {
        id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        guestName: g.name,
        channel: selectedChannel,
        intervalStage: selectedInterval,
        status,
        sentAt: new Date().toISOString()
      };
    });

    setDeliveryLogs(prev => [...newLogs, ...prev]);
    triggerToast(`🚀 Dispatched ${selectedInterval} reminders via ${selectedChannel} to ${targetGuests.length} guests.`);
  };

  // Action: Change specific guest's RSVP status
  const toggleRSVP = (guestId: string, status: 'YES' | 'NO' | 'PENDING') => {
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, rsvpStatus: status } : g));
    triggerToast(`Updated RSVP status for guest.`);
  };

  // Calculations for KPI widgets
  const stats = {
    totalGuests: guests.length,
    rsvpYes: guests.filter(g => g.rsvpStatus === 'YES').length,
    rsvpNo: guests.filter(g => g.rsvpStatus === 'NO').length,
    rsvpPending: guests.filter(g => g.rsvpStatus === 'PENDING').length,
    remindersSentCount: deliveryLogs.length,
    deliverySuccessCount: deliveryLogs.filter(l => l.status === 'DELIVERED').length,
    deliverySuccessRate: deliveryLogs.length > 0 
      ? Math.round((deliveryLogs.filter(l => l.status === 'DELIVERED').length / deliveryLogs.length) * 100) 
      : 100
  };

  // Filter roster
  const filteredGuests = guests.filter(g => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRSVP = rsvpFilter === 'ALL' || g.rsvpStatus === rsvpFilter;

    return matchesSearch && matchesRSVP;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6 font-sans antialiased">
      
      {/* Toast Notification Box */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 border-l-4 border-slate-500 text-white py-3.5 px-5 font-mono text-xs flex items-center gap-3 shadow-lg rounded-none">
          <Volume2 className="w-4 h-4 text-slate-300 animate-pulse" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* App Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-300 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-slate-700" />
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-slate-900">Event Coordination Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Sprint 6: Seamless RSVP invitations, elite guest import, and multi-channel campaign automation.
          </p>
        </div>

        {/* Security / Role indicator */}
        <div className="mt-4 md:mt-0 bg-white border border-slate-300 p-3 flex items-center gap-4 font-mono text-xs">
          <div className="h-9 w-9 bg-slate-200 border border-slate-400 text-slate-700 flex items-center justify-center rounded-none font-bold">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Workspace Mode</div>
            <div className="text-slate-900 font-bold">EVENT MANAGER PANEL</div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</div>
            <div className="text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>LOGGED IN</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Board Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Total Invitation Size</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalGuests}</span>
          <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
            <UserPlus className="w-3 h-3 text-slate-400" />
            <span>Database Roster</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Confirmed RSVPs (YES)</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.rsvpYes}</span>
          <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>{stats.totalGuests > 0 ? Math.round((stats.rsvpYes / stats.totalGuests) * 100) : 0}% response rate</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Pending Response</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">{stats.rsvpPending}</span>
          <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Awaiting confirmation</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Dispatched Reminders</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{stats.remindersSentCount}</span>
          <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
            <Send className="w-3 h-3 text-slate-400" />
            <span>Total campaign sends</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 font-mono shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Delivery Success Rate</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.deliverySuccessRate}%</span>
          <div className="w-full bg-slate-100 h-1 mt-2.5 rounded-none overflow-hidden">
            <div className="bg-slate-700 h-full" style={{ width: `${stats.deliverySuccessRate}%` }}></div>
          </div>
        </div>

      </div>

      {/* Main Grid: Settings & Campaigns vs Guest Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Coordination Config & Campaign Dispatcher */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Event coordination parameters */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-700" />
              <span>01. Event Parameters Coordination</span>
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  Summit Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-3 w-full rounded-none outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  Venue Location Coordinates *
                </label>
                <input
                  type="text"
                  required
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-3 w-full rounded-none outline-none focus:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-3 w-full rounded-none outline-none focus:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    Time Coordinates *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 p-3 w-full rounded-none outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase py-3 transition-colors tracking-widest cursor-pointer border-0 mt-2"
              >
                APPLY PARAMETERS
              </button>
            </form>
          </div>

          {/* Section 2: Campaign scheduler & preview panel */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold font-mono text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3.5 flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-700" />
              <span>02. Multi-Channel Campaign Dispatcher</span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              
              {/* Channel Picker */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                  Select Transmit Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedChannel('EMAIL')}
                    className={`py-2 px-3 border text-center font-bold tracking-wider cursor-pointer ${
                      selectedChannel === 'EMAIL' 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    SMTP EMAIL SYSTEM
                  </button>
                  <button
                    onClick={() => setSelectedChannel('WHATSAPP')}
                    className={`py-2 px-3 border text-center font-bold tracking-wider cursor-pointer ${
                      selectedChannel === 'WHATSAPP' 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    WHATSAPP CLOUD API
                  </button>
                </div>
              </div>

              {/* Interval stage */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                  Campaign Stage Interval
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold">
                  {(['H-7', 'H-3', 'H-1', 'DAY-OF'] as const).map(stage => (
                    <button
                      key={stage}
                      onClick={() => setSelectedInterval(stage)}
                      className={`py-2 px-1 border text-center cursor-pointer transition-colors ${
                        selectedInterval === stage 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 border border-slate-200 p-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  PRE-FABRICATED TEMPLATE PREVIEW
                </span>
                <div className="space-y-1 bg-white border border-slate-200 p-3 shadow-inner text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1.5 mb-1.5">
                    Subject: {activeTemplate.title}
                  </span>
                  <p className="text-slate-600 italic">
                    "{activeTemplate.body}"
                  </p>
                </div>
              </div>

              {/* Target calculation indicators */}
              <div className="bg-slate-50 border border-slate-200 p-3 text-[10px] flex justify-between items-center text-slate-500">
                <span>Targets Qualified For Send:</span>
                <span className="font-bold text-slate-800">
                  {selectedInterval === 'H-7' 
                    ? guests.filter(g => g.rsvpStatus === 'PENDING').length 
                    : guests.filter(g => g.rsvpStatus === 'PENDING' || (g.rsvpStatus === 'YES' && !g.checkedIn)).length
                  } Recipients
                </span>
              </div>

              <button
                onClick={handleBroadcastReminders}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase py-3 transition-colors tracking-widest cursor-pointer border-0"
              >
                DISPATCH COORDINATION CAMPAIGN
              </button>

            </div>
          </div>

        </div>

        {/* Right Side: Guest Roster & Live Campaign Logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Guest list directory */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-4 gap-4 font-mono">
              <div>
                <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <ListChecks className="w-4.5 h-4.5 text-slate-700" />
                  <span>RSVP Guest Directory ({filteredGuests.length})</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Seating allocations and RSVP stances</p>
              </div>

              {/* Bulk import CTA */}
              <button
                onClick={handleBulkImport}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] py-2 px-3 border-0 cursor-pointer flex items-center gap-1 uppercase tracking-wide transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>BULK IMPORT ROSTER</span>
              </button>
            </div>

            {/* Controls panel: Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5 font-mono text-xs">
              {/* Search */}
              <div className="relative md:col-span-7">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search guests by name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 py-2.5 pl-9 pr-4 w-full rounded-none outline-none focus:border-slate-500"
                />
              </div>

              {/* RSVP status tabs */}
              <div className="flex border border-slate-300 md:col-span-5 p-0.5 bg-slate-50">
                {(['ALL', 'PENDING', 'YES', 'NO'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRsvpFilter(tab)}
                    className={`flex-1 py-1 text-[10px] font-bold tracking-wide cursor-pointer transition-colors ${
                      rsvpFilter === tab 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Fast-Add form */}
            <form onSubmit={handleAddGuest} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-5 font-mono text-[11px] bg-slate-50 p-3 border border-slate-200">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 p-2 rounded-none outline-none focus:border-slate-500"
              />
              <input
                type="email"
                required
                placeholder="Email Address *"
                value={newGuestEmail}
                onChange={(e) => setNewGuestEmail(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 p-2 rounded-none outline-none focus:border-slate-500"
              />
              <input
                type="text"
                placeholder="Company / Affiliation"
                value={newGuestCompany}
                onChange={(e) => setNewGuestCompany(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 p-2 rounded-none outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-none uppercase tracking-wider transition-colors cursor-pointer border-0"
              >
                ADD GUEST
              </button>
            </form>

            {/* List Table Grid of guests */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs font-mono">
              {filteredGuests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">
                  No matching guests identified in this sector.
                </div>
              ) : (
                filteredGuests.map(g => (
                  <div key={g.id} className="p-3.5 bg-slate-50 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-400 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{g.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
                          g.rsvpStatus === 'YES' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          g.rsvpStatus === 'NO' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          RSVP: {g.rsvpStatus}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>{g.email}</span>
                        <span className="text-slate-300">|</span>
                        <span>{g.company}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-slate-600">{g.tableNumber} ({g.seatNumber})</span>
                      </div>
                    </div>

                    {/* RSVP Quick Actions */}
                    <div className="flex gap-1.5 text-[9px] font-bold">
                      <button
                        onClick={() => toggleRSVP(g.id, 'YES')}
                        className={`py-1 px-2 border cursor-pointer transition-all ${
                          g.rsvpStatus === 'YES' 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-emerald-600'
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => toggleRSVP(g.id, 'PENDING')}
                        className={`py-1 px-2 border cursor-pointer transition-all ${
                          g.rsvpStatus === 'PENDING' 
                            ? 'bg-amber-500 text-white border-amber-400' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-amber-500'
                        }`}
                      >
                        PEND
                      </button>
                      <button
                        onClick={() => toggleRSVP(g.id, 'NO')}
                        className={`py-1 px-2 border cursor-pointer transition-all ${
                          g.rsvpStatus === 'NO' 
                            ? 'bg-rose-500 text-white border-rose-400' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-rose-500'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Delivery campaign Logs stream */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm font-mono">
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-150 pb-3.5 flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-slate-700" />
              <span>Real-Time Campaign Delivery Stream ({deliveryLogs.length})</span>
            </h3>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 text-[11px]">
              {deliveryLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                  No campaign dispatches on file.
                </div>
              ) : (
                deliveryLogs.map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2.5">
                      {log.status === 'DELIVERED' ? (
                        <div className="h-5 w-5 bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center font-bold">
                          ✓
                        </div>
                      ) : (
                        <div className="h-5 w-5 bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center font-bold">
                          ✗
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-800">{log.guestName}</span>
                        <div className="text-[10px] text-slate-400 flex gap-2">
                          <span>{log.channel}</span>
                          <span>•</span>
                          <span>Stage: {log.intervalStage}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[9px] font-bold px-1 py-0.5 ${
                        log.status === 'DELIVERED' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {log.status}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        {new Date(log.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
