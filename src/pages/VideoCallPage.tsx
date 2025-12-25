
/** @jsxRuntime classic */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Wifi, Slash, X,
  Camera,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Signaling now uses the Render-hosted backend WebSocket endpoint
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

const SIGNALING_SERVER = '/'; // kept for compatibility

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

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [connectionQuality, setConnectionQuality] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Excellent');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  const peerId = useRef<string>(() => {
    try {
      if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    } catch (e) {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
  }).current;

  // Initialize local media and attach to refs
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing, width: 1280, height: 720 }, audio: true });
        if (!mounted) return;
        console.log('[VideoCall] Acquired local media stream');
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
    const handler = () => {
      console.log('Media devices changed');
      // Could re-enumerate devices and prompt user
    };
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, []);

  // Setup Supabase channel and signaling handler
  const [roomId, setRoomId] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) return r;
      // generate UUID
      if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    } catch (e) {
      return 'global';
    }
  });

  useEffect(() => {
    const wsUrl = `wss://smartcare-zflo.onrender.com/ws/${encodeURIComponent(roomId)}/${encodeURIComponent(peerId)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] connected to', wsUrl);
    };

    ws.onmessage = async (ev: any) => {
      try {
        const msg = JSON.parse(ev.data);
        const type = msg?.type;
        const from = msg?.from;
        const payload = msg?.payload ?? msg?.data ?? null;
        console.log('[WS] signal received', type, payload, 'from', from);

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
          // act as callee
          await createPeerConnection();
          const pc = pcRef.current;
          try {
            await pc.setRemoteDescription(payload);
          } catch (e) {
            console.warn('setRemoteDescription (offer) failed', e);
            return;
          }
          try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsRef.current?.send(JSON.stringify({ type: 'answer', to: from, payload: pc.localDescription }));
            // flush pending candidates
            while (pendingCandidatesRef.current.length) {
              const c = pendingCandidatesRef.current.shift();
              try { await pc.addIceCandidate(c); } catch (e) { console.warn('flushing candidate failed', e); }
            }
          } catch (e) {
            console.warn('Failed creating/sending answer', e);
          }
        } else if (type === 'answer') {
          const pc = pcRef.current;
          if (!pc) return;
          try {
            await pc.setRemoteDescription(payload);
            // flush pending candidates
            while (pendingCandidatesRef.current.length) {
              const c = pendingCandidatesRef.current.shift();
              try { await pc.addIceCandidate(c); } catch (e) { console.warn('flushing candidate failed', e); }
            }
          } catch (e) {
            console.warn('setRemoteDescription (answer) failed', e);
          }
        } else if (type === 'peer-joined') {
          // optional: notify UI
          console.log('[WS] peer joined', msg?.peer ?? from);
        } else if (type === 'peer-left') {
          console.log('[WS] peer left', msg?.peer ?? from);
        }
      } catch (e) {
        console.warn('Failed handling incoming signal', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS] connection closed');
    };

    ws.onerror = (e) => {
      console.warn('[WS] error', e);
    };

    return () => {
      try { ws.close(); } catch (e) {}
      wsRef.current = null;
      pendingCandidatesRef.current = [];
    };
  }, [roomId]);

  // Attach remote stream to element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  // Ensure we clean up media, peers and sockets when leaving the page
  useEffect(() => {
    return () => {
      console.log('[VideoCall] cleaning up on unmount — stopping media and connections');
      try { localStreamRef.current?.getTracks().forEach(t => { t.stop(); console.log('[VideoCall] stopped local track', t.kind); }); } catch (e) {}
      try { remoteStreamRef.current?.getTracks().forEach(t => { t.stop(); console.log('[VideoCall] stopped remote track', t.kind); }); } catch (e) {}
      try { pcRef.current?.close(); console.log('[VideoCall] closed RTCPeerConnection'); } catch (e) {}
      try { wsRef.current?.close(); console.log('[VideoCall] closed signaling socket'); } catch (e) {}
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      setIsCameraActive(false);
      setIsMicActive(false);
    };
  }, []);

  // Stop media when call ends (defensive)
  useEffect(() => {
    if (callStatus === 'ended') {
      console.log('[VideoCall] call ended — stopping media tracks');
      try { localStreamRef.current?.getTracks().forEach(t => { t.stop(); console.log('[VideoCall] stopped local track on end', t.kind); }); } catch (e) {}
      try { remoteStreamRef.current?.getTracks().forEach(t => { t.stop(); console.log('[VideoCall] stopped remote track on end', t.kind); }); } catch (e) {}
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      setIsCameraActive(false);
      setIsMicActive(false);
    }
  }, [callStatus]);

  const toggleMute = useCallback(() => {
    // Optimistic UI: update immediately
    setIsMuted(prev => {
      const next = !prev;
      // apply to tracks (best effort)
      try {
        localStream?.getAudioTracks().forEach(t => (t.enabled = !next));
        console.log('[VideoCall] toggled mute ->', next ? 'muted' : 'unmuted');
        setIsMicActive(!next);
      } catch (e) {
        console.warn('Failed to toggle hardware mute quickly', e);
      }
      return next;
    });
  }, [localStream]);

  const toggleVideo = useCallback(async () => {
    setIsVideoEnabled(v => {
      const next = !v;
      try {
        localStream?.getVideoTracks().forEach(t => (t.enabled = next));
        console.log('[VideoCall] toggled video ->', next ? 'video-on' : 'video-off');
        setIsCameraActive(next);
      } catch (e) {}
      return next;
    });
  }, [localStream]);

  const endCall = () => {
    setCallStatus('ended');
    // cleanup
    try { localStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
    try { remoteStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
    try { pcRef.current?.close(); } catch (e) {}
    try { wsRef.current?.close(); } catch (e) {}
    pcRef.current = null;
    setJoined(false);
    setJoining(false);
    toast.success('Call ended');
    // Redirect to role-based dashboard route
    navigate('/dashboard');
  };

  // Create RTCPeerConnection and wire tracks/ICE/remote track handling
  const createPeerConnection = async () => {
    if (pcRef.current) return pcRef.current;
    const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(servers as any);
    pcRef.current = pc;

    // Add local tracks
    try {
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }
    } catch (e) {
      console.warn('Failed to add local tracks', e);
    }

    // Remote stream handling
    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (ev: any) => {
      try {
        ev.streams?.[0]?.getTracks().forEach((t: MediaStreamTrack) => remote.addTrack(t));
      } catch (e) {
        // fallback: add individual track
        if (ev.track) remote.addTrack(ev.track);
      }
    };

    pc.onicecandidate = (ev: any) => {
      if (ev.candidate) {
        try {
          wsRef.current?.send(JSON.stringify({ type: 'candidate', payload: ev.candidate }));
        } catch (e) { console.warn('Failed to send candidate', e); }
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') setCallStatus('connected');
      if (s === 'connected') {
        setJoined(true);
        setJoining(false);
      }
      if (s === 'disconnected' || s === 'failed') {
        setIsReconnecting(true);
        setJoining(false);
        setJoined(false);
      } else setIsReconnecting(false);
    };

    return pc;
  };

  // Start a call as caller (create offer)
  const startCall = async () => {
    if (!localStreamRef.current) {
      console.warn('No local stream available');
      setJoining(false);
      toast.error('No local media available');
      return;
    }
    await createPeerConnection();
    const pc = pcRef.current;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // send offer via WebSocket
      try {
        wsRef.current?.send(JSON.stringify({ type: 'offer', payload: pc.localDescription }));
      } catch (e) { console.warn('Failed to send offer', e); }
    } catch (e) {
      console.warn('Failed to create offer', e);
      setJoining(false);
      toast.error('Failed to create offer');
    }
  };

  // Keyboard shortcuts
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
  function copyInvite(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;

    const fallbackCopy = (text: string) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); console.log('[VideoCall] invite copied (fallback)'); }
      catch (e) { console.warn('[VideoCall] fallback copy failed', e); }
      document.body.removeChild(ta);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        console.log('[VideoCall] invite copied to clipboard');
        toast.success('Room link copied!');
      }).catch((err) => {
        console.warn('[VideoCall] clipboard.writeText failed, using fallback', err);
        fallbackCopy(url);
        toast.success('Room link copied!');
      });
    } else {
      fallbackCopy(url);
      toast.success('Room link copied!');
    }
  }

  // Flip camera (user <-> environment). Re-acquire stream and replace senders.
  const flipCamera = async () => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next, width: 1280, height: 720 }, audio: true });
      // stop old tracks
      try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (e) {}
      setLocalStream(s);
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      // replace tracks on existing peer connection
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
    } catch (e) {
      console.warn('flipCamera failed', e);
      toast.error('Unable to access alternate camera');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black/80 via-transparent to-black/80 text-white">
      <div className="relative h-screen flex flex-col">
        {/* Camera/Mic active indicator (top-left) */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${isCameraActive ? 'bg-green-600 text-white' : 'bg-black/40 text-white/80'}`} aria-live="polite">
                  <Camera className="w-4 h-4" />
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${isMicActive ? 'bg-green-600 text-white' : 'bg-black/40 text-white/80'}`} aria-live="polite">
                  <Mic className="w-4 h-4" />
                </div>
              </div>

              <div className="ml-2 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-md">
                <span className="text-sm font-medium">Room:</span>
                <span className="text-sm font-mono truncate max-w-[12rem]">{roomId}</span>
                <button onClick={copyInvite} title="Copy invite link" className="ml-2 p-1 bg-white/8 rounded-md hover:bg-white/12">
                  Copy
                </button>
              </div>
            </div>
        {/* Network indicator */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-bold ${connectionQuality==='Excellent'?'bg-green-600':'bg-yellow-500'} ${connectionQuality==='Fair'?'bg-orange-500':''} ${connectionQuality==='Poor'?'bg-red-600':''}`}>{connectionQuality}</div>
        </div>

        {/* Main video */}
        <div className="flex-1 relative p-4">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl bg-black" />

          {/* Reconnecting overlay */}
          {isReconnecting && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/60 z-30">
              <div className="text-center">
                <div className="text-2xl font-semibold">Reconnecting...</div>
                <div className="text-sm text-gray-300 mt-2">We're trying to restore the connection.</div>
              </div>
            </div>
          )}

            {/* Draggable self view */}
            <DraggableSelfView videoRef={localVideoRef} enabled={isVideoEnabled} onFlip={flipCamera} />
        </div>

        {/* Command center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[90%]">
          <motion.div className="mx-auto bg-white/6 backdrop-blur-md px-3 md:px-4 py-2 md:py-3 rounded-full flex items-center gap-3 md:gap-4 shadow-lg justify-center" initial={{ y: 40 }} animate={{ y: 0 }}>
            <div className="flex items-center gap-3">
              <VideoControls
                isMuted={isMuted}
                isVideoEnabled={isVideoEnabled}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onEndCall={endCall}
                onJoinCall={async () => { setJoining(true); await startCall(); }}
                joining={joining}
                joined={joined}
              />

              {!joined && (
                <>
                  {!joining ? (
                    <button onClick={async () => { setJoining(true); await startCall(); }} className="md:hidden px-3 py-2 rounded-full bg-green-600 text-white font-semibold">
                      Join Call
                    </button>
                  ) : (
                    <div className="md:hidden px-3 py-2 rounded-full bg-yellow-500 text-white font-semibold flex items-center gap-2">
                      <LoadingSpinner />
                      <span>Connecting...</span>
                    </div>
                  )}
                </>
              )}
              {joined && (
                <div className="px-3 py-2 rounded-full bg-green-700 text-white font-semibold">Connected</div>
              )}
            </div>

            {/* layoutId for join transition (shared with WaitingRoom) */}
            <motion.div layoutId="joinButton" className="hidden" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;

