import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CalendarDays,
  DollarSign,
  Shield,
  UserRound,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import apiFetch from '@/lib/api';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b'];

type AdminStats = {
  total_users: number;
  doctors: number;
  patients: number;
  appointments: number;
};

const revenueSeries = [
  { month: 'Jan', revenue: 24, visits: 180 },
  { month: 'Feb', revenue: 29, visits: 220 },
  { month: 'Mar', revenue: 32, visits: 245 },
  { month: 'Apr', revenue: 28, visits: 208 },
  { month: 'May', revenue: 38, visits: 276 },
  { month: 'Jun', revenue: 44, visits: 320 },
  { month: 'Jul', revenue: 47, visits: 344 },
];

const activityFeed = [
  { title: 'New doctor onboarded', meta: 'Dr. A. Bennett joined Cardiology', time: '2m ago' },
  { title: 'Telehealth spike detected', meta: '42 sessions started in last hour', time: '12m ago' },
  { title: 'Revenue milestone hit', meta: 'Monthly revenue exceeded target by 16%', time: '34m ago' },
  { title: 'Audit policy updated', meta: 'Access log retention changed to 365 days', time: '1h ago' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    doctors: 0,
    patients: 0,
    appointments: 0,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await apiFetch.get('/admin/stats');
        if (!mounted) return;
        const payload = (result as any)?.data ?? {};
        setStats({
          total_users: payload.total_users ?? 178,
          doctors: payload.doctors ?? 36,
          patients: payload.patients ?? 142,
          appointments: payload.appointments ?? 412,
        });
      } catch {
        if (!mounted) return;
        setStats({ total_users: 178, doctors: 36, patients: 142, appointments: 412 });
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const roleMix = useMemo(
    () => [
      { name: 'Doctors', value: stats.doctors },
      { name: 'Patients', value: stats.patients },
      { name: 'Admins', value: Math.max(stats.total_users - stats.doctors - stats.patients, 1) },
    ],
    [stats]
  );

  const cardData = [
    { label: 'Total Users', value: stats.total_users, icon: UserRound, accent: '#00d4ff' },
    { label: 'Appointments', value: stats.appointments, icon: CalendarDays, accent: '#7c3aed' },
    { label: 'Security Score', value: '99.2%', icon: Shield, accent: '#10b981' },
    { label: 'MRR Growth', value: '+16%', icon: DollarSign, accent: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-text)]">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Command Center</h1>
              <p className="mt-2 text-sm text-[var(--lux-muted)]">Full bento analytics with live operations insights.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cardData.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--lux-muted)]">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold">{card.value}</p>
                    </div>
                    <div className="rounded-xl border p-2" style={{ borderColor: `${card.accent}55`, backgroundColor: `${card.accent}15` }}>
                      <card.icon size={18} color={card.accent} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5 xl:col-span-7">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Revenue & Visits</h2>
                  <span className="text-xs text-[var(--lux-muted)]">Monthly trend</span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="var(--lux-muted)" tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--lux-muted)" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--lux-panel-strong)',
                          border: '1px solid var(--lux-border)',
                          borderRadius: 12,
                          color: 'var(--lux-text)',
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#00d4ff" strokeWidth={2.4} fill="url(#revenueFill)" />
                      <Area type="monotone" dataKey="visits" stroke="#7c3aed" strokeWidth={2.2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5 xl:col-span-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Role Mix</h2>
                  <Activity size={16} className="text-[var(--lux-muted)]" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleMix} dataKey="value" innerRadius={70} outerRadius={105} paddingAngle={4}>
                        {roleMix.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--lux-panel-strong)',
                          border: '1px solid var(--lux-border)',
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {roleMix.map((item, index) => (
                    <div key={item.name} className="rounded-xl border border-[var(--lux-border)] p-2 text-center">
                      <div style={{ color: COLORS[index % COLORS.length] }} className="font-semibold">
                        {item.value}
                      </div>
                      <div className="text-[var(--lux-muted)]">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5 xl:col-span-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Revenue by Channel</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { channel: 'Telehealth', amount: 48 },
                        { channel: 'In-person', amount: 34 },
                        { channel: 'Diagnostics', amount: 21 },
                        { channel: 'Subscriptions', amount: 17 },
                      ]}
                    >
                      <XAxis dataKey="channel" stroke="var(--lux-muted)" tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--lux-muted)" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--lux-panel-strong)',
                          border: '1px solid var(--lux-border)',
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="amount" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5 xl:col-span-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Activity Feed</h2>
                <div className="space-y-3">
                  {activityFeed.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] p-3"
                    >
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-[var(--lux-muted)]">{item.meta}</p>
                      <p className="mt-1 text-[11px] text-[var(--lux-muted)]">{item.time}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
