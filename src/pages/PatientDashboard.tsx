import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';
import { getPatientDashboardData } from '@/lib/api';
import { ShieldCheck, User, Phone, MessageSquare, FileText, Calendar, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Single-file Masterpiece: Patient Dashboard
// - Medical Glass 2.0 visual identity
// - Holographic Hero (mouse-aware 3D tilt)
// - BreathingLine sparklines (SVG + Framer Motion)
// - SpotlightCard (radial spotlight following mouse)
// - JellyButton (springy tactile button)
// All components are internal to this file. Sidebar is preserved.

type Appointment = { id: string; date: string; time: string; doctor: string; type?: string; note?: string };
type RecordItem = { id: string; title: string; date: string; summary?: string };
type Stat = { id: string; label: string; value: number; trend: string };

// Motion tokens helper
const useMotionTokens = () => {
  const reduced = useReducedMotion();
  return {
    reduced,
    snappy: reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 28 },
    gentle: reduced ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.9, 0.2, 1] },
  } as const;
};

// SpotlightCard: creates a subtle radial spotlight that follows the cursor inside the card
const SpotlightCard: React.FC<React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }> = ({ children, className = '', ...props }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState({ x: 50, y: 50, active: false });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        setPos({ x, y, active: true });
      }}
      onMouseLeave={() => setPos((s) => ({ ...s, active: false }))}
      style={{ ['--spot-x' as any]: `${pos.x}%`, ['--spot-y' as any]: `${pos.y}%` }}
      className={`${className} relative overflow-hidden`}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity"
        style={{
          background: `radial-gradient(400px at var(--spot-x) var(--spot-y), rgba(255,255,255,0.12), rgba(255,255,255,0.03) 20%, transparent 45%)`,
          opacity: pos.active ? 1 : 0,
        }}
      />

      {children}
    </div>
  );
};