// Internal subcomponents required by spec
const VideoControls: React.FC<{
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onJoinCall: () => void;
  joining?: boolean;
  joined?: boolean;
}> = ({ isMuted, isVideoEnabled, onToggleMute, onToggleVideo, onEndCall, onJoinCall, joining, joined }) => {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      {!joined && (
        <>
          {!joining ? (
            <button
              onClick={onJoinCall}
              className="hidden md:inline-block px-3 py-2 rounded-full bg-green-600 text-sm font-semibold hover:brightness-105"
            >
              Join Call
            </button>
          ) : (
            <div className="hidden md:inline-flex px-3 py-2 rounded-full bg-yellow-500 text-white font-semibold items-center gap-2">
              <LoadingSpinner />
              <span>Connecting...</span>
            </div>
          )}
        </>
      )}
      <button
        aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        onClick={onToggleMute}
        className={`w-12 md:w-14 h-12 md:h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-black/40'} hover:scale-105 focus:outline-none`}
      >
        {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
      </button>

      <button
        aria-label={isVideoEnabled ? 'Turn off camera (V)' : 'Turn on camera (V)'}
        title={isVideoEnabled ? 'Turn off camera (V)' : 'Turn on camera (V)'}
        onClick={onToggleVideo}
        className={`w-12 md:w-14 h-12 md:h-14 rounded-full flex items-center justify-center ${!isVideoEnabled ? 'bg-red-600' : 'bg-black/40'} hover:scale-105 focus:outline-none`}
      >
        {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
      </button>

      <motion.button
        onClick={onEndCall}
        whileHover={{ scale: 1.03 }}
        className="ml-4 md:ml-6 w-12 md:w-14 h-12 md:h-14 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold"
        aria-label="End call"
        title="End call"
      >
        <PhoneOff className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

const DraggableSelfView: React.FC<{ videoRef: React.RefObject<HTMLVideoElement>; enabled: boolean; onFlip?: () => void }> = ({ videoRef, enabled, onFlip }) => {
  return (
    <motion.div
      drag
      dragElastic={0.2}
      className="absolute top-4 right-4 md:bottom-6 md:right-6 w-36 md:w-48 h-24 md:h-36 rounded-xl overflow-hidden z-50 cursor-grab touch-none"
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className={`w-full h-full bg-gray-800 rounded-xl border-2 border-white/10 overflow-hidden ${!enabled ? 'opacity-50' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {!enabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Camera className="w-6 h-6 text-white/80" />
          </div>
        )}
        <div className="absolute top-2 right-2 z-60 flex items-center gap-2">
          {onFlip && (
            <button onClick={onFlip} title="Flip camera" className="bg-white/8 text-white p-1 rounded-md hover:bg-white/12">
              Flip
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
