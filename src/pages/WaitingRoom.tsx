/** @jsxRuntime classic */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, ArrowLeft } from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { useNavigate } from 'react-router-dom';

/** Clean WaitingRoom component */
const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mockVolume, setMockVolume] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [intakeTranscript, setIntakeTranscript] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!mounted) return;
        setStream(s);
        setHasPermission(true);
        if (videoRef.current) videoRef.current.srcObject = s;
        setIsCameraActive(Boolean(s.getVideoTracks().length && s.getVideoTracks()[0].enabled));
        setIsMicActive(Boolean(s.getAudioTracks().length && s.getAudioTracks()[0].enabled));
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = ctx.createMediaStreamSource(s);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
          const data = new Uint8Array(analyser.frequencyBinCount);
          const loop = () => {
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length / 255;
            setMockVolume(avg);
            rafRef.current = requestAnimationFrame(loop);
          };
          loop();
        } catch (e) {
          // no analyser available
        }
      })
      .catch(() => setHasPermission(false));

    return () => {
      mounted = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsCameraActive(false);
      setIsMicActive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAccess = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setHasPermission(true);
      if (videoRef.current) videoRef.current.srcObject = s;
      setIsCameraActive(Boolean(s.getVideoTracks().length && s.getVideoTracks()[0].enabled));
      setIsMicActive(Boolean(s.getAudioTracks().length && s.getAudioTracks()[0].enabled));
    } catch (err) {
      setHasPermission(false);
    }
  };

  const barCount = 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-4xl">
        <div className="mb-6">
          <button aria-label="Go back" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 bg-white/90 px-3 py-2 rounded-full shadow-sm">
            <ArrowLeft className="w-4 h-4" /> <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="bg-white/80 rounded-2xl p-6 md:p-8 shadow-2xl" style={{ backdropFilter: 'blur(6px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Preparing your consultation</h1>
              <p className="mt-3 text-gray-700">Welcome to the Green Room — a calm spot to quickly verify your camera and mic. Large, clear controls help everyone join confidently.</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700"><Camera className="w-5 h-5 text-indigo-600" /> Camera preview</div>
                <div className="flex items-center gap-2 text-sm text-gray-700"><Mic className="w-5 h-5 text-indigo-600" /> Microphone levels</div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <motion.button
                  layoutId="joinButton"
                  onClick={() => { try { sessionStorage.setItem('intake_transcript', intakeTranscript || ''); } catch (e) {} navigate('/video-call'); }}
                  className="px-8 py-4 rounded-full text-white font-semibold shadow-lg text-base"
                  style={{ background: 'linear-gradient(90deg,#6b46ff,#ff7ab6)' }}
                  whileHover={{ scale: 1.03 }}
                >
                  Join Consultation
                </motion.button>

                <button onClick={requestAccess} className="px-4 py-3 rounded-full bg-white border shadow" aria-label="Preview and test camera and microphone">
                  {hasPermission === false ? 'Retry Permissions' : 'Preview & Test'}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-lg overflow-hidden relative bg-black/5">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {/* Embed Chatbot for intake when waiting */}
                  {hasPermission === false && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-200">
                      <div className="text-lg font-semibold">Allow Camera & Microphone</div>
                      <div className="text-sm mt-2 text-gray-300">Tap the button below and follow the browser prompt.</div>
                      <button onClick={requestAccess} className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-lg">Allow Access</button>
                    </div>
                  )}
                  {hasPermission !== false && (
                    // Show the Chatbot intake UI inside waiting room
                    <div className="w-full h-full bg-white/80 p-2">
                      <Chatbot onTranscriptChange={(t) => setIntakeTranscript(t)} />
                    </div>
                  )}
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${isCameraActive ? 'bg-green-600 text-white' : 'bg-black/30 text-white/80'}`} aria-live="polite">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${isMicActive ? 'bg-green-600 text-white' : 'bg-black/30 text-white/80'}`} aria-live="polite">
                    <Mic className="w-4 h-4" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
                  <div className="w-full max-w-xs bg-black/40 rounded-full p-2 flex items-end gap-3 pointer-events-auto">
                    <div className="flex gap-1 items-end" aria-hidden>
                      {Array.from({ length: barCount }).map((_, i) => {
                        const height = Math.max(4, Math.round((mockVolume * 40) * (0.6 + i * 0.2)));
                        return (
                          <div key={i} style={{ height }} className="w-1.5 bg-green-400 rounded-sm transition-all duration-120" />
                        );
                      })}
                    </div>
                    <div className="text-xs text-white/90">Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WaitingRoom;
