import { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  subDays,
} from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarDays, CircleDot, Video } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';

const statusColor: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  completed: '#7c3aed',
};

export default function AppointmentPage() {
  const { appointments, isLive, updateStatus } = useRealtimeAppointments();
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const monthDays = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const selectedItems = useMemo(() => {
    const day = format(selectedDay, 'yyyy-MM-dd');
    return appointments.filter((item) => item.date === day);
  }, [selectedDay, appointments]);

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-text)]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                <p className="mt-2 text-sm text-[var(--lux-muted)]">Mini calendar with status indicators and live session actions.</p>
              </div>
              {isLive && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Realtime Live
                </div>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              <section className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-4 xl:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    className="rounded-lg border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] px-3 py-1 text-xs"
                  >
                    Prev
                  </button>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">{format(monthCursor, 'MMMM yyyy')}</h2>
                  <button
                    onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    className="rounded-lg border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] px-3 py-1 text-xs"
                  >
                    Next
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--lux-muted)]">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1">
                  {monthDays.map((day) => {
                    const hasEvent = appointments.some((item) => item.date === format(day, 'yyyy-MM-dd'));
                    const active = isSameDay(day, selectedDay);
                    return (
                      <button
                        key={format(day, 'yyyy-MM-dd')}
                        onClick={() => setSelectedDay(day)}
                        className="relative rounded-lg border p-2 text-xs transition"
                        style={{
                          borderColor: active ? 'color-mix(in oklab, var(--lux-cyan) 65%, transparent)' : 'var(--lux-border)',
                          background: active
                            ? 'color-mix(in oklab, var(--lux-cyan) 14%, transparent)'
                            : isSameMonth(day, monthCursor)
                              ? 'var(--lux-panel-strong)'
                              : 'transparent',
                          color: isSameMonth(day, monthCursor) ? 'var(--lux-text)' : 'var(--lux-muted)',
                        }}
                      >
                        {format(day, 'd')}
                        {hasEvent && <CircleDot size={10} className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[var(--lux-cyan)]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] p-3 text-xs text-[var(--lux-muted)]">
                  Dot indicator means one or more appointments on that day.
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-4 xl:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">
                    <CalendarDays size={16} />
                    {format(selectedDay, 'EEEE, MMM d')}
                  </h2>
                  <span className="text-xs text-[var(--lux-muted)]">{selectedItems.length} events</span>
                </div>

                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <p className="text-xs text-[var(--lux-muted)]">{item.doctor}</p>
                        </div>
                        <span
                          className="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase"
                          style={{
                            borderColor: `${statusColor[item.status]}55`,
                            background: `${statusColor[item.status]}18`,
                            color: statusColor[item.status],
                          }}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-[var(--lux-muted)]">
                        <span>{item.time}</span>
                        <span className="capitalize">{item.mode}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {item.mode === 'video' && item.status !== 'cancelled' && (
                          <button className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--lux-cyan),var(--lux-violet))] px-3 py-2 text-xs font-semibold text-white">
                            <Video size={14} />
                            Join
                          </button>
                        )}
                        <button className="rounded-lg border border-[var(--lux-border)] bg-[var(--lux-panel)] px-3 py-2 text-xs font-semibold text-[var(--lux-muted)]">
                          View details
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {selectedItems.length === 0 && (
                    <div className="rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] p-8 text-center text-sm text-[var(--lux-muted)]">
                      No appointments scheduled for this day.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
