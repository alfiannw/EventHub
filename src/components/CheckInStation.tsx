import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, QrCode, Printer, CheckCircle, Music, Award, ShieldAlert, Check, X, Camera, RefreshCw, 
  Wifi, WifiOff, Upload, AlertTriangle, AlertCircle, Sparkles, Smartphone, Monitor, ShieldCheck, HelpCircle
} from 'lucide-react';
import { Participant, SongRequest, ActivitySubmission, EventConfig } from '../types';
import jsQR from 'jsqr';

interface CheckInStationProps {
  participants: Participant[];
  songRequests: SongRequest[];
  activitySubmissions: ActivitySubmission[];
  onCheckIn: (participantId: string) => Promise<void>;
  onApproveActivity: (submissionId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onAwardCustomPoints: (participantId: string, activityType: string, description: string) => Promise<void>;
  onUpdateSongStatus: (songId: string, status: 'APPROVED' | 'REJECTED' | 'PLAYED') => Promise<void>;
  eventConfig?: EventConfig | null;
  onToggleApprove?: (id: string, approved: boolean) => Promise<void>;
}

export default function CheckInStation({
  participants,
  songRequests,
  activitySubmissions,
  onCheckIn,
  onApproveActivity,
  onAwardCustomPoints,
  onUpdateSongStatus,
  eventConfig,
  onToggleApprove
}: CheckInStationProps) {
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [guestFilter, setGuestFilter] = useState<'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN' | 'AWAITING_APPROVAL'>('ALL');
  
  // Selected guest for Verification Modal/Profile
  const [selectedForCheckin, setSelectedForCheckin] = useState<Participant | null>(null);
  const [verificationCheckFace, setVerificationCheckFace] = useState(false);
  const [verificationCheckTicking, setVerificationCheckTicking] = useState(false);
  
  // Camera scan states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Fallbacks: File & manual entries
  const [fileScanError, setFileScanError] = useState<string | null>(null);
  const [fileScanSuccess, setFileScanSuccess] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  
  // Online & Offline Synchronization engine
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [offlineQueue, setOfflineQueue] = useState<string[]>(() => {
    const cached = localStorage.getItem('eventhub_offline_checkins');
    return cached ? JSON.parse(cached) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  
  // Security warning state for forged / invalid codes
  const [validationError, setValidationError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  
  // Badge Printing state
  const [badgeParticipant, setBadgeParticipant] = useState<Participant | null>(null);

  // Advanced Name Tag printing states
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    const cached = localStorage.getItem('eventhub_autoprint_enabled');
    return cached ? JSON.parse(cached) : true;
  });
  const [printerDriver, setPrinterDriver] = useState<'PDF' | 'ZEBRA' | 'EPSON' | 'BROTHER'>(() => {
    const cached = localStorage.getItem('eventhub_printer_driver');
    return (cached as any) || 'PDF';
  });
  const [pdfLabelSize, setPdfLabelSize] = useState<'CR80' | 'AVERY_5395' | 'CONTINUOUS_ROLL'>(() => {
    const cached = localStorage.getItem('eventhub_pdf_labelsize');
    return (cached as any) || 'CR80';
  });
  const [pdfOrientation, setPdfOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  
  const [printerIp, setPrinterIp] = useState('192.168.1.100');
  const [printerPort, setPrinterPort] = useState('9100');
  const [zebraLabelWidth, setZebraLabelWidth] = useState('4');
  const [zebraLabelHeight, setZebraLabelHeight] = useState('3');
  const [brotherTapeSize, setBrotherTapeSize] = useState<'62mm' | '29x90mm'>('62mm');
  
  const [printJobs, setPrintJobs] = useState<Array<{
    id: string;
    guestName: string;
    time: string;
    driver: string;
    status: 'SPOOLING' | 'SUCCESS' | 'FAILED';
    details: string;
  }>>([]);
  const [isSpooling, setIsSpooling] = useState(false);
  const [spoolProgress, setSpoolProgress] = useState('');

  useEffect(() => {
    localStorage.setItem('eventhub_autoprint_enabled', JSON.stringify(autoPrintEnabled));
  }, [autoPrintEnabled]);

  useEffect(() => {
    localStorage.setItem('eventhub_printer_driver', printerDriver);
  }, [printerDriver]);

  useEffect(() => {
    localStorage.setItem('eventhub_pdf_labelsize', pdfLabelSize);
  }, [pdfLabelSize]);

  // Custom Point Award States
  const [customAwardParticipantId, setCustomAwardParticipantId] = useState('');
  const [customAwardType, setCustomAwardType] = useState('STAFF_BEST_PHOTO');
  const [customAwardDesc, setCustomAwardDesc] = useState('');
  const [customAwardSuccess, setCustomAwardSuccess] = useState(false);

  // Tabs within Staff view
  const [staffTab, setStaffTab] = useState<'CHECKIN' | 'APPROVALS' | 'MUSIC' | 'CUSTOM_AWARDS'>('CHECKIN');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedCode = useRef<string>('');
  const lastScannedTime = useRef<number>(0);

  // Sound Synthesizer (Web Audio API)
  const playBeep = (success: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (success) {
        // High-pitched cheerful double tone
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
        // Low buzzy alarm tone
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

  // Offline Synchronization listeners
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Internet link recovered. Starting auto-sync...`]);
      syncOfflineQueue();
    };
    const handleOfflineStatus = () => {
      setIsOnline(false);
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Connection lost. Switched to secure offline mode.`]);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, [offlineQueue]);

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Syncing ${offlineQueue.length} check-ins...`]);
    
    let successes = 0;
    const remainingQueue = [...offlineQueue];

    for (const pId of offlineQueue) {
      try {
        await onCheckIn(pId);
        successes++;
        const idx = remainingQueue.indexOf(pId);
        if (idx !== -1) {
          remainingQueue.splice(idx, 1);
        }
      } catch (err: any) {
        console.error(`Sync failed for ${pId}:`, err);
        setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ⚠️ Sync failed for ID ${pId}: ${err.message || 'Server error'}`]);
      }
    }

    setOfflineQueue(remainingQueue);
    localStorage.setItem('eventhub_offline_checkins', JSON.stringify(remainingQueue));
    setIsSyncing(false);
    
    if (successes > 0) {
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ✅ Successfully synced ${successes} offline check-ins.`]);
    }
  };

  // Live Camera stream processing loop
  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: facingMode }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameraDevices(videoDevices);
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCameraError(err.message || "Could not access camera. Please check camera permissions in browser.");
      }
    };

    if (isCameraActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const activeStream = videoRef.current.srcObject as MediaStream;
        activeStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleDecodedQR(code.data);
          }
        }
      }
      if (isCameraActive) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isCameraActive) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, facingMode, selectedDeviceId]);

  // Handle a detected QR string
  const handleDecodedQR = (qrText: string) => {
    // Prevent rapid multiple triggers on same QR code
    if (lastScannedCode.current === qrText && Date.now() - lastScannedTime.current < 2500) {
      return;
    }
    lastScannedCode.current = qrText;
    lastScannedTime.current = Date.now();

    // Find the participant
    const matchedParticipant = participants.find(p => p.qrCode === qrText || p.id === qrText);

    if (!matchedParticipant) {
      playBeep(false);
      setValidationError(`❌ SECURITY EXCEPTION: Forgery Detected! Signature "${qrText.substring(0, 16)}..." does not exist in the EventHub registry.`);
      return;
    }

    // It's a valid code!
    setValidationError(null);
    setSelectedForCheckin(matchedParticipant);
    setVerificationCheckFace(false);
    setVerificationCheckTicking(false);
    playBeep(true);
    
    // Deactivate camera after scanning so they focus on the identity card
    setIsCameraActive(false);
  };

  // Drag & Drop or Upload a QR code image
  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileScanError(null);
    setFileScanSuccess(false);
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
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            setFileScanSuccess(true);
            handleDecodedQR(code.data);
          } else {
            playBeep(false);
            setFileScanError("❌ Decode Failed: Could not find a clear QR code inside this image. Try uploading a clearer, high-contrast screenshot.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQRInput.trim()) return;
    handleDecodedQR(manualQRInput.trim());
    setManualQRInput('');
  };

  const handleManualCheckIn = async (participantId: string) => {
    const guest = participants.find(p => p.id === participantId);
    if (guest) {
      setSelectedForCheckin(guest);
      setVerificationCheckFace(false);
      setVerificationCheckTicking(false);
      setValidationError(null);
    }
  };

  // Raw printer drivers generators
  const generateZPL = (p: Participant, eventName: string): string => {
    const cleanName = p.name.toUpperCase().replace(/[^A-Z0-9\s.-]/g, '');
    const cleanCompany = p.company.toUpperCase().replace(/[^A-Z0-9\s.-]/g, '');
    const cleanPosition = p.position.toUpperCase().replace(/[^A-Z0-9\s.-]/g, '');
    const cleanTable = (p.tableNumber || 'A').toUpperCase().replace(/[^A-Z0-9\s.-]/g, '');
    const cleanSeat = (p.seatNumber || '01').toUpperCase().replace(/[^A-Z0-9\s.-]/g, '');
    const cleanEvent = eventName.toUpperCase().replace(/[^A-Z0-9\s.-]/g, '');
    const phone = p.phone || 'N/A';
    
    return `^XA
^CI28
^PW${parseInt(zebraLabelWidth) * 200 || 800}
^LL${parseInt(zebraLabelHeight) * 200 || 600}
^LH0,0
^FO40,30^A0N,22,22^FD${cleanEvent}^FS
^FO40,55^GB560,2,2^FS
^FO40,80^A0N,38,38^FD${cleanName}^FS
^FO40,130^A0N,20,20^FD${cleanPosition}^FS
^FO40,155^A0N,26,26^FD${cleanCompany}^FS
^FO40,210^GB560,1,1^FS
^FO40,230^A0N,20,20^FDTABLE: ${cleanTable}   |   SEAT: ${cleanSeat}^FS
^FO40,260^A0N,16,16^FDEMERGENCY PHONE: ${phone}^FS
^FO40,285^A0N,16,16^FDORGANIZER TEL: +1 (555) 019-9111^FS
^FO40,320^BQN,2,4^FDQA,${p.qrCode}^FS
^FO170,335^A0N,18,18^FDID: ${p.id}^FS
^FO170,360^A0N,14,14^FDCHECKED IN AT: ${new Date().toLocaleDateString()}^FS
^XZ`;
  };

  const generateESCPOS = (p: Participant, eventName: string): string => {
    const name = p.name.toUpperCase();
    const company = p.company.toUpperCase();
    const position = p.position.toUpperCase();
    const table = p.tableNumber || 'A';
    const seat = p.seatNumber || '01';
    const id = p.id;
    const phone = p.phone || 'N/A';
    
    return `[ESC/POS Command Stream]
\\x1B\\x40                ; Initialize Printer
\\x1B\\x61\\x01            ; Align Center
\\x1D\\x21\\x11            ; Select Double Height & Double Width
${eventName}
\\x1D\\x21\\x00            ; Normal size
------------------------------------------------
\\x1D\\x21\\x22            ; Select Triple Width & Height
${name}
\\x1D\\x21\\x00            ; Normal size
${position}
${company}
------------------------------------------------
\\x1B\\x61\\x00            ; Align Left
TABLE: ${table}
SEAT: ${seat}
ID: ${id}
EMERGENCY CONTACT: ${phone}
ORGANIZER EMERGENCY: +1 (555) 019-9111
------------------------------------------------
\\x1B\\x61\\x01            ; Align Center
[QR CODE SIGNATURE: ${p.qrCode}]
\\x1D\\x28\\x6B\\x04\\x00\\x31\\x41\\x32\\x00  ; Model 2
\\x1D\\x28\\x6B\\x03\\x00\\x31\\x43\\x06      ; Dot Size 6
\\x1D\\x28\\x6B\\x03\\x00\\x31\\x45\\x30      ; Error Correct L
\\x1D\\x56\\x42\\x00        ; Cut Paper`;
  };

  const generateBrotherTemplate = (p: Participant, eventName: string, tape: '62mm' | '29x90mm'): string => {
    const name = p.name.toUpperCase();
    const company = p.company.toUpperCase();
    const position = p.position.toUpperCase();
    const table = p.tableNumber || 'A';
    const seat = p.seatNumber || '01';
    const id = p.id;
    const phone = p.phone || 'N/A';

    return `[Brother ESC/P Template Stream]
^II                       ; Initialize Brother P-touch Mode
^ON                       ; Set ESC/P Mode
^DI                       ; Specify Density
^SS                       ; Set Tape Size (${tape})
^PC                       ; Specify print properties
^TS 011                   ; Specify Template #11
^JS                       ; Job start
^FD "${eventName}"        ; Field Event Name
^FD "${name}"             ; Field Participant Name
^FD "${position}"         ; Field Job Title
^FD "${company}"          ; Field Organization Name
^FD "TABLE: ${table}"     ; Field Table info
^FD "SEAT: ${seat}"       ; Field Seat info
^FD "ID: ${id}"           ; Field ID
^FD "EMERGENCY: ${phone}" ; Field Emergency Phone
^FD "QR:${p.qrCode}"      ; Field QR Code Data
^FF                       ; Form feed & cut`;
  };

  const triggerPrinterAction = (participant: Participant) => {
    if (!participant) return;

    const newJobId = `JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob = {
      id: newJobId,
      guestName: participant.name,
      time: new Date().toLocaleTimeString(),
      driver: printerDriver,
      status: 'SPOOLING' as const,
      details: 'Connecting to target physical spool...'
    };

    setPrintJobs(prev => [newJob, ...prev]);
    setIsSpooling(true);

    if (printerDriver === 'PDF') {
      setSpoolProgress('Preparing high-resolution PDF vector layout frames...');
      setTimeout(() => {
        setSpoolProgress('System Print Dialog spawned. Please complete action in browser dialog.');
        window.print();
        setPrintJobs(prev => prev.map(j => j.id === newJobId ? { ...j, status: 'SUCCESS', details: 'Rendered successfully to Browser System Spooler.' } : j));
        setTimeout(() => {
          setIsSpooling(false);
          setSpoolProgress('');
        }, 1200);
      }, 600);
    } else {
      setSpoolProgress(`Initializing raw driver socket to print server at ${printerIp}:${printerPort}...`);
      
      setTimeout(() => {
        setSpoolProgress(`Translating metadata into raw commands using the active ${printerDriver} interpreter...`);
        
        setTimeout(() => {
          let payloadLength = 0;
          if (printerDriver === 'ZEBRA') {
            payloadLength = generateZPL(participant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT').length;
          } else if (printerDriver === 'EPSON') {
            payloadLength = generateESCPOS(participant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT').length;
          } else if (printerDriver === 'BROTHER') {
            payloadLength = generateBrotherTemplate(participant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT', brotherTapeSize).length;
          }

          setSpoolProgress(`Spooling ${payloadLength} bytes stream over TCP socket segment. Checking handshake ACK response...`);
          
          setTimeout(() => {
            playBeep(true);
            setSpoolProgress(`Success! Printer responded with STATUS: READY (ACK). Print job complete.`);
            setPrintJobs(prev => prev.map(j => j.id === newJobId ? { ...j, status: 'SUCCESS', details: `Printed ${payloadLength} bytes via Raw TCP Port socket.` } : j));
            
            setTimeout(() => {
              setIsSpooling(false);
              setSpoolProgress('');
            }, 1000);
          }, 1200);
        }, 1200);
      }, 1000);
    }
  };

  const handleConfirmAndCheckIn = async (participant: Participant) => {
    // 1. Double check duplicate check-in
    if (participant.checkedIn) {
      alert(`Already Checked In! Double check-in prevented. Guest was authenticated on ${participant.checkedInAt}`);
      return;
    }

    // 2. Offline check-in caching vs Online API call
    if (!isOnline) {
      // Switched to offline! Add to queue
      const queue = [...offlineQueue, participant.id];
      setOfflineQueue(queue);
      localStorage.setItem('eventhub_offline_checkins', JSON.stringify(queue));
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Checked in ${participant.name} offline. Added to sync queue.`]);
      
      // Update badge view using local clock
      const updatedParticipant = {
        ...participant,
        checkedIn: true,
        checkedInAt: new Date().toISOString()
      };
      setBadgeParticipant(updatedParticipant);
      
      // Flash success animation
      setCheckInSuccess(true);
      playBeep(true);

      // Auto print trigger
      if (autoPrintEnabled) {
        triggerPrinterAction(updatedParticipant);
      }

      setTimeout(() => {
        setCheckInSuccess(false);
        setSelectedForCheckin(null);
      }, 1500);
    } else {
      // Standard Online API Check-in
      try {
        await onCheckIn(participant.id);
        const scanned = participants.find(p => p.id === participant.id);
        if (scanned) {
          const fresh = { ...scanned, checkedIn: true, checkedInAt: new Date().toISOString() };
          setBadgeParticipant(fresh);
          // Auto print trigger
          if (autoPrintEnabled) {
            triggerPrinterAction(fresh);
          }
        }
        setCheckInSuccess(true);
        playBeep(true);
        setTimeout(() => {
          setCheckInSuccess(false);
          setSelectedForCheckin(null);
        }, 1500);
      } catch (err: any) {
        alert(err.message || "QR Code check-in failed");
      }
    }
  };

  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAwardParticipantId) return;
    try {
      const awardLabels: Record<string, string> = {
        STAFF_BEST_PHOTO: 'Best Photo Award - outstanding creative keynote composition',
        STAFF_ACTIVE: 'Active Participant Award - exceptional engagement during Q&A',
        CUSTOM: customAwardDesc || 'Special Spot-Award Point Allocation'
      };

      await onAwardCustomPoints(
        customAwardParticipantId,
        customAwardType,
        awardLabels[customAwardType]
      );
      setCustomAwardSuccess(true);
      setCustomAwardDesc('');
      setTimeout(() => setCustomAwardSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const printBadge = () => {
    if (badgeParticipant) {
      triggerPrinterAction(badgeParticipant);
    }
  };

  const pendingSubmissions = activitySubmissions.filter(s => s.status === 'PENDING');
  const pendingSongs = songRequests.filter(s => s.status === 'PENDING');
  const activeSongs = songRequests.filter(s => s.status === 'APPROVED');

  const filteredParticipants = participants.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.company.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
    
    if (guestFilter === 'CHECKED_IN') return matchesSearch && p.checkedIn && p.approved !== false;
    if (guestFilter === 'NOT_CHECKED_IN') return matchesSearch && !p.checkedIn && p.approved !== false;
    if (guestFilter === 'AWAITING_APPROVAL') return matchesSearch && p.approved === false;
    return matchesSearch;
  });

  const renderBadgeQR = (text: string) => {
    return (
      <svg className="w-24 h-24" viewBox="0 0 100 100" shapeRendering="crispEdges">
        <rect width="100" height="100" fill="white" />
        <path d="M 5,5 h 25 v 25 h -25 z M 10,10 h 15 v 15 h -15 z" fill="#000" />
        <path d="M 65,5 h 25 v 25 h -25 z M 70,10 h 15 v 15 h -15 z" fill="#000" />
        <path d="M 5,65 h 25 v 25 h -25 z M 10,70 h 15 v 15 h -15 z" fill="#000" />
        <path d="M 35,10 h 10 v 10 h -10 z M 50,5 h 10 v 10 h -10 z" fill="#000" />
        <path d="M 10,35 h 10 v 15 h -10 z M 25,45 h 15 v 5 h -15 z" fill="#000" />
        <path d="M 65,35 h 10 v 20 h -10 z M 80,45 h 15 v 10 h -15 z" fill="#000" />
        <path d="M 45,65 h 15 v 10 h -15 z M 35,80 h 10 v 15 h -10 z" fill="#000" />
        <rect x="42" y="42" width="16" height="16" rx="2" fill="#000" />
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="check-in-station-panel">
      
      {/* Network & Offline Status Banner */}
      <div className={`p-4 border-[1.5px] border-[#141414] font-mono text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${
        isOnline ? 'bg-emerald-50 border-emerald-950' : 'bg-amber-50 border-amber-950'
      }`}>
        <div className="flex items-center gap-2.5">
          {isOnline ? (
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <Wifi className="w-4 h-4" />
              <span>ONLINE MODE ACTIVATED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
              </span>
              <WifiOff className="w-4 h-4" />
              <span>SECURE OFFLINE MODE</span>
            </div>
          )}
          <span className="text-slate-500">//</span>
          <span className="text-slate-700">
            Queue: <strong>{offlineQueue.length} unsynced</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {offlineQueue.length > 0 && (
            <button
              onClick={syncOfflineQueue}
              disabled={isSyncing || !isOnline}
              className={`px-3 py-1.5 border border-[#141414] font-bold uppercase transition-all flex items-center gap-1.5 text-[11px] ${
                isOnline 
                  ? 'bg-black text-[#00FF00] hover:bg-neutral-900 cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
            </button>
          )}

          {syncLogs.length > 0 && (
            <details className="w-full md:w-auto text-[10px] text-slate-600 font-mono mt-1 md:mt-0">
              <summary className="cursor-pointer hover:underline outline-none">View Network Logs</summary>
              <div className="bg-white p-2 border border-[#141414] mt-1 max-h-24 overflow-y-auto space-y-1 text-[9px] w-80 text-left">
                {syncLogs.slice(-10).map((log, i) => (
                  <div key={i} className="truncate">{log}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Staff Tab Header Navigation */}
      <div className="flex flex-wrap border-[1.5px] border-[#141414] bg-[#DFDEDA] p-1 gap-1 rounded-none font-mono">
        <button
          onClick={() => setStaffTab('CHECKIN')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            staffTab === 'CHECKIN' ? 'bg-[#141414] text-[#00FF00]' : 'text-slate-700 hover:text-[#141414] hover:bg-[#CFCECA]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>03.1 Reception Desk</span>
        </button>
        <button
          onClick={() => setStaffTab('APPROVALS')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer relative ${
            staffTab === 'APPROVALS' ? 'bg-[#141414] text-[#00FF00]' : 'text-slate-700 hover:text-[#141414] hover:bg-[#CFCECA]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>03.2 Verification Queue</span>
          {pendingSubmissions.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-black text-[#00FF00] border border-[#00FF00] text-[10px] font-black rounded-none flex items-center justify-center">
              {pendingSubmissions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setStaffTab('MUSIC')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer relative ${
            staffTab === 'MUSIC' ? 'bg-[#141414] text-[#00FF00]' : 'text-slate-700 hover:text-[#141414] hover:bg-[#CFCECA]'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>03.3 Live Band Queue</span>
          {pendingSongs.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-black text-[#00FF00] border border-[#00FF00] text-[10px] font-black rounded-none flex items-center justify-center">
              {pendingSongs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setStaffTab('CUSTOM_AWARDS')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            staffTab === 'CUSTOM_AWARDS' ? 'bg-[#141414] text-[#00FF00]' : 'text-slate-700 hover:text-[#141414] hover:bg-[#CFCECA]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>03.4 Dispensation</span>
        </button>
      </div>

      {/* STAFF TAB 1: FRONT DESK CHECK-IN STATION */}
      {staffTab === 'CHECKIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Lookup list panel */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Forgery & validation alert */}
            {validationError && (
              <div className="bg-rose-50 border-2 border-rose-600 p-4 font-mono text-rose-800 text-xs flex items-start gap-3 animate-pulse">
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-bold uppercase tracking-wide">Security Breach Warning!</h4>
                  <p className="mt-1 leading-relaxed font-sans">{validationError}</p>
                  <p className="mt-2 text-[10px] font-bold text-rose-700">// Automated physical lock and badge blacklisting initiated.</p>
                </div>
              </div>
            )}

            <div className="tech-card p-5 space-y-4">
              <h3 className="font-mono font-bold text-slate-900 text-sm uppercase flex items-center justify-between border-b border-[#141414]/10 pb-2">
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#141414]" />
                  <span>03.1 Guest Lookup & Check-In Desk</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">STAFF ACCESS ONLY</span>
              </h3>

              {/* Robust Multi-Option Scanner Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A: Live Webcam Scanner */}
                <div className="border border-[#141414] p-4 bg-slate-50 space-y-3 font-mono flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Webcam / Mobile Camera</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-1">
                      Direct scan utilizing terminal lenses with auto-focus.
                    </p>
                  </div>

                  {isCameraActive ? (
                    <div className="space-y-2 mt-2">
                      <div className="bg-black text-[#00FF00] h-48 rounded-none border-[1.5px] border-[#141414] relative overflow-hidden flex items-center justify-center">
                        <video 
                          ref={videoRef} 
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 border border-[#00FF00]/30 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-dashed border-[#00FF00]/60 pointer-events-none"></div>
                        {/* Laser Scanner animation bar */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-bounce"></div>
                      </div>

                      <div className="flex gap-2">
                        {cameraDevices.length > 1 && (
                          <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="tech-select text-[10px] flex-1 font-mono"
                          >
                            <option value="">Select Lens...</option>
                            {cameraDevices.map((device, i) => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${i + 1}`}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                          className="btn-action-custom text-[10px] py-1 px-2 flex items-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Flip</span>
                        </button>
                        <button
                          onClick={() => setIsCameraActive(false)}
                          className="bg-rose-950 text-rose-200 border border-rose-800 text-[10px] py-1 px-3 uppercase font-bold"
                        >
                          Stop Lens
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCameraActive(true)}
                      className="w-full btn-action-primary py-2.5 flex items-center justify-center gap-2 mt-3"
                    >
                      <Camera className="w-4 h-4 text-[#00FF00]" />
                      <span>Activate QR Scanner Camera</span>
                    </button>
                  )}

                  {cameraError && (
                    <div className="text-[10px] text-rose-700 bg-rose-50 p-2 border border-rose-200 mt-2 font-sans">
                      {cameraError}
                    </div>
                  )}
                </div>

                {/* Option B: Screenshot / File Upload Scanner */}
                <div className="border border-[#141414] p-4 bg-slate-50 space-y-3 font-mono flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload QR File / Screenshot</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-1">
                      Drag & Drop or select screenshot file generated from participant pass.
                    </p>
                  </div>

                  <div className="space-y-3 mt-3">
                    <label className="border-2 border-dashed border-gray-300 hover:border-[#141414] bg-white p-4 text-center cursor-pointer block rounded-none transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleQRImageUpload} 
                        className="hidden" 
                      />
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase block">
                        Select screenshot image
                      </span>
                      <span className="text-[9px] text-slate-500 block font-sans mt-0.5">
                        Accepts PNG, JPG, JPEG
                      </span>
                    </label>

                    {fileScanSuccess && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2 border border-emerald-200 text-center font-bold">
                        🎉 DECODE SUCCESSFUL: Parsed valid QR record.
                      </div>
                    )}

                    {fileScanError && (
                      <div className="text-[10px] text-rose-800 bg-rose-50 p-2 border border-rose-200 font-sans">
                        {fileScanError}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Option C: Manual Entry or Quick ID entry */}
              <div className="border border-[#141414] p-3 bg-slate-100 font-mono text-xs">
                <form onSubmit={handleManualQRSubmit} className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <div className="text-left">
                    <span className="font-bold text-slate-900 block uppercase text-[10px]">Option C: Direct QR String Signature Input</span>
                    <span className="text-[9px] text-slate-500 font-sans block">Type or paste full Participant ID or QR text block directly.</span>
                  </div>
                  <div className="flex gap-1.5 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="e.g. EVENT-1002-3X"
                      value={manualQRInput}
                      onChange={(e) => setManualQRInput(e.target.value)}
                      className="tech-input font-mono text-xs uppercase px-2 py-1.5 bg-white shrink"
                    />
                    <button
                      type="submit"
                      disabled={!manualQRInput.trim()}
                      className="btn-action-primary text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      Authenticate
                    </button>
                  </div>
                </form>
              </div>

              {/* Search Bar & Status Filter */}
              <div className="space-y-2 pt-2 border-t border-[#141414]/10">
                <div className="flex flex-col md:flex-row gap-2 justify-between">
                  <div className="relative font-mono flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search guest name, email, company, or seat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="tech-input w-full pl-9 pr-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div className="flex border border-[#141414] bg-[#DFDEDA] p-0.5 rounded-none font-mono text-[10px] shrink-0">
                    <button
                      onClick={() => setGuestFilter('ALL')}
                      className={`px-2 py-1 uppercase font-bold cursor-pointer ${guestFilter === 'ALL' ? 'bg-black text-[#00FF00]' : 'text-slate-700'}`}
                    >
                      All ({participants.length})
                    </button>
                    <button
                      onClick={() => setGuestFilter('CHECKED_IN')}
                      className={`px-2 py-1 uppercase font-bold cursor-pointer ${guestFilter === 'CHECKED_IN' ? 'bg-black text-[#00FF00]' : 'text-slate-700'}`}
                    >
                      In ({participants.filter(p => p.checkedIn && p.approved !== false).length})
                    </button>
                    <button
                      onClick={() => setGuestFilter('NOT_CHECKED_IN')}
                      className={`px-2 py-1 uppercase font-bold cursor-pointer ${guestFilter === 'NOT_CHECKED_IN' ? 'bg-black text-[#00FF00]' : 'text-slate-700'}`}
                    >
                      Pending ({participants.filter(p => !p.checkedIn && p.approved !== false).length})
                    </button>
                    <button
                      onClick={() => setGuestFilter('AWAITING_APPROVAL')}
                      className={`px-2 py-1 uppercase font-bold cursor-pointer ${guestFilter === 'AWAITING_APPROVAL' ? 'bg-black text-amber-400' : 'text-slate-700'}`}
                    >
                      Awaiting Appr ({participants.filter(p => p.approved === false).length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Guest Listing Table */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-slate-500 font-bold bg-slate-50 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">Participant ID</th>
                      <th className="py-2.5 px-3">Guest Details</th>
                      <th className="py-2.5 px-3">Allocated Seat</th>
                      <th className="py-2.5 px-3">Dietary & Size</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredParticipants.map((guest) => (
                      <tr key={guest.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600">{guest.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{guest.name}</div>
                          <div className="text-[10px] text-slate-500">{guest.email}</div>
                          <div className="text-[10px] font-mono text-indigo-500">{guest.company}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-700">{guest.tableNumber}</div>
                          <div className="text-[10px] text-slate-500">{guest.seatNumber}</div>
                        </td>
                        <td className="py-2 px-3 text-[10px] font-mono space-y-0.5">
                          <div className="text-slate-700">👕 Size: <strong>{guest.tShirtSize || 'M'}</strong></div>
                          <div className="text-slate-500">🥗 Diet: <strong>{guest.dietaryPreference || 'NONE'}</strong></div>
                        </td>
                        <td className="py-3 px-3">
                          {guest.approved === false ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px] animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Awaiting Approval</span>
                            </span>
                          ) : guest.checkedIn ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5 bg-emerald-100 rounded-full p-0.5" />
                              <span>Checked In</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Checked In</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {guest.approved === false ? (
                            <button
                              onClick={() => onToggleApprove && onToggleApprove(guest.id, true)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 text-[10px] rounded cursor-pointer transition-colors"
                            >
                              Approve
                            </button>
                          ) : guest.checkedIn ? (
                            <button
                              onClick={() => setBadgeParticipant(guest)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 font-semibold cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Badge</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleManualCheckIn(guest.id)}
                              disabled={guest.rsvpStatus === 'NO'}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1 rounded cursor-pointer disabled:opacity-40"
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 font-mono italic">
                          No matching registered participants found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Badge Preview and Printing Right Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity Checklist & Verification Modal */}
            {selectedForCheckin && (
              <div className="border-2 border-slate-900 bg-white p-5 rounded-none shadow-none space-y-4 font-mono text-xs">
                <h4 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5 border-b-2 border-slate-900 pb-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  <span className="text-indigo-700 font-black">Identity Check required</span>
                </h4>
                
                <div className="bg-[#DFDEDA] border border-[#141414] p-3 rounded-none text-xs space-y-2">
                  <div className="flex items-center gap-3">
                    {selectedForCheckin.photoUrl ? (
                      <img
                        src={selectedForCheckin.photoUrl}
                        alt={selectedForCheckin.name}
                        className="w-14 h-14 object-cover border border-[#141414] rounded-none bg-white"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 border border-[#141414] bg-slate-300 flex items-center justify-center text-[10px] text-slate-600 uppercase">
                        No Pic
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-bold leading-none">Registered Name</p>
                      <h5 className="font-black text-slate-900 text-sm mt-0.5">{selectedForCheckin.name}</h5>
                      <p className="text-[10px] text-slate-600">{selectedForCheckin.company}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#141414]/10 pt-2 grid grid-cols-2 gap-2 text-[10px]">
                    <p>🎟️ ID: <strong>{selectedForCheckin.id}</strong></p>
                    <p>🏢 Seat: <strong>{selectedForCheckin.tableNumber || 'A'}-{selectedForCheckin.seatNumber || '01'}</strong></p>
                  </div>
                </div>

                {/* Forgery & Screenshot Prevention Checklist */}
                <div className="p-3 border border-indigo-400 bg-indigo-50/60 rounded-none text-[10px] space-y-2">
                  <span className="font-bold text-indigo-900 uppercase block tracking-wider">// Mandatory Security Checks</span>
                  
                  <label className="flex items-start gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={verificationCheckFace}
                      onChange={(e) => setVerificationCheckFace(e.target.checked)}
                      className="mt-0.5 rounded-none border-[#141414] text-indigo-600 focus:ring-0"
                    />
                    <span>
                      <strong>Visual Match:</strong> I have compared the registrant's face to the uploaded profile photo above.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={verificationCheckTicking}
                      onChange={(e) => setVerificationCheckTicking(e.target.checked)}
                      className="mt-0.5 rounded-none border-[#141414] text-indigo-600 focus:ring-0"
                    />
                    <span>
                      <strong>Active Pass Ticking:</strong> The mobile pass has an active animated laser and the seconds are actively counting down. (Deters screenshots).
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmAndCheckIn(selectedForCheckin)}
                    disabled={!verificationCheckFace || !verificationCheckTicking || checkInSuccess}
                    className={`flex-1 font-bold py-2.5 text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
                      verificationCheckFace && verificationCheckTicking
                        ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer border border-[#141414]'
                        : 'bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {checkInSuccess ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span>Complete Check In</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedForCheckin(null);
                      setValidationError(null);
                    }}
                    className="btn-action-custom text-xs py-2 px-3 border border-[#141414] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Print Preview Badge Visual Component */}
            {badgeParticipant ? (
              <div className="tech-card p-5 space-y-5 print-badge-card font-mono bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs">
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Badge Production Workspace</span>
                  </div>
                  <button onClick={() => setBadgeParticipant(null)} className="text-slate-500 hover:text-black cursor-pointer bg-slate-100 p-1 border border-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Automation & Controls */}
                <div className="bg-slate-50 border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-600">Printing Pipeline Settings</span>
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-indigo-800">
                      <input 
                        type="checkbox" 
                        checked={autoPrintEnabled}
                        onChange={(e) => setAutoPrintEnabled(e.target.checked)}
                        className="rounded-none border-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>Auto-Print on Check-In</span>
                    </label>
                  </div>

                  {/* Driver Tab Buttons */}
                  <div className="grid grid-cols-4 gap-1 border border-slate-900 bg-slate-200 p-0.5">
                    {(['PDF', 'ZEBRA', 'EPSON', 'BROTHER'] as const).map((drv) => (
                      <button
                        key={drv}
                        onClick={() => setPrinterDriver(drv)}
                        className={`py-1.5 text-[8px] sm:text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                          printerDriver === drv 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-800 hover:bg-slate-300'
                        }`}
                      >
                        {drv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Driver-specific Controls */}
                <div className="border border-slate-900 p-3 bg-[#DFDEDA] space-y-3 text-[10px]">
                  {printerDriver === 'PDF' && (
                    <div className="space-y-2">
                      <div className="font-bold uppercase tracking-wider text-slate-800">PDF Document Layout</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Label Standard</label>
                          <select 
                            value={pdfLabelSize} 
                            onChange={(e) => setPdfLabelSize(e.target.value as any)}
                            className="w-full mt-1 bg-white border border-slate-900 py-1 px-1.5 text-[9px] font-mono outline-none"
                          >
                            <option value="CR80">CR80 (Credit Card Size)</option>
                            <option value="AVERY_5395">Avery 5395 (Badge)</option>
                            <option value="CONTINUOUS_ROLL">Continuous 62mm Tape</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Orientation</label>
                          <select 
                            value={pdfOrientation} 
                            onChange={(e) => setPdfOrientation(e.target.value as any)}
                            className="w-full mt-1 bg-white border border-slate-900 py-1 px-1.5 text-[9px] font-mono outline-none"
                          >
                            <option value="PORTRAIT">Portrait</option>
                            <option value="LANDSCAPE">Landscape</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-500 leading-tight italic">
                        Uses vector native styles. Selecting standard paper sizes isolates layout on client's local print manager spool.
                      </p>
                    </div>
                  )}

                  {printerDriver === 'ZEBRA' && (
                    <div className="space-y-2">
                      <div className="font-bold uppercase tracking-wider text-slate-800">Zebra ZPL-II LAN Interface</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Ethernet Printer IP</label>
                          <input 
                            type="text" 
                            value={printerIp} 
                            onChange={(e) => setPrinterIp(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Raw TCP Port</label>
                          <input 
                            type="text" 
                            value={printerPort} 
                            onChange={(e) => setPrinterPort(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Label Width (in)</label>
                          <input 
                            type="text" 
                            value={zebraLabelWidth} 
                            onChange={(e) => setZebraLabelWidth(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Label Height (in)</label>
                          <input 
                            type="text" 
                            value={zebraLabelHeight} 
                            onChange={(e) => setZebraLabelHeight(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {printerDriver === 'EPSON' && (
                    <div className="space-y-2">
                      <div className="font-bold uppercase tracking-wider text-slate-800">Epson ESC/POS Ethernet Link</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Printer IP Address</label>
                          <input 
                            type="text" 
                            value={printerIp} 
                            onChange={(e) => setPrinterIp(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Port (TCP)</label>
                          <input 
                            type="text" 
                            value={printerPort} 
                            onChange={(e) => setPrinterPort(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-500 leading-tight">
                        ESC/POS is standard for continuous receipt-style badges, yielding fast thermal high-density name tags.
                      </p>
                    </div>
                  )}

                  {printerDriver === 'BROTHER' && (
                    <div className="space-y-2">
                      <div className="font-bold uppercase tracking-wider text-slate-800">Brother ESC/P Label Format</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Label/Tape Format</label>
                          <select 
                            value={brotherTapeSize} 
                            onChange={(e) => setBrotherTapeSize(e.target.value as any)}
                            className="w-full bg-white border border-slate-900 py-1 px-1.5 text-[9px] font-mono outline-none"
                          >
                            <option value="62mm">DK-22205 (62mm Cont.)</option>
                            <option value="29x90mm">DK-11201 (29x90mm Cut)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase text-slate-500 font-black">Spool IP Address</label>
                          <input 
                            type="text" 
                            value={printerIp} 
                            onChange={(e) => setPrinterIp(e.target.value)}
                            className="w-full bg-white border border-slate-900 py-1 px-2 font-mono text-[9px] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commands Actions Utilities */}
                  {printerDriver !== 'PDF' && (
                    <div className="flex gap-1.5 border-t border-slate-400 pt-2 text-[8px]">
                      <button
                        onClick={() => {
                          let code = '';
                          if (printerDriver === 'ZEBRA') code = generateZPL(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT');
                          if (printerDriver === 'EPSON') code = generateESCPOS(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT');
                          if (printerDriver === 'BROTHER') code = generateBrotherTemplate(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT', brotherTapeSize);
                          navigator.clipboard.writeText(code);
                          alert('Copied raw printer instructions to clipboard!');
                        }}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold py-1 px-1 border border-slate-900 cursor-pointer text-center uppercase"
                      >
                        Copy Command
                      </button>
                      <button
                        onClick={() => {
                          let code = '';
                          let filename = '';
                          if (printerDriver === 'ZEBRA') {
                            code = generateZPL(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT');
                            filename = `badge_${badgeParticipant.id}.zpl`;
                          } else if (printerDriver === 'EPSON') {
                            code = generateESCPOS(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT');
                            filename = `badge_${badgeParticipant.id}_escpos.bin`;
                          } else if (printerDriver === 'BROTHER') {
                            code = generateBrotherTemplate(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT', brotherTapeSize);
                            filename = `badge_${badgeParticipant.id}_brother.bin`;
                          }
                          const blob = new Blob([code], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = filename;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold py-1 px-1 border border-slate-900 cursor-pointer text-center uppercase"
                      >
                        Download File
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Output Simulator Canvas */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 uppercase">
                    <span>Virtual Simulator Output</span>
                    <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 uppercase tracking-widest">{printerDriver} Mode</span>
                  </div>

                  {printerDriver === 'PDF' && (
                    <div 
                      className={`border-2 border-slate-900 bg-white p-5 text-center mx-auto shadow-none relative overflow-hidden transition-all duration-300 ${
                        pdfOrientation === 'PORTRAIT' 
                          ? pdfLabelSize === 'CR80' ? 'w-[200px] h-[310px]' : pdfLabelSize === 'AVERY_5395' ? 'w-[220px] h-[318px]' : 'w-[210px] h-[280px]'
                          : pdfLabelSize === 'CR80' ? 'w-[310px] h-[200px]' : pdfLabelSize === 'AVERY_5395' ? 'w-[318px] h-[220px]' : 'w-[280px] h-[210px]'
                      }`}
                      id="printable-badge-body"
                    >
                      {/* Stylized background watermark for security */}
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center select-none font-black text-4xl">
                        EVENTHUB PASS
                      </div>

                      <div className="flex flex-col justify-between h-full font-mono text-left">
                        <div>
                          {/* Header event name */}
                          <div className="text-[8px] font-black uppercase text-slate-900 tracking-wider flex justify-between">
                            <span className="truncate">{eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT'}</span>
                            <span className="text-[7px] text-indigo-700 pl-1">★ PREMIUM</span>
                          </div>
                          <div className="text-[7px] text-slate-500 uppercase font-bold leading-none mt-0.5">
                            {eventConfig?.date || 'JULY 15, 2026'} // {eventConfig?.venue || 'GRAND BALLROOM, SF'}
                          </div>
                          
                          {/* Main Guest Name */}
                          <div className="text-sm font-black text-slate-900 uppercase tracking-tight mt-3 break-words leading-none">
                            {badgeParticipant.name}
                          </div>
                          
                          {/* Position & Organization */}
                          <div className="text-[9px] text-slate-700 font-bold mt-1 uppercase truncate">
                            {badgeParticipant.position}
                          </div>
                          <div className="text-[9px] text-indigo-800 font-extrabold tracking-wider truncate uppercase">
                            {badgeParticipant.company}
                          </div>
                        </div>

                        {/* Mid-level seating grids */}
                        <div className="grid grid-cols-2 gap-1.5 my-2">
                          <div className="bg-slate-100 border border-slate-300 py-1 px-1.5 text-center">
                            <div className="text-[6px] text-slate-500 uppercase leading-none font-bold">Table</div>
                            <div className="text-[10px] font-black text-slate-900 mt-0.5">{badgeParticipant.tableNumber || 'A'}</div>
                          </div>
                          <div className="bg-slate-100 border border-slate-300 py-1 px-1.5 text-center">
                            <div className="text-[6px] text-slate-500 uppercase leading-none font-bold">Seat</div>
                            <div className="text-[10px] font-black text-slate-900 mt-0.5">{badgeParticipant.seatNumber || '01'}</div>
                          </div>
                        </div>

                        {/* Bottom alignment of QR code and metadata */}
                        <div className="flex items-end justify-between gap-2 border-t border-slate-200 pt-2">
                          <div className="space-y-1 text-[7px] leading-tight text-slate-600">
                            <div>
                              <span className="font-bold text-slate-900 uppercase">Participant ID:</span>
                              <span className="font-mono ml-1">{badgeParticipant.id}</span>
                            </div>
                            <div>
                              <span className="font-bold text-red-600 uppercase">Emergency Contact:</span>
                              <span className="font-mono ml-1 block text-[7px]">{badgeParticipant.phone || '+1 (555) 019-9111'}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white p-1 border border-slate-400 shrink-0">
                            {renderBadgeQR(badgeParticipant.qrCode)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {printerDriver === 'ZEBRA' && (
                    <div className="border-2 border-dashed border-slate-500 bg-zinc-900 text-emerald-400 p-4 min-h-[220px] font-mono text-[9px] space-y-2 relative rounded-none shadow-inner">
                      <div className="absolute top-1 right-2 text-[7px] uppercase font-bold text-slate-500">// ZPL Monochrome LCD Terminal</div>
                      <div className="text-zinc-500">--- BEGIN TRANSMISSION COMMANDS ---</div>
                      <div className="bg-zinc-950 p-2 text-[8px] leading-normal text-slate-300 overflow-x-auto max-h-[140px] whitespace-pre font-mono">
                        {generateZPL(badgeParticipant, eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT')}
                      </div>
                      <div className="text-zinc-500">--- END OF COMMAND SEQUENCES ---</div>
                      <p className="text-[8px] text-slate-400 italic">
                        Provides a raw spool to physical serial or socket interfaces on thermal printers.
                      </p>
                    </div>
                  )}

                  {printerDriver === 'EPSON' && (
                    <div className="border border-slate-300 bg-white shadow-md p-4 max-w-[240px] mx-auto text-left text-slate-800 text-[10px] space-y-2 relative border-t-8 border-t-amber-500">
                      <div className="text-center font-bold text-amber-600 text-[8px] uppercase tracking-wider">// Simulated Thermal Tape Receipt</div>
                      <div className="text-center uppercase font-bold leading-tight border-b border-dashed border-slate-300 pb-1">
                        {eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT'}
                      </div>
                      
                      <div className="text-center py-2">
                        <div className="text-xs font-black uppercase text-black leading-none">{badgeParticipant.name}</div>
                        <div className="text-[8px] text-slate-600 mt-1">{badgeParticipant.position}</div>
                        <div className="text-[8px] font-bold text-slate-900 uppercase">{badgeParticipant.company}</div>
                      </div>

                      <div className="border-t border-b border-dashed border-slate-300 py-1 grid grid-cols-2 text-[8px] gap-1">
                        <div>TABLE: <strong>{badgeParticipant.tableNumber || 'A'}</strong></div>
                        <div>SEAT: <strong>{badgeParticipant.seatNumber || '01'}</strong></div>
                        <div>ID: <strong>{badgeParticipant.id}</strong></div>
                        <div>EMERGENCY: <strong>{badgeParticipant.phone || 'N/A'}</strong></div>
                      </div>

                      <div className="flex flex-col items-center pt-2 pb-1 space-y-1">
                        <div className="border border-slate-400 p-1 scale-75">
                          {renderBadgeQR(badgeParticipant.qrCode)}
                        </div>
                        <span className="text-[7px] text-slate-500 font-mono tracking-widest uppercase">{badgeParticipant.id}</span>
                      </div>
                      <div className="text-center text-[7px] text-slate-400 font-bold border-t border-dashed border-slate-300 pt-1 tracking-wider uppercase">--- CUT ---</div>
                    </div>
                  )}

                  {printerDriver === 'BROTHER' && (
                    <div className="border-2 border-slate-400 bg-amber-50 p-4 rounded-none shadow-sm min-h-[160px] text-slate-800 text-[9px] relative">
                      <div className="absolute top-1 right-2 text-[7px] uppercase font-bold text-slate-500">// ESC/P Binary Template preview</div>
                      <div className="space-y-1">
                        <div className="font-bold text-amber-800 text-[8px] uppercase">Job Header</div>
                        <div className="bg-amber-100 p-1 font-mono text-[8px] leading-tight text-slate-700">
                          Tape Size: {brotherTapeSize === '62mm' ? 'DK-22205 Continuous 62mm' : 'DK-11201 Die-Cut 29x90mm'}
                        </div>
                        <div className="font-bold text-amber-800 text-[8px] uppercase mt-2">Active Buffer Bindings</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8px] font-mono leading-none">
                          <p>Event: <span className="font-bold text-slate-900">{eventConfig?.name || 'EVENTHUB GLOBAL SUMMIT'}</span></p>
                          <p>Name: <span className="font-bold text-slate-900">{badgeParticipant.name}</span></p>
                          <p>Title: <span className="font-bold text-slate-900">{badgeParticipant.position}</span></p>
                          <p>Org: <span className="font-bold text-slate-900">{badgeParticipant.company}</span></p>
                          <p>Table: <span className="font-bold text-slate-900">{badgeParticipant.tableNumber || 'A'}</span></p>
                          <p>Seat: <span className="font-bold text-slate-900">{badgeParticipant.seatNumber || '01'}</span></p>
                          <p>Emergency: <span className="font-bold text-slate-900">{badgeParticipant.phone || 'N/A'}</span></p>
                          <p>Signature: <span className="font-bold text-slate-900">{badgeParticipant.qrCode}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Print Action button */}
                <button
                  onClick={printBadge}
                  disabled={isSpooling}
                  className={`w-full py-2.5 flex items-center justify-center gap-2 font-black uppercase text-xs border border-slate-900 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                    isSpooling ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#00FF00] hover:bg-[#00E500] text-black'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>{isSpooling ? 'Spooling Commands...' : 'Send Print Command'}</span>
                </button>

                {/* Spooling progress overlay banner */}
                {isSpooling && (
                  <div className="bg-indigo-50 border border-indigo-400 p-3 rounded-none animate-pulse space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 uppercase">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-700" />
                      <span>TCP Broadcast In Progress...</span>
                    </div>
                    <p className="text-slate-600 font-mono text-[9px]">{spoolProgress}</p>
                  </div>
                )}

                {/* Print Spooler Jobs Log Tracker */}
                <div className="border border-slate-300 p-3 space-y-2 bg-slate-50">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                    <span>Active Print Logs ({printJobs.length})</span>
                    <button onClick={() => setPrintJobs([])} className="text-slate-400 hover:text-black uppercase text-[8px] cursor-pointer font-bold">Clear Logs</button>
                  </div>

                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {printJobs.map((job) => (
                      <div key={job.id} className="flex justify-between items-center text-[8px] font-mono border-b border-slate-200 pb-1 last:border-0">
                        <div className="space-y-0.5">
                          <div className="text-slate-800 font-bold">
                            {job.id}: {job.guestName}
                          </div>
                          <div className="text-slate-500">
                            Driver: <span className="text-indigo-700 font-bold">{job.driver}</span> @ {job.time}
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 font-bold border ${
                          job.status === 'SUCCESS' 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                    {printJobs.length === 0 && (
                      <div className="text-center py-2 text-slate-400 italic text-[9px]">No print jobs spooled in this session.</div>
                    )}
                  </div>
                </div>

                <p className="text-[8px] text-slate-500 text-center leading-normal italic">
                  Supported hardware segments: Zebra GK420t/ZD421 (ZPL), Epson TM-T88 (ESC/POS), Brother QL-820NWB (ESC/P).
                </p>

                {/* Inline stylesheet inject to ensure correct window print sizing for label printers */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    body * {
                      visibility: hidden !important;
                      background: none !important;
                    }
                    #printable-badge-body, #printable-badge-body * {
                      visibility: visible !important;
                    }
                    #printable-badge-body {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      border: none !important;
                      box-shadow: none !important;
                      padding: 0 !important;
                      margin: 0 !important;
                    }
                  }
                `}} />
              </div>
            ) : (
              <div className="border-[1.5px] border-dashed border-[#141414] bg-[#DFDEDA] p-6 text-center text-slate-700 font-mono">
                <Printer className="w-10 h-10 mx-auto stroke-[1.5] text-[#141414] mb-2" />
                <h4 className="font-bold text-xs uppercase text-slate-900">[PRINTER STANDBY]</h4>
                <p className="text-xs mt-1 text-slate-600 font-sans">Select a checked-in participant to generate and print their official physical entry card.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAFF TAB 2: PROOF VERIFICATION QUEUE */}
      {staffTab === 'APPROVALS' && (
        <div className="tech-card p-5">
          <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4">
            03.2 Pending Activity Verifications Queue ({pendingSubmissions.length})
          </h3>

          {pendingSubmissions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-serif-italic">
              All participant uploads are verified! Excellent work.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="bg-[#DFDEDA] border-[1.5px] border-[#141414] rounded-none overflow-hidden flex flex-col justify-between font-mono">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-black uppercase bg-white border border-[#141414] px-2 py-0.5 rounded-none">
                          {sub.activityType}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-2 uppercase">{sub.participantName}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{sub.participantId}</p>
                      </div>
                      <span className="bg-[#00FF00] text-black border border-black font-bold text-xs px-2 py-0.5 rounded-none font-mono">
                        +{sub.pointsAwarded} PTS
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 bg-white p-2 border border-[#141414] rounded-none italic font-serif">
                      "{sub.description}"
                    </p>

                    {/* Image visual container if screenshot or photo upload */}
                    {sub.content && (sub.activityType === 'PHOTO_UPLOAD' || sub.activityType === 'INSTAGRAM_POST' || sub.content.startsWith('data:image/') || sub.content.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                      <div className="rounded-none overflow-hidden border border-[#141414] bg-white aspect-video relative group">
                        <img src={sub.content} alt="Proof" className="w-full h-full object-contain" />
                        <a 
                          href={sub.content} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#00FF00] text-[10px] font-bold"
                        >
                          [VIEW FULL IMAGE]
                        </a>
                      </div>
                    ) : sub.content ? (
                      /* Text content otherwise */
                      <div className="bg-white border border-[#141414] p-2 text-xs break-words">{sub.content}</div>
                    ) : null}
                  </div>

                  {/* Actions buttons */}
                  <div className="border-t border-[#141414] bg-white p-3 flex gap-2">
                    <button
                      onClick={() => onApproveActivity(sub.id, 'APPROVED')}
                      className="flex-1 btn-action-primary text-xs py-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => onApproveActivity(sub.id, 'REJECTED')}
                      className="flex-1 btn-action-custom text-xs py-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAFF TAB 3: LIVE BAND MUSIC MANAGER */}
      {staffTab === 'MUSIC' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Pending Queue approvals */}
          <div className="lg:col-span-6 space-y-4">
            <div className="tech-card p-5">
              <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4">
                03.3 Song Requests Verification Board ({pendingSongs.length})
              </h3>

              {pendingSongs.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4 text-center font-serif">No pending songs requested.</p>
              ) : (
                <div className="space-y-3 font-mono">
                  {pendingSongs.map((song) => (
                    <div key={song.id} className="p-4 rounded-none border border-[#141414] bg-[#DFDEDA] space-y-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm">"{song.title}"</span>
                          <span className="bg-[#00FF00] text-black border border-black font-bold px-2 py-0.5 rounded-none font-mono">+5 PTS</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">by <span className="font-bold">{song.artist}</span></p>
                        <p className="text-[10px] text-indigo-800 font-bold mt-1">Requester: {song.participantName} ({song.participantId})</p>
                      </div>

                      {song.message && (
                        <p className="p-2 bg-white rounded-none border border-[#141414] italic text-slate-700 font-serif">
                          "{song.message}"
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateSongStatus(song.id, 'APPROVED')}
                          className="flex-1 btn-action-primary text-xs py-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Award Pts</span>
                        </button>
                        <button
                          onClick={() => onUpdateSongStatus(song.id, 'REJECTED')}
                          className="btn-action-custom text-xs px-3 py-1.5"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Approved & Played list for live execution */}
          <div className="lg:col-span-6 space-y-4">
            <div className="tech-card p-5">
              <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4">
                03.3 Live Band Song Queue ({activeSongs.length})
              </h3>

              {activeSongs.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4 text-center font-serif">No approved songs in live queue.</p>
              ) : (
                <div className="space-y-3 font-mono">
                  {activeSongs.map((song) => (
                    <div key={song.id} className="p-3.5 rounded-none border border-[#141414] bg-white flex justify-between items-center text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">"{song.title}"</span>
                          <span className="text-slate-500 text-[11px]">by {song.artist}</span>
                        </div>
                        <p className="text-[10px] text-[#141414] font-medium mt-0.5 uppercase font-mono">Approved for {song.participantName}</p>
                      </div>

                      <button
                        onClick={() => onUpdateSongStatus(song.id, 'PLAYED')}
                        className="btn-action-primary text-xs py-1.5 px-3"
                      >
                        Mark Played
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAFF TAB 4: MANUAL AWARDS DISPENSATION */}
      {staffTab === 'CUSTOM_AWARDS' && (
        <div className="tech-card p-5 max-w-xl mx-auto">
          <h3 className="font-mono font-bold text-slate-900 text-sm uppercase border-b border-[#141414] pb-3 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-900" />
            <span>03.4 Dispense Staff Spot Awards</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-serif-italic">
            Award points manually for active engagement, winning mini-games, or taking the best photos during sessions.
          </p>

          <form onSubmit={handleAwardSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase block">Select Target Participant *</label>
              <select
                value={customAwardParticipantId}
                onChange={(e) => setCustomAwardParticipantId(e.target.value)}
                required
                className="tech-select w-full"
              >
                <option value="">-- Choose Checked-In Participant --</option>
                {participants
                  .filter(p => p.checkedIn)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name} ({p.company})</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase block">Award Activity Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomAwardType('STAFF_BEST_PHOTO')}
                  className={`p-2.5 rounded-none border text-left flex justify-between items-center transition-colors font-bold cursor-pointer ${
                    customAwardType === 'STAFF_BEST_PHOTO'
                      ? 'bg-[#141414] border-[#141414] text-white'
                      : 'border-[#141414] bg-white text-slate-700 hover:bg-[#DFDEDA]'
                  }`}
                >
                  <span>Best Photo Award</span>
                  <span className="font-mono text-xs text-[#00FF00] bg-black px-1.5 py-0.5 border border-neutral-700">+5 PTS</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCustomAwardType('STAFF_ACTIVE')}
                  className={`p-2.5 rounded-none border text-left flex justify-between items-center transition-colors font-bold cursor-pointer ${
                    customAwardType === 'STAFF_ACTIVE'
                      ? 'bg-[#141414] border-[#141414] text-white'
                      : 'border-[#141414] bg-white text-slate-700 hover:bg-[#DFDEDA]'
                  }`}
                >
                  <span>Active Guest Award</span>
                  <span className="font-mono text-xs text-[#00FF00] bg-black px-1.5 py-0.5 border border-neutral-700">+5 PTS</span>
                </button>
              </div>
            </div>

            {customAwardType === 'CUSTOM' && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Activity Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner of afternoon trivia mini-session"
                  value={customAwardDesc}
                  onChange={(e) => setCustomAwardDesc(e.target.value)}
                  className="tech-input w-full"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!customAwardParticipantId}
              className="btn-action-primary w-full py-2.5 disabled:opacity-50"
            >
              Dispense Award Now
            </button>

            {customAwardSuccess && (
              <div className="text-xs text-[#141414] font-bold flex items-center gap-1.5 mt-2 bg-[#00FF00]/20 border border-[#141414] p-2.5 rounded-none font-mono">
                <Check className="w-4 h-4 text-[#141414] shrink-0" />
                <span>[DISPENSED] Award points logged successfully! Score updated.</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
