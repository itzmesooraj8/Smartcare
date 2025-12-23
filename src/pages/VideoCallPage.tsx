
/** @jsxRuntime classic */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Wifi, Slash, X,
  Camera,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const SIGNALING_SERVER = '/'; // kept for compatibility

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
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

  // Initialize local media and attach to refs
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
        if (!mounted) return;
        console.log('[VideoCall] Acquired local media stream');
        setLocalStream(s);
        localStreamRef.current = s;
        setIsCameraActive(Boolean(s.getVideoTracks().length && s.getVideoTracks()[0].enabled));
        setIsMicActive(Boolean(s.getAudioTracks().length && s.getAudioTracks()[0].enabled));
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      } catch (err) {
        console.warn('Media access denied or not available', err);
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
    const channel = supabase.channel('room_' + roomId);
    channelRef.current = channel;

    const handler = async (payload: any) => {
      try {
        const message = payload?.payload;
        if (!message) return;
        const { type, data } = message;
        console.log('[Supabase] signal received', type, data);

        if (type === 'candidate') {
          // Queue until remote description present
          const cand = data;
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
            await pc.setRemoteDescription(data);
          } catch (e) {
            console.warn('setRemoteDescription (offer) failed', e);
            return;
          }
          try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: { type: 'answer', data: pc.localDescription } });
            // flush any pending candidates
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
            await pc.setRemoteDescription(data);
            // flush pending candidates
            while (pendingCandidatesRef.current.length) {
              const c = pendingCandidatesRef.current.shift();
              try { await pc.addIceCandidate(c); } catch (e) { console.warn('flushing candidate failed', e); }
            }
          } catch (e) {
            console.warn('setRemoteDescription (answer) failed', e);
          }
        }
      } catch (e) {
        console.warn('Failed handling incoming signal', e);
      }
    };

    channel.on('broadcast', { event: 'signal' }, handler);

    channel.subscribe().then(() => {
      console.log('[Supabase] subscribed to', 'room_' + roomId);
    }).catch((err: any) => {
      console.warn('[Supabase] subscribe error', err);
    });

    return () => {
      try { channel.unsubscribe(); } catch (e) {}
      channelRef.current = null;
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
      try { channelRef.current?.unsubscribe(); console.log('[VideoCall] unsubscribed channel'); } catch (e) {}
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
    try { pcRef.current?.close(); } catch (e) {}
    try { channelRef.current?.unsubscribe(); } catch (e) {}
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
          channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: { type: 'candidate', data: ev.candidate } });
        } catch (e) { console.warn('Failed to send candidate', e); }
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') setCallStatus('connected');
      if (s === 'disconnected' || s === 'failed') setIsReconnecting(true);
      else setIsReconnecting(false);
    };

    return pc;
  };

  // Start a call as caller (create offer)
  const startCall = async () => {
    if (!localStreamRef.current) {
      console.warn('No local stream available');
      return;
    }
    await createPeerConnection();
    const pc = pcRef.current;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // send offer
      try {
        await channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: { type: 'offer', data: pc.localDescription } });
      } catch (e) { console.warn('Failed to send offer', e); }
    } catch (e) {
      console.warn('Failed to create offer', e);
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
      }).catch((err) => {
        console.warn('[VideoCall] clipboard.writeText failed, using fallback', err);
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  }

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
            <DraggableSelfView videoRef={localVideoRef} enabled={isVideoEnabled} />
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
                onJoinCall={async () => { setJoined(true); await startCall(); }}
              />

              {!joined && (
                <button onClick={async () => { setJoined(true); await startCall(); }} className="md:hidden px-3 py-2 rounded-full bg-green-600 text-white font-semibold">
                  Join Call
                </button>
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
}> = ({ isMuted, isVideoEnabled, onToggleMute, onToggleVideo, onEndCall, onJoinCall }) => {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <button
        onClick={onJoinCall}
        className="hidden md:inline-block px-3 py-2 rounded-full bg-green-600 text-sm font-semibold hover:brightness-105"
      >
        Join Call
      </button>
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

const DraggableSelfView: React.FC<{ videoRef: React.RefObject<HTMLVideoElement>; enabled: boolean }> = ({ videoRef, enabled }) => {
  return (
    <motion.div
      drag
      dragElastic={0.2}
      className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-40 md:w-48 h-28 md:h-36 rounded-xl overflow-hidden z-50 cursor-grab touch-none"
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className={`w-full h-full bg-gray-800 rounded-xl border-2 border-white/10 overflow-hidden ${!enabled ? 'opacity-50' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {!enabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Camera className="w-6 h-6 text-white/80" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
