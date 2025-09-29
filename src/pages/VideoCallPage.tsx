
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}
import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  MessageSquare, Users, Settings, Monitor, MoreVertical,
  Maximize2, Minimize2, Camera, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '../components/ui/card'; // Adjust the path as needed
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

const VideoCallPage = () => {
  // Place all logic, hooks, handlers, and JSX here
  // ...existing code from lines 19 to 423...
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // State and hooks
  const [showTestModal, setShowTestModal] = useState(true);
  const [notes, setNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'Excellent'|'Good'|'Fair'|'Poor'>('Excellent');
  const [raiseHand, setRaiseHand] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participantName] = useState(user?.role === 'doctor' ? 'John Doe' : 'Dr. Sarah Johnson');

  // Effects
  useEffect(() => {
    // Simulate connection after 2 seconds
    const connectionTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    // Start call duration timer
    const durationInterval = setInterval(() => {
      if (callStatus === 'connected') {
        setCallDuration(prev => prev + 1);
      }
    }, 1000);

    // Initialize mock video stream
    initializeVideoStream();

    return () => {
      clearTimeout(connectionTimer);
      clearInterval(durationInterval);
      cleanupMediaStream();
    };
  }, [callStatus]);

  // Handlers
  const toggleFullScreen = () => setIsFullScreen(f => !f);
  const toggleScreenShare = () => setIsScreenSharing(f => !f);
  const endCall = () => setCallStatus('ended');
  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        id: Date.now().toString(),
        sender: user?.name || 'You',
        message: newMessage,
        timestamp: new Date()
      }]);
      setNewMessage('');
    }
  };
  const toggleAudio = () => setIsAudioEnabled(a => !a);
  const toggleVideo = () => setIsVideoEnabled(v => !v);

  // Media stream functions
  const cleanupMediaStream = () => {
    // Cleanup media streams
  };
  const initializeVideoStream = async () => {
    try {
      if (localVideoRef.current) {
        localVideoRef.current.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };




  // Handler for downloading summary
  const handleDownloadSummary = () => {
    const blob = new Blob([`Consultation Notes:\n${notes}`], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consultation_summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore main UI return
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="relative h-screen flex flex-col">
          {/* Doctor Profile Sidebar */}
          <aside className="hidden md:flex flex-col w-80 bg-gray-800 border-r border-gray-700 p-6 justify-center items-center absolute left-0 top-0 bottom-0 z-30">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-xl font-bold mb-1">{participantName}</div>
            <div className="text-sm text-gray-400 mb-2">Cardiology</div>
            <div className="text-xs text-gray-400">Experience: 10+ years</div>
            <div className="text-xs text-gray-400">Rating: ★★★★☆</div>
          </aside>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-gray-900 to-transparent p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{participantName}</h2>
                  <p className="text-sm text-gray-400">
                    {callStatus === 'connecting' ? 'Connecting...' : callStatus === 'connected' ? formatDuration(callDuration) : 'Call Ended'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${connectionQuality==='Excellent'?'bg-green-600':'bg-yellow-500'} ${connectionQuality==='Fair'?'bg-orange-500':''} ${connectionQuality==='Poor'?'bg-red-600':''}`}>{connectionQuality}</span>
                <span className="ml-2">Connection</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullScreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="w-4 h-4 mr-2" />
                      Participants
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Audio Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          {/* Video Grid */}
          <div className="flex-1 relative p-4">
            {/* Notes Section */}
            <div className="absolute left-4 bottom-4 w-64 bg-gray-800 rounded-lg shadow-lg p-3 hidden md:block">
              <div className="font-semibold mb-2">Your Notes</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full h-24 bg-gray-700 text-white rounded p-2 resize-none" placeholder="Jot down notes here..." />
            </div>
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover rounded-lg"
              autoPlay
              playsInline
            />
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-64 h-48">
              <video
                ref={localVideoRef}
                className={`w-full h-full object-cover rounded-lg border-2 border-gray-700 ${!isVideoEnabled ? 'opacity-50' : ''}`}
                autoPlay
                playsInline
                muted
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 rounded-lg">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            {/* Connection Status */}
            {callStatus === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg">Connecting to consultation...</p>
                  <p className="text-sm text-gray-400 mt-2">Please wait while we establish a secure connection</p>
                </div>
              </div>
            )}
            {callStatus === 'ended' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 rounded-lg">
                <div className="text-center">
                  <PhoneOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-lg">Call Ended</p>
                  <p className="text-sm text-gray-400 mt-2">Duration: {formatDuration(callDuration)}</p>
                  <Button className="mt-4" onClick={()=>setShowSummary(true)}>View Summary</Button>
                </div>
              </div>
            )}
          </div>
          {/* Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-gray-900 to-transparent p-6">
            <div className="flex justify-center items-center gap-4">
              <Button
                variant={raiseHand ? 'secondary' : 'outline'}
                size="lg"
                onClick={()=>setRaiseHand(!raiseHand)}
                className="rounded-full w-14 h-14"
              >
                <span role="img" aria-label="Raise Hand">✋</span>
              </Button>
              <Button
                variant={isAudioEnabled ? 'secondary' : 'destructive'}
                size="lg"
                onClick={toggleAudio}
                className="rounded-full w-14 h-14"
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>
              <Button
                variant={isVideoEnabled ? 'secondary' : 'destructive'}
                size="lg"
                onClick={toggleVideo}
                className="rounded-full w-14 h-14"
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
              <Button
                variant={isScreenSharing ? 'secondary' : 'outline'}
                size="lg"
                onClick={toggleScreenShare}
                className="rounded-full w-14 h-14"
              >
                <Monitor className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowChat(!showChat)}
                className="rounded-full w-14 h-14 relative"
              >
                <MessageSquare className="w-6 h-6" />
                {chatMessages.length > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full w-14 h-14 ml-8"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
          {/* Chat Panel */}
          {showChat && (
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 z-30">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Chat</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowChat(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === user?.name ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender === user?.name ? 'bg-primary text-white' : 'bg-gray-700'}`}>
                          <p className="text-xs font-semibold mb-1">{msg.sender}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input type="file" multiple className="hidden" id="file-upload" onChange={e=>{
                      if(e.target.files) setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
                    }} />
                    <Button variant="outline" onClick={()=>document.getElementById('file-upload')?.click()}>Upload File</Button>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="text-xs text-gray-400">📄 {file.name}</div>
                    ))}
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 border-gray-600"
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default VideoCallPage;
