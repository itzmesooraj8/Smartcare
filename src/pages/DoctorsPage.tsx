import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import apiFetch from '@/lib/api';

type Doctor = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  bio: string;
  avatar?: string;
  availabilityDays: string[];
};

const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fallbackDoctors: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Helena Ward',
    email: 'helena@smartcare.app',
    specialization: 'Cardiology',
    bio: 'Specialist in preventive cardiology and tele-consult follow-up care.',
    availabilityDays: ['Mon', 'Tue', 'Thu', 'Fri'],
  },
  {
    id: 'd2',
    name: 'Dr. Alan Rivera',
    email: 'alan@smartcare.app',
    specialization: 'General Medicine',
    bio: 'Primary care physician focused on diagnostics and long-term patient plans.',
    availabilityDays: ['Mon', 'Wed', 'Fri', 'Sat'],
  },
  {
    id: 'd3',
    name: 'Dr. Priya Shah',
    email: 'priya@smartcare.app',
    specialization: 'Dermatology',
    bio: 'Clinical dermatologist with digital-first image-led consultation workflows.',
    availabilityDays: ['Tue', 'Wed', 'Thu', 'Sun'],
  },
  {
    id: 'd4',
    name: 'Dr. Marcus Lee',
    email: 'marcus@smartcare.app',
    specialization: 'Orthopedics',
    bio: 'Sports injury expert supporting hybrid telehealth and in-clinic care.',
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Fri'],
  },
];

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await apiFetch.get('/doctors');
        if (!mounted) return;
        const payload = (result as any)?.data ?? [];
        const mapped: Doctor[] = payload.map((doctor: any, index: number) => ({
          id: String(doctor.id ?? `doctor-${index}`),
          name: doctor.name ?? doctor.full_name ?? 'Doctor',
          email: doctor.email ?? `doctor${index}@smartcare.app`,
          specialization: doctor.specialization ?? 'General Medicine',
          bio: doctor.bio ?? 'Smartcare specialist available for digital consultations.',
          avatar: doctor.avatar,
          availabilityDays: dayOrder.filter((_, dayIndex) => (dayIndex + index) % 2 === 0),
        }));
        setDoctors(mapped.length ? mapped : fallbackDoctors);
      } catch {
        if (!mounted) return;
        setDoctors(fallbackDoctors);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const specializations = useMemo(() => {
    const values = Array.from(new Set(doctors.map((doctor) => doctor.specialization)));
    return ['All', ...values];
  }, [doctors]);

  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const term = search.trim().toLowerCase();
      const hitSearch =
        !term ||
        doctor.name.toLowerCase().includes(term) ||
        doctor.specialization.toLowerCase().includes(term) ||
        doctor.bio.toLowerCase().includes(term);
      const hitSpecialization = specializationFilter === 'All' || doctor.specialization === specializationFilter;
      return hitSearch && hitSpecialization;
    });
  }, [doctors, search, specializationFilter]);

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-text)]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Doctor Network</h1>
              <p className="mt-2 text-sm text-[var(--lux-muted)]">Filter by specialization, check weekly availability, and launch consults instantly.</p>
            </div>

            <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-4">
              <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-muted)]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search doctors, skills, or profile keywords"
                    className="w-full rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] py-2.5 pl-10 pr-3 text-sm outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {specializations.map((specialization) => (
                    <button
                      key={specialization}
                      onClick={() => setSpecializationFilter(specialization)}
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                      style={{
                        borderColor:
                          specializationFilter === specialization
                            ? 'color-mix(in oklab, var(--lux-cyan) 65%, transparent)'
                            : 'var(--lux-border)',
                        background:
                          specializationFilter === specialization
                            ? 'color-mix(in oklab, var(--lux-cyan) 16%, transparent)'
                            : 'var(--lux-panel-strong)',
                        color: specializationFilter === specialization ? 'var(--lux-cyan)' : 'var(--lux-muted)',
                      }}
                    >
                      {specialization}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((doctor, index) => (
                <motion.article
                  key={doctor.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)]">
                      {doctor.avatar ? (
                        <img src={doctor.avatar} alt={doctor.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--lux-cyan)]">
                          <Stethoscope size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold leading-tight">{doctor.name}</h2>
                      <p className="text-xs text-[var(--lux-muted)]">{doctor.email}</p>
                    </div>
                  </div>

                  <div className="mb-3 inline-flex rounded-full border border-[color:color-mix(in_oklab,var(--lux-violet)_52%,transparent)] bg-[color:color-mix(in_oklab,var(--lux-violet)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--lux-violet)]">
                    {doctor.specialization}
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-[var(--lux-muted)]">{doctor.bio}</p>

                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lux-muted)]">Availability</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dayOrder.map((day) => {
                        const active = doctor.availabilityDays.includes(day);
                        return (
                          <span
                            key={`${doctor.id}-${day}`}
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold"
                            style={{
                              borderColor: active ? 'color-mix(in oklab, var(--lux-success) 45%, transparent)' : 'var(--lux-border)',
                              background: active ? 'color-mix(in oklab, var(--lux-success) 16%, transparent)' : 'var(--lux-panel-strong)',
                              color: active ? 'var(--lux-success)' : 'var(--lux-muted)',
                            }}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/book-appointment"
                      className="rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] px-3 py-2 text-center text-xs font-semibold text-[var(--lux-muted)]"
                    >
                      Book Slot
                    </Link>
                    <button className="rounded-xl bg-[linear-gradient(135deg,var(--lux-cyan),var(--lux-violet))] px-3 py-2 text-xs font-semibold text-white shadow-[0_0_18px_color-mix(in_oklab,var(--lux-cyan)_30%,transparent)]">
                      Consult
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-8 text-center">
                <Users className="mx-auto mb-3 text-[var(--lux-muted)]" size={26} />
                <p className="text-sm text-[var(--lux-muted)]">No doctor matches this filter set.</p>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--lux-panel)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--lux-muted)]">Smart Consultation</p>
                  <h3 className="text-xl font-semibold">Need urgent guidance?</h3>
                </div>
                <Link
                  to="/video-call"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--lux-border)] bg-[var(--lux-panel-strong)] px-4 py-2 text-sm font-semibold"
                >
                  <Calendar size={15} />
                  Start Teleconsult
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
