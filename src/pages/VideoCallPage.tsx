import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Brain,
  Monitor,
  Clock,
  Shield,
  Upload,
  Zap,
} from 'lucide-react';
import { useThemeMode } from '@/hooks/useThemeMode';

type Soap = { S: string; O: string; A: string; P: string } | null;

type ChatMessage = { from: 'doctor' | 'patient'; text: string; time: string };

export default function VideoCallPage() {
  const { isDark } = useThemeMode();
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sidePanel, setSidePanel] = useState<'chat' | 'notes' | 'files' | null>('notes');
  const [transcript, setTranscript] = useState(
    'Patient reports sharp chest pain since this morning, rated 7/10 intensity. No shortness of breath. Blood pressure measured at 148/92.'
  );
  const [soapNotes, setSoapNotes] = useState<Soap>(null);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([
    { from: 'doctor', text: 'Good morning. How are you feeling today?', time: '09:32' },
    { from: 'patient', text: 'I have this chest pain since morning.', time: '09:33' },
    { from: 'doctor', text: 'Can you describe the pain? Sharp or dull?', time: '09:33' },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const generateNotes = async () => {
    setGeneratingNotes(true);
    await new Promise((resolve) => setTimeout(resolve, 1300));
    setSoapNotes({
      S: 'Patient reports sharp chest pain rated 7/10 since morning. Denies dyspnea, nausea, and arm radiation.',
      O: 'BP 148/92 mmHg. HR 88 bpm. SpO2 98%. Cardiac rhythm regular with no murmurs.',
      A: 'Hypertensive urgency with atypical chest pain. Rule out ACS. Anxiety component possible.',
      P: 'ECG stat. Troponin + BMP labs. Start Amlodipine 5mg OD. Follow up in 48 hours or earlier if pain worsens.',
    });
    setGeneratingNotes(false);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChat((prev) => [...prev, { from: 'doctor', text: chatInput.trim(), time }]);
    setChatInput('');
  };

  const callBg = isDark ? '#050508' : '#eef3fb';

  const ControlButton = ({ icon: Icon, active, danger, onClick, label }: any) => (
    <motion.button
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      title={label}
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: danger
          ? 'rgba(239,68,68,0.2)'
          : active
            ? 'color-mix(in oklab, var(--lux-text) 14%, transparent)'
            : 'var(--lux-panel)',
        border: danger ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--lux-border)',
        color: danger ? '#ef4444' : active ? 'var(--lux-text)' : 'var(--lux-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={18} />
    </motion.button>
  );

  return (
    <div
      style={{
        background: callBg,
        color: 'var(--lux-text)',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          height: 56,
          background: 'color-mix(in oklab, var(--lux-bg) 92%, transparent)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--lux-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lux-success)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 14, color: 'var(--lux-success)', fontWeight: 700 }}>LIVE</span>
          </div>
          <span style={{ fontSize: 14, color: 'var(--lux-muted)' }}>Session #SC-2026-0419</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 8,
              background: 'var(--lux-panel)',
              border: '1px solid var(--lux-border)',
            }}
          >
            <Clock size={12} color="var(--lux-muted)" />
            <span style={{ fontSize: 13, color: 'var(--lux-muted)', fontFamily: 'monospace' }}>{formatTime(elapsed)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={13} color="var(--lux-success)" />
          <span style={{ fontSize: 12, color: 'var(--lux-success)' }}>End-to-end encrypted</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              background: isDark
                ? 'linear-gradient(135deg,#090911,#111120)'
                : 'linear-gradient(135deg,#dbeafe,#eef2ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, color-mix(in oklab, var(--lux-cyan) 30%, transparent), color-mix(in oklab, var(--lux-violet) 30%, transparent))',
                border: '3px solid color-mix(in oklab, var(--lux-cyan) 35%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 42,
                fontWeight: 800,
                color: 'var(--lux-text)',
              }}
            >
              DP
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--lux-panel)',
                backdropFilter: 'blur(8px)',
                fontSize: 13,
                border: '1px solid var(--lux-border)',
              }}
            >
              Demo Patient
            </div>
          </div>

          <motion.div
            drag
            dragConstraints={{ top: 0, bottom: 220, left: -620, right: 0 }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 170,
              height: 124,
              borderRadius: 14,
              background: isDark ? 'linear-gradient(135deg,#1a0a2e,#0a1a2e)' : 'linear-gradient(135deg,#dbeafe,#ddd6fe)',
              border: '2px solid color-mix(in oklab, var(--lux-cyan) 35%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              overflow: 'hidden',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15,23,42,0.16)',
            }}
          >
            {videoEnabled ? (
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--lux-cyan)' }}>DR</div>
            ) : (
              <VideoOff size={24} color="var(--lux-muted)" />
            )}
            <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 11, color: 'var(--lux-muted)' }}>Dr. Demo</div>
          </motion.div>

          <div
            style={{
              height: 84,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: 'color-mix(in oklab, var(--lux-bg) 95%, transparent)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--lux-border)',
              flexShrink: 0,
            }}
          >
            <ControlButton icon={audioEnabled ? Mic : MicOff} active={audioEnabled} onClick={() => setAudioEnabled((v) => !v)} label="Toggle mic" />
            <ControlButton icon={videoEnabled ? Video : VideoOff} active={videoEnabled} onClick={() => setVideoEnabled((v) => !v)} label="Toggle camera" />
            <ControlButton icon={Monitor} active={false} onClick={() => null} label="Share screen" />
            <ControlButton icon={MessageSquare} active={sidePanel === 'chat'} onClick={() => setSidePanel((v) => (v === 'chat' ? null : 'chat'))} label="Chat panel" />
            <ControlButton icon={FileText} active={sidePanel === 'notes'} onClick={() => setSidePanel((v) => (v === 'notes' ? null : 'notes'))} label="SOAP notes" />
            <ControlButton icon={Upload} active={sidePanel === 'files'} onClick={() => setSidePanel((v) => (v === 'files' ? null : 'files'))} label="Files" />
            <div style={{ width: 1, height: 32, background: 'var(--lux-border)' }} />
            <ControlButton icon={PhoneOff} danger onClick={() => window.history.back()} label="End call" />
          </div>
        </div>

        <AnimatePresence>
          {sidePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              style={{
                background: 'color-mix(in oklab, var(--lux-bg) 94%, transparent)',
                borderLeft: '1px solid var(--lux-border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {sidePanel === 'notes' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflow: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                    <Brain size={16} color="var(--lux-violet)" />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>AI SOAP Notes</span>
                  </div>

                  <label style={{ fontSize: 12, color: 'var(--lux-muted)', fontWeight: 700, marginBottom: 8 }}>Session transcript</label>
                  <textarea
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    rows={5}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--lux-panel)',
                      border: '1px solid var(--lux-border)',
                      color: 'var(--lux-text)',
                      fontSize: 13,
                      resize: 'none',
                      outline: 'none',
                      lineHeight: 1.6,
                      boxSizing: 'border-box',
                      marginBottom: 16,
                    }}
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateNotes}
                    disabled={generatingNotes}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg,var(--lux-violet),var(--lux-cyan))',
                      border: 'none',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: generatingNotes ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 20,
                      boxShadow: '0 0 20px color-mix(in oklab, var(--lux-violet) 35%, transparent)',
                    }}
                  >
                    <Zap size={16} />
                    {generatingNotes ? 'Generating notes...' : 'Generate SOAP notes'}
                  </motion.button>

                  {soapNotes && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Object.entries(soapNotes).map(([key, value]) => (
                        <div key={key} style={{ padding: 14, borderRadius: 12, background: 'var(--lux-panel)', border: '1px solid var(--lux-border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lux-violet)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                            {key === 'S' ? 'Subjective' : key === 'O' ? 'Objective' : key === 'A' ? 'Assessment' : 'Plan'}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--lux-text)', lineHeight: 1.6 }}>{value}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {sidePanel === 'chat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--lux-border)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={15} color="var(--lux-cyan)" />
                    Session chat
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {chat.map((message, index) => (
                      <div key={`${message.time}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: message.from === 'doctor' ? 'flex-end' : 'flex-start' }}>
                        <div
                          style={{
                            maxWidth: '76%',
                            padding: '10px 14px',
                            borderRadius: message.from === 'doctor' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background:
                              message.from === 'doctor'
                                ? 'linear-gradient(135deg, color-mix(in oklab, var(--lux-cyan) 20%, transparent), color-mix(in oklab, var(--lux-violet) 20%, transparent))'
                                : 'var(--lux-panel)',
                            border: `1px solid ${message.from === 'doctor' ? 'color-mix(in oklab, var(--lux-cyan) 35%, transparent)' : 'var(--lux-border)'}`,
                            fontSize: 13,
                            color: 'var(--lux-text)',
                            lineHeight: 1.5,
                          }}
                        >
                          {message.text}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--lux-muted)', marginTop: 4 }}>{message.time}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--lux-border)', display: 'flex', gap: 8 }}>
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && sendChat()}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'var(--lux-panel)',
                        border: '1px solid var(--lux-border)',
                        color: 'var(--lux-text)',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={sendChat}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        background: 'color-mix(in oklab, var(--lux-cyan) 16%, transparent)',
                        border: '1px solid color-mix(in oklab, var(--lux-cyan) 35%, transparent)',
                        color: 'var(--lux-cyan)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Send
                    </motion.button>
                  </div>
                </div>
              )}

              {sidePanel === 'files' && (
                <div style={{ flex: 1, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Upload size={16} color="var(--lux-cyan)" />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Shared Files</span>
                  </div>
                  <div style={{ border: '1px dashed var(--lux-border)', borderRadius: 14, padding: 20, background: 'var(--lux-panel)' }}>
                    <p style={{ fontSize: 13, color: 'var(--lux-muted)', marginBottom: 8 }}>Drop files here to share during call</p>
                    <button
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--lux-border)',
                        background: 'var(--lux-panel-strong)',
                        color: 'var(--lux-text)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Choose file
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  );
}
