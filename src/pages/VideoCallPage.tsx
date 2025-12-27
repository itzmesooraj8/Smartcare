import { useParams, useNavigate } from 'react-router-dom';
import TelehealthRoom from '@/components/TelehealthRoom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function TelehealthLandingPage() {
  // Grab the "roomId" from the URL (e.g., /video/consultation-101)
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Simple Header */}
      <div className="flex items-center p-4 text-white bg-slate-900 border-b border-slate-800">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard')}
          className="mr-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex flex-col">
          <span className="font-semibold">Secure Telehealth Session</span>
          <span className="text-xs text-slate-400">Room ID: {roomId || 'General'}</span>
        </div>
      </div>

      {/* The LiveKit Room */}
      <div className="flex-1 overflow-hidden">
        {/* We pass the roomId from the URL to your component */}
        <TelehealthRoom 
          roomId={roomId || 'default-room'} 
          onLeave={() => navigate('/dashboard')} 
        />
      </div>
    </div>
  );
}
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera, MessageCircle, Paperclip, FileText, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import apiFetch from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Helper: build websocket base from env or fallback to current origin
function getWebsocketBase() {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  try {
    if (envUrl) {
      const u = new URL(envUrl);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}`;
    }
  } catch (e) {
    // ignore
  }
  // fallback to current origin
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${loc.host}`;
}

const wsBase = getWebsocketBase();

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingCandidatesRef = useRef<Array<any>>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceConfigRef = useRef<RTCIceServer[] | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [connectionQuality, setConnectionQuality] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Excellent');
  const [isReconnecting, setIsReconnecting] = useState(false);

  // NEW: pre-call joined flag (user must click Join Consultation)
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const [role] = useState<'doctor' | 'patient'>(() => (user?.role === 'doctor' ? 'doctor' : 'patient'));

  // screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; ts: number }>>([]);
  const [chatInput, setChatInput] = useState('');

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesContent, setNotesContent] = useState<any>(null);

  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // File sharing state
  const [isUploading, setIsUploading] = useState(false);
  const [sharedFile, setSharedFile] = useState<{ url: string; name: string } | null>(null);

  const peerId = useRef<string>((() => {
    try {
      if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    } catch (e) {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
  })()).current;

  // Acquire local preview immediately for pre-call setup
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing, width: 1280, height: 720 }, audio: true });
        if (!mounted) return;
        setLocalStream(s);
        localStreamRef.current = s;
        setIsCameraActive(Boolean(s.getVideoTracks().length && s.getVideoTracks()[0].enabled));
        setIsMicActive(Boolean(s.getAudioTracks().length && s.getAudioTracks()[0].enabled));
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      } catch (err) {
        console.warn('Media access denied or not available', err);
        toast.error('Camera access denied. Please check permissions.');
      }
    };
    init();

    // fetch ICE config (best-effort). Prefer credentials endpoint with TURN support, fallback to legacy ice-servers route
    (async () => {
      try {
        let cfg = null;
        try {
          cfg = await apiFetch({ url: '/api/v1/tele/credentials', auth: false as any });
        } catch (err) {
          // try legacy route
          cfg = await apiFetch({ url: '/api/v1/tele/config/ice-servers', auth: false as any });
        }
        if (cfg && cfg.iceServers) iceConfigRef.current = cfg.iceServers;
      } catch (e) {
        console.warn('Could not load ICE servers', e);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Watch local stream tracks to update indicators
  useEffect(() => {
    if (!localStream) return;
    const onChange = () => {
      setIsCameraActive(Boolean(localStream.getVideoTracks().length && localStream.getVideoTracks()[0].enabled));
      setIsMicActive(Boolean(localStream.getAudioTracks().length && localStream.getAudioTracks()[0].enabled));
    };
    const t = setInterval(onChange, 300);
    return () => clearInterval(t);
  }, [localStream]);

  // Device change handling
  useEffect(() => {
    const handler = () => { console.log('Media devices changed'); };
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, []);

  // Build ws url for a room/peer
  const buildWsUrl = (room: string, peer: string) => `${wsBase}/ws/${encodeURIComponent(room)}/${encodeURIComponent(peer)}`;

  const roomId = useRef<string>((() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) return r;
      if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    } catch (e) {
      return 'global';
    }
  })()).current;

  // WebSocket connect/disconnect
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) return;
    const wsUrl = buildWsUrl(roomId, peerId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] connected to', wsUrl);
      try {
        ws.send(JSON.stringify({ type: 'announce', role, peerId, name: (user as any)?.full_name || user?.email }));
      } catch (e) {}

      // start heartbeat every 30s
      try {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = window.setInterval(() => {
          try { ws.send(JSON.stringify({ type: 'ping' })); } catch (e) {}
        }, 30000);
      } catch (e) { console.warn('heartbeat setup failed', e); }
    };

    ws.onmessage = async (ev: any) => {
      try {
        const msg = JSON.parse(ev.data);
        const type = msg?.type;
        const from = msg?.from;
        const payload = msg?.payload ?? msg?.data ?? null;
        // handle file-share
        if (type === 'file-share') {
          try {
            const fileUrl = msg.fileUrl || msg.fileURL || payload?.fileUrl;
            const fileName = msg.fileName || payload?.fileName || 'file';
            if (fileUrl) {
              setSharedFile({ url: fileUrl, name: fileName });
              toast.success(`File received: ${fileName}`);
            }
          } catch (e) { console.warn('file-share handling failed', e); }
          return;
        }
        // handle chat
        if (type === 'chat') {
          setChatMessages(prev => [...prev, { sender: msg.sender || 'Peer', text: msg.text || '', ts: Date.now() }]);
          return;
        }

        if (type === 'join_request') {
          if (role === 'doctor') {
            setIncomingRequests(prev => [...prev.filter(r => r.peerId !== from), { peerId: from, name: msg?.name, intake: msg?.intake }]);
            toast(`${msg?.name || 'Patient'} is knocking`, { duration: 4000 });
          }
          return;
        }

        if (type === 'connection_granted') {
          if (role === 'patient') {
            setIsWaiting(false);
            setJoining(true);
            try { await startCall(); } catch (e) { console.warn(e); }
          }
          return;
        }

        if (type === 'connection_rejected') {
          if (role === 'patient') {
            setIsWaiting(false);
            setJoining(false);
            toast.error('Doctor denied the request');
            try { wsRef.current?.close(); } catch (e) {}
          }
          return;
        }

        if (type === 'candidate') {
          const cand = payload;
          const pc = pcRef.current;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try { await pc.addIceCandidate(cand); } catch (e) { console.warn('addIceCandidate failed', e); }
          } else {
            pendingCandidatesRef.current.push(cand);
          }
          return;
        }

        if (type === 'offer') {
          await createPeerConnection();
          const pc = pcRef.current;
          try { await pc.setRemoteDescription(payload); } catch (e) { console.warn('setRemoteDescription (offer) failed', e); return; }
          try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsRef.current?.send(JSON.stringify({ type: 'answer', to: from, payload: pc.localDescription }));
            while (pendingCandidatesRef.current.length) {
              const c = pendingCandidatesRef.current.shift();
              try { await pc.addIceCandidate(c); } catch (e) { console.warn('flushing candidate failed', e); }
            }
          } catch (e) { console.warn('Failed creating/sending answer', e); }
          return;
        }

        if (type === 'answer') {
          const pc = pcRef.current;
          if (!pc) return;
          try {
            await pc.setRemoteDescription(payload);
            while (pendingCandidatesRef.current.length) {
              const c = pendingCandidatesRef.current.shift();
              try { await pc.addIceCandidate(c); } catch (e) { console.warn('flushing candidate failed', e); }
            }
          } catch (e) { console.warn('setRemoteDescription (answer) failed', e); }
          return;
        }

        if (type === 'peer-joined') { console.log('[WS] peer joined', msg?.peer ?? from); }
        if (type === 'peer-left') { console.log('[WS] peer left', msg?.peer ?? from); }
      } catch (e) { console.warn('Failed handling incoming signal', e); }
    };

    ws.onclose = () => {
      console.log('[WS] connection closed');
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    };

    ws.onerror = (e) => { console.warn('[WS] error', e); };

    return ws;
  }, [roomId, peerId, role, user]);

  const disconnectWebSocket = useCallback(() => {
    try { if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; } } catch (e) {}
    try { wsRef.current?.close(); } catch (e) {}
    wsRef.current = null;
    pendingCandidatesRef.current = [];
  }, []);

  // Attach remote stream to element
  useEffect(() => { if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream; remoteStreamRef.current = remoteStream; }, [remoteStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (e) {}
      try { remoteStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (e) {}
      try { pcRef.current?.close(); } catch (e) {}
      try { disconnectWebSocket(); } catch (e) {}
      localStreamRef.current = null; remoteStreamRef.current = null;
    };
  }, [disconnectWebSocket]);

  // Toggle mute/video for preview and during call
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try { localStream?.getAudioTracks().forEach(t => (t.enabled = !next)); setIsMicActive(!next); } catch (e) { console.warn(e); }
      return next;
    });
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(v => {
      const next = !v;
      try { localStream?.getVideoTracks().forEach(t => (t.enabled = next)); setIsCameraActive(next); } catch (e) { console.warn(e); }
      return next;
    });
  }, [localStream]);

  const endCall = useCallback(() => {
    setCallStatus('ended');
    try { localStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
    try { remoteStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
    try { pcRef.current?.close(); } catch (e) {}
    try { disconnectWebSocket(); } catch (e) {}
    pcRef.current = null;
    setIsJoined(false);
    setJoining(false);
    toast.success('Call ended');
    navigate('/dashboard');
  }, [disconnectWebSocket, localStream, remoteStream, navigate]);

  // Create peer connection
  const createPeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current;
    const servers = { iceServers: iceConfigRef.current || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ] };
    const pc = new RTCPeerConnection(servers as any);
    pcRef.current = pc;

    // Add local tracks
    try {
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) pc.addTrack(track, localStreamRef.current);
      }
    } catch (e) { console.warn('Failed to add local tracks', e); }

    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (ev: any) => {
      try {
        const s = ev.streams?.[0] || new MediaStream([ev.track]);
        if (s) {
          setRemoteStreams(prev => {
            if (!s.id) return prev;
            const exists = prev.find(r => r.id === s.id);
            if (exists) return prev;
            return [...prev, s];
          });
        }
      } catch (e) {
        if (ev.track) {
          const s = new MediaStream([ev.track]);
          setRemoteStreams(prev => {
            if (!s.id) return prev;
            const exists = prev.find(r => r.id === s.id);
            if (exists) return prev;
            return [...prev, s];
          });
        }
      }
    };

    pc.onicecandidate = (ev: any) => {
      if (ev.candidate) {
        try { wsRef.current?.send(JSON.stringify({ type: 'candidate', payload: ev.candidate })); } catch (e) { console.warn('Failed to send candidate', e); }
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') { setCallStatus('connected'); setIsReconnecting(false); }
      if (s === 'connected') { setIsJoined(true); setJoining(false); }
      if (s === 'disconnected' || s === 'failed') { setIsReconnecting(true); setJoining(false); setIsJoined(false); }
    };

    return pc;
  }, []);

  // Start a call as caller (create offer)
  const startCall = useCallback(async () => {
    if (!localStreamRef.current) { setJoining(false); toast.error('No local media available'); return; }
    await createPeerConnection();
    const pc = pcRef.current;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      try { wsRef.current?.send(JSON.stringify({ type: 'offer', payload: pc.localDescription })); } catch (e) { console.warn('Failed to send offer', e); }
    } catch (e) { console.warn('Failed to create offer', e); setJoining(false); toast.error('Failed to create offer'); }
  }, [createPeerConnection]);

  // Patient flow: request to join
  const requestJoin = useCallback(async () => {
    try {
      const intake = sessionStorage.getItem('intake_transcript') || undefined;
      wsRef.current?.send(JSON.stringify({ type: 'join_request', from: peerId, name: (user as any)?.full_name || user?.email, intake }));
      setIsWaiting(true);
      setJoining(true);
    } catch (e) { toast.error('Failed to send join request'); }
  }, [peerId, user]);

  // Join button handler: mark isJoined and open socket + begin flow
  const handleJoin = useCallback(async () => {
    setIsJoined(true);
    setJoining(true);
    connectWebSocket();
    if (role === 'patient') {
      setTimeout(() => { try { const intake = sessionStorage.getItem('intake_transcript') || undefined; wsRef.current?.send(JSON.stringify({ type: 'join_request', from: peerId, name: (user as any)?.full_name || user?.email, intake })); setIsWaiting(true); } catch (e) { console.warn(e); } }, 500);
    } else {
      setTimeout(async () => { try { setJoining(true); await startCall(); } catch (e) { console.warn(e); } }, 600);
    }
  }, [connectWebSocket, peerId, role, startCall, user]);

  // Flip camera
  const flipCamera = async () => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next, width: 1280, height: 720 }, audio: true });
      try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (e) {}
      setLocalStream(s); localStreamRef.current = s; if (localVideoRef.current) localVideoRef.current.srcObject = s;
      const pc = pcRef.current;
      if (pc) {
        const senders = pc.getSenders();
        const audioTrack = s.getAudioTracks()[0];
        const videoTrack = s.getVideoTracks()[0];
        for (const sender of senders) {
          try {
            if (sender.track?.kind === 'video' && videoTrack) await sender.replaceTrack(videoTrack);
            if (sender.track?.kind === 'audio' && audioTrack) await sender.replaceTrack(audioTrack);
          } catch (e) { console.warn('replaceTrack failed', e); }
        }
      }
      setCameraFacing(next);
    } catch (e) { console.warn('flipCamera failed', e); toast.error('Unable to access alternate camera'); }
  };

  // Screen sharing logic
  const startScreenShare = async () => {
    if (isScreenSharing) return stopScreenShare();
    try {
      const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      // replace sender track in pc
      const pc = pcRef.current;
      if (pc && screenTrack) {
        const senders = pc.getSenders();
        for (const sender of senders) {
          if (sender.track?.kind === 'video') {
            try { await sender.replaceTrack(screenTrack); } catch (e) { console.warn('replaceTrack for screen failed', e); }
          }
        }
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.warn('Screen share failed', e);
      toast.error('Unable to start screen sharing');
    }
  };

  const stopScreenShare = async () => {
    try {
      const pc = pcRef.current;
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (pc && videoTrack) {
        const senders = pc.getSenders();
        for (const sender of senders) {
          if (sender.track?.kind === 'video') {
            try { await sender.replaceTrack(videoTrack); } catch (e) { console.warn('replaceTrack revert failed', e); }
          }
        }
      }
      if (screenTrackRef.current) {
        try { screenTrackRef.current.stop(); } catch (e) {}
        screenTrackRef.current = null;
      }
    } catch (e) { console.warn(e); }
    setIsScreenSharing(false);
  };

  // Chat send
  const sendChat = () => {
    if (!chatInput?.trim()) return;
    const msg = { type: 'chat', text: chatInput.trim(), sender: (user as any)?.full_name || user?.email };
    try { wsRef.current?.send(JSON.stringify(msg)); } catch (e) { console.warn('Failed to send chat', e); }
    setChatMessages(prev => [...prev, { sender: msg.sender, text: msg.text, ts: Date.now() }]);
    setChatInput('');
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const userId = (user as any)?.id || (user as any)?.sub || (user as any)?.email || 'anonymous';
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Ask backend to sign the URL so the action is audited
      const res = await apiFetch({
        url: '/files/sign-url',
        method: 'POST',
        data: { file_path: filePath, bucket: 'chat-files' },
        auth: true as any,
      });
      // Expect canonical backend response shape: { data: { signedURL: '...' }, error: null }
      const r = res as any;
      const signedUrl = r?.data?.signedURL || r?.data?.signed_url || r?.data?.signedUrl || r?.signedUrl || r?.signedURL || r?.signed_url;
      if (!signedUrl) throw new Error('Failed to obtain signed URL');

      if (wsRef.current && signedUrl) {
        wsRef.current.send(JSON.stringify({
          type: 'file-share',
          fileUrl: signedUrl,
          fileName: file.name,
        }));
        setSharedFile({ url: signedUrl, name: file.name });
        toast.success('File Sent');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload Failed');
    } finally {
      setIsUploading(false);
      // clear input value to allow re-uploading same file
      try { (e.target as HTMLInputElement).value = ''; } catch (e) {}
    }
  };

  // copy invite
  function copyInvite(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast.success('Room link copied!')).catch(() => { navigator.clipboard.writeText(url); toast.success('Room link copied!'); });
    } else { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('Room link copied!'); }
  }

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if (e.key === 'v' || e.key === 'V') toggleVideo();
      if (e.code === 'Space') { e.preventDefault(); toggleMute(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute, toggleVideo]);

  // Incoming requests state (doctor)
  const [incomingRequests, setIncomingRequests] = useState<Array<{ peerId: string; name?: string; intake?: string }>>([]);

  // Attach remote stream when available
  useEffect(() => { if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream; remoteStreamRef.current = remoteStream; }, [remoteStream]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black/80 via-transparent to-black/80 text-white">
      <div className="relative h-screen flex flex-col">
        <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
          <div className="ml-2 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-md">
            <span className="text-sm font-medium">Room:</span>
            <span className="text-sm font-mono truncate max-w-[12rem]">{roomId}</span>
            <button onClick={copyInvite} title="Copy invite link" className="ml-2 p-1 bg-white/8 rounded-md hover:bg-white/12">Copy</button>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-bold ${connectionQuality==='Excellent'?'bg-green-600':'bg-yellow-500'} ${connectionQuality==='Fair'?'bg-orange-500':''} ${connectionQuality==='Poor'?'bg-red-600':''}`}>{connectionQuality}</div>
          <button onClick={() => setChatOpen(c => !c)} className="ml-2 p-2 rounded-md bg-white/6">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Main area */}
        <div className="flex-1 relative p-4">
          {/* Render one or many remote video streams. Use a responsive grid for multi-party calls. */}
          {remoteStreams.length > 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full h-full">
              {remoteStreams.map((s, idx) => (
                <video
                  key={s.id || idx}
                  autoPlay
                  playsInline
                  className="w-full h-56 md:h-80 object-cover rounded-xl bg-black"
                  ref={(el) => { if (el) el.srcObject = s; }}
                />
              ))}
            </div>
          ) : (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl bg-black" />
          )}

          {/* Waiting overlay */}
          {isWaiting && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/70 z-40">
              <div className="text-center max-w-md p-6 bg-white/6 rounded-lg">
                <div className="text-2xl font-semibold mb-2">Waiting for the doctor to admit you...</div>
                <div className="text-sm text-gray-300">You've been placed in the waiting room. The doctor will admit or deny your request.</div>
              </div>
            </div>
          )}

          {/* Shared file preview (polished) */}
          {sharedFile && (
            <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-indigo-100 z-50 max-w-sm animate-in slide-in-from-right-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm truncate w-48">{sharedFile.name}</h4>
                  <p className="text-xs text-indigo-500 font-medium">Shared by Doctor</p>
                </div>
                <button onClick={() => setSharedFile(null)} className="text-gray-400 hover:text-red-500">
                  <X className="h-5 w-5"/>
                </button>
              </div>

              {/* Image Preview */}
              {sharedFile.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={sharedFile.url} alt="Shared" className="w-full h-32 object-cover rounded-md mb-3 border" />
              ) : (
                <div className="w-full h-24 bg-gray-50 rounded-md flex items-center justify-center mb-3 border border-dashed">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
              )}

              <a 
                href={sharedFile.url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors font-semibold"
              >
                Open Document <ArrowUpRight className="ml-2 h-4 w-4"/>
              </a>
            </div>
          )}

          {/* Doctor: incoming knocks list */}
          {role === 'doctor' && incomingRequests.length > 0 && (
            <div className="absolute top-24 right-4 z-50 w-80 p-2 space-y-2">
              {incomingRequests.map(req => (
                <div key={req.peerId} className="bg-white/6 p-3 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{req.name || 'Patient'}</div>
                      <div className="text-xs text-gray-300">Wants to join</div>
                      {req.intake && (
                        <div className="mt-2 text-xs text-gray-200 bg-black/10 p-2 rounded">{String(req.intake).slice(0, 160)}{String(req.intake).length > 160 ? '...' : ''}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { try { wsRef.current?.send(JSON.stringify({ type: 'approve_join', target: req.peerId, from: peerId })); } catch (e) {} setIncomingRequests(prev => prev.filter(p => p.peerId !== req.peerId)); }} className="px-2 py-1 bg-green-600 rounded-md">Accept</button>
                      <button onClick={() => { try { wsRef.current?.send(JSON.stringify({ type: 'reject_join', target: req.peerId, from: peerId })); } catch (e) {} setIncomingRequests(prev => prev.filter(p => p.peerId !== req.peerId)); }} className="px-2 py-1 bg-red-600 rounded-md">Deny</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reconnecting overlay */}
          {isReconnecting && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/60 z-30">
              <div className="text-center">
                <div className="text-2xl font-semibold">Reconnecting...</div>
                <div className="text-sm text-gray-300 mt-2">We're trying to restore the connection.</div>
              </div>
            </div>
          )}

          {/* Self view */}
          <div className="absolute top-4 right-4 md:bottom-6 md:right-6 w-36 md:w-48 h-24 md:h-36 rounded-xl overflow-hidden z-50">
            <div className={`w-full h-full bg-gray-800 rounded-xl border-2 border-white/10 overflow-hidden ${!isVideoEnabled ? 'opacity-50' : ''}`}>
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Camera className="w-6 h-6 text-white/80" />
                </div>
              )}
            </div>
          </div>

          {/* Pre-call setup overlay when not joined */}
          {!isJoined && (
            <div className="absolute inset-0 flex items-center justify-center z-40">
              <div className="bg-white/6 p-6 rounded-lg max-w-xl w-full text-center">
                <h2 className="text-xl font-semibold mb-3">Pre-call Setup</h2>
                <div className="mb-4">
                  <div className="w-full h-48 bg-black/60 rounded-md overflow-hidden">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button onClick={toggleMute} className={`px-3 py-2 rounded-md ${isMuted ? 'bg-red-600' : 'bg-black/40'}`}>{isMuted ? <MicOff /> : <Mic />}</button>
                  <button onClick={toggleVideo} className={`px-3 py-2 rounded-md ${!isVideoEnabled ? 'bg-red-600' : 'bg-black/40'}`}>{isVideoEnabled ? <Video /> : <VideoOff />}</button>
                  <button onClick={flipCamera} className="px-3 py-2 rounded-md bg-white/8">Flip</button>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={handleJoin} className="px-4 py-2 bg-green-600 rounded-md">Join Consultation</button>
                  <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-700 rounded-md">Cancel</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Control bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[90%]">
          <motion.div className="mx-auto bg-white/6 backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-full flex items-center gap-3 md:gap-4 shadow-lg justify-center" initial={{ y: 40 }} animate={{ y: 0 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute' : 'Mute'} onClick={toggleMute} className={`w-12 md:w-14 h-12 md:h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-black/40'}`}>
                  {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'} title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'} onClick={toggleVideo} className={`w-12 md:w-14 h-12 md:h-14 rounded-full flex items-center justify-center ${!isVideoEnabled ? 'bg-red-600' : 'bg-black/40'}`}>
                  {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
                </button>

                <button onClick={() => { if (!isJoined) { handleJoin(); } else { /* if joined, patient/doctor flows handled earlier */ } }} className="hidden md:inline-block px-3 py-2 rounded-full bg-green-600 text-sm font-semibold">{!isJoined ? 'Join' : (callStatus==='connected' ? 'Connected' : 'Join')}</button>

                <button onClick={isScreenSharing ? stopScreenShare : startScreenShare} className={`ml-2 px-3 py-2 rounded-full bg-white/8`}>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</button>

                <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="file-upload" className="ml-2">
                  <button title="Share file" className="px-3 py-2 rounded-full bg-white/8">
                    {isUploading ? <span className="animate-spin">⌛</span> : <Paperclip className="w-5 h-5" />}
                  </button>
                </label>

                <button onClick={() => setChatOpen(c => !c)} className="ml-2 px-3 py-2 rounded-full bg-white/8"><MessageCircle /></button>

                <motion.button onClick={endCall} whileHover={{ scale: 1.03 }} className="ml-4 md:ml-6 w-12 md:w-14 h-12 md:h-14 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold" aria-label="End call" title="End call">
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
              </div>

              {/* doctor notes */}
              {role === 'doctor' && (
                <>
                  <button onClick={async () => {
                    setNotesLoading(true);
                    try {
                      // Determine patient_id: prefer URL param, then any incoming request peerId
                      const params = new URLSearchParams(window.location.search);
                      const patientIdFromUrl = params.get('patient_id') || params.get('patient') || (incomingRequests?.[0]?.peerId) || null;

                      // Build a transcript: prefer intake stored in sessionStorage, else use recent in-call chat
                      const intake = sessionStorage.getItem('intake_transcript');
                      const chatTranscript = chatMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
                      const transcript = intake || chatTranscript || 'Patient exam transcript...';

                      const res = await apiFetch({
                        path: '/api/v1/tele/generate-notes',
                        method: 'POST',
                        body: JSON.stringify({ transcript, patient_id: patientIdFromUrl }),
                        auth: true as any
                      } as any);
                      // apiFetch may return an Axios-like response where the payload is under `data`,
                      // so normalize by checking common locations for the notes payload.
                      const notes = (res as any)?.data?.notes ?? (res as any)?.notes ?? (res as any)?.data ?? res;
                      setNotesContent(notes);
                      setNotesOpen(true);
                    }
                    catch (e: any) { toast.error(String(e?.message || e)); }
                    finally { setNotesLoading(false); }
                  }} className="ml-3 px-3 py-2 rounded-full bg-blue-600 text-white font-semibold">{notesLoading ? 'Generating...' : 'Generate Notes'}</button>

                  <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generated Notes</DialogTitle>
                        <DialogDescription>AI-generated SOAP note from the session transcript.</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 max-h-72 overflow-auto">
                        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(notesContent, null, 2)}</pre>
                      </div>
                      <DialogFooter className="mt-4">
                        <button onClick={() => setNotesOpen(false)} className="px-3 py-2 bg-gray-700 rounded-md">Close</button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Chat sidebar */}
        {chatOpen && (
          <div className="absolute right-0 top-16 h-[60vh] w-80 bg-black/80 z-50 p-3 rounded-l-md overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto space-y-2 mb-2">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`p-2 rounded-md ${m.sender === ((user as any)?.email) ? 'bg-blue-600 self-end' : 'bg-white/6 self-start'}`}>
                    <div className="text-xs text-gray-200 font-semibold">{m.sender}</div>
                    <div className="text-sm">{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 px-2 py-1 bg-white/6 rounded-md" placeholder="Message..." />
                <button onClick={sendChat} className="px-3 py-1 bg-green-600 rounded-md">Send</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VideoCallPage;