// BreathingLine: draws a smooth path and animates it on load
const BreathingLine: React.FC<{ values?: number[]; color?: string; height?: number; ariaLabel?: string }> = ({ values = [20, 40, 30, 60, 45, 70, 55, 80], color = '#0ea5a6', height = 48, ariaLabel }) => {
  const w = 200;
  const h = height;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${h - (v / 100) * h}`);
  const d = `M ${points.join(' L ')}`;

  return (
    <svg role="img" aria-label={ariaLabel} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <motion.path
        d={d}
        fill="transparent"
        stroke="url(#g)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
    </svg>
  );
};

// HolographicHero: 3D tilt container with a glowing health shield
const HolographicHero: React.FC<{ name?: string }> = ({ name = 'Patient' }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const tokens = useMotionTokens();
  const [rot, setRot] = React.useState({ rx: 0, ry: 0 });

  React.useEffect(() => {
    if (tokens.reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => {
        setRot({ rx: -py * 9, ry: px * 14 });
        raf = 0;
      });
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', () => setRot({ rx: 0, ry: 0 }));
    return () => {
      el.removeEventListener('mousemove', onMove);
    };
  }, [tokens.reduced]);

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_left,_#e8f8ff_0,_#f8ffff_25%,_#ffffff_60%)] opacity-90 animate-[pulse_8s_ease-in-out_infinite]" />
      <div ref={ref} className="relative max-w-4xl mx-auto">
        <motion.div
          style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
          animate={{ rotateX: rot.rx, rotateY: rot.ry }}
          transition={tokens.reduced ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 18 }}
          className="bg-white/70 backdrop-blur-2xl border border-white/20 shadow-[0_20px_40px_rgba(2,6,23,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-3xl p-6 md:p-10"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm tracking-wide text-zinc-700">Good morning,</div>
              <div className="text-5xl font-thin tracking-tight leading-tight text-black">{name}</div>
              <div className="mt-2 text-sm text-zinc-600">Your health, reimagined — quick insights below</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-xl opacity-60 bg-gradient-to-tr from-cyan-200 to-sky-300" />
                <svg width="96" height="96" viewBox="0 0 96 96" className="relative">
                  <defs>
                    <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.12" />
                    </radialGradient>
                  </defs>
                  <motion.circle cx="48" cy="48" r="28" fill="url(#pulse)" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: [1, 1.06, 1], opacity: [1, 0.85, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <circle cx="48" cy="48" r="18" fill="#fff" opacity={0.85} />
                  <motion.path d="M42 52 Q48 44 54 52" stroke="#06b6d4" strokeWidth={3} strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
                </svg>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs text-zinc-600">Overall status</div>
                <div className="text-lg font-semibold text-black">Stable</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// JellyButton: tactile springy button
const JellyButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }> = ({ children, className = '', ...props }) => {
  const { reduced, snappy } = useMotionTokens();
  return (
    <motion.button
      whileTap={!reduced ? { scale: [1, 0.92, 1.02, 1], borderRadius: ['12px', '16px', '12px'] } : undefined}
      transition={!reduced ? { ...snappy, duration: 0.45 } : { duration: 0 }}
      className={`${className} px-4 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/30`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

// Main page component
export default function PatientDashboard(): JSX.Element {
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState<{
    stats: Array<{ label: string; value: number }>;
    upcoming_appointments: Array<any>;
    recent_records: Array<any>;
  } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPatientDashboardData();
        if (!mounted) return;
        setDashboardData(data as any);
      } catch (err) {
        console.warn('Failed to load dashboard data', err);
        setDashboardData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_#e8f8ff_0,_#f8ffff_25%,_#ffffff_60%)]">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6 bg-white/6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
                <div className="rounded-2xl p-6 bg-white/6">
                  <Skeleton className="h-8 w-40 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>

              <div className="pt-6">
                <Footer />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats ?? [];
  const appointments = dashboardData?.upcoming_appointments ?? [];
  const records = dashboardData?.recent_records ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_#e8f8ff_0,_#f8ffff_25%,_#ffffff_60%)]">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <HolographicHero name={user?.name || 'Patient'} />

            {/* Symptom Checker CTA */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-8 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Bot className="h-8 w-8" />
                    Not sure if you need a doctor?
                  </h2>
                  <p className="text-indigo-100 mb-4 max-w-xl">
                    Use our AI Symptom Triage to get an instant assessment. It can tell you if you need ER, a video visit, or home rest.
                  </p>
                  <Link to="/chatbot">
                    <Button variant="secondary" className="font-bold text-indigo-700">
                      Start Triage Assessment <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* REAL DATA GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 1. Upcoming Appointments (Real) */}
              <SpotlightCard className="rounded-2xl">
                <div className="backdrop-blur-2xl bg-white/70 border border-white/20 shadow-sm p-6 rounded-2xl h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-black">Next Appointment</div>
                    <Link to="/appointments" className="text-xs text-primary underline">Manage</Link>
                  </div>

                  {appointments.length > 0 ? (
                    <div className="space-y-3">
                      {appointments.map((appt) => (
                        <div key={appt.id} className="p-3 bg-white/40 rounded-lg border border-white/40">
                          <div className="font-medium text-black">Dr. {appt.doctor_id}</div>
                          <div className="text-sm text-zinc-600">
                            {new Date(appt.appointment_time).toLocaleString()}
                          </div>
                          <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {appt.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-500 bg-white/30 rounded-xl border border-dashed border-zinc-300">
                      <Calendar className="w-8 h-8 mb-2 opacity-50" />
                      <span>No upcoming appointments</span>
                      <Link to="/appointments">
                        <Button variant="link" className="text-primary mt-1">Book Now</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SpotlightCard>

              {/* 2. Medical Records (Real) */}
              <SpotlightCard className="rounded-2xl">
                <div className="backdrop-blur-2xl bg-white/70 border border-white/20 shadow-sm p-6 rounded-2xl h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-black">Recent Records</div>
                    <Link to="/medical-records" className="text-xs text-primary underline">View all</Link>
                  </div>

                  {records.length > 0 ? (
                    <div className="space-y-3">
                      {records.map((r) => (
                        <div key={r.id} className="flex items-start gap-3 p-3 bg-white/40 rounded-lg">
                          <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-black">{r.title}</div>
                            <div className="text-xs text-zinc-600 truncate max-w-[200px]">{r.summary}</div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-500 bg-white/30 rounded-xl border border-dashed border-zinc-300">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <span>No medical records found</span>
                    </div>
                  )}
                </div>
              </SpotlightCard>

            </div>

            <div className="pt-6">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
