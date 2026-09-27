import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Search, UserCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import apiFetch from '@/lib/api';

type Patient = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  avatar?: string;
  notes?: string;
};

const fallbackPatients: Patient[] = [
  {
    id: 'p1',
    user_id: 'u-p1',
    name: 'Maya Thompson',
    email: 'maya@smartcare.app',
    date_of_birth: '1994-01-04',
    gender: 'Female',
    blood_group: 'A+',
    notes: 'Asthma follow-up pending in 2 weeks.',
  },
  {
    id: 'p2',
    user_id: 'u-p2',
    name: 'Daniel Reyes',
    email: 'daniel@smartcare.app',
    date_of_birth: '1988-09-17',
    gender: 'Male',
    blood_group: 'O+',
    notes: 'Post-operative physical therapy review required.',
  },
  {
    id: 'p3',
    user_id: 'u-p3',
    name: 'Nora Ali',
    email: 'nora@smartcare.app',
    date_of_birth: '2001-04-30',
    gender: 'Female',
    blood_group: 'B-',
    notes: 'Migraine pattern improved with current treatment.',
  },
];

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await apiFetch({ url: '/patients' });
        if (!mounted) return;
        const payload = (result as any)?.data ?? result ?? [];
        const mapped: Patient[] = payload.map((patient: any, index: number) => ({
          id: String(patient.id ?? `patient-${index}`),
          user_id: String(patient.user_id ?? patient.id ?? `user-${index}`),
          name: patient.name ?? patient.full_name ?? 'Patient',
          email: patient.email ?? `patient${index}@smartcare.app`,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          blood_group: patient.blood_group,
          avatar: patient.avatar,
          notes: patient.notes ?? 'No additional notes available.',
        }));
        setPatients(mapped.length ? mapped : fallbackPatients);
      } catch {
        if (!mounted) return;
        setPatients(fallbackPatients);
      }
    };

    if (user?.role === 'doctor' || user?.role === 'admin') {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => {
      return patient.name.toLowerCase().includes(term) || patient.email.toLowerCase().includes(term);
    });
  }, [patients, search]);

  if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-text)]">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-8">
              <h1 className="text-2xl font-semibold">Access denied</h1>
              <p className="mt-2 text-sm text-[var(--lux-muted)]">Only doctors or admins can access patient profiles.</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-text)]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-bold tracking-tight">Patient Registry</h1>
            <p className="mt-2 text-sm text-[var(--lux-muted)]">Select any patient to open a full animated profile panel.</p>

            <div className="mt-5 rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-muted)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by patient name or email"
                  className="w-full rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] py-2.5 pl-10 pr-3 text-sm outline-none"
                />
              </div>

              <div className="mt-4 divide-y divide-[var(--lux-border)] overflow-hidden rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)]">
                {filtered.map((patient, index) => (
                  <motion.button
                    key={patient.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setSelected(patient)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[color:color-mix(in_oklab,var(--lux-cyan)_10%,transparent)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-[var(--lux-border)] bg-[var(--lux-panel)]">
                        {patient.avatar ? (
                          <img src={patient.avatar} alt={patient.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--lux-cyan)]">
                            <UserCircle2 size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{patient.name}</p>
                        <p className="text-xs text-[var(--lux-muted)]">{patient.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--lux-muted)]">Open profile</span>
                  </motion.button>
                ))}

                {filtered.length === 0 && (
                  <div className="p-8 text-center text-sm text-[var(--lux-muted)]">No patients match this search.</div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {selected && (
                <motion.aside
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                  className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-[var(--lux-border)] bg-[var(--lux-bg)] p-5 shadow-2xl"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--lux-muted)]">Patient profile</p>
                      <h2 className="text-2xl font-bold">{selected.name}</h2>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="rounded-lg border border-[var(--lux-border)] bg-[var(--lux-panel)] px-3 py-1 text-xs font-semibold text-[var(--lux-muted)]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[var(--lux-muted)]">Email</p>
                        <p>{selected.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--lux-muted)]">DOB</p>
                        <p>{selected.date_of_birth || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--lux-muted)]">Gender</p>
                        <p>{selected.gender || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--lux-muted)]">Blood Group</p>
                        <p>{selected.blood_group || 'Not set'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[var(--lux-muted)]">Clinical note</p>
                      <p className="rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] p-3 text-sm leading-relaxed">
                        {selected.notes}
                      </p>
                    </div>

                    <button className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--lux-cyan),var(--lux-violet))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_color-mix(in_oklab,var(--lux-cyan)_28%,transparent)]">
                      <FileText size={16} />
                      Open medical records
                    </button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
