import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Ticket, Sparkles, Send, Music, Image as ImageIcon, MessageSquare, 
  Award, CheckCircle2, AlertCircle, Camera, Check, Calendar, MapPin, ExternalLink,
  Upload, Shield, Lock, User, Users, Briefcase, FileText, Utensils, Shirt, LogIn, UserPlus, LogOut, CheckSquare, Scan, X 
} from 'lucide-react';
import { Participant, SongRequest, ActivitySubmission, EventConfig, BoothVisit, NetworkingConnection } from '../types';
import jsQR from 'jsqr';

interface RegistrationPortalProps {
  currentParticipant: Participant | undefined;
  eventConfig: EventConfig | null;
  leaderboard: Participant[];
  songRequests: SongRequest[];
  activitySubmissions: ActivitySubmission[];
  onSubmitRSVP: (rsvpData: any) => Promise<void>;
  onSubmitSongRequest: (songData: { artist: string; title: string; message: string }) => Promise<void>;
  onSubmitActivity: (activityData: { activityType: string; description: string; content: string }) => Promise<void>;
  onRegisterParticipant: (regData: any) => Promise<Participant>;
  onLoginParticipant: (loginData: { email: string; password?: string }) => Promise<Participant>;
  onUpdateProfile: (profileData: any) => Promise<void>;
  onSelectParticipant: (id: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onLogout?: () => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
];

const PRESET_EVENT_PHOTOS = [
  { name: "Keynote Front Row Panel", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80" },
  { name: "Networking Lounge & Coffee Bar", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80" },
  { name: "Main Stage Light Show Setup", url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&80" }
];

// Reusable Drag and Drop Image Uploader
const FileUploadArea = ({ label, value, onChange, placeholder, id }: { label: string, value: string, onChange: (val: string) => void, placeholder: string, id: string }) => {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="space-y-1.5 font-mono text-xs">
      <span className="text-[10px] font-bold text-slate-700 uppercase block">{label}</span>
      <label
        htmlFor={id}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') onChange(reader.result);
            };
            reader.readAsDataURL(file);
          }
        }}
        className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all block relative ${
          dragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-[#141414] hover:bg-white/40'
        }`}
      >
        <input
          type="file"
          id={id}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') onChange(reader.result);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        {value ? (
          <div className="flex flex-col items-center gap-2">
            <img src={value} alt="Preview" className="h-16 w-16 object-cover border border-[#141414] mx-auto" />
            <span className="text-[9px] font-bold text-emerald-700 uppercase">✓ Image Loaded (Click to Change)</span>
          </div>
        ) : (
          <div className="space-y-1 py-1">
            <Camera className="w-6 h-6 mx-auto text-slate-500" />
            <p className="text-[10px] text-slate-700 font-bold">{placeholder}</p>
            <p className="text-[8px] text-slate-400">Drag & drop image file or click</p>
          </div>
        )}
      </label>
    </div>
  );
};

export default function RegistrationPortal({
  currentParticipant,
  eventConfig,
  leaderboard,
  songRequests,
  activitySubmissions,
  onSubmitRSVP,
  onSubmitSongRequest,
  onSubmitActivity,
  onRegisterParticipant,
  onLoginParticipant,
  onUpdateProfile,
  onSelectParticipant,
  onRefresh,
  isRefreshing,
  onLogout
}: RegistrationPortalProps) {
  
  // RSVP Form States (For non-registered or modifying profile)
  const [email, setEmail] = useState(currentParticipant?.email || '');
  const [name, setName] = useState(currentParticipant?.name || '');
  const [phone, setPhone] = useState(currentParticipant?.phone || '');
  const [company, setCompany] = useState(currentParticipant?.company || '');
  const [position, setPosition] = useState(currentParticipant?.position || '');
  const [avatarUrl, setAvatarUrl] = useState(currentParticipant?.avatarUrl || PRESET_AVATARS[0]);
  const [rsvpStatus, setRsvpStatus] = useState<'YES' | 'NO'>(currentParticipant?.rsvpStatus === 'NO' ? 'NO' : 'YES');
  
  // New customized profile fields
  const [password, setPassword] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState(currentParticipant?.dietaryPreference || 'None');
  const [tShirtSize, setTShirtSize] = useState(currentParticipant?.tShirtSize || 'M');
  const [specialNeeds, setSpecialNeeds] = useState(currentParticipant?.specialNeeds || '');
  const [companyLogoUrl, setCompanyLogoUrl] = useState(currentParticipant?.companyLogoUrl || '');

  // Auth States
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Submitting States
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false);
  const [showRsvpSuccess, setShowRsvpSuccess] = useState(false);

  // Tab state in Participant View
  const [activeTab, setActiveTab] = useState<'PASS' | 'ACTIVITIES' | 'SONGS' | 'LEADERBOARD' | 'PROFILE' | 'SPONSORS' | 'NETWORKING'>('PASS');

  // Sponsor Booth States
  const [visitedBooths, setVisitedBooths] = useState<BoothVisit[]>([]);
  const [boothScanCode, setBoothScanCode] = useState('');
  const [boothScanError, setBoothScanError] = useState('');
  const [boothScanSuccess, setBoothScanSuccess] = useState('');
  const [isScanningBooth, setIsScanningBooth] = useState(false);
  const [isSubmittingBoothScan, setIsSubmittingBoothScan] = useState(false);

  // Real Camera scan states for Sponsor Booth
  const [sponsorCameraActive, setSponsorCameraActive] = useState(false);
  const [sponsorCameraDevices, setSponsorCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [sponsorSelectedDeviceId, setSponsorSelectedDeviceId] = useState<string>('');
  const [sponsorFacingMode, setSponsorFacingMode] = useState<'user' | 'environment'>('environment');
  const [sponsorCameraError, setSponsorCameraError] = useState<string | null>(null);
  const sponsorVideoRef = useRef<HTMLVideoElement | null>(null);
  const sponsorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedSponsorCode = useRef<string>('');
  const lastScannedSponsorTime = useRef<number>(0);
  const [sponsorFileScanError, setSponsorFileScanError] = useState<string | null>(null);
  const [sponsorFileScanSuccess, setSponsorFileScanSuccess] = useState(false);

  // Sound Synthesizer (Web Audio API)
  const playSponsorBeep = (success: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (success) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.frequency.value = 523.25; // C5
        osc2.frequency.value = 659.25; // E5
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      } else {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 130; // low G
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }
    } catch (e) {
      console.error("Audio feedback failed:", e);
    }
  };

  // Live Camera stream processing loop for Sponsor Booth
  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startSponsorCamera = async () => {
      try {
        setSponsorCameraError(null);
        const constraints: MediaStreamConstraints = {
          video: sponsorSelectedDeviceId 
            ? { deviceId: { exact: sponsorSelectedDeviceId } }
            : { facingMode: sponsorFacingMode }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (sponsorVideoRef.current) {
          sponsorVideoRef.current.srcObject = stream;
          sponsorVideoRef.current.setAttribute("playsinline", "true");
          sponsorVideoRef.current.play();
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setSponsorCameraDevices(videoDevices);
      } catch (err: any) {
        console.error("Sponsor camera access error:", err);
        setSponsorCameraError(err.message || "Could not access camera. Please check camera permissions in browser.");
      }
    };

    if (sponsorCameraActive) {
      startSponsorCamera();
    } else {
      if (sponsorVideoRef.current && sponsorVideoRef.current.srcObject) {
        const activeStream = sponsorVideoRef.current.srcObject as MediaStream;
        activeStream.getTracks().forEach(track => track.stop());
        sponsorVideoRef.current.srcObject = null;
      }
    }

    const tickSponsor = () => {
      if (sponsorVideoRef.current && sponsorVideoRef.current.readyState === sponsorVideoRef.current.HAVE_ENOUGH_DATA && sponsorCanvasRef.current) {
        const canvas = sponsorCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = sponsorVideoRef.current.videoHeight;
          canvas.width = sponsorVideoRef.current.videoWidth;
          ctx.drawImage(sponsorVideoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
            handleDecodedSponsorQR(code.data);
          }
        }
      }
      if (sponsorCameraActive) {
        animationFrameId = requestAnimationFrame(tickSponsor);
      }
    };

    if (sponsorCameraActive) {
      animationFrameId = requestAnimationFrame(tickSponsor);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sponsorCameraActive, sponsorFacingMode, sponsorSelectedDeviceId]);

  const handleDecodedSponsorQR = (qrText: string) => {
    if (lastScannedSponsorCode.current === qrText && Date.now() - lastScannedSponsorTime.current < 2500) {
      return;
    }
    lastScannedSponsorCode.current = qrText;
    lastScannedSponsorTime.current = Date.now();

    playSponsorBeep(true);
    setBoothScanCode(qrText);
    handleSponsorBoothScan(qrText);
    setSponsorCameraActive(false);
  };

  // Drag & Drop or Upload a Sponsor QR/Barcode image in Participant Portal
  const handleSponsorQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSponsorFileScanError(null);
    setSponsorFileScanSuccess(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
          if (code && code.data) {
            setSponsorFileScanSuccess(true);
            playSponsorBeep(true);
            setBoothScanCode(code.data);
            handleSponsorBoothScan(code.data);
          } else {
            playSponsorBeep(false);
            setSponsorFileScanError("❌ Decode Failed: Could not find a clear QR or Barcode in this image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setSponsorCameraActive(false);
  }, [activeTab]);

  // Networking Challenge States
  const [connections, setConnections] = useState<NetworkingConnection[]>([]);
  const [networkingScanCode, setNetworkingScanCode] = useState('');
  const [networkingError, setNetworkingError] = useState('');
  const [networkingSuccess, setNetworkingSuccess] = useState('');
  const [isSubmittingNetworking, setIsSubmittingNetworking] = useState(false);

  const loadNetworkingConnections = async () => {
    if (!currentParticipant) return;
    try {
      const res = await fetch('/api/networking/connections');
      if (res.ok) {
        const data: NetworkingConnection[] = await res.json();
        // Filter connections where current user is either from or to
        const userConnections = data.filter(c => 
          c.fromParticipantId === currentParticipant.id || c.toParticipantId === currentParticipant.id
        );
        setConnections(userConnections);
      }
    } catch (err) {
      console.error("Failed to load networking connections:", err);
    }
  };

  const handleNetworkingConnect = async (code: string) => {
    if (!currentParticipant) return;
    if (!code || !code.trim()) {
      setNetworkingError("Please enter a valid participant ID or QR Code signature.");
      return;
    }

    setIsSubmittingNetworking(true);
    setNetworkingError('');
    setNetworkingSuccess('');

    try {
      const res = await fetch('/api/networking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromParticipantId: currentParticipant.id,
          targetCode: code.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setNetworkingError(data.error || "Failed to connect.");
      } else {
        setNetworkingSuccess(`Successfully connected with ${data.targetParticipantName}! You both earned +${data.pointsAwarded} PTS.`);
        setNetworkingScanCode('');
        // Reload participant data
        onSelectParticipant(currentParticipant.id);
        await loadNetworkingConnections();
      }
    } catch (err) {
      setNetworkingError("A connection error occurred. Please try again.");
    } finally {
      setIsSubmittingNetworking(false);
    }
  };

  const loadBoothVisits = async () => {
    if (!currentParticipant) return;
    try {
      const res = await fetch('/api/sponsor-booth/visits');
      if (res.ok) {
        const data: BoothVisit[] = await res.json();
        const userVisits = data.filter(v => v.participantId === currentParticipant.id);
        setVisitedBooths(userVisits);
      }
    } catch (err) {
      console.error("Failed to load booth visits:", err);
    }
  };

  const handleSponsorBoothScan = async (code: string) => {
    if (!currentParticipant) return;
    if (!code || !code.trim()) {
      setBoothScanError("Please enter a valid booth code.");
      return;
    }

    setIsSubmittingBoothScan(true);
    setBoothScanError('');
    setBoothScanSuccess('');

    try {
      const res = await fetch('/api/sponsor-booth/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: currentParticipant.id,
          boothCode: code.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setBoothScanError(data.error || "Failed to scan booth.");
      } else {
        setBoothScanSuccess(`Successfully verified! Checked in at ${data.visit.boothName} and earned +${data.visit.pointsAwarded} PTS.`);
        setBoothScanCode('');
        // Reload participant data
        onSelectParticipant(currentParticipant.id);
        await loadBoothVisits();
      }
    } catch (err) {
      setBoothScanError("A connection error occurred. Please try again.");
    } finally {
      setIsSubmittingBoothScan(false);
    }
  };

  useEffect(() => {
    if (currentParticipant) {
      loadBoothVisits();
      loadNetworkingConnections();
    }
  }, [currentParticipant, activeTab]);

  // Secure Ticking Clock for Screenshot Prevention
  const [secureTime, setSecureTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setSecureTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state when selected participant changes from Header dropdown
  useEffect(() => {
    if (currentParticipant) {
      setEmail(currentParticipant.email || '');
      setName(currentParticipant.name || '');
      setPhone(currentParticipant.phone || '');
      setCompany(currentParticipant.company || '');
      setPosition(currentParticipant.position || '');
      setAvatarUrl(currentParticipant.avatarUrl || PRESET_AVATARS[0]);
      setRsvpStatus(currentParticipant.rsvpStatus === 'NO' ? 'NO' : 'YES');
      setDietaryPreference(currentParticipant.dietaryPreference || 'None');
      setTShirtSize(currentParticipant.tShirtSize || 'M');
      setSpecialNeeds(currentParticipant.specialNeeds || '');
      setCompanyLogoUrl(currentParticipant.companyLogoUrl || '');
      setPassword(currentParticipant.password || '');
    }
  }, [currentParticipant]);

  // Track invitation open state when participant views their dashboard
  useEffect(() => {
    if (currentParticipant && (!currentParticipant.invitationStatus || currentParticipant.invitationStatus === 'NOT_SENT' || currentParticipant.invitationStatus === 'DELIVERED')) {
      fetch('/api/invitations/track-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: currentParticipant.id })
      })
      .then(r => r.json())
      .catch(err => console.error("Error tracking open status:", err));
    }
  }, [currentParticipant]);

  // If participant is not checked in, ensure activeTab resets to 'PASS' or 'PROFILE'
  useEffect(() => {
    if (currentParticipant && !currentParticipant.checkedIn) {
      if (activeTab !== 'PASS' && activeTab !== 'PROFILE') {
        setActiveTab('PASS');
      }
    }
  }, [currentParticipant?.checkedIn, activeTab]);

  // Activity interaction states
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [selectedPhotoPreset, setSelectedPhotoPreset] = useState('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const [instagramPostUrl, setInstagramPostUrl] = useState('');
  const [instagramFilePreview, setInstagramFilePreview] = useState<string | null>(null);
  const [instagramUploaded, setInstagramUploaded] = useState(false);

  const [songArtist, setSongArtist] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songMessage, setSongMessage] = useState('');
  const [songSubmitted, setSongSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmittingRSVP(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const participant = await onLoginParticipant({ email, password });
      setAuthSuccessMsg(`Welcome back, ${participant.name}!`);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setIsSubmittingRSVP(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmittingRSVP(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const participant = await onRegisterParticipant({
        name,
        email,
        password,
        phone,
        company,
        position,
        dietaryPreference,
        tShirtSize,
        specialNeeds,
        rsvpStatus,
        avatarUrl,
        companyLogoUrl
      });
      setAuthSuccessMsg(`Account registered successfully! Welcome, ${participant.name}.`);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setIsSubmittingRSVP(false);
    }
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParticipant) return;
    setIsSubmittingRSVP(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      await onUpdateProfile({
        id: currentParticipant.id,
        name,
        phone,
        company,
        position,
        avatarUrl,
        companyLogoUrl,
        dietaryPreference,
        tShirtSize,
        specialNeeds,
        rsvpStatus
      });
      setShowRsvpSuccess(true);
      setTimeout(() => setShowRsvpSuccess(false), 3000);
    } catch (err: any) {
      setAuthError(err.message || 'Profile update failed.');
    } finally {
      setIsSubmittingRSVP(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    try {
      await onSubmitActivity({
        activityType: 'FEEDBACK',
        description: 'Submitted feedback on Event experience',
        content: feedback
      });
      setFeedback('');
      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUploadSubmit = async (url: string) => {
    if (!url) return;
    try {
      await onSubmitActivity({
        activityType: 'PHOTO_UPLOAD',
        description: 'Uploaded live event snap to the Activity Board',
        content: url
      });
      setCustomPhotoUrl('');
      setSelectedPhotoPreset('');
      setPhotoUploaded(true);
      setTimeout(() => setPhotoUploaded(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstagramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = instagramFilePreview || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80';
    try {
      await onSubmitActivity({
        activityType: 'INSTAGRAM_POST',
        description: 'Uploaded Instagram story post screenshot (#EventHub2026)',
        content: url
      });
      setInstagramFilePreview(null);
      setInstagramUploaded(true);
      setTimeout(() => setInstagramUploaded(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songArtist.trim() || !songTitle.trim()) return;
    try {
      await onSubmitSongRequest({
        artist: songArtist,
        title: songTitle,
        message: songMessage
      });
      setSongArtist('');
      setSongTitle('');
      setSongMessage('');
      setSongSubmitted(true);
      setTimeout(() => setSongSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCalendarInvite = (p: Participant) => {
    if (!p) return;
    const title = eventConfig?.name || "EventHub Global Summit 2026";
    const venue = eventConfig?.venue || "Grand Ballroom, Tech Plaza";
    const rawDate = eventConfig?.date || "2026-07-15";
    const datePart = rawDate.replace(/-/g, "");

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventHub//NONSGML Invitation//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `LOCATION:${venue}`,
      `DESCRIPTION:Hello ${p.name},\\n\\nYou are registered for ${title}!\\n\\nYour Seating details: Table: ${p.tableNumber || 'General Seating'}, Seat: ${p.seatNumber || 'General'}\\nParticipant ID: ${p.id}\\n\\nWe look forward to seeing you there!`,
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

  // Safe variables
  const isRegistered = !!currentParticipant;
  const userRank = leaderboard.findIndex(p => p.id === currentParticipant?.id) + 1;
  const userScore = currentParticipant?.points || 0;

  // Door prize category assignment based on points
  let userDoorPrizeCategory = 'Bronze Tier (Category A)';
  if (userScore >= 21) {
    userDoorPrizeCategory = 'Gold Tier (Category C)';
  } else if (userScore >= 11) {
    userDoorPrizeCategory = 'Silver Tier (Category B)';
  }

  // Generate high-contrast, fully scannable real QR Code
  const renderMockQR = (text: string) => {
    return (
      <div className="flex flex-col items-center justify-center p-2 bg-white border border-[#141414] mx-auto w-40 h-40">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`}
          alt={`QR Code for ${text}`}
          className="w-36 h-36 block object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6" id="registration-portal-panel">
      {/* RSVP Portal or Registered Dashboard */}
      {!isRegistered ? (
        <div className="tech-card overflow-hidden max-w-2xl mx-auto">
          {/* Form Switch tabs */}
          <div className="flex border-b-[1.5px] border-[#141414] bg-[#DFDEDA] p-1 gap-1 font-mono">
            <button
              onClick={() => { setAuthMode('LOGIN'); setAuthError(''); setAuthSuccessMsg(''); }}
              className={`flex-1 py-3 px-4 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'LOGIN' ? 'bg-[#141414] text-[#00FF00]' : 'text-slate-700 hover:bg-white/40'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login Account</span>
            </button>
            <button
              onClick={() => { setAuthMode('REGISTER'); setAuthError(''); setAuthSuccessMsg(''); }}
              className={`flex-1 py-3 px-4 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'REGISTER' ? 'bg-[#141414] text-[#00FF00]' : 'text-slate-700 hover:bg-white/40'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Account</span>
            </button>
          </div>

          <div className="bg-[#141414] p-6 text-white text-center border-b-[1.5px] border-[#141414]">
            <Ticket className="w-10 h-10 mx-auto text-[#00FF00] mb-2 stroke-[1.5]" />
            <h2 className="text-xl font-mono font-bold tracking-tight uppercase">
              {authMode === 'LOGIN' ? 'Sign In to Your Hub' : 'Register Account & Confirm Attendance'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-mono">
              [SYSTEM ACTIVE] Gain immediate access to your digital event pass, table layout, custom menus and live gamified scoreboards.
            </p>
          </div>

          {/* Active Event Information Block with Google Maps Link */}
          {eventConfig && (
            <div className="bg-[#DFDEDA] border-b-[1.5px] border-[#141414] p-4 font-mono text-xs text-[#141414] space-y-2">
              <span className="text-[9px] font-bold text-indigo-800 uppercase block tracking-wider">[ Venue & Schedule Coordination ]</span>
              <div className="space-y-1">
                <h3 className="font-black text-sm uppercase text-slate-900">{eventConfig.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <p className="flex items-center gap-1.5 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{eventConfig.date} | {eventConfig.time}</span>
                  </p>
                  <p className="flex items-start gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                    <span>{eventConfig.venue}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status feedback alerts */}
          {authError && (
            <div className="m-5 p-4 bg-red-100 border-[1.5px] border-red-900 text-red-900 font-mono text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="m-5 p-4 bg-emerald-100 border-[1.5px] border-emerald-900 text-emerald-950 font-mono text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {authMode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="p-6 space-y-5 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-black" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.chen@google.com"
                  className="tech-input w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-black" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password (or set new one if seed user)"
                  className="tech-input w-full"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRSVP}
                className="btn-action-primary w-full py-3 px-4 flex items-center justify-center gap-2 text-sm"
              >
                <LogIn className="w-5 h-5 text-[#00FF00]" />
                <span>Verify Credentials & Enter Dashboard</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="p-6 space-y-5 font-mono text-xs">
              <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-widest border-b border-[#141414] pb-1">[ Account Security & Core Profile ]</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elizabeth Mercer"
                    className="tech-input w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. lizzy@mercer.com"
                    className="tech-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Create Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="tech-input w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="tech-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. SpaceX"
                    className="tech-input w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Job Position</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Avionics Engineer"
                    className="tech-input w-full"
                  />
                </div>
              </div>

              <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-widest border-b border-[#141414] pb-1 pt-2">[ Catering & Custom Event Preferences ]</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-slate-600" />
                    <span>Dietary Preference</span>
                  </label>
                  <select
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="tech-input w-full bg-white text-slate-900 focus:outline-none"
                  >
                    <option value="None">None / Standard Meal</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                    <option value="Nut-Free">Nut-Free</option>
                    <option value="Other">Other / Request custom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-slate-600" />
                    <span>Official T-Shirt Size</span>
                  </label>
                  <select
                    value={tShirtSize}
                    onChange={(e) => setTShirtSize(e.target.value)}
                    className="tech-input w-full bg-white text-slate-900 focus:outline-none"
                  >
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                    <option value="XXL">XXL (Double XL)</option>
                    <option value="XXXL">XXXL (Triple XL)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase">Special Needs / Accessibility Requirements</label>
                <textarea
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="e.g. Wheelchair access, speech description, severe allergy alerts, etc."
                  rows={2}
                  className="tech-input w-full resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase">Confirm Attendance RSVP</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('YES')}
                    className={`py-2 rounded-none border-[1.5px] text-xs font-bold uppercase transition-colors cursor-pointer ${
                      rsvpStatus === 'YES'
                        ? 'bg-[#00FF00] border-[#141414] text-black'
                        : 'border-[#141414] bg-white hover:bg-slate-100 text-[#141414]'
                    }`}
                  >
                    Yes, Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('NO')}
                    className={`py-2 rounded-none border-[1.5px] text-xs font-bold uppercase transition-colors cursor-pointer ${
                      rsvpStatus === 'NO'
                        ? 'bg-red-200 border-[#141414] text-red-950'
                        : 'border-[#141414] bg-white hover:bg-slate-100 text-[#141414]'
                    }`}
                  >
                    No, Declining
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-widest border-b border-[#141414] pb-1 pt-2">[ Visual Branding Assets ]</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile Avatar selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase block">Profile Avatar Preset</label>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-none border-[1.5px] border-[#141414] object-cover"
                    />
                    <div className="flex gap-1.5">
                      {PRESET_AVATARS.map((avatar, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarUrl(avatar)}
                          className={`w-9 h-9 rounded-none overflow-hidden border-2 transition-transform hover:scale-110 ${
                            avatarUrl === avatar ? 'border-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <FileUploadArea 
                      label="Or Upload Custom Profile Photo" 
                      value={avatarUrl.startsWith('data:') ? avatarUrl : ''} 
                      onChange={setAvatarUrl} 
                      placeholder="Custom Profile Snap" 
                      id="register-custom-photo"
                    />
                  </div>
                </div>

                {/* Company Logo Custom Drag and Drop */}
                <div>
                  <FileUploadArea 
                    label="Upload Corporate Logo (Optional)" 
                    value={companyLogoUrl} 
                    onChange={setCompanyLogoUrl} 
                    placeholder="Company Logo Image" 
                    id="register-company-logo"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRSVP}
                className="btn-action-primary w-full py-3 px-4 flex items-center justify-center gap-2 text-sm mt-4"
              >
                <UserPlus className="w-5 h-5 text-[#00FF00]" />
                <span>Create Account & Save Event Pass</span>
              </button>
            </form>
          )}
        </div>
      ) : currentParticipant?.approved === false ? (
        /* Pending Approval Screen */
        <div className="tech-card overflow-hidden max-w-xl mx-auto p-8 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 border border-amber-400 text-amber-600 animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-mono font-black uppercase text-slate-900 tracking-tight">
              Awaiting Registration Approval
            </h2>
            <p className="text-xs text-slate-600 font-mono leading-relaxed">
              Your account has been saved successfully! However, an <strong>Event Manager</strong> or <strong>Event Staff</strong> must review and approve your registration before you can access the Participant Hub, digital pass, and live activities.
            </p>
          </div>

          <div className="bg-[#DFDEDA] border border-black p-4 rounded-xl font-mono text-left text-[11px] space-y-2.5">
            <span className="text-[9px] font-bold text-indigo-700 uppercase block tracking-wider">[ Saved Registration Profile ]</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 font-bold">
              <div>
                <span className="text-slate-500 font-normal">NAME:</span> {currentParticipant.name}
              </div>
              <div>
                <span className="text-slate-500 font-normal">EMAIL:</span> {currentParticipant.email}
              </div>
              <div>
                <span className="text-slate-500 font-normal">COMPANY:</span> {currentParticipant.company || 'Independent'}
              </div>
              <div>
                <span className="text-slate-500 font-normal">POSITION:</span> {currentParticipant.position || 'Professional'}
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-300 flex items-center justify-between text-slate-600 font-bold text-[10px]">
              <span>STATUS:</span>
              <span className="bg-amber-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider text-[8px] animate-pulse">
                PENDING STAFF REVIEW
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onRefresh && onRefresh()}
              disabled={isRefreshing}
              className="flex-1 btn-action-primary py-2.5 px-4 text-xs font-bold font-mono uppercase flex items-center justify-center gap-2 cursor-pointer bg-[#C5F237] text-[#141414] border-2 border-[#141414] rounded-lg shadow-[2px_2px_0px_0px_#141414]"
            >
              <Sparkles className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Check Approval Status'}</span>
            </button>
            
            <button
              onClick={() => onLogout && onLogout()}
              className="flex-1 py-2.5 px-4 text-xs font-bold font-mono uppercase flex items-center justify-center gap-2 cursor-pointer bg-white text-slate-700 hover:text-black border-2 border-slate-300 hover:border-black rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout / Change Account</span>
            </button>
          </div>
          
          <p className="text-[9px] font-mono text-slate-400">
            System last checked at: {new Date().toLocaleTimeString()}
          </p>
        </div>
      ) : (
        /* Participant Hub Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Dashboard Left Sidebar - Pass, Details and QR Code */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick RSVP Notification block if RSVP'd NO */}
            {currentParticipant.rsvpStatus === 'NO' && (
              <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-4 text-slate-900 flex items-start gap-3 font-mono text-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold uppercase">[ATTENDANCE DECLINED]</h4>
                  <p className="text-[11px] text-slate-700 mt-1">
                    You currently have marked yourself as not attending. Switch your RSVP response to gain full check-in access.
                  </p>
                  <button
                    onClick={() => {
                      setEmail(currentParticipant.email);
                      setName(currentParticipant.name);
                      setPhone(currentParticipant.phone);
                      setCompany(currentParticipant.company);
                      setPosition(currentParticipant.position);
                      setRsvpStatus('YES');
                      onUpdateProfile({
                        id: currentParticipant.id,
                        rsvpStatus: 'YES'
                      });
                    }}
                    className="text-xs font-bold underline mt-2 text-black hover:text-[#00FF00] block"
                  >
                    Change RSVP to YES
                  </button>
                </div>
              </div>
            )}

            {/* Event Digital Pass - Wallet Styled */}
            <div className="tech-card text-slate-900 overflow-hidden relative">
              
              {/* Pass Header */}
              <div className="bg-[#141414] px-5 py-4 border-b-[1.5px] border-[#141414] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-[#00FF00] rounded-none flex items-center justify-center font-mono font-bold text-xs text-black">E</div>
                  <span className="text-xs font-mono tracking-wider font-bold uppercase text-[#00FF00]">Digital Event Pass</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase bg-white text-black px-2 py-0.5 rounded-none font-bold border border-black">
                    {currentParticipant.checkedIn ? "Checked In" : "RSVP Registered"}
                  </span>
                </div>
              </div>

              {/* Pass Body */}
              <div className="p-5 space-y-4 font-mono">
                {/* Profile Header and Company Logo */}
                <div className="flex items-center justify-between border-b border-[#141414] pb-3 mb-1">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={currentParticipant.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                      alt={currentParticipant.name}
                      className="w-14 h-14 rounded-none border border-[#141414] object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight truncate">{currentParticipant.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{currentParticipant.position}</p>
                      <p className="text-[11px] font-mono text-indigo-800 font-black mt-0.5 truncate">{currentParticipant.company}</p>
                    </div>
                  </div>
                  {currentParticipant.companyLogoUrl && (
                    <div className="shrink-0 flex items-center justify-center border border-[#141414] bg-white p-1 w-12 h-12 ml-2">
                      <img src={currentParticipant.companyLogoUrl} alt="Company logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Grid Seat Table Details */}
                <div className="grid grid-cols-2 gap-3.5 bg-[#DFDEDA] p-3 rounded-none border-[1.5px] border-[#141414] text-xs font-mono">
                  <div>
                    <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-bold">Table Allocation</span>
                    {currentParticipant.checkedIn ? (
                      <span className="text-black font-extrabold">{currentParticipant.tableNumber}</span>
                    ) : (
                      <span className="text-slate-500 font-bold italic flex items-center gap-1">🔒 Locked</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-bold">Seat Number</span>
                    {currentParticipant.checkedIn ? (
                      <span className="text-black font-extrabold">{currentParticipant.seatNumber}</span>
                    ) : (
                      <span className="text-slate-500 font-bold italic flex items-center gap-1">🔒 Locked</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-bold">Participant ID</span>
                    <span className="text-black font-extrabold">{currentParticipant.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-bold">Points Score</span>
                    <span className="text-[#00FF00] bg-black px-1.5 py-0.5 font-bold inline-block mt-0.5 text-[10px]">{currentParticipant.points} PTS</span>
                  </div>
                </div>

                {/* Preferences badge panels */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white/50 p-2.5 border border-dashed border-[#141414]/30 rounded-none">
                  <div>
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Dietary Option</span>
                    <span className="text-slate-900 font-extrabold">{currentParticipant.dietaryPreference || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">T-Shirt Size</span>
                    <span className="text-slate-900 font-extrabold">{currentParticipant.tShirtSize || 'M'}</span>
                  </div>
                  {currentParticipant.specialNeeds && (
                    <div className="col-span-2 border-t border-dashed border-[#141414]/20 pt-1.5 mt-0.5">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Special Assistance Details</span>
                      <span className="text-slate-800 font-semibold text-[9px] block max-w-full truncate">{currentParticipant.specialNeeds}</span>
                    </div>
                  )}
                </div>

                {/* QR Code Container with Screenshot Prevention / Secure Clock */}
                <div className="bg-white p-4 rounded-none border-[1.5px] border-[#141414] max-w-[200px] mx-auto shadow-inner text-center relative overflow-hidden group">
                  {/* Screenshot Abuse Prevention moving animated laser bar */}
                  <div className="absolute inset-x-0 h-0.5 bg-indigo-500/80 animate-[bounce_3s_infinite] top-0 pointer-events-none"></div>
                  
                  {renderMockQR(currentParticipant.qrCode)}
                  
                  <p className="text-[10px] text-center text-slate-500 mt-2 font-mono break-all font-semibold">
                    {currentParticipant.id}
                  </p>

                  {/* Secure Live Code Stamp */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 font-mono text-[9px] text-slate-700 bg-slate-50 p-1.5 border border-dashed border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold mb-1 uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>SECURE ACTIVE PASS</span>
                    </div>
                    <div className="text-black font-extrabold text-[11px] font-mono tracking-tight">
                      {secureTime.toLocaleTimeString()}
                    </div>
                    <div className="text-slate-400 mt-0.5 uppercase tracking-widest text-[7px] font-black">
                      TS: {secureTime.toISOString().substring(0, 19).replace('T', ' ')}
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-500 text-[10px] text-center italic font-serif">
                  Present this QR code to the event host desk on arrival for instant badge check-in.
                </p>

                {/* Calendar Reminder & Account Log Out */}
                <div className="pt-2 space-y-2 border-t border-slate-300">
                  <button
                    onClick={() => handleDownloadCalendarInvite(currentParticipant)}
                    className="w-full bg-[#141414] hover:bg-slate-800 text-white font-mono text-[10px] uppercase font-black py-2 px-3 border border-black cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>Download Calendar Reminder (.ics)</span>
                  </button>

                  <button
                    onClick={() => onSelectParticipant('')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] uppercase font-black py-2 px-3 border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Log Out / Switch Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Right Main Content - Tab Navigation & Points, Games, Music */}
          <div className="lg:col-span-8 space-y-6">
            
             {/* Participant Action Tabs Navigation */}
            <div className="flex flex-wrap bg-white p-2 border-2.5 border-[#141414] rounded-2xl gap-2 shadow-[4px_4px_0px_0px_#141414] font-mono mb-6">
              <button
                onClick={() => setActiveTab('PASS')}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'PASS' 
                    ? 'bg-[#C5F237] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                    : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-amber-700" />
                <span>My Dashboard</span>
              </button>
              
              {currentParticipant.checkedIn && (
                <>
                  <button
                    onClick={() => setActiveTab('ACTIVITIES')}
                    className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'ACTIVITIES' 
                        ? 'bg-[#38BDF8] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                        : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-blue-700" />
                    <span>Earn Points ({currentParticipant.points} PTS)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('SPONSORS')}
                    className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'SPONSORS' 
                        ? 'bg-[#FFE600] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                        : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sponsor Booths</span>
                  </button>
                  {eventConfig?.activities?.find(a => a.type === 'NETWORKING')?.isEnabled !== false && (
                    <button
                      onClick={() => setActiveTab('NETWORKING')}
                      className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'NETWORKING' 
                          ? 'bg-[#FF6B00] text-white border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                          : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Networking</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('SONGS')}
                    className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'SONGS' 
                        ? 'bg-[#DDD6FE] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                        : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-purple-700" />
                    <span>Song Requests</span>
                  </button>
                  {eventConfig?.showLeaderboardRank !== false && (
                    <button
                      onClick={() => setActiveTab('LEADERBOARD')}
                      className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'LEADERBOARD' 
                          ? 'bg-[#F472B6] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                          : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-pink-700" />
                      <span>Leaderboard</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-black rounded-[10px] border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'PROFILE' 
                    ? 'bg-[#C084FC] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]' 
                    : 'bg-transparent text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]'
                }`}
              >
                <User className="w-3.5 h-3.5 text-fuchsia-700" />
                <span>Complete Profile</span>
              </button>
            </div>
 
            {/* TAB CONTENT: My Dashboard Overview */}
            {activeTab === 'PASS' && (
              <div className="space-y-6">
                
                {/* Gamified Welcome Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="tech-card p-4 flex items-center gap-3 font-mono">
                    <div className="h-10 w-10 rounded-none bg-[#DFDEDA] border border-[#141414] flex items-center justify-center text-[#141414] shrink-0">
                      <Award className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">My Score</span>
                      <span className="text-sm font-bold text-slate-900">{currentParticipant.points} Points</span>
                    </div>
                  </div>
 
                  {eventConfig?.showLeaderboardRank !== false ? (
                    <div className="tech-card p-4 flex items-center gap-3 font-mono">
                      <div className="h-10 w-10 rounded-none bg-[#00FF00]/20 border border-[#141414] flex items-center justify-center text-black shrink-0">
                        <Sparkles className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Leaderboard Rank</span>
                        <span className="text-sm font-bold text-slate-900">Rank #{userRank}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="tech-card p-4 flex items-center gap-3 font-mono opacity-80">
                      <div className="h-10 w-10 rounded-none bg-slate-100 border border-[#141414] flex items-center justify-center text-slate-400 shrink-0">
                        <Lock className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Leaderboard Rank</span>
                        <span className="text-sm font-bold text-slate-400">Rankings Private</span>
                      </div>
                    </div>
                  )}
 
                  <div className="tech-card p-4 flex items-center gap-3 font-mono">
                    <div className="h-10 w-10 rounded-none bg-slate-100 border border-[#141414] flex items-center justify-center text-slate-700 shrink-0">
                      <Ticket className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Lucky Prize Category</span>
                      <span className="text-xs font-bold text-slate-900 leading-tight block">{userDoorPrizeCategory}</span>
                    </div>
                  </div>
                </div>
 
                {/* Event Venue & Map Info Card */}
                {eventConfig && (
                  <div className="tech-card p-5 font-mono">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-[#141414] pb-3 uppercase flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-black" />
                      <span>Event Venue Location details</span>
                    </h3>
                    <div className="mt-4 space-y-3 text-xs leading-relaxed">
                      <div>
                        <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-bold mb-0.5">Assigned Venue Address</span>
                        <p className="font-black text-slate-800 text-sm">{eventConfig.venue}</p>
                      </div>
                      
                      {eventConfig.googleMapsUrl && (
                        <div className="pt-1">
                          <a
                            href={eventConfig.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#141414] hover:bg-slate-800 text-white font-bold uppercase text-[9px] tracking-wider py-2.5 px-4 border border-black transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#00FF00]" />
                            <span>Navigate using Google Maps App</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Event Schedule Info */}
                <div className="tech-card p-5 font-mono">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-[#141414] pb-3 uppercase flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-black" />
                    <span>Today's Event Schedule</span>
                  </h3>
                  <div className="mt-4 space-y-4">
                    {eventConfig?.schedule.map((item, index) => (
                      <div key={index} className="flex gap-4 items-start group text-xs">
                        <div className="w-28 shrink-0 font-mono font-bold text-black pt-0.5 bg-[#DFDEDA] border border-[#141414] py-1 px-2 text-center text-[10px]">
                          {item.time}
                        </div>
                        <div className="border-l-2 border-[#141414] pl-4 pb-2 group-last:border-transparent group-last:pb-0">
                          <h4 className="font-bold text-slate-900 uppercase">{item.activity}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 uppercase">{item.description || "Active session in main summit venue"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
 
                {/* Activity Progress */}
                {currentParticipant.checkedIn ? (
                  <div className="tech-card p-5 font-mono">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight uppercase mb-3 border-b border-[#141414] pb-2">Earned Point Milestones</h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-slate-700">
                          <span className="font-bold">Silver Category Milestone (11 points)</span>
                          <span className="font-mono font-bold">{currentParticipant.points}/11 PTS</span>
                        </div>
                        <div className="w-full bg-[#DFDEDA] h-3 border border-[#141414] rounded-none overflow-hidden">
                          <div 
                            className="bg-black h-full transition-all" 
                            style={{ width: `${Math.min((currentParticipant.points / 11) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1 text-slate-700">
                          <span className="font-bold">Gold Category Milestone (21 points)</span>
                          <span className="font-mono font-bold">{currentParticipant.points}/21 PTS</span>
                        </div>
                        <div className="w-full bg-[#DFDEDA] h-3 border border-[#141414] rounded-none overflow-hidden">
                          <div 
                            className="bg-[#00FF00] h-full border-r border-black transition-all" 
                            style={{ width: `${Math.min((currentParticipant.points / 21) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="tech-card p-5 font-mono bg-slate-50 border-dashed border-slate-300 flex flex-col items-center justify-center text-center py-8">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <h4 className="font-bold text-slate-700 uppercase text-xs">Milestones & Earning Locked</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                      Check-in at the front desk of the event to unlock point earning, table assignments, and milestones!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Earn points gamification activities */}
            {activeTab === 'ACTIVITIES' && (
              <div className="space-y-6 font-mono text-xs">
                
                {/* Information Header */}
                <div className="bg-[#DFDEDA] border-[1.5px] border-[#141414] p-4 text-[#141414]">
                  <span className="font-bold uppercase block text-[10px] tracking-wide mb-1">[SYSTEM MESSAGE: GAMIFICATION ACTIVE]</span>
                  Complete default and custom host activities below to instantly gain points. Approved submissions upgrade your Door Prize eligibility!
                </div>

                {/* Dynamic Activities Mapping */}
                {eventConfig?.activities?.filter(a => a.isEnabled).map((act, index) => {
                  const isSubmitted = 
                    (act.type === 'FEEDBACK' && feedbackSubmitted) || 
                    (act.type === 'PHOTO_UPLOAD' && photoUploaded) ||
                    (act.type === 'INSTAGRAM_POST' && instagramUploaded);

                  return (
                    <div key={act.id} className="tech-card p-5">
                      <div className="flex justify-between items-start border-b border-[#141414] pb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 uppercase">
                            <CheckSquare className="w-4 h-4 text-black" />
                            <span>{String(index + 1).padStart(2, '0')}. {act.name}</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                          {(act.startTime || act.endTime) && (
                            <p className="text-[10px] text-indigo-700 font-bold mt-1 uppercase">Time: {act.startTime || 'Open'} - {act.endTime || 'End'}</p>
                          )}
                          <p className="text-[10px] text-slate-700 font-bold mt-1 uppercase border border-slate-300 inline-block px-1.5 py-0.5 bg-slate-50">
                            Verification: {act.validationMethod || (act.requireApproval ? 'STAFF_APPROVAL' : 'AUTOMATIC')}
                          </p>
                        </div>
                        <span className="bg-[#00FF00] border border-black text-black font-bold text-xs px-2.5 py-1 rounded-none font-mono">+{act.points} PTS</span>
                      </div>

                      <div className="mt-4">
                        {act.type === 'FEEDBACK' ? (
                          <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                            <textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="Type your feedback here (minimum 10 characters)..."
                              required
                              rows={3}
                              className="tech-input w-full font-mono text-xs p-3"
                            ></textarea>
                            <button
                              type="submit"
                              disabled={feedback.length < 10}
                              className="btn-action-primary text-xs py-2 px-4 disabled:opacity-50"
                            >
                              Submit Feedback
                            </button>
                            {feedbackSubmitted && (
                              <div className="text-xs text-[#141414] font-bold flex items-center gap-1.5 mt-2 bg-[#00FF00]/20 border border-black p-2 rounded-none">
                                <Check className="w-4 h-4 text-[#141414] shrink-0" />
                                <span>[APPROVED] Feedback logged! +{act.points} points added.</span>
                              </div>
                            )}
                          </form>
                        ) : act.type === 'PHOTO_UPLOAD' ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <span className="text-[9px] font-bold uppercase text-slate-500 block">Or Simulate Camera Photo Snap:</span>
                              <div className="grid grid-cols-3 gap-2">
                                {PRESET_EVENT_PHOTOS.map((photo, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedPhotoPreset(photo.url)}
                                    className={`relative h-20 rounded-none overflow-hidden border-[1.5px] transition-transform hover:scale-[1.02] cursor-pointer ${
                                      selectedPhotoPreset === photo.url ? 'border-black ring-2 ring-black' : 'border-[#141414]'
                                    }`}
                                  >
                                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[8px] font-bold p-1 truncate">
                                      {photo.name}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-4">
                              <div>
                                <FileUploadArea 
                                  label="Upload or Take Photo Proof" 
                                  value={customPhotoUrl} 
                                  onChange={(val) => { setCustomPhotoUrl(val); setSelectedPhotoPreset(''); }} 
                                  placeholder="Snap Camera or Upload from Gallery" 
                                  id="activity-photo-proof"
                                />
                              </div>

                              {/* Photo Preview Section before submission */}
                              {(selectedPhotoPreset || customPhotoUrl) && (
                                <div className="space-y-2 p-3 bg-slate-50 border-2 border-dashed border-[#141414] rounded-xl">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-[#141414] uppercase tracking-wider font-mono flex items-center gap-1.5">
                                      📸 Photo Preview (Ready to Submit)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedPhotoPreset(''); setCustomPhotoUrl(''); }}
                                      className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer font-mono"
                                    >
                                      <X className="w-3.5 h-3.5" /> Remove
                                    </button>
                                  </div>
                                  <div className="border-2 border-[#141414] bg-white p-1 rounded-lg overflow-hidden shadow-[2px_2px_0px_0px_#141414] max-h-64 flex items-center justify-center">
                                    <img 
                                      src={selectedPhotoPreset || customPhotoUrl} 
                                      alt="Selected Preview" 
                                      className="max-h-60 w-full object-contain rounded" 
                                    />
                                  </div>
                                </div>
                              )}

                              <button
                                onClick={() => handlePhotoUploadSubmit(selectedPhotoPreset || customPhotoUrl)}
                                disabled={!selectedPhotoPreset && !customPhotoUrl}
                                className="btn-action-primary w-full py-2.5 px-4 text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Submit Photo Proof</span>
                              </button>
                            </div>
                            {photoUploaded && (
                              <div className="text-xs text-[#141414] font-bold bg-[#DFDEDA] border border-[#141414] p-2.5 rounded-none flex items-center gap-1.5 mt-2">
                                <AlertCircle className="w-4 h-4 text-black shrink-0" />
                                <span>[SUBMITTED] Photo proof uploaded! Pending Staff review.</span>
                              </div>
                            )}
                          </div>
                        ) : act.type === 'INSTAGRAM_POST' ? (
                          <form onSubmit={handleInstagramSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">
                                Choose Instagram Story Screenshot from Gallery
                              </label>
                              
                              <div className="flex flex-col items-center justify-center border-[1.5px] border-dashed border-[#141414] p-5 bg-white relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="instagram-screenshot-upload"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        setInstagramFilePreview(evt.target?.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                
                                {instagramFilePreview ? (
                                  <div className="w-full flex flex-col items-center gap-3">
                                    <div className="w-40 h-40 border border-slate-300 overflow-hidden relative group">
                                      <img src={instagramFilePreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setInstagramFilePreview(null);
                                        }}
                                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#E4E3E0] font-mono text-[9px] font-bold cursor-pointer"
                                      >
                                        CHANGE SCREENSHOT
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 font-mono uppercase">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot Selected
                                    </span>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor="instagram-screenshot-upload"
                                    className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4 w-full text-center"
                                  >
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                    <span className="btn-action-refresh text-[10px] h-8 font-black uppercase">
                                      <Upload className="w-3.5 h-3.5" /> ACCESS PHONE GALLERY
                                    </span>
                                    <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                      Select image from library or files
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>
                            
                            <button
                              type="submit"
                              className="btn-action-primary text-xs py-1.5 px-4 w-full"
                            >
                              Submit Story Proof
                            </button>
                            
                            {instagramUploaded && (
                              <div className="text-xs text-[#141414] font-bold bg-[#DFDEDA] border border-[#141414] p-2.5 rounded-none flex items-center gap-1.5 mt-2">
                                <AlertCircle className="w-4 h-4 text-black shrink-0" />
                                <span>[SUBMITTED] Instagram screenshot submitted! Pending Staff approval.</span>
                              </div>
                            )}
                          </form>
                        ) : (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem('customInput') as HTMLInputElement;
                              const cameraInput = e.currentTarget.elements.namedItem('cameraInput') as HTMLInputElement;
                              const galleryInput = e.currentTarget.elements.namedItem('galleryInput') as HTMLInputElement;
                              const fileInput = e.currentTarget.elements.namedItem('fileInput') as HTMLInputElement;
                              
                              const file = cameraInput?.files?.[0] || galleryInput?.files?.[0] || fileInput?.files?.[0];

                              const doSubmit = (contentStr: string) => {
                                onSubmitActivity({
                                  activityType: act.type,
                                  description: `${act.name}: ${input?.value || (contentStr.startsWith('data:image') ? 'Uploaded Photo' : 'Completed')}`,
                                  content: contentStr
                                });
                                if (input) input.value = '';
                                if (cameraInput) cameraInput.value = '';
                                if (galleryInput) galleryInput.value = '';
                                if (fileInput) fileInput.value = '';
                                alert(`Activity "${act.name}" submitted!`);
                              };

                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  doSubmit(evt.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                doSubmit(input?.value || '');
                              }
                            }} 
                            className="space-y-4"
                          >
                            {act.validationMethod === 'GPS' ? (
                              <div className="bg-slate-100 p-3 border border-slate-300 text-[10px] text-slate-600 space-y-2">
                                <div className="flex items-center gap-2 text-slate-800 font-bold uppercase"><MapPin className="w-3.5 h-3.5" /> <span>GPS Verification Required</span></div>
                                <p>This activity requires you to be at the physical location. Click below to verify.</p>
                                <button type="button" onClick={() => alert("Mock GPS Verification: You are at the correct location!")} className="btn-action-secondary text-[10px] py-1 px-3">Verify My Location</button>
                              </div>
                            ) : act.validationMethod === 'QR_SCAN' ? (
                              <div className="bg-slate-100 p-3 border border-slate-300 text-[10px] text-slate-600 space-y-2">
                                <div className="flex items-center gap-2 text-slate-800 font-bold uppercase"><Scan className="w-3.5 h-3.5" /> <span>QR Code Scan Required</span></div>
                                <p>Find the activity QR code on-site and scan it to complete.</p>
                                <button type="button" onClick={() => alert("Mock QR Scanner Opened.")} className="btn-action-secondary text-[10px] py-1 px-3">Open Camera Scanner</button>
                              </div>
                            ) : (
                              <div>
                                {act.requiresCamera && (
                                  <div className="mb-3">
                                    <label className="text-[9px] font-bold text-red-600 uppercase block mb-1">
                                      📸 Take Picture (Cellphone Camera - REQUIRED)
                                    </label>
                                    <input
                                      type="file"
                                      name="cameraInput"
                                      accept="image/*"
                                      capture="environment"
                                      required
                                      className="text-xs w-full border border-red-300 p-1 bg-red-50/50"
                                    />
                                  </div>
                                )}

                                {act.requiresGallery && (
                                  <div className="mb-3">
                                    <label className="text-[9px] font-bold text-blue-600 uppercase block mb-1">
                                      📁 Upload Photo (Gallery - REQUIRED)
                                    </label>
                                    <input
                                      type="file"
                                      name="galleryInput"
                                      accept="image/*"
                                      required
                                      className="text-xs w-full border border-blue-300 p-1 bg-blue-50/50"
                                    />
                                  </div>
                                )}

                                {!act.requiresCamera && !act.requiresGallery && (
                                  <div className="mb-3">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Upload Photo (Optional)</label>
                                    <input
                                      type="file"
                                      name="fileInput"
                                      accept="image/*"
                                      capture="environment"
                                      className="text-xs w-full border border-slate-300 p-1 bg-slate-50"
                                    />
                                  </div>
                                )}

                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Proof / Submission details (Optional)</label>
                                <input
                                  type="text"
                                  name="customInput"
                                  placeholder="Enter text or URL proof..."
                                  className="tech-input w-full text-xs"
                                />
                              </div>
                            )}
                            
                            <button
                              type="submit"
                              className="btn-action-primary text-xs py-1.5 px-4"
                            >
                              Submit Activity
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: Song Requests queue */}
            {activeTab === 'SONGS' && (
              <div className="space-y-6 font-mono text-xs">
                
                {/* Submit New Request form */}
                <div className="tech-card p-5">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-[#141414] pb-3 uppercase flex items-center gap-2">
                    <Music className="w-4 h-4 text-black" />
                    <span>Submit Live Band Song Request</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ask our Live Band performers to play your favorite track! If approved, you'll earn <span className="font-bold text-black bg-[#00FF00] px-1">+5 PTS</span>!
                  </p>

                  <form onSubmit={handleSongSubmit} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Artist Name *</label>
                        <input
                          type="text"
                          required
                          value={songArtist}
                          onChange={(e) => setSongArtist(e.target.value)}
                          placeholder="e.g. Daft Punk"
                          className="tech-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Song Title *</label>
                        <input
                          type="text"
                          required
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          placeholder="e.g. One More Time"
                          className="tech-input w-full text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Message to Band / Dedication</label>
                      <input
                        type="text"
                        value={songMessage}
                        onChange={(e) => setSongMessage(e.target.value)}
                        placeholder="e.g. Dedicated to my awesome colleagues!"
                        className="tech-input w-full text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!songArtist || !songTitle}
                      className="btn-action-primary text-xs py-2 px-4 disabled:opacity-50"
                    >
                      Submit Request to Band
                    </button>

                    {songSubmitted && (
                      <div className="text-xs text-[#141414] font-bold flex items-center gap-1.5 mt-2 bg-[#00FF00]/20 border border-black p-2 rounded-none">
                        <Check className="w-4 h-4 text-black shrink-0" />
                        <span>Song request queued successfully! +5 points will be added as soon as approved.</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Queue Display of My Requests & All approved songs */}
                <div className="tech-card p-5">
                  <h3 className="font-bold text-slate-900 text-sm uppercase mb-3 border-b border-[#141414] pb-2">Today's Live Requests Board</h3>
                  <div className="space-y-3">
                    {songRequests.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No song requests submitted yet.</p>
                    ) : (
                      songRequests.map((song) => {
                        const statusColors = {
                          PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
                          APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                          REJECTED: 'bg-slate-100 text-slate-500 border-slate-300',
                          PLAYED: 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        };

                        return (
                          <div key={song.id} className="p-3 bg-[#DFDEDA] border-[1.5px] border-[#141414] flex justify-between items-center text-xs gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">"{song.title}"</span>
                                <span className="text-slate-500 text-[10px] shrink-0">by {song.artist}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase">Request by: {song.participantName}</p>
                              {song.message && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">"{song.message}"</p>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none border border-black uppercase ${statusColors[song.status] || 'bg-white text-black'}`}>
                              {song.status}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Leaderboard */}
            {activeTab === 'LEADERBOARD' && (
              <div className="tech-card p-5 font-mono text-xs">
                {eventConfig?.showLeaderboardRank === false ? (
                  <div className="text-center py-12 space-y-3">
                    <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase">Leaderboard is Private</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      The event administrator has disabled public leaderboard ranking visibility for this event. Points can still be earned through activities.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-[#141414] pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm uppercase">Active Leaderboard</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Real-time point distribution of checked-in participants.</p>
                      </div>
                      <span className="text-xs bg-black text-[#00FF00] px-2 py-1 rounded-none font-bold">
                        {leaderboard.filter(p => p.checkedIn).length} Checked-In
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {leaderboard
                        .filter(p => p.checkedIn)
                        .map((participant, index) => {
                          const isCurrentUser = participant.id === currentParticipant?.id;
                          const rank = index + 1;
                          
                          let trophyBg = 'bg-slate-100 text-slate-800';
                          if (rank === 1) trophyBg = 'bg-[#00FF00] text-black border-[#141414] font-extrabold';
                          else if (rank === 2) trophyBg = 'bg-white text-slate-800 border-slate-400 font-extrabold';
                          else if (rank === 3) trophyBg = 'bg-[#DFDEDA] text-slate-800 border-slate-300 font-extrabold';

                          return (
                            <div
                              key={participant.id}
                              className={`p-3 rounded-none border-[1.5px] flex justify-between items-center text-xs transition-colors ${
                                isCurrentUser 
                                  ? 'bg-[#00FF00]/10 border-black font-bold' 
                                  : 'bg-white border-[#141414]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`h-6 w-6 rounded-none flex items-center justify-center font-mono text-[11px] shrink-0 border border-black ${trophyBg}`}>
                                  {rank}
                                </span>
                                <img
                                  src={participant.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                  alt={participant.name}
                                  className="w-8 h-8 rounded-none border border-[#141414] object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-950 truncate">{participant.name}</span>
                                    {isCurrentUser && (
                                      <span className="bg-black text-[#00FF00] text-[9px] font-bold px-1.5 py-0.5 rounded-none uppercase shrink-0">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate uppercase">{participant.company || 'Professional'}</p>
                                </div>
                              </div>
                              
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-slate-900 text-sm font-mono block">{participant.points} PTS</span>
                                <span className="text-[10px] uppercase text-slate-400">
                                  {participant.points >= 21 ? 'Gold Tier' : participant.points >= 11 ? 'Silver Tier' : 'Bronze Tier'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: Complete Profile / Preferences */}
            {activeTab === 'PROFILE' && (
              <div className="tech-card p-6 font-mono space-y-6">
                <div className="border-b border-[#141414] pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm uppercase">Complete Your Profile</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize your digital pass, official t-shirt size, dietary options and branding.</p>
                  </div>
                  <User className="w-5 h-5 text-indigo-700" />
                </div>

                {/* Status alerts */}
                {authError && (
                  <div className="p-4 bg-red-100 border-[1.5px] border-red-900 text-red-900 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {showRsvpSuccess && (
                  <div className="p-4 bg-emerald-100 border-[1.5px] border-emerald-900 text-emerald-950 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>Profile saved successfully! Digital Event Pass updated.</span>
                  </div>
                )}

                <form onSubmit={handleProfileUpdateSubmit} className="space-y-5 text-xs">
                  <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-widest border-b border-slate-200 pb-1">[ Core Participant Data ]</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Elizabeth Mercer"
                        className="tech-input w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Email Address (Read-only)</label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="tech-input w-full bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="tech-input w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Update Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Type new password to update"
                        className="tech-input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Company Name</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. SpaceX"
                        className="tech-input w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase">Job Position</label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Avionics Engineer"
                        className="tech-input w-full"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-widest border-b border-slate-200 pb-1 pt-1">[ Event & Meal Preferences ]</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-slate-600" />
                        <span>Dietary Preference</span>
                      </label>
                      <select
                        value={dietaryPreference}
                        onChange={(e) => setDietaryPreference(e.target.value)}
                        className="tech-input w-full bg-white text-slate-900 focus:outline-none"
                      >
                        <option value="None">None / Standard Meal</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Halal">Halal</option>
                        <option value="Kosher">Kosher</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                        <option value="Nut-Free">Nut-Free</option>
                        <option value="Other">Other / Request custom</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                        <Shirt className="w-3.5 h-3.5 text-slate-600" />
                        <span>Official T-Shirt Size</span>
                      </label>
                      <select
                        value={tShirtSize}
                        onChange={(e) => setTShirtSize(e.target.value)}
                        className="tech-input w-full bg-white text-slate-900 focus:outline-none"
                      >
                        <option value="S">S (Small)</option>
                        <option value="M">M (Medium)</option>
                        <option value="L">L (Large)</option>
                        <option value="XL">XL (Extra Large)</option>
                        <option value="XXL">XXL (Double XL)</option>
                        <option value="XXXL">XXXL (Triple XL)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Special Needs / Accessibility Requirements</label>
                    <textarea
                      value={specialNeeds}
                      onChange={(e) => setSpecialNeeds(e.target.value)}
                      placeholder="e.g. Wheelchair access, speech description, severe allergy alerts, etc."
                      rows={2}
                      className="tech-input w-full resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Confirm Attendance RSVP</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRsvpStatus('YES')}
                        className={`py-2 rounded-none border-[1.5px] text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          rsvpStatus === 'YES'
                            ? 'bg-[#00FF00] border-[#141414] text-black'
                            : 'border-[#141414] bg-white hover:bg-slate-100 text-[#141414]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Yes, Attending</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRsvpStatus('NO')}
                        className={`py-2 rounded-none border-[1.5px] text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          rsvpStatus === 'NO'
                            ? 'bg-red-200 border-[#141414] text-red-950'
                            : 'border-[#141414] bg-white hover:bg-slate-100 text-[#141414]'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No, Declining</span>
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-widest border-b border-slate-200 pb-1 pt-1">[ Visual Assets & Branding ]</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Avatar Preset & Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-700 uppercase block">Profile Avatar Preset</label>
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl}
                          alt="Avatar Preview"
                          className="w-12 h-12 rounded-none border-[1.5px] border-[#141414] object-cover"
                        />
                        <div className="flex gap-1.5">
                          {PRESET_AVATARS.map((avatar, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setAvatarUrl(avatar)}
                              className={`w-9 h-9 rounded-none overflow-hidden border-2 transition-transform hover:scale-110 ${
                                avatarUrl === avatar ? 'border-indigo-600' : 'border-slate-300'
                              }`}
                            >
                              <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <FileUploadArea 
                          label="Or Upload Custom Profile Photo" 
                          value={avatarUrl.startsWith('data:') ? avatarUrl : ''} 
                          onChange={setAvatarUrl} 
                          placeholder="Custom Profile Snap" 
                          id="profile-custom-photo"
                        />
                      </div>
                    </div>

                    {/* Company Logo drag and drop */}
                    <div>
                      <FileUploadArea 
                        label="Upload Corporate Logo (Optional)" 
                        value={companyLogoUrl} 
                        onChange={setCompanyLogoUrl} 
                        placeholder="Company Logo Image" 
                        id="profile-company-logo"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRSVP}
                    className="btn-action-primary w-full py-3 px-4 flex items-center justify-center gap-2 text-sm mt-4"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#00FF00]" />
                    <span>Save Profile Changes</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Sponsor Booth Scanning & Progress */}
            {activeTab === 'SPONSORS' && (
              <div className="space-y-6">
                
                {/* Header Card */}
                <div className="tech-card p-6 font-mono space-y-4">
                  <div className="border-b border-[#141414] pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm uppercase">Sponsor Booth Explorer</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Visit our corporate partners, scan their booth QR Codes, and claim bonus event points!</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 border border-[#141414] rounded-none">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Booths Visited</span>
                      <span className="text-base font-black text-slate-900">
                        {visitedBooths.length} / {(eventConfig?.sponsorBooths || []).length}
                      </span>
                      <div className="w-full bg-slate-200 h-1.5 mt-1.5 border border-slate-300">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300" 
                          style={{ 
                            width: `${(eventConfig?.sponsorBooths || []).length > 0 
                              ? (visitedBooths.length / (eventConfig?.sponsorBooths || []).length) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 border border-[#141414] rounded-none">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Sponsor Points Earned</span>
                      <span className="text-base font-black text-indigo-900">
                        +{visitedBooths.reduce((sum, v) => sum + v.pointsAwarded, 0)} PTS
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 border border-[#141414] rounded-none">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Visit Status</span>
                      <span className="text-xs font-bold text-slate-700 block mt-1">
                        {visitedBooths.length === (eventConfig?.sponsorBooths || []).length && (eventConfig?.sponsorBooths || []).length > 0 ? (
                          <span className="text-emerald-700 flex items-center gap-1">✓ Completed All Booths!</span>
                        ) : (
                          <span className="text-indigo-600">Keep scanning to level up!</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                   {/* Main QR Simulation / Manual Scan Form Card */}
                <div className="tech-card p-6 font-mono space-y-4">
                  <h4 className="font-bold text-[#141414] uppercase text-[10px] tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Scan className="w-4 h-4 text-indigo-600" />
                    <span>[ Sponsor QR Code Verification Portal ]</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Left side: Live Camera View or Upload area */}
                    <div className="md:col-span-5 bg-black border-[1.5px] border-[#141414] aspect-square relative flex flex-col items-center justify-center p-4 overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                      
                      {sponsorCameraActive ? (
                        <div className="absolute inset-0 flex flex-col justify-between p-2 z-10 bg-black">
                          <div className="relative w-full flex-1 bg-neutral-900 border border-slate-700 overflow-hidden flex items-center justify-center">
                            <video 
                              ref={sponsorVideoRef} 
                              className="w-full h-full object-cover"
                            />
                            <canvas ref={sponsorCanvasRef} className="hidden" />
                            <div className="absolute inset-0 border-2 border-emerald-500/30 pointer-events-none"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-dashed border-emerald-400/60 pointer-events-none"></div>
                            {/* Scanning laser line */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-bounce"></div>
                          </div>

                          <div className="flex gap-1.5 mt-2">
                            {sponsorCameraDevices.length > 1 && (
                              <select
                                value={sponsorSelectedDeviceId}
                                onChange={(e) => setSponsorSelectedDeviceId(e.target.value)}
                                className="bg-slate-900 text-white border border-slate-700 text-[9px] p-1 flex-1 font-mono focus:outline-none"
                              >
                                <option value="">Select Lens...</option>
                                {sponsorCameraDevices.map((device, i) => (
                                  <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${i + 1}`}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              type="button"
                              onClick={() => setSponsorFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                              className="bg-slate-800 text-slate-200 border border-slate-600 text-[8px] px-2 py-1 uppercase font-bold cursor-pointer hover:bg-slate-700"
                            >
                              Flip
                            </button>
                            <button
                              type="button"
                              onClick={() => setSponsorCameraActive(false)}
                              className="bg-rose-950 text-rose-200 border border-rose-800 text-[8px] px-2 py-1 uppercase font-bold cursor-pointer hover:bg-rose-900"
                            >
                              Stop
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 z-10 space-y-3">
                          {/* Simulated default lens view when camera is inactive */}
                          <div className="w-24 h-24 border-2 border-dashed border-slate-500 relative flex items-center justify-center">
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-slate-400" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-slate-400" />
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-slate-400" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-slate-400" />
                            <QrCode className="w-10 h-10 text-slate-600" />
                          </div>

                          <div className="space-y-1.5 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                setSponsorCameraActive(true);
                                setSponsorFileScanError(null);
                                setSponsorFileScanSuccess(false);
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 text-[10px] border border-black uppercase cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Start Live Webcam</span>
                            </button>

                            <div className="text-slate-500 text-[8px] uppercase font-bold">OR UPLOAD IMAGE</div>

                            <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 px-3 text-[10px] border border-slate-600 uppercase cursor-pointer flex items-center justify-center gap-1">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload QR Pass</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleSponsorQRImageUpload} 
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side: Manual input / interactive selection */}
                    <div className="md:col-span-7 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        To claim points, click <strong className="text-indigo-600">Start Live Webcam</strong> above to scan the sponsor's QR code using your laptop/phone camera, upload a saved QR image, or manually type their sponsor code.
                      </p>

                      {/* File Scan Error or Success */}
                      {sponsorFileScanError && (
                        <div className="p-3 bg-red-100 border-[1.5px] border-red-900 text-red-900 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                          <span>{sponsorFileScanError}</span>
                        </div>
                      )}

                      {sponsorFileScanSuccess && (
                        <div className="p-3 bg-emerald-100 border-[1.5px] border-emerald-900 text-emerald-950 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>✓ QR Code decoded from image successfully!</span>
                        </div>
                      )}

                      {/* Sponsor Camera Access Error */}
                      {sponsorCameraError && (
                        <div className="p-3 bg-amber-100 border-[1.5px] border-amber-900 text-amber-900 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>{sponsorCameraError}</span>
                        </div>
                      )}

                      {/* Scan Feedback */}
                      {boothScanError && (
                        <div className="p-3 bg-red-100 border-[1.5px] border-red-900 text-red-900 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                          <span>{boothScanError}</span>
                        </div>
                      )}

                      {boothScanSuccess && (
                        <div className="p-3 bg-emerald-100 border-[1.5px] border-emerald-900 text-emerald-950 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{boothScanSuccess}</span>
                        </div>
                      )}

                      {/* Manual Code Input Form */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSponsorBoothScan(boothScanCode);
                        }} 
                        className="space-y-2"
                      >
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Enter Booth ID or Code Manually</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={boothScanCode}
                            onChange={(e) => setBoothScanCode(e.target.value.toUpperCase())}
                            placeholder="e.g. BOOTH-101"
                            className="flex-1 bg-white border-[1.5px] border-[#141414] py-2 px-3 text-xs uppercase focus:outline-none font-bold"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingBoothScan || !boothScanCode.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-xs border-[1.5px] border-black disabled:bg-slate-300 disabled:border-slate-300 transition-colors uppercase cursor-pointer"
                          >
                            {isSubmittingBoothScan ? "Verifying..." : "Verify Code"}
                          </button>
                        </div>
                      </form>

                      {/* Simulated Interactive Scan Shortcuts */}
                      {eventConfig?.sponsorBooths && eventConfig.sponsorBooths.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Interactive Demo Simulator:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {eventConfig.sponsorBooths.map(b => {
                              const alreadyVisited = visitedBooths.some(v => v.boothId === b.id);
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  disabled={alreadyVisited || isSubmittingBoothScan}
                                  onClick={() => handleSponsorBoothScan(b.boothCode)}
                                  className={`px-2.5 py-1.5 text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                    alreadyVisited 
                                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                      : "bg-indigo-50 text-indigo-950 border-indigo-300 hover:bg-indigo-100 cursor-pointer"
                                  }`}
                                  title={alreadyVisited ? "Already scanned" : `Scan booth ${b.name}`}
                                >
                                  <span>📲</span>
                                  <span>Scan {b.name} ({b.boothCode})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booths Directory List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest px-1">[ Exhibitor & Sponsor Booth Directory ]</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(eventConfig?.sponsorBooths || []).map((b) => {
                      const visitRecord = visitedBooths.find(v => v.boothId === b.id);
                      const isVisited = !!visitRecord;

                      return (
                        <div 
                          key={b.id} 
                          className={`border-[1.5px] p-4 flex flex-col justify-between font-mono relative transition-all ${
                            isVisited 
                              ? "bg-emerald-50/70 border-emerald-700/50" 
                              : "bg-white border-[#141414] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-black text-slate-900 uppercase tracking-tight block">{b.name}</span>
                              <span className="bg-slate-100 text-slate-800 text-[8px] font-black font-mono border border-slate-300 px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                                {b.boothCode}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600">
                              <span className="font-bold">Location:</span> {b.locationDescription || "Main Corridor"}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-dotted border-slate-300 flex justify-between items-center gap-2">
                            <span className="text-[10px] font-black text-slate-700">
                              Reward: <span className="text-indigo-600">+{b.pointsReward} PTS</span>
                            </span>

                            {isVisited ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 border border-emerald-300 px-2 py-0.5 uppercase">
                                  ✓ Visited
                                </span>
                                <span className="text-[8px] text-slate-400 mt-1">
                                  {new Date(visitRecord.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSponsorBoothScan(b.boothCode)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-400 text-slate-800 text-[10px] uppercase font-bold py-1 px-3 transition-colors cursor-pointer"
                              >
                                Scan Code
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(eventConfig?.sponsorBooths || []).length === 0 && (
                      <div className="col-span-2 text-center py-8 bg-slate-50 border border-dashed border-slate-300 text-slate-500 font-mono text-xs">
                        No sponsor booths configured for this event.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: Networking Challenge */}
            {activeTab === 'NETWORKING' && eventConfig?.activities?.find(a => a.type === 'NETWORKING')?.isEnabled !== false && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="tech-card p-6 font-mono space-y-4">
                  <div className="border-b border-[#141414] pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm uppercase">Networking Challenge</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Exchange QR codes with other attendees to earn customizable points, build your professional network, and rise on the leaderboard!
                      </p>
                    </div>
                    <Users className="w-5 h-5 text-indigo-600 fill-indigo-100 animate-pulse" />
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 border border-[#141414] rounded-none">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Connections Made</span>
                      <span className="text-base font-black text-slate-900">
                        {connections.length} people
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 border border-[#141414] rounded-none">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Networking Points</span>
                      <span className="text-base font-black text-emerald-700">
                        +{connections.reduce((sum, c) => sum + (c.pointsAwarded || 15), 0)} PTS
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 border border-[#141414] rounded-none">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Challenge Status</span>
                      <span className="text-xs font-bold text-slate-700 block mt-1">
                        {connections.length >= 5 ? (
                          <span className="text-emerald-700 flex items-center gap-1">✓ Elite Networker! (+Bonus)</span>
                        ) : (
                          <span className="text-indigo-600">Connect with {Math.max(1, 5 - connections.length)} more for Elite badge!</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main QR Simulation / Manual Scan Form Card */}
                <div className="tech-card p-6 font-mono grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-4 bg-slate-50 border border-slate-300 p-4 flex flex-col items-center justify-center text-center aspect-square rounded-none">
                    <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-400 p-2 relative group overflow-hidden">
                      <QrCode className="w-16 h-16 text-slate-800 animate-pulse" />
                      <div className="absolute inset-0 bg-slate-950/80 text-white flex flex-col items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Scan className="w-8 h-8 text-[#00FF00] animate-bounce mb-2" />
                        <span className="text-[10px] font-bold uppercase">Simulator Active</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-wide">Scan QR Code</span>
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <div>
                      <h4 className="font-bold text-xs uppercase text-slate-900 flex items-center gap-1.5">
                        <span>[ Attendee Connection Portal ]</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                        To claim networking points, point your cellphone camera at another attendee's digital badge QR code, or enter their custom badge code manually below.
                      </p>
                    </div>

                    {/* Scan feedback */}
                    {networkingError && (
                      <div className="bg-red-50 border border-red-300 text-red-900 px-3 py-2 text-[10px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{networkingError}</span>
                      </div>
                    )}

                    {networkingSuccess && (
                      <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-3 py-2 text-[10px] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{networkingSuccess}</span>
                      </div>
                    )}

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleNetworkingConnect(networkingScanCode);
                      }}
                      className="flex gap-2"
                    >
                      <input 
                        type="text"
                        value={networkingScanCode}
                        onChange={(e) => setNetworkingScanCode(e.target.value)}
                        placeholder="e.g. EH-1002 or QRSIGN_xxx"
                        className="flex-1 tech-input text-xs font-bold font-mono py-2 bg-white"
                        disabled={isSubmittingNetworking}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNetworking || !networkingScanCode.trim()}
                        className="btn-action-primary text-xs font-black uppercase tracking-wider py-2 px-4 shrink-0 transition-all disabled:opacity-50"
                      >
                        {isSubmittingNetworking ? 'Verifying...' : 'Connect'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Grid Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: My Network */}
                  <div className="tech-card p-4 font-mono space-y-3">
                    <h4 className="font-black text-xs uppercase text-indigo-950 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                      <span>My Professional Network ({connections.length})</span>
                      <span className="text-[9px] text-slate-400 font-bold">MUTUAL CONNECTIONS</span>
                    </h4>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {connections.map((conn) => {
                        const isFromUser = conn.fromParticipantId === currentParticipant.id;
                        const partnerName = isFromUser ? conn.toParticipantName : conn.fromParticipantName;
                        const partnerCompany = isFromUser ? conn.toParticipantCompany : conn.fromParticipantCompany;
                        const partnerPosition = isFromUser ? conn.toParticipantPosition : conn.fromParticipantPosition;
                        
                        return (
                          <div key={conn.id} className="bg-white border border-slate-200 p-2.5 flex items-center justify-between hover:border-slate-400 transition-all">
                            <div>
                              <span className="font-bold text-slate-800 text-xs block">{partnerName}</span>
                              <span className="text-[9px] text-slate-500 block">{partnerPosition} @ {partnerCompany}</span>
                              <span className="text-[8px] text-slate-400 block mt-1">
                                Met at: {new Date(conn.connectedAt).toLocaleDateString()} {new Date(conn.connectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none uppercase">
                                +{conn.pointsAwarded} PTS
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {connections.length === 0 && (
                        <div className="py-12 text-center text-slate-400 font-mono text-[10px] border border-dashed border-slate-200 bg-slate-50/50">
                          No connections made yet.<br />Use the interactive simulator on the right to meet other attendees!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Checked-in Attendees Directory (Simulate physical scanner) */}
                  <div className="tech-card p-4 font-mono space-y-3 bg-slate-50">
                    <h4 className="font-black text-xs uppercase text-slate-900 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                      <span>On-Site Attendees ({leaderboard.filter(p => p.checkedIn && p.id !== currentParticipant.id).length})</span>
                      <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5">SCANNER SIMULATOR</span>
                    </h4>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {leaderboard
                        .filter(p => p.checkedIn && p.id !== currentParticipant.id)
                        .map((attendee) => {
                          const isPartnerConnected = connections.some(c => 
                            c.fromParticipantId === attendee.id || c.toParticipantId === attendee.id
                          );
                          
                          return (
                            <div key={attendee.id} className="bg-white border border-slate-200 p-2.5 flex items-center justify-between hover:border-slate-300 transition-all">
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">{attendee.name}</span>
                                <span className="text-[9px] text-slate-500 block">{attendee.position || 'Attendee'} @ {attendee.company}</span>
                                <span className="text-[8px] text-indigo-500 font-bold font-mono">CODE: {attendee.qrCode || attendee.id}</span>
                              </div>
                              <div>
                                {isPartnerConnected ? (
                                  <span className="text-[9px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-0.5 block uppercase text-center">
                                    ✓ Connected
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleNetworkingConnect(attendee.qrCode || attendee.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white border border-black text-[9px] uppercase font-black py-1 px-2.5 transition-colors cursor-pointer"
                                  >
                                    Scan Badge
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {leaderboard.filter(p => p.checkedIn && p.id !== currentParticipant.id).length === 0 && (
                        <div className="py-12 text-center text-slate-400 font-mono text-[10px] border border-dashed border-slate-200 bg-white">
                          No other attendees have checked in yet.<br />Open a separate window or check in other accounts first!
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
