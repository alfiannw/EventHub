import React, { useState, useEffect } from 'react';
import { 
  Music, Play, Disc, ListMusic, PlusCircle, Check, X, 
  Search, Star, Volume2, User, Radio, RefreshCw, Sparkles, 
  Calendar, Award, MessageSquare, Flame, CheckCircle2 
} from 'lucide-react';

interface SongRequest {
  id: string;
  participantId: string;
  participantName: string;
  artist: string;
  title: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'PLAYED' | 'REJECTED';
  pointsAwarded?: number;
  createdAt: string;
}

export default function SongsRequestPage() {
  // Mock logged-in user profile with points
  const [userProfile, setUserProfile] = useState({
    id: 'p-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@meta.com',
    currentPoints: 25
  });

  // Current Now Playing state
  const [nowPlaying, setNowPlaying] = useState<SongRequest | null>({
    id: 'song-103',
    participantId: 'p-3',
    participantName: 'Elena Rostova',
    artist: 'Daft Punk',
    title: 'One More Time',
    message: 'Let’s close the event with this jam!',
    status: 'PLAYED',
    createdAt: new Date(Date.now() - 5400000).toISOString()
  });

  // In-memory song queue
  const [songRequests, setSongRequests] = useState<SongRequest[]>([
    {
      id: 'song-101',
      participantId: 'p-1',
      participantName: 'Alex Rivera',
      artist: 'The Weeknd',
      title: 'Blinding Lights',
      message: 'Play this during the networking break!',
      status: 'APPROVED',
      pointsAwarded: 5,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'song-102',
      participantId: 'p-2',
      participantName: 'Sarah Chen',
      artist: 'Dua Lipa',
      title: 'Levitating',
      message: 'For Table 4!',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]);

  // Toast / alert notifications list
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [artistInput, setArtistInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [shoutoutInput, setShoutoutInput] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PLAYED'>('ALL');

  // Trigger temporary notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit song request
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistInput.trim() || !titleInput.trim()) return;

    const newRequest: SongRequest = {
      id: `song-${Date.now()}`,
      participantId: userProfile.id,
      participantName: userProfile.name,
      artist: artistInput.trim(),
      title: titleInput.trim(),
      message: shoutoutInput.trim() || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setSongRequests(prev => [newRequest, ...prev]);
    setArtistInput('');
    setTitleInput('');
    setShoutoutInput('');
    triggerToast(`🎵 Your request for "${newRequest.title}" was broadcasted to the DJ booth!`);
  };

  // DJ Moderation handlers
  const handleModerate = (songId: string, action: 'APPROVED' | 'REJECTED' | 'PLAYED') => {
    setSongRequests(prev => 
      prev.map(song => {
        if (song.id === songId) {
          // If song is being APPROVED for the first time, award +5 points to the participant!
          if (action === 'APPROVED' && song.status === 'PENDING') {
            if (song.participantId === userProfile.id) {
              setUserProfile(curr => ({ ...curr, currentPoints: curr.currentPoints + 5 }));
            }
            triggerToast(`✅ Approved "${song.title}". +5 Points awarded to ${song.participantName}!`);
            return { ...song, status: 'APPROVED', pointsAwarded: 5 };
          }

          if (action === 'PLAYED') {
            setNowPlaying(song);
            triggerToast(`🎧 Now Playing: "${song.title}" by ${song.artist}`);
            return { ...song, status: 'PLAYED' };
          }

          if (action === 'REJECTED') {
            triggerToast(`❌ Song request "${song.title}" rejected.`);
            return { ...song, status: 'REJECTED' };
          }
        }
        return song;
      })
    );
  };

  // Filter requests
  const filteredRequests = songRequests.filter(song => {
    const matchesSearch = 
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.participantName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'ALL' || song.status === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans antialiased selection:bg-purple-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-purple-900 border-2 border-purple-400 text-white py-3.5 px-5 font-mono text-xs flex items-center gap-3 shadow-[0_0_15px_rgba(168,85,247,0.4)] rounded-none animate-bounce">
          <Volume2 className="w-4 h-4 text-purple-300 animate-pulse" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Profile Dashboard info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-xl font-black font-mono tracking-wider uppercase text-white">Live DJ Cooperation Board</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Sprint 5: Seamless attendee interaction, real-time requests, & custom point feedback mechanisms.
          </p>
        </div>

        {/* Checked-in User Points Card */}
        <div className="mt-4 md:mt-0 bg-neutral-900 border border-neutral-800 p-3.5 flex items-center gap-4 font-mono text-xs">
          <div className="h-9 w-9 bg-purple-950/40 border border-purple-800 text-purple-400 flex items-center justify-center rounded-none font-bold">
            <User className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Attendee Standing</div>
            <div className="text-white font-bold">{userProfile.name}</div>
          </div>
          <div className="border-l border-neutral-800 pl-4">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Score Balance</div>
            <div className="text-purple-400 font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{userProfile.currentPoints} PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Now Playing Jumbotron */}
      <div className="bg-gradient-to-r from-purple-950/20 to-neutral-950 border border-neutral-800 p-6 mb-8 font-mono relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute right-0 top-0 h-48 w-48 bg-purple-500/10 blur-3xl pointer-events-none rounded-full"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          
          {/* Vinyl spin animation */}
          <div className="relative group">
            <div className="h-24 w-24 bg-black border-4 border-neutral-800 rounded-full flex items-center justify-center animate-spin [animation-duration:12s] shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <div className="h-10 w-10 bg-purple-900 rounded-full border border-neutral-700 flex items-center justify-center">
                <Disc className="w-5 h-5 text-purple-300" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
              <span>ON STAGE NOW / LIVE FEED</span>
            </span>

            {nowPlaying ? (
              <>
                <h2 className="text-white text-xl font-extrabold tracking-tight">
                  {nowPlaying.title}
                </h2>
                <p className="text-sm text-neutral-300 mt-1">
                  Artist: <span className="text-purple-300 font-bold">{nowPlaying.artist}</span>
                </p>
                {nowPlaying.message && (
                  <p className="text-xs text-neutral-500 mt-2 bg-neutral-900/60 inline-block py-1 px-2 border border-neutral-800 italic">
                    Shoutout: "{nowPlaying.message}"
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-500 italic mt-1">DJ Booth is currently warming up the speakers...</p>
            )}

            {/* Simulated progress tracker */}
            <div className="w-full bg-neutral-900 h-1.5 mt-4 border border-neutral-800 max-w-md">
              <div className="bg-purple-500 h-full w-[65%] animate-pulse"></div>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-neutral-500 mt-4 md:mt-0 border border-neutral-800 p-3 bg-black">
            <span className="block text-neutral-400 font-bold uppercase">Points Policy</span>
            <span className="block text-white mt-1">Approved Request: <span className="text-purple-400 font-bold">+5 PTS</span></span>
            <span className="block text-neutral-500 mt-1">Rule ID: activity_rules_5</span>
          </div>
        </div>
      </div>

      {/* Main split grid: Form vs Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Submit request form */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6">
            <h3 className="text-white font-bold font-mono text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <PlusCircle className="w-4.5 h-4.5 text-purple-400" />
              <span>Submit Song Request</span>
            </h3>

            <form onSubmit={handleSubmitRequest} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  Track Title <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starboy, Levitating..."
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="bg-black border border-neutral-800 text-white placeholder-neutral-600 p-3 w-full rounded-none outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  Artist Name <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Weeknd, Dua Lipa..."
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  className="bg-black border border-neutral-800 text-white placeholder-neutral-600 p-3 w-full rounded-none outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  Dedicated Shoutout / Message (Optional)
                </label>
                <textarea
                  placeholder="e.g. Dedicated to Table 4 or networking squad!"
                  rows={3}
                  value={shoutoutInput}
                  onChange={(e) => setShoutoutInput(e.target.value)}
                  className="bg-black border border-neutral-800 text-white placeholder-neutral-600 p-3 w-full rounded-none outline-none focus:border-purple-500 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase py-3 transition-colors tracking-widest cursor-pointer border-0 mt-2"
              >
                BROADCAST REQUEST
              </button>
            </form>
          </div>

          {/* Quick tips */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 font-mono text-[11px] leading-relaxed text-neutral-400">
            <h4 className="text-neutral-200 font-bold uppercase mb-2 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Cooperation Policy</span>
            </h4>
            <p>
              To ensure pristine performance and balanced acoustics, all requests flow through the DJ Booth curation queue first. If approved, points are immediately added to your ledger balance.
            </p>
          </div>
        </div>

        {/* Right column: Queue Board */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-6 font-mono">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-4 mb-4 gap-4">
            <div>
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <ListMusic className="w-4.5 h-4.5 text-purple-400" />
                <span>Live Audience Queue ({filteredRequests.length})</span>
              </h3>
              <p className="text-[10px] text-neutral-500 mt-1">Real-time status of song approvals</p>
            </div>

            {/* Quick Tabs */}
            <div className="flex gap-1 overflow-x-auto text-[10px] font-black">
              {(['ALL', 'PENDING', 'APPROVED', 'PLAYED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-1.5 px-3 border transition-colors cursor-pointer rounded-none uppercase ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search box */}
          <div className="relative mb-5 text-xs">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by song, artist, or attendee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black border border-neutral-800 text-white placeholder-neutral-600 py-2.5 pl-9 pr-4 w-full rounded-none outline-none focus:border-purple-500"
            />
          </div>

          {/* Requests Queue List */}
          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-neutral-600 text-xs italic">
                No songs matching filters found in queue.
              </div>
            ) : (
              filteredRequests.map(song => {
                const statusStyles = {
                  PENDING: 'border-l-yellow-500 bg-black text-yellow-500',
                  APPROVED: 'border-l-purple-500 bg-purple-950/10 text-purple-400',
                  PLAYED: 'border-l-green-500 bg-neutral-900 text-green-500 opacity-70',
                  REJECTED: 'border-l-red-500 bg-black text-red-500 opacity-60'
                };

                return (
                  <div 
                    key={song.id} 
                    className={`p-4 border border-neutral-800 border-l-4 ${statusStyles[song.status] || 'border-l-neutral-600'} text-xs relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{song.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold uppercase">
                          {song.status}
                        </span>
                      </div>
                      <p className="text-neutral-300 mt-1">
                        by <span className="font-bold text-white">{song.artist}</span>
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500">
                        <User className="w-3 h-3" />
                        <span>Requested by: <span className="text-neutral-400 font-bold">{song.participantName}</span></span>
                      </div>

                      {song.message && (
                        <div className="mt-2 text-[11px] text-neutral-400 bg-neutral-950 p-2 border border-neutral-800/80 italic flex items-start gap-1.5">
                          <MessageSquare className="w-3 h-3 mt-0.5 text-neutral-600" />
                          <span>"{song.message}"</span>
                        </div>
                      )}
                    </div>

                    {/* DJ Booth Moderation Desk */}
                    <div className="flex flex-wrap gap-2 md:self-center font-black text-[10px]">
                      {song.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleModerate(song.id, 'APPROVED')}
                            className="bg-purple-950/40 hover:bg-purple-900 border border-purple-800 text-purple-300 py-1.5 px-3 flex items-center gap-1 cursor-pointer font-bold uppercase transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>APPROVE (+5 PTS)</span>
                          </button>
                          <button
                            onClick={() => handleModerate(song.id, 'REJECTED')}
                            className="bg-black hover:bg-red-950/40 border border-neutral-800 hover:border-red-900 text-neutral-500 hover:text-red-400 py-1.5 px-3 flex items-center gap-1 cursor-pointer font-bold uppercase transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>REJECT</span>
                          </button>
                        </>
                      )}

                      {song.status === 'APPROVED' && (
                        <button
                          onClick={() => handleModerate(song.id, 'PLAYED')}
                          className="bg-green-950/40 hover:bg-green-900 border border-green-800 text-green-300 py-1.5 px-3 flex items-center gap-1 cursor-pointer font-bold uppercase transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-green-300" />
                          <span>PLAY TRACK</span>
                        </button>
                      )}

                      {song.pointsAwarded && (
                        <div className="text-purple-400 text-[10px] font-extrabold flex items-center gap-1 border border-purple-950 bg-purple-950/20 py-1 px-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Awarded +5 Pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
