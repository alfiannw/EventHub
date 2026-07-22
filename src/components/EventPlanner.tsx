import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Users, Award, Shield, Tag, Plus, Trash2, Copy, 
  Archive, Mail, MessageSquare, CheckSquare, Layers, Settings, Save, 
  HelpCircle, RefreshCw, Layers3, Briefcase, Gift, Send, Play, Layout, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventPlannerItem, ActivityType } from '../types';

interface EventPlannerProps {
  onRefreshAll: () => Promise<void>;
}

export default function EventPlanner({ onRefreshAll }: EventPlannerProps) {
  const [events, setEvents] = useState<EventPlannerItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // Tabs configuration
  const [activeTab, setActiveTab] = useState<'VENUE_SEATING' | 'SCHEDULE_ACTIVITIES' | 'POINTS' | 'SPONSORS' | 'LUCKY_DRAWS' | 'FORM_OUTREACH'>('VENUE_SEATING');

  // Event list fetcher
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/planner/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          // Select the first non-archived event if possible
          const active = data.find((e: any) => !e.isArchived) || data[0];
          setSelectedEventId(active.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch planned events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Selected event object
  const currentEvent = events.find(e => e.id === selectedEventId);

  // Form edit helper states (synchronized with currentEvent)
  const [eventName, setEventName] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [showLeaderboardRank, setShowLeaderboardRank] = useState(true);
  
  // Sub-config states
  const [venueBallroom, setVenueBallroom] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(500);
  const [venueAddress, setVenueAddress] = useState('');
  const [venueParking, setVenueParking] = useState('');
  const [venueGoogleMapsUrl, setVenueGoogleMapsUrl] = useState('');

  const [tablesCount, setTablesCount] = useState(10);
  const [seatsPerTable, setSeatsPerTable] = useState(8);
  const [vipTablesCount, setVipTablesCount] = useState(3);
  const [assignmentMode, setAssignmentMode] = useState<'AUTO' | 'MANUAL' | 'FIRST_COME'>('AUTO');

  const [pointRules, setPointRules] = useState<Record<ActivityType, number>>({
    CHECK_IN: 5,
    FEEDBACK: 5,
    PHOTO_UPLOAD: 5,
    INSTAGRAM_POST: 5,
    SONG_REQUEST: 5,
    STAFF_BEST_PHOTO: 5,
    STAFF_ACTIVE: 5,
    CUSTOM: 5
  });

  const [schedule, setSchedule] = useState<Array<{ id: string; time: string; activity: string }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; type: ActivityType | string; name: string; description?: string; isEnabled: boolean; requireApproval: boolean; validationMethod: string; startTime?: string; endTime?: string; points?: number; requiresCamera?: boolean; requiresGallery?: boolean; }>>([]);
  const [sponsorBooths, setSponsorBooths] = useState<Array<{ id: string; name: string; boothCode: string; pointsReward: number; locationDescription: string }>>([]);
  const [luckyDrawCategories, setLuckyDrawCategories] = useState<Array<{ id: string; name: string; eligiblePointsMin: number; prizeName: string; quantity: number }>>([]);
  const [prizes, setPrizes] = useState<Array<{ id: string; name: string; description: string; stock: number; pointsRequiredToRedeem: number; imageUrl?: string }>>([]);
  
  const [regForm, setRegForm] = useState({
    requireCompany: true,
    requirePosition: true,
    requirePhone: true,
    requireFoodAllergies: false,
    customDisclaimer: '',
    isEnabled: true
  });

  const [emails, setEmails] = useState({
    h7Subject: '',
    h7Body: '',
    h3Subject: '',
    h3Body: '',
    h1Subject: '',
    h1Body: '',
    dayOfSubject: '',
    dayOfBody: ''
  });

  const [whatsapps, setWhatsapps] = useState({
    h7Message: '',
    h3Message: '',
    h1Message: '',
    dayOfMessage: ''
  });

  // Sync edits when event selection shifts
  useEffect(() => {
    if (currentEvent) {
      setEventName(currentEvent.name);
      setEventVenue(currentEvent.venue);
      setEventDate(currentEvent.date);
      setEventTime(currentEvent.time);
      setEventDesc(currentEvent.description || '');
      setShowLeaderboardRank(currentEvent.showLeaderboardRank !== false);

      setVenueBallroom(currentEvent.venueDetails?.ballroom || '');
      setVenueCapacity(currentEvent.venueDetails?.capacity || 500);
      setVenueAddress(currentEvent.venueDetails?.address || '');
      setVenueParking(currentEvent.venueDetails?.parkingInstructions || '');
      setVenueGoogleMapsUrl(currentEvent.venueDetails?.googleMapsUrl || '');

      setTablesCount(currentEvent.seatingLayout?.tablesCount || 10);
      setSeatsPerTable(currentEvent.seatingLayout?.seatsPerTable || 8);
      setVipTablesCount(currentEvent.seatingLayout?.vipTablesCount || 3);
      setAssignmentMode(currentEvent.seatingLayout?.assignmentMode || 'AUTO');

      setPointRules(currentEvent.pointRules);
      setSchedule(currentEvent.schedule || []);
      setActivities(currentEvent.activities || []);
      setSponsorBooths(currentEvent.sponsorBooths || []);
      setLuckyDrawCategories(currentEvent.luckyDrawCategories || []);
      setPrizes(currentEvent.prizes || []);
      setRegForm(currentEvent.registrationForm || {
        requireCompany: true,
        requirePosition: true,
        requirePhone: true,
        requireFoodAllergies: false,
        customDisclaimer: '',
        isEnabled: true
      });
      setEmails(currentEvent.emailTemplates || {
        h7Subject: '', h7Body: '', h3Subject: '', h3Body: '', h1Subject: '', h1Body: '', dayOfSubject: '', dayOfBody: ''
      });
      setWhatsapps(currentEvent.whatsappTemplates || {
        h7Message: '', h3Message: '', h1Message: '', dayOfMessage: ''
      });
    }
  }, [selectedEventId, events]);

  // Handler: Save Complete State Config
  const handleSaveConfig = async () => {
    if (!currentEvent) return;
    setSaveStatus('SAVING');
    try {
      const updatedItem: EventPlannerItem = {
        ...currentEvent,
        name: eventName,
        venue: eventVenue,
        date: eventDate,
        time: eventTime,
        description: eventDesc,
        showLeaderboardRank,
        venueDetails: {
          ballroom: venueBallroom,
          capacity: venueCapacity,
          address: venueAddress,
          parkingInstructions: venueParking,
          googleMapsUrl: venueGoogleMapsUrl
        },
        seatingLayout: {
          tablesCount,
          seatsPerTable,
          vipTablesCount,
          assignmentMode
        },
        pointRules,
        schedule,
        activities,
        sponsorBooths,
        luckyDrawCategories,
        prizes,
        registrationForm: regForm,
        emailTemplates: emails,
        whatsappTemplates: whatsapps
      };

      const res = await fetch('/api/planner/config/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });

      if (res.ok) {
        setSaveStatus('SUCCESS');
        await fetchEvents();
        await onRefreshAll();
        setTimeout(() => setSaveStatus('IDLE'), 3000);
      } else {
        setSaveStatus('ERROR');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('ERROR');
    }
  };

  // Handler: Duplicate Event
  const handleDuplicate = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/planner/events/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id })
      });
      if (res.ok) {
        const duplicated = await res.json();
        await fetchEvents();
        setSelectedEventId(duplicated.id);
        await onRefreshAll();
      }
    } catch (err) {
      console.error("Duplicate failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Archive/Unarchive Event
  const handleArchiveToggle = async (id: string, isArchived: boolean) => {
    try {
      setLoading(true);
      const res = await fetch('/api/planner/events/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, isArchived })
      });
      if (res.ok) {
        await fetchEvents();
        await onRefreshAll();
      }
    } catch (err) {
      console.error("Archive toggle failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Create New Blank Event
  const handleCreateNewBlankEvent = async () => {
    try {
      setLoading(true);
      const newId = `evt-${Date.now()}`;
      const newBlank: EventPlannerItem = {
        id: newId,
        name: "Untitled New Summit " + new Date().getFullYear(),
        venue: "New Venue Center",
        date: new Date().toISOString().split('T')[0],
        time: "09:00 AM - 05:00 PM",
        isArchived: false,
        createdAt: new Date().toISOString(),
        description: "New empty event template ready for full setups.",
        venueDetails: {
          ballroom: "Grand Exhibition Suite",
          capacity: 300,
          address: "123 Main Avenue, Tech District",
          parkingInstructions: "Free parking available in the West block."
        },
        schedule: [
          { id: `sch-${Date.now()}-1`, time: "09:00 AM - 10:00 AM", activity: "Opening Day Registration" },
          { id: `sch-${Date.now()}-2`, time: "10:00 AM - 11:30 AM", activity: "Introduction Keynote" }
        ],
        seatingLayout: {
          tablesCount: 5,
          seatsPerTable: 8,
          vipTablesCount: 1,
          assignmentMode: "AUTO"
        },
        pointRules: {
          CHECK_IN: 5,
          FEEDBACK: 5,
          PHOTO_UPLOAD: 5,
          INSTAGRAM_POST: 5,
          SONG_REQUEST: 5,
          STAFF_BEST_PHOTO: 5,
          STAFF_ACTIVE: 5,
          NETWORKING: 15,
          CUSTOM: 5
        },
        activities: [
          { id: `act-${Date.now()}-1`, type: "CHECK_IN", name: "Main Desk Check-In", isEnabled: true, requireApproval: false, validationMethod: "AUTOMATIC" },
          { id: `act-${Date.now()}-2`, type: "FEEDBACK", name: "MESSAGE TO KSO", isEnabled: true, requireApproval: false, validationMethod: "AUTOMATIC" },
          { id: `act-${Date.now()}-3`, type: "NETWORKING", name: "Attendee Networking Challenge", isEnabled: true, requireApproval: false, validationMethod: "QR_SCAN", points: 15 }
        ],
        sponsorBooths: [
          { id: `sb-${Date.now()}-1`, name: "Enterprise Sponsor A", boothCode: "BOOTH-A", pointsReward: 10, locationDescription: "Lobby Center" }
        ],
        luckyDrawCategories: [
          { id: `ld-${Date.now()}-1`, name: "First tier", eligiblePointsMin: 10, prizeName: "Gift Card Bundle", quantity: 5 }
        ],
        prizes: [
          { id: `prz-${Date.now()}-1`, name: "Gift Card Bundle", description: "$50 Tech Voucher", stock: 5, pointsRequiredToRedeem: 10 }
        ],
        registrationForm: {
          requireCompany: true,
          requirePosition: false,
          requirePhone: true,
          requireFoodAllergies: false,
          customDisclaimer: "Standard terms of service apply.",
          isEnabled: true
        },
        emailTemplates: {
          h7Subject: "Welcome Notification",
          h7Body: "Hi {{GUEST_NAME}},\n\nWelcome to our event!\n\nRegards.",
          h3Subject: "Schedule Outline",
          h3Body: "Hi {{GUEST_NAME}},\n\n3 days remaining.\n\nRegards.",
          h1Subject: "Check-in Details",
          h1Body: "Hi {{GUEST_NAME}},\n\nSee you tomorrow.\n\nRegards.",
          dayOfSubject: "Event Day Info",
          dayOfBody: "Hi {{GUEST_NAME}},\n\nDoors are open!."
        },
        whatsappTemplates: {
          h7Message: "Hi {{GUEST_NAME}}! Confirm RSVP for {{EVENT_NAME}}.",
          h3Message: "Hello {{GUEST_NAME}}! Only 3 days left.",
          h1Message: "See you tomorrow at {{EVENT_NAME}}!",
          dayOfMessage: "Welcome to {{EVENT_NAME}}! Enjoy your day!."
        }
      };

      const res = await fetch('/api/planner/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlank)
      });

      if (res.ok) {
        await fetchEvents();
        setSelectedEventId(newId);
        await onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers to split and join time intervals "Start Time - End Time"
  const parseTimeInterval = (timeStr: string) => {
    if (!timeStr) return { start: '', end: '' };
    const parts = timeStr.split(' - ');
    return {
      start: parts[0] || '',
      end: parts[1] || ''
    };
  };

  const updateScheduleTime = (id: string, startVal: string, endVal: string) => {
    const s = (startVal || '').trim();
    const e = (endVal || '').trim();
    const combined = s && e ? `${s} - ${e}` : (s || e || '');
    updateScheduleSlot(id, 'time', combined);
  };

  // Helpers to add dynamic rows
  const addScheduleSlot = () => {
    setSchedule([...schedule, { id: `sch-${Date.now()}`, time: '09:00 AM - 10:00 AM', activity: 'New Interactive Session' }]);
  };

  const removeScheduleSlot = (id: string) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const addActivity = () => {
    const uniqueId = `ACT_${Date.now()}`;
    setActivities([
      ...activities,
      {
        id: uniqueId,
        type: `CUSTOM_${uniqueId}`,
        name: 'New Custom Activity',
        description: '',
        isEnabled: true,
        requireApproval: false,
        validationMethod: 'STAFF_APPROVAL',
        startTime: '09:00 AM',
        endTime: '10:00 PM',
        points: 10,
        requiresCamera: false,
        requiresGallery: false
      }
    ]);
  };

  const removeActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const updateScheduleSlot = (id: string, field: 'time' | 'activity' | 'description', val: string) => {
    setSchedule(schedule.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const addSponsorBooth = () => {
    setSponsorBooths([...sponsorBooths, { id: `sb-${Date.now()}`, name: 'New Sponsor', boothCode: 'BOOTH-999', pointsReward: 10, locationDescription: 'Main Corridor' }]);
  };

  const removeSponsorBooth = (id: string) => {
    setSponsorBooths(sponsorBooths.filter(s => s.id !== id));
  };

  const updateSponsorBooth = (id: string, field: keyof typeof sponsorBooths[0], val: any) => {
    setSponsorBooths(sponsorBooths.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const addLuckyDrawCategory = () => {
    setLuckyDrawCategories([...luckyDrawCategories, { id: `ld-${Date.now()}`, name: 'New Tier Prize', eligiblePointsMin: 10, prizeName: 'Mystery Box Gift', quantity: 1 }]);
  };

  const removeLuckyDrawCategory = (id: string) => {
    setLuckyDrawCategories(luckyDrawCategories.filter(l => l.id !== id));
  };

  const updateLuckyDrawCategory = (id: string, field: keyof typeof luckyDrawCategories[0], val: any) => {
    setLuckyDrawCategories(luckyDrawCategories.map(l => l.id === id ? { ...l, [field]: val } : l));
  };

  const addPrize = () => {
    setPrizes([...prizes, { id: `prz-${Date.now()}`, name: 'Premium Swag Bag', description: 'Hoodie + branded accessories', stock: 10, pointsRequiredToRedeem: 20 }]);
  };

  const removePrize = (id: string) => {
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const updatePrize = (id: string, field: keyof typeof prizes[0], val: any) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  return (
    <div className="space-y-6" id="event-planner-module">
      
      {/* Title block */}
      <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-black uppercase text-[#141414] tracking-tight flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-indigo-700" />
            <span>Core Event Planner & Orchestrator Station</span>
          </h2>
          <p className="text-[11px] text-slate-600 font-serif-italic">
            Manage high-level events parameters, duplicating schedules, configuring seat maps, setting gamification targets, and customizing registration templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCreateNewBlankEvent}
            className="px-3 py-1.5 bg-[#141414] text-white font-mono text-[10px] font-bold uppercase transition-all hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Event</span>
          </button>
          <button 
            onClick={fetchEvents}
            className="px-3 py-1.5 border border-[#141414] text-[#141414] bg-white font-mono text-[10px] font-bold uppercase transition-all hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EVENTS DICTIONARY / SELECTION CONTAINER */}
        <div className="lg:col-span-4 space-y-4">
          <div className="tech-card p-4">
            <h3 className="font-mono font-bold text-xs text-slate-900 uppercase border-b border-[#141414] pb-2 mb-3 flex items-center justify-between">
              <span>Event Registry Catalogue</span>
              <span className="text-[9px] bg-[#141414] text-white px-1.5 py-0.5 rounded-none">{events.length} Total</span>
            </h3>

            {loading ? (
              <div className="py-8 text-center font-mono text-[10px] text-slate-500 animate-pulse">
                Querying Server Memory ...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {events.map((evt) => {
                  const isSelected = evt.id === selectedEventId;
                  return (
                    <div 
                      key={evt.id}
                      className={`border p-3 transition-all flex flex-col justify-between gap-2.5 ${
                        isSelected 
                          ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[4px_4px_0px_#00FF00]' 
                          : 'bg-[#DFDEDA] text-[#141414] border-[#141414] hover:bg-[#CFCECA]'
                      }`}
                    >
                      <div className="cursor-pointer flex-1" onClick={() => setSelectedEventId(evt.id)}>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 ${
                            evt.isArchived 
                              ? 'bg-amber-600/20 text-amber-800 border border-amber-600/40' 
                              : 'bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/30'
                          }`}>
                            {evt.isArchived ? 'ARCHIVED PAST EVENT' : 'ACTIVE SUMMIT'}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {evt.date}
                          </span>
                        </div>
                        
                        <h4 className="text-[11px] font-mono font-black uppercase mt-1.5 line-clamp-2 leading-tight">
                          {evt.name}
                        </h4>
                        <p className={`text-[10px] font-serif-italic mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                          {evt.description || "No description provided."}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-gray-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[180px]">{evt.venue}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 border-t border-dashed border-neutral-700 pt-2 text-[9px] font-mono">
                        <button
                          onClick={() => handleDuplicate(evt.id)}
                          className={`flex-1 py-1 rounded-none border text-[8px] font-bold uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected 
                              ? 'bg-neutral-800 border-neutral-700 text-slate-300 hover:bg-neutral-700' 
                              : 'bg-white border-neutral-400 text-slate-700 hover:bg-neutral-100'
                          }`}
                          title="Duplicate previous event rules & setup into a new active copy"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={() => handleArchiveToggle(evt.id, !evt.isArchived)}
                          className={`flex-1 py-1 rounded-none border text-[8px] font-bold uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                            evt.isArchived 
                              ? 'bg-[#00FF00]/20 border-[#00FF00]/30 text-emerald-950 hover:bg-[#00FF00]/35' 
                              : 'bg-amber-600/20 border-amber-600/30 text-amber-900 hover:bg-amber-600/30'
                          }`}
                        >
                          <Archive className="w-2.5 h-2.5" />
                          <span>{evt.isArchived ? 'Restore' : 'Archive'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED CONFIGURATION CONTROLLER */}
        <div className="lg:col-span-8 space-y-4">
          {currentEvent ? (
            <div className="tech-card p-5 space-y-5">
              
              {/* Event basic header state */}
              <div className="border-b border-dashed border-[#141414] pb-4 space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">
                    Editing Node: {currentEvent.id} ({currentEvent.isArchived ? "Archived" : "Active"})
                  </span>
                  
                  {/* Save feedback banner */}
                  <div className="flex items-center gap-2">
                    {saveStatus === 'SAVING' && (
                      <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                        [WRITING JSON STORE...]
                      </span>
                    )}
                    {saveStatus === 'SUCCESS' && (
                      <span className="text-[9px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>CONFIG RE-CONFIGURED & COMMITTED!</span>
                      </span>
                    )}
                    {saveStatus === 'ERROR' && (
                      <span className="text-[9px] text-red-600 font-bold">
                        [ERROR TRANSMITTING CONFIGS]
                      </span>
                    )}
                    
                    <button
                      onClick={handleSaveConfig}
                      className="px-4 py-2 bg-indigo-700 text-white font-mono text-xs font-black uppercase tracking-tight flex items-center gap-2 cursor-pointer border border-indigo-900 shadow-[2px_2px_0px_#141414]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Commit & Deploy Rules</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Event Label Name</label>
                    <input 
                      type="text" 
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="tech-input w-full font-bold text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Brief Summary Description</label>
                    <input 
                      type="text" 
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder="e.g. Landmark 2026 developer conference..."
                      className="tech-input w-full text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Venue</label>
                    <input 
                      type="text" 
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      className="tech-input w-full text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Scheduled Date</label>
                    <input 
                      type="date" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="tech-input w-full text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Duration Info</label>
                    <input 
                      type="text" 
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="tech-input w-full text-xs" 
                    />
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Participant Leaderboard</label>
                    <label className="flex items-center gap-2 cursor-pointer h-[34px] bg-white border-2 border-[#141414] rounded-[10px] px-2.5 transition-all hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#141414]">
                      <input 
                        type="checkbox" 
                        checked={showLeaderboardRank}
                        onChange={(e) => setShowLeaderboardRank(e.target.checked)}
                        className="accent-black h-3.5 w-3.5 cursor-pointer" 
                      />
                      <span className="font-bold text-[9px] select-none text-[#141414] tracking-tighter">
                        {showLeaderboardRank ? "RANKING VISIBLE" : "RANKING HIDDEN"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex flex-wrap bg-white p-1 border-2 border-[#141414] rounded-xl gap-1 mb-6">
                {[
                  { id: 'VENUE_SEATING', label: '01 Venue & Seating', icon: MapPin, color: '#C5F237' },
                  { id: 'SCHEDULE_ACTIVITIES', label: '02 Schedule & Activities', icon: Calendar, color: '#38BDF8' },
                  { id: 'POINTS', label: '03 Point Rules', icon: Award, color: '#FFE600' },
                  { id: 'SPONSORS', label: '04 Booths & Sponsors', icon: Layout, color: '#DDD6FE' },
                  { id: 'LUCKY_DRAWS', label: '05 Lucky Draw & Prizes', icon: Gift, color: '#F472B6' },
                  { id: 'FORM_OUTREACH', label: '06 Form & Communications', icon: Send, color: '#FF6B00' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isCurrent = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        backgroundColor: isCurrent ? tab.color : 'transparent',
                      }}
                      className={`flex-1 min-w-[130px] py-2 px-2.5 font-mono text-[9px] uppercase font-black tracking-tighter flex items-center justify-center gap-1.5 transition-all border-2 rounded-[8px] cursor-pointer ${
                        isCurrent 
                          ? 'text-[#141414] border-[#141414] shadow-[1.5px_1.5px_0px_0px_#141414]' 
                          : 'text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: isCurrent ? '#141414' : 'inherit' }} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE TAB CONTAINER */}
              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: VENUE & SEATING LAYOUT */}
                  {activeTab === 'VENUE_SEATING' && (
                    <motion.div 
                      key="venue-seating"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <h4 className="font-bold text-[10px] uppercase text-indigo-800 border-b border-[#141414] pb-1.5 mb-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Venue Metadata Details</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Specific Ballroom Area</label>
                              <input 
                                type="text" 
                                value={venueBallroom}
                                onChange={(e) => setVenueBallroom(e.target.value)}
                                placeholder="e.g. Grand Ballroom Section 3"
                                className="tech-input w-full bg-white text-xs" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Total Seat Capacity</label>
                              <input 
                                type="number" 
                                value={venueCapacity}
                                onChange={(e) => setVenueCapacity(parseInt(e.target.value) || 0)}
                                className="tech-input w-full bg-white text-xs" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Exact Postal Address</label>
                              <textarea 
                                value={venueAddress}
                                onChange={(e) => setVenueAddress(e.target.value)}
                                rows={2}
                                className="tech-input w-full bg-white text-xs resize-none" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Parking Guidelines</label>
                              <input 
                                type="text" 
                                value={venueParking}
                                onChange={(e) => setVenueParking(e.target.value)}
                                placeholder="e.g. Valet validation available at desk..."
                                className="tech-input w-full bg-white text-xs" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Google Maps Link</label>
                              <input 
                                type="url" 
                                value={venueGoogleMapsUrl}
                                onChange={(e) => setVenueGoogleMapsUrl(e.target.value)}
                                placeholder="https://maps.google.com/?q=..."
                                className="tech-input w-full bg-white text-xs text-indigo-900" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <h4 className="font-bold text-[10px] uppercase text-indigo-800 border-b border-[#141414] pb-1.5 mb-2 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Seating Grid & Allocation Layout</span>
                          </h4>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase block">Number of Tables</label>
                                <input 
                                  type="number" 
                                  value={tablesCount}
                                  onChange={(e) => setTablesCount(parseInt(e.target.value) || 1)}
                                  className="tech-input w-full bg-white text-xs" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase block">Seats Per Table</label>
                                <input 
                                  type="number" 
                                  value={seatsPerTable}
                                  onChange={(e) => setSeatsPerTable(parseInt(e.target.value) || 1)}
                                  className="tech-input w-full bg-white text-xs" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">VIP Tables Reserve Count</label>
                              <input 
                                type="number" 
                                value={vipTablesCount}
                                onChange={(e) => setVipTablesCount(parseInt(e.target.value) || 0)}
                                className="tech-input w-full bg-white text-xs" 
                              />
                              <span className="text-[8px] text-gray-500 block">Tables 1 to {vipTablesCount} will be designated as VIP zones.</span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Seat Assignment Algorithm</label>
                              <select 
                                value={assignmentMode} 
                                onChange={(e: any) => setAssignmentMode(e.target.value)}
                                className="tech-input w-full bg-white text-xs"
                              >
                                <option value="AUTO">Auto-Balanced (Smart Fill algorithm)</option>
                                <option value="FIRST_COME">First-Come, First-Served (Sequential table fills)</option>
                                <option value="MANUAL">Manual Placement (Drag & Drop via staff desks)</option>
                              </select>
                            </div>

                            <div className="bg-slate-50 p-2.5 border border-dashed border-slate-400 text-[9px] leading-tight text-slate-600">
                              <strong>Layout preview:</strong> {tablesCount} tables * {seatsPerTable} seats = <strong>{tablesCount * seatsPerTable} seats</strong> total mapped seating. Maximum capacity is restricted to {venueCapacity} pax.
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: SCHEDULE & GAMIFIED ACTIVITIES */}
                  {activeTab === 'SCHEDULE_ACTIVITIES' && (
                    <motion.div 
                      key="schedule-activities"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Event schedule outline */}
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <div className="flex justify-between items-center border-b border-[#141414] pb-1.5 mb-2">
                            <h4 className="font-bold text-[10px] uppercase text-indigo-800 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Agenda Schedule Outline</span>
                            </h4>
                            <button
                              type="button"
                              onClick={addScheduleSlot}
                              className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold uppercase transition-all hover:bg-neutral-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Slot</span>
                            </button>
                          </div>

                           <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {schedule.map((slot, index) => {
                              const { start, end } = parseTimeInterval(slot.time);
                              return (
                                <div key={slot.id || index} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2.5 border border-slate-300 font-mono">
                                  <div className="flex items-center gap-1 shrink-0">
                                    <input 
                                      type="text" 
                                      value={start}
                                      onChange={(e) => updateScheduleTime(slot.id, e.target.value, end)}
                                      placeholder="09:00 AM"
                                      className="w-[70px] font-bold border-b border-gray-300 focus:border-black outline-none text-[9px] uppercase px-0.5 py-0.5 text-center"
                                      title="Activity start time"
                                    />
                                    <span className="text-[8px] text-gray-400 font-bold uppercase shrink-0 px-0.5">to</span>
                                    <input 
                                      type="text" 
                                      value={end}
                                      onChange={(e) => updateScheduleTime(slot.id, start, e.target.value)}
                                      placeholder="10:00 AM"
                                      className="w-[70px] font-bold border-b border-gray-300 focus:border-black outline-none text-[9px] uppercase px-0.5 py-0.5 text-center"
                                      title="Activity finish time"
                                    />
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1.5">
                                    <input 
                                      type="text" 
                                      value={slot.activity}
                                      onChange={(e) => updateScheduleSlot(slot.id, 'activity', e.target.value)}
                                      placeholder="Session activity name"
                                      className="w-full border-b border-gray-300 focus:border-black outline-none text-[10px] font-bold px-1 py-0.5"
                                    />
                                    <input 
                                      type="text" 
                                      value={slot.description || ''}
                                      onChange={(e) => updateScheduleSlot(slot.id, 'description', e.target.value)}
                                      placeholder="Session details / description / location"
                                      className="w-full border-b border-gray-200 focus:border-black outline-none text-[9px] text-slate-500 px-1 py-0.5"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeScheduleSlot(slot.id)}
                                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors cursor-pointer"
                                    title="Delete item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                            {schedule.length === 0 && (
                              <div className="py-8 text-center text-slate-500 text-[10px]">
                                No schedule items configured. Click "Add Slot" to seed.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Activities list */}
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <div className="flex justify-between items-center border-b border-[#141414] pb-1.5 mb-2">
                            <h4 className="font-bold text-[10px] uppercase text-indigo-800 flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Configure Gamified Activities</span>
                            </h4>
                            <button
                              type="button"
                              onClick={addActivity}
                              className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold uppercase transition-all hover:bg-neutral-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Custom</span>
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {activities.map((act, index) => (
                              <div key={act.id || index} className="bg-white p-3 border border-slate-300 space-y-3">
                                <div className="flex items-start justify-between">
                                  {act.type.startsWith('CUSTOM') ? (
                                    <input 
                                      type="text" 
                                      value={act.name}
                                      onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, name: e.target.value } : a))}
                                      placeholder="Activity Name"
                                      className="font-black text-[10px] text-slate-800 uppercase border-b border-gray-300 outline-none w-2/3 focus:border-black"
                                    />
                                  ) : (
                                    <span className="font-black text-[10px] text-slate-800 uppercase">{act.name}</span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-1.5 py-0.5 uppercase font-mono max-w-[80px] truncate" title={act.type}>
                                      {act.type.startsWith('CUSTOM') ? 'CUSTOM' : act.type}
                                    </span>
                                    {act.type.startsWith('CUSTOM') && (
                                      <button onClick={() => removeActivity(act.id)} className="text-red-600 hover:text-red-800 cursor-pointer">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] font-mono">
                                  {act.type.startsWith('CUSTOM') && (
                                    <div className="sm:col-span-2">
                                      <input 
                                        type="text" 
                                        value={act.description || ''}
                                        onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, description: e.target.value } : a))}
                                        placeholder="Description"
                                        className="w-full border-b border-gray-300 focus:border-black outline-none px-1 py-0.5"
                                      />
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-1">
                                    <span className="text-slate-500 font-bold uppercase">Time Range</span>
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="text" 
                                        value={act.startTime || ''}
                                        onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, startTime: e.target.value } : a))}
                                        placeholder="09:00 AM"
                                        className="w-16 border-b border-gray-300 focus:border-black outline-none text-center"
                                      />
                                      <span className="text-[7px]">to</span>
                                      <input 
                                        type="text" 
                                        value={act.endTime || ''}
                                        onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, endTime: e.target.value } : a))}
                                        placeholder="05:00 PM"
                                        className="w-16 border-b border-gray-300 focus:border-black outline-none text-center"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-slate-500 font-bold uppercase">Validation Method</span>
                                    <select
                                      value={act.validationMethod || 'STAFF_APPROVAL'}
                                      onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, validationMethod: e.target.value } : a))}
                                      className="border border-gray-300 p-0.5 outline-none focus:border-black bg-white cursor-pointer"
                                    >
                                      <option value="AUTOMATIC">Automatic</option>
                                      <option value="STAFF_APPROVAL">Staff Approval</option>
                                      <option value="QR_SCAN">QR Scan</option>
                                      <option value="GPS">GPS Geolocation</option>
                                      <option value="MANUAL_APPROVAL">Manual Verification</option>
                                    </select>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-slate-500 font-bold uppercase">Points</span>
                                    <input 
                                      type="number"
                                      value={act.points ?? pointRules[act.type as keyof typeof pointRules] ?? 5}
                                      onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, points: parseInt(e.target.value) || 0 } : a))}
                                      className="border border-gray-300 p-0.5 outline-none focus:border-black w-16 text-center"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2 border-t border-dotted border-gray-200">
                                  <div className="flex flex-wrap items-center gap-4 text-[9px]">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={act.isEnabled}
                                        onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, isEnabled: e.target.checked } : a))}
                                        className="rounded-none accent-black border-gray-300" 
                                      />
                                      <span className="font-bold text-gray-700">ENABLED</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={act.requireApproval}
                                        onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, requireApproval: e.target.checked } : a))}
                                        className="rounded-none accent-black border-gray-300" 
                                      />
                                      <span className="font-bold text-gray-700">REQUIRES APPROVAL (Legacy)</span>
                                    </label>
                                  </div>

                                  {act.type.startsWith('CUSTOM') && (
                                    <div className="bg-slate-50 p-2 border border-slate-200 space-y-1.5 mt-1">
                                      <span className="font-bold text-indigo-900 text-[8px] uppercase block">Required Submission Assets Checklist:</span>
                                      <div className="flex flex-wrap items-center gap-4 text-[9px]">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <input 
                                            type="checkbox" 
                                            checked={act.requiresCamera || false}
                                            onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, requiresCamera: e.target.checked } : a))}
                                            className="rounded-none accent-black border-gray-300" 
                                          />
                                          <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <span>📸</span>
                                            <span>Requires Cellphone Camera (Photo Snap)</span>
                                          </span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <input 
                                            type="checkbox" 
                                            checked={act.requiresGallery || false}
                                            onChange={(e) => setActivities(activities.map(a => a.id === act.id ? { ...a, requiresGallery: e.target.checked } : a))}
                                            className="rounded-none accent-black border-gray-300" 
                                          />
                                          <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <span>📁</span>
                                            <span>Requires Photo from Gallery</span>
                                          </span>
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {activities.length === 0 && (
                              <div className="py-8 text-center text-slate-500 text-[10px]">
                                No activities configured. Initialize some or add custom ones.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: GAMIFICATION POINT RULES */}
                  {activeTab === 'POINTS' && (
                    <motion.div 
                      key="points"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-4">
                        <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                          <h4 className="font-bold text-[10px] uppercase text-indigo-800 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>Modify Points Distribution Values</span>
                          </h4>
                          <span className="text-[8px] text-gray-500 uppercase">Values awarded automatically or upon approval</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { key: 'CHECK_IN', label: 'Summit Arrival Check-In', color: 'border-emerald-400 bg-emerald-50/50' },
                            { key: 'FEEDBACK', label: 'MESSAGE TO KSO', color: 'border-blue-400 bg-blue-50/50' },
                            { key: 'PHOTO_UPLOAD', label: 'Upload Photo Wall snap', color: 'border-purple-400 bg-purple-50/50' },
                            { key: 'INSTAGRAM_POST', label: 'Share Tagged Social Story', color: 'border-rose-400 bg-rose-50/50' },
                            { key: 'SONG_REQUEST', label: 'Request Stage Band Song', color: 'border-amber-400 bg-amber-50/50' },
                            { key: 'STAFF_BEST_PHOTO', label: 'Award Staff Best Photo Pick', color: 'border-indigo-400 bg-indigo-50/50' },
                            { key: 'STAFF_ACTIVE', label: 'Custom Active Staff Award', color: 'border-teal-400 bg-teal-50/50' },
                            { key: 'NETWORKING', label: 'Networking Connection Scan', color: 'border-yellow-400 bg-yellow-50/50' },
                            { key: 'CUSTOM', label: 'Spot General Admin Award', color: 'border-neutral-400 bg-neutral-50/50' }
                          ].map((rule) => (
                            <div key={rule.key} className={`border p-3 space-y-1.5 flex flex-col justify-between ${rule.color}`}>
                              <span className="text-[8px] font-black text-slate-800 block uppercase tracking-tight leading-tight">
                                {rule.label}
                              </span>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  value={pointRules[rule.key as ActivityType] ?? 5}
                                  onChange={(e) => {
                                    setPointRules({
                                      ...pointRules,
                                      [rule.key]: parseInt(e.target.value) || 0
                                    });
                                  }}
                                  className="w-full tech-input bg-white text-xs font-bold text-center" 
                                />
                                <span className="text-[8px] text-slate-500 font-bold uppercase">PTS</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: SPONSOR BOOTHS */}
                  {activeTab === 'SPONSORS' && (
                    <motion.div 
                      key="sponsors"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                        <div className="flex justify-between items-center border-b border-[#141414] pb-1.5 mb-2">
                          <h4 className="font-bold text-[10px] uppercase text-indigo-800 flex items-center gap-1">
                            <Layout className="w-3.5 h-3.5" />
                            <span>Corporate Sponsors & Verification Booths</span>
                          </h4>
                          <button
                            type="button"
                            onClick={addSponsorBooth}
                            className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold uppercase transition-all hover:bg-neutral-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add Booth</span>
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {sponsorBooths.map((booth, index) => (
                            <div key={booth.id || index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3 border border-slate-300 items-end">
                              <div className="sm:col-span-4 space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Sponsor Company Name</label>
                                <input 
                                  type="text" 
                                  value={booth.name}
                                  onChange={(e) => updateSponsorBooth(booth.id, 'name', e.target.value)}
                                  placeholder="e.g. Google Cloud"
                                  className="w-full tech-input text-[10px]"
                                />
                              </div>
                              <div className="sm:col-span-3 space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Booth ID / Code</label>
                                <input 
                                  type="text" 
                                  value={booth.boothCode}
                                  onChange={(e) => updateSponsorBooth(booth.id, 'boothCode', e.target.value)}
                                  placeholder="BOOTH-101"
                                  className="w-full tech-input text-[10px]"
                                />
                              </div>
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">PTS Reward</label>
                                <input 
                                  type="number" 
                                  value={booth.pointsReward}
                                  onChange={(e) => updateSponsorBooth(booth.id, 'pointsReward', parseInt(e.target.value) || 0)}
                                  className="w-full tech-input text-[10px]"
                                />
                              </div>
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Coordinates / Floor</label>
                                <input 
                                  type="text" 
                                  value={booth.locationDescription}
                                  onChange={(e) => updateSponsorBooth(booth.id, 'locationDescription', e.target.value)}
                                  placeholder="West Corridor"
                                  className="w-full tech-input text-[10px]"
                                />
                              </div>
                              <div className="sm:col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeSponsorBooth(booth.id)}
                                  className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                  title="Delete booth"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {sponsorBooths.length === 0 && (
                            <div className="py-8 text-center text-slate-500 text-[10px]">
                              No sponsor booths configured. Click "Add Booth" to create a sponsor stand.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 5: LUCKY DRAW TIERS & PRIZES INVENTORY */}
                  {activeTab === 'LUCKY_DRAWS' && (
                    <motion.div 
                      key="lucky-draws"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Lucky Draw Categories setup */}
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <div className="flex justify-between items-center border-b border-[#141414] pb-1.5 mb-2">
                            <h4 className="font-bold text-[10px] uppercase text-indigo-800 flex items-center gap-1">
                              <Play className="w-3.5 h-3.5" />
                              <span>Lucky Draw Category Tiers</span>
                            </h4>
                            <button
                              type="button"
                              onClick={addLuckyDrawCategory}
                              className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold uppercase transition-all hover:bg-neutral-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Category</span>
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {luckyDrawCategories.map((ld, index) => (
                              <div key={ld.id || index} className="bg-white p-3 border border-slate-300 space-y-2">
                                <div className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-6">
                                    <label className="text-[7px] font-bold text-slate-400 uppercase block">Category Name</label>
                                    <input 
                                      type="text" 
                                      value={ld.name}
                                      onChange={(e) => updateLuckyDrawCategory(ld.id, 'name', e.target.value)}
                                      placeholder="e.g. Grand Prize"
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                  <div className="col-span-6">
                                    <label className="text-[7px] font-bold text-slate-400 uppercase block">Associated Prize</label>
                                    <input 
                                      type="text" 
                                      value={ld.prizeName}
                                      onChange={(e) => updateLuckyDrawCategory(ld.id, 'prizeName', e.target.value)}
                                      placeholder="iPad Pro 11"
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-dotted border-gray-200">
                                  <div className="col-span-5">
                                    <label className="text-[7px] font-bold text-slate-400 uppercase block">Min Points Required</label>
                                    <input 
                                      type="number" 
                                      value={ld.eligiblePointsMin}
                                      onChange={(e) => updateLuckyDrawCategory(ld.id, 'eligiblePointsMin', parseInt(e.target.value) || 0)}
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                  <div className="col-span-5">
                                    <label className="text-[7px] font-bold text-slate-400 uppercase block">Qty Available</label>
                                    <input 
                                      type="number" 
                                      value={ld.quantity}
                                      onChange={(e) => updateLuckyDrawCategory(ld.id, 'quantity', parseInt(e.target.value) || 0)}
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => removeLuckyDrawCategory(ld.id)}
                                      className="text-red-600 hover:text-red-800 p-1 mt-2 block mx-auto cursor-pointer"
                                      title="Delete category"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {luckyDrawCategories.length === 0 && (
                              <div className="py-8 text-center text-slate-500 text-[10px]">
                                No lucky draws tiers. Click "Add Category" to set up wheels.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Prizes Inventory Catalogs */}
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <div className="flex justify-between items-center border-b border-[#141414] pb-1.5 mb-2">
                            <h4 className="font-bold text-[10px] uppercase text-indigo-800 flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Redeemable Prize Inventory</span>
                            </h4>
                            <button
                              type="button"
                              onClick={addPrize}
                              className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold uppercase transition-all hover:bg-neutral-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Prize Item</span>
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {prizes.map((prz, index) => (
                              <div key={prz.id || index} className="bg-white p-3 border border-slate-300 space-y-2">
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-6">
                                    <label className="text-[7px] font-bold text-slate-400 block uppercase">Prize Title</label>
                                    <input 
                                      type="text" 
                                      value={prz.name}
                                      onChange={(e) => updatePrize(prz.id, 'name', e.target.value)}
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                  <div className="col-span-6">
                                    <label className="text-[7px] font-bold text-slate-400 block uppercase">Stock Available</label>
                                    <input 
                                      type="number" 
                                      value={prz.stock}
                                      onChange={(e) => updatePrize(prz.id, 'stock', parseInt(e.target.value) || 0)}
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-10">
                                    <label className="text-[7px] font-bold text-slate-400 block uppercase">Prize Specifications / Description</label>
                                    <input 
                                      type="text" 
                                      value={prz.description}
                                      onChange={(e) => updatePrize(prz.id, 'description', e.target.value)}
                                      placeholder="Color, chips, bundles..."
                                      className="w-full tech-input text-[10px]"
                                    />
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => removePrize(prz.id)}
                                      className="text-red-600 hover:text-red-800 p-1 mt-2.5 block mx-auto cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {prizes.length === 0 && (
                              <div className="py-8 text-center text-slate-500 text-[10px]">
                                No prize item configured in inventory. Click "Add Prize Item" to catalog.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 6: FORM PARAMETERS & COMMUNICATIONS TEMPLATES */}
                  {activeTab === 'FORM_OUTREACH' && (
                    <motion.div 
                      key="form-outreach"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Custom Registration Form schema */}
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-3">
                          <h4 className="font-bold text-[10px] uppercase text-indigo-800 border-b border-[#141414] pb-1.5 mb-2 flex items-center gap-1">
                            <Settings className="w-3.5 h-3.5" />
                            <span>Customize RSVP Portal Registration Form Fields</span>
                          </h4>

                          <div className="space-y-3 bg-white p-4 border border-slate-300">
                            <label className="flex items-center gap-2.5 cursor-pointer border-b border-gray-100 pb-2">
                              <input 
                                type="checkbox" 
                                checked={regForm.isEnabled}
                                onChange={(e) => setRegForm({ ...regForm, isEnabled: e.target.checked })}
                                className="accent-black rounded-none h-4 w-4" 
                              />
                              <div>
                                <span className="font-bold block text-slate-900 text-[10px]">ALLOW RSVP PORTAL REGISTRATIONS</span>
                                <span className="text-[8px] text-gray-500 block leading-none">Toggle to close or open public registration intakes</span>
                              </div>
                            </label>

                            <div className="space-y-2 pt-1">
                              <span className="text-[8px] font-bold text-slate-400 block uppercase">Toggle Required Fields *</span>
                              
                              <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                                <input 
                                  type="checkbox" 
                                  checked={regForm.requireCompany}
                                  onChange={(e) => setRegForm({ ...regForm, requireCompany: e.target.checked })}
                                  className="accent-black rounded-none" 
                                />
                                <span className="font-bold text-gray-700">Require Guest Company/Institution</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                                <input 
                                  type="checkbox" 
                                  checked={regForm.requirePosition}
                                  onChange={(e) => setRegForm({ ...regForm, requirePosition: e.target.checked })}
                                  className="accent-black rounded-none" 
                                />
                                <span className="font-bold text-gray-700">Require Guest Corporate Designation/Position</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                                <input 
                                  type="checkbox" 
                                  checked={regForm.requirePhone}
                                  onChange={(e) => setRegForm({ ...regForm, requirePhone: e.target.checked })}
                                  className="accent-black rounded-none" 
                                />
                                <span className="font-bold text-gray-700">Require Contact Phone Number</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                                <input 
                                  type="checkbox" 
                                  checked={regForm.requireFoodAllergies}
                                  onChange={(e) => setRegForm({ ...regForm, requireFoodAllergies: e.target.checked })}
                                  className="accent-black rounded-none" 
                                />
                                <span className="font-bold text-gray-700">Require Dietary Restrictions/Food Allergies</span>
                              </label>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-dashed border-gray-200">
                              <label className="text-[8px] font-bold text-slate-500 uppercase block">Custom Form Consent / Terms Disclaimer Text</label>
                              <textarea 
                                value={regForm.customDisclaimer}
                                onChange={(e) => setRegForm({ ...regForm, customDisclaimer: e.target.value })}
                                rows={2}
                                placeholder="By RSVPing, you consent to photography..."
                                className="tech-input w-full bg-slate-50 text-[10px] resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Communication Templates (Emails & WhatsApp) */}
                        <div className="bg-[#DFDEDA] p-4 border border-[#141414] space-y-4">
                          <h4 className="font-bold text-[10px] uppercase text-indigo-800 border-b border-[#141414] pb-1.5 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Configure Outreach & Reminder Draft Templates</span>
                          </h4>

                          <div className="space-y-3">
                            {/* EMAIL SECTION */}
                            <div className="border border-slate-300 p-3 bg-white space-y-2">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                <span className="text-[9px] font-black text-indigo-700 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span>Dynamic Email Invitation Template</span>
                                </span>
                                <span className="text-[7px] text-gray-400 uppercase font-bold">Token: {"{{GUEST_NAME}}"}</span>
                              </div>
                              <div className="space-y-1.5">
                                <input 
                                  type="text" 
                                  value={emails.h7Subject}
                                  onChange={(e) => setEmails({ ...emails, h7Subject: e.target.value })}
                                  placeholder="H-7 Email Subject Header"
                                  className="w-full tech-input text-[9px] font-bold"
                                />
                                <textarea 
                                  value={emails.h7Body}
                                  onChange={(e) => setEmails({ ...emails, h7Body: e.target.value })}
                                  rows={3}
                                  placeholder="Hi {{GUEST_NAME}}, You are cordially invited to..."
                                  className="w-full tech-input text-[9px] font-mono resize-none"
                                />
                              </div>
                            </div>

                            {/* WHATSAPP SECTION */}
                            <div className="border border-slate-300 p-3 bg-white space-y-2">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                <span className="text-[9px] font-black text-emerald-700 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp Broadcast Template</span>
                                </span>
                                <span className="text-[7px] text-gray-400 uppercase font-bold">Tokens: {"{{EVENT_NAME}}, {{PASS_LINK}}"}</span>
                              </div>
                              <div>
                                <textarea 
                                  value={whatsapps.h7Message}
                                  onChange={(e) => setWhatsapps({ ...whatsapps, h7Message: e.target.value })}
                                  rows={3}
                                  placeholder="Hi {{GUEST_NAME}}! Confirm your RSVP code at {{PASS_LINK}}"
                                  className="w-full tech-input text-[9px] font-mono resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>
          ) : (
            <div className="tech-card p-12 text-center text-slate-500 font-mono text-xs">
              <Layers3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p>Select or create an event in the catalogue registry to begin advanced setups & parameter adjustments.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
