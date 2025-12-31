import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { getPatientDashboardData } from '@/lib/api';
import {
  Calendar, FileText, ArrowRight, Activity, Heart, Thermometer,
  Wind, Droplets, Clock, ChevronRight, Plus, Video, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Components ---

const BentoCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`group relative overflow-hidden bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const StatPill = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay }}
    className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/5"
  >
    <div className={`p-2 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  </motion.div>
);

// --- Main Page ---

export default function PatientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    getPatientDashboardData()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const appointments = data?.upcoming_appointments ?? [];
  const records = data?.recent_records ?? [];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black text-foreground selection:bg-indigo-500/30">
      {/* Mobile Header Handled by Sidebar/Header logic if needed or separate */}
      <div className="lg:pl-72 min-h-screen transition-all duration-300">
        <Sidebar /> {/* Sidebar is fixed, so we pad the content */}

        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">

          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Good morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">{user?.name?.split(' ')[0] || 'Patient'}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 dark:text-slate-400 mt-2 text-lg"
              >
                Here's your health overview for today.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/book-appointment">
                <Button size="lg" className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 border-none h-12 text-base">
                  <Plus className="w-5 h-5 mr-2" /> Book Appointment
                </Button>
              </Link>
            </motion.div>
          </header>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* 1. Vital Stats (Top Row) - Spans full width on mobile, 8 cols on desktop */}
            <div className="col-span-12 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatPill icon={Heart} label="Heart Rate" value="72 bpm" color="bg-rose-500" delay={0.1} />
              <StatPill icon={Droplets} label="Blood Pressure" value="120/80" color="bg-cyan-500" delay={0.15} />
              <StatPill icon={Thermometer} label="Temperature" value="98.6°F" color="bg-orange-500" delay={0.2} />
              <StatPill icon={Activity} label="Status" value="Healthy" color="bg-emerald-500" delay={0.25} />
            </div>

            {/* 2. Weather / Date Widget (Right Top) */}
            <BentoCard className="col-span-12 md:col-span-4 min-h-[120px] bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none p-6 flex flex-col justify-between" delay={0.3}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-indigo-100 text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  <div className="text-3xl font-bold mt-1">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <Wind className="w-8 h-8 text-indigo-200 opacity-80" />
              </div>
              <div className="text-sm text-indigo-100 mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div> All systems normal
              </div>
            </BentoCard>

            {/* 3. Upcoming Appointments (Large Block) */}
            <BentoCard className="col-span-12 md:col-span-8 p-0" delay={0.4}>
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Appointments
                </h3>
                <Link to="/appointments" className="text-sm text-indigo-500 font-medium hover:underline">View All</Link>
              </div>
              <div className="p-4 space-y-3">
                {appointments.length > 0 ? (
                  appointments.map((appt: any, i: number) => (
                    <div key={i} className="flex items-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                        {new Date(appt.appointment_time).getDate()}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-foreground">Dr. {appt.doctor_id}</div>
                        <div className="text-sm text-muted-foreground">{new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • General Checkup</div>
                      </div>
                      <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                        {appt.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500">No upcoming appointments</p>
                    <Link to="/book-appointment">
                      <Button variant="link" className="text-indigo-500">Book one now</Button>
                    </Link>
                  </div>
                )}
              </div>
            </BentoCard>

            {/* 4. Quick Actions (Right Column) */}
            <div className="col-span-12 md:col-span-4 space-y-6">
              {/* Video Call Widget */}
              <BentoCard className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none" delay={0.5}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Telemedicine</h3>
                    <p className="text-emerald-100 text-xs">Available 24/7</p>
                  </div>
                </div>
                <p className="text-sm text-emerald-50 mb-4 opacity-90">Start a secure video consultation with a doctor instantly.</p>
                <Link to="/patient/video-call">
                  <Button className="w-full bg-white text-emerald-700 hover:bg-emerald-50 border-none font-bold">
                    Join Room
                  </Button>
                </Link>
              </BentoCard>

              {/* Messages Widget */}
              <BentoCard className="p-0" delay={0.6}>
                <div className="p-5 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" /> Messages
                  </h3>
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  <p className="text-sm text-slate-500 mb-4">No new messages from your care team.</p>
                  <Link to="/messages" className="w-full">
                    <Button variant="outline" className="w-full">Open Chat</Button>
                  </Link>
                </div>
              </BentoCard>
            </div>

            {/* 5. Medical Records (Bottom Full) */}
            <BentoCard className="col-span-12 p-0" delay={0.7}>
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" /> Recent Medical Records
                </h3>
                <Link to="/medical-records" className="text-sm text-blue-500 font-medium hover:underline">Secure Vault</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {records.map((rec: any, i: number) => (
                  <Link key={i} to={`/medical-records`} className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-medium text-foreground truncate">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{rec.summary}</p>
                  </Link>
                ))}
                {records.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                    No recent records found.
                  </div>
                )}
              </div>
            </BentoCard>

          </div>
        </main>
      </div>
    </div>
  );
}

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-black p-6 lg:p-10 lg:pl-80 space-y-8">
    <div className="flex justify-between">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-12 w-40 rounded-full" />
    </div>
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-8 grid grid-cols-4 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      <Skeleton className="col-span-12 md:col-span-4 h-32" />
      <Skeleton className="col-span-12 md:col-span-8 h-64" />
      <Skeleton className="col-span-12 md:col-span-4 h-64" />
    </div>
  </div>
);
