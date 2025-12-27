import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, VideoOff } from 'lucide-react';

export default function TelehealthRoom({ roomId, onLeave }: { roomId: string; onLeave?: () => void }) {
  const { token: authToken } = useAuth();
  const [videoToken, setVideoToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId || !authToken) return;

    fetch(`/api/v1/video/token/${roomId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch video token');
        return res.json();
      })
      .then(data => {
        setVideoToken(data.token);
        setServerUrl(data.url);
      })
      .catch(e => {
        console.error(e);
        setError('Could not connect to secure video server.');
      });
  }, [roomId, authToken]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <VideoOff className="w-12 h-12 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!videoToken) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4 bg-slate-900 text-white rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-slate-300">Establishing Secure Line...</p>
      </div>
    );
  }

  return (
    <div className="h-[80vh] w-full rounded-xl overflow-hidden border shadow-2xl bg-black">
      <LiveKitRoom
        video={true}
        audio={true}
        token={videoToken}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '100%' }}
        onDisconnected={onLeave}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
