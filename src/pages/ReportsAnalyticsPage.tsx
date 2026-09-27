import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

const growthData = [
  { month: 'Jan', users: 140 },
  { month: 'Feb', users: 164 },
  { month: 'Mar', users: 188 },
  { month: 'Apr', users: 215 },
  { month: 'May', users: 237 },
  { month: 'Jun', users: 262 },
  { month: 'Jul', users: 286 },
];

const revenueData = [
  { month: 'Jan', amount: 19 },
  { month: 'Feb', amount: 24 },
  { month: 'Mar', amount: 26 },
  { month: 'Apr', amount: 32 },
  { month: 'May', amount: 35 },
  { month: 'Jun', amount: 39 },
  { month: 'Jul', amount: 44 },
];

const diagnosisMix = [
  { name: 'Respiratory', value: 32 },
  { name: 'Cardiac', value: 24 },
  { name: 'Dermatology', value: 19 },
  { name: 'Orthopedic', value: 14 },
  { name: 'Other', value: 11 },
];

const waitTimeData = [
  { day: 'Mon', wait: 22 },
  { day: 'Tue', wait: 18 },
  { day: 'Wed', wait: 25 },
  { day: 'Thu', wait: 17 },
  { day: 'Fri', wait: 19 },
  { day: 'Sat', wait: 14 },
  { day: 'Sun', wait: 12 },
];

const qualityRadar = [
  { metric: 'Access', value: 88 },
  { metric: 'Speed', value: 82 },
  { metric: 'Safety', value: 95 },
  { metric: 'Outcomes', value: 86 },
  { metric: 'Trust', value: 91 },
  { metric: 'UX', value: 84 },
];

const departmentLoad = [
  { dept: 'Tele', completed: 62, pending: 18 },
  { dept: 'ER', completed: 42, pending: 26 },
  { dept: 'Cardio', completed: 37, pending: 14 },
  { dept: 'Derm', completed: 31, pending: 10 },
];

const pieColors = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

const panelClass = 'rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-4';

export default function ReportsAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-text)]">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
              <p className="mt-2 text-sm text-[var(--lux-muted)]">6-chart bento dashboard for growth, revenue, diagnosis mix, wait time, quality, and load metrics.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`${panelClass} xl:col-span-6`}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Patient growth</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--lux-border)" />
                      <XAxis dataKey="month" stroke="var(--lux-muted)" />
                      <YAxis stroke="var(--lux-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--lux-panel-strong)', border: '1px solid var(--lux-border)', borderRadius: 12 }} />
                      <Area dataKey="users" stroke="#00d4ff" fill="url(#growthFill)" strokeWidth={2.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`${panelClass} xl:col-span-6`}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Revenue bars</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--lux-border)" />
                      <XAxis dataKey="month" stroke="var(--lux-muted)" />
                      <YAxis stroke="var(--lux-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--lux-panel-strong)', border: '1px solid var(--lux-border)', borderRadius: 12 }} />
                      <Bar dataKey="amount" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${panelClass} xl:col-span-4`}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Diagnosis pie</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={diagnosisMix} dataKey="value" innerRadius={54} outerRadius={94}>
                        {diagnosisMix.map((item, index) => (
                          <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--lux-panel-strong)', border: '1px solid var(--lux-border)', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className={`${panelClass} xl:col-span-4`}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Wait time line</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={waitTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--lux-border)" />
                      <XAxis dataKey="day" stroke="var(--lux-muted)" />
                      <YAxis stroke="var(--lux-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--lux-panel-strong)', border: '1px solid var(--lux-border)', borderRadius: 12 }} />
                      <Line type="monotone" dataKey="wait" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className={`${panelClass} xl:col-span-4`}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Quality radar</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={qualityRadar}>
                      <PolarGrid stroke="var(--lux-border)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--lux-muted)', fontSize: 12 }} />
                      <Radar dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ background: 'var(--lux-panel-strong)', border: '1px solid var(--lux-border)', borderRadius: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className={`${panelClass} xl:col-span-12`}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Department load (completed vs pending)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentLoad}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--lux-border)" />
                      <XAxis dataKey="dept" stroke="var(--lux-muted)" />
                      <YAxis stroke="var(--lux-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--lux-panel-strong)', border: '1px solid var(--lux-border)', borderRadius: 12 }} />
                      <Bar dataKey="completed" stackId="a" fill="#00d4ff" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="pending" stackId="a" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
