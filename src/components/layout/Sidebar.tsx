import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  FileText,
  MessageSquare,
  Phone,
  Settings,
  LogOut,
  Menu,
  Archive,
  Users,
  Clipboard,
  CreditCard,
  BookOpen,
  Video,
  LayoutDashboard,
  CalendarClock,
  Stethoscope,
  FileEdit,
  Wallet,
  PackageSearch,
  BarChart2,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

type SidebarItem = {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<'admin' | 'doctor' | 'patient'>;
};

const ALL_ITEMS: SidebarItem[] = [
  { id: 'dash', name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'doctor', 'patient'] },
  { id: 'appointments', name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['admin', 'doctor', 'patient'] },
  { id: 'book', name: 'Book Appointment', href: '/book-appointment', icon: Calendar, roles: ['patient'] },
  { id: 'records', name: 'Medical Records', href: '/medical-records', icon: FileText, roles: ['admin', 'doctor', 'patient'] },
  { id: 'labs', name: 'Lab Results', href: '/patient/lab-results', icon: Clipboard, roles: ['patient'] },
  { id: 'waiting', name: 'Waiting Room', href: '/waiting-room', icon: Archive, roles: ['doctor', 'patient'] },
  { id: 'video', name: 'Video Call', href: '/patient/video-call', icon: Video, roles: ['doctor', 'patient'] },
  { id: 'messages', name: 'Messages', href: '/messages', icon: MessageSquare, roles: ['admin', 'doctor', 'patient'] },
  { id: 'doctors', name: 'Doctors', href: '/doctors', icon: Users, roles: ['admin', 'doctor', 'patient'] },
  { id: 'resources', name: 'Patient Education', href: '/resources', icon: BookOpen, roles: ['admin', 'doctor', 'patient'] },
  { id: 'financial', name: 'Financial Hub', href: '/financial-hub', icon: CreditCard, roles: ['admin', 'doctor', 'patient'] },
  { id: 'profile', name: 'Profile', href: '/patient/profile', icon: Users, roles: ['patient'] },
  { id: 'settings', name: 'Settings', href: '/patient/settings', icon: Settings, roles: ['patient'] },
];

// Back-compat export used by other components (Header etc.)
export const NAVIGATION = ALL_ITEMS.map((it) => ({ name: it.name, href: it.href, icon: it.icon, roles: it.roles }));

const pillTransition = { type: 'spring', stiffness: 350, damping: 30 } as const;

const IconMicro: React.FC<{ Icon: React.ComponentType<{ className?: string }>; active?: boolean }> = ({ Icon, active }) => (
  <div className="relative w-6 h-6 flex items-center justify-center">
    <motion.div
      initial={false}
      animate={active ? { scale: 1.06 } : { scale: 1 }}
      whileHover={{ rotate: [-2, -8, 6, 0], scale: 1.12 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="flex items-center justify-center"
      aria-hidden
    >
      <Icon className={`h-5 w-5 ${active ? 'text-emerald-500' : 'text-zinc-700'}`} />
    </motion.div>

    <AnimatePresence>
      {active && (
        <motion.span
          layout
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.02, opacity: 0.12 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-full bg-emerald-500/20 -z-10"
        />
      )}
    </AnimatePresence>
  </div>
);

const MotionSidebarItem: React.FC<{ item: SidebarItem; collapsed: boolean; active: boolean }> = ({ item, collapsed, active }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) => `relative z-10 block px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300/30 ${isActive ? 'text-black font-semibold' : 'text-zinc-700'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-current={active ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <IconMicro Icon={item.icon} active={active} />
        </div>

        <motion.span initial={false} animate={collapsed ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }} transition={{ duration: 0.22 }} className="whitespace-nowrap" aria-hidden={collapsed}>
          {item.name}
        </motion.span>

        {collapsed && hover && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 8 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.16 }} className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur rounded-md px-3 py-1 text-xs shadow-lg border border-white/20" role="tooltip">
            {item.name}
          </motion.div>
        )}
      </div>
    </NavLink>
  );
};

export default function Sidebar(): JSX.Element {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const role = (user?.role as 'admin' | 'doctor' | 'patient') || 'patient';
  const items = ALL_ITEMS.filter((it) => it.roles.includes(role));

  const activeIndex = items.findIndex((n) => location.pathname.startsWith(n.href));

  // Admin-only Command Center Dock
  if (role === 'admin' && !isMobile) {
    const ADMIN_ITEMS = [
      { id: 'dash', name: 'Dashboard Overview', href: '/dashboard', Icon: LayoutDashboard },
      { id: 'patients', name: 'Patient Mgmt', href: '/patients', Icon: Users },
      { id: 'appointments', name: 'Appointments', href: '/appointments', Icon: CalendarClock },
      { id: 'staff', name: 'Staff', href: '/doctors', Icon: Stethoscope },
      { id: 'cms', name: 'CMS', href: '/cms', Icon: FileEdit },
      { id: 'finance', name: 'Finance', href: '/financial-hub', Icon: Wallet },
      { id: 'inventory', name: 'Inventory', href: '/inventory', Icon: PackageSearch },
      { id: 'analytics', name: 'Analytics', href: '/reports', Icon: BarChart2 },
      { id: 'security', name: 'Settings', href: '/settings', Icon: ShieldCheck },
    ];

    return (
      <aside className="fixed left-4 top-4 m-4 w-20 h-[calc(100vh-2rem)] rounded-3xl bg-zinc-950/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-40 p-3 flex flex-col items-center">
        <div className="mt-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-800 to-emerald-800 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#39E079" opacity="0.12" /></svg>
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-4">
          {ADMIN_ITEMS.map((it) => (
            <NavLink key={it.id} to={it.href} className={({ isActive }) => `group relative w-full flex items-center justify-center p-2 rounded-lg`}>
              {({ isActive }) => (
                <div className="relative flex items-center justify-center w-full">
                  <it.Icon className={`h-6 w-6 ${isActive ? 'text-[#39E079]' : 'text-zinc-400'} transition-transform duration-150 group-hover:scale-110`} />
                  <span className={`absolute -right-2 w-2 h-2 rounded-full ${isActive ? 'bg-[#39E079] shadow-[0_0_12px_#39E079]' : 'opacity-0'} top-1/2 -translate-y-1/2`} />
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 mb-2">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white">{(user?.name || 'A').slice(0, 1)}</div>
        </div>
      </aside>
    );
  }

  // God Tier Sidebar Design
  return (
    <>
      {isMobile && (
        <div className="fixed z-50 top-4 left-4">
          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="p-2.5 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 shadow-lg text-foreground hover:bg-white/20 transition-all">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {(open || !isMobile) && (
          <motion.aside
            initial={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`z-40 fixed top-0 left-0 h-screen flex-shrink-0 flex flex-col ${collapsed ? 'w-[5.5rem]' : 'w-72'} py-6 px-4 bg-white/40 dark:bg-[#09090b]/60 backdrop-blur-3xl border-r border-white/20 dark:border-white/5 shadow-2xl transition-[width] duration-300 ease-in-out`}
          >
            {/* Logo Area */}
            <div className="flex items-center gap-4 mb-8 px-2 relative group">
              <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse-slow" />
              </div>

              <motion.div animate={collapsed ? { opacity: 0, width: 0, display: 'none' } : { opacity: 1, width: 'auto', display: 'block' }} className="overflow-hidden whitespace-nowrap">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 tracking-tight">
                  SmartCare
                </h1>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Health OS</p>
              </motion.div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-2 space-y-1">
              <LayoutGroup>
                {items.map((item, idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.href}
                      onClick={() => isMobile && setOpen(false)}
                      className="group relative block"
                    >
                      {({ isActive }) => (
                        <div className={`relative px-3 py-3 flex items-center gap-4 rounded-xl transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-white/5'}`}>

                          {/* Active Background Glow */}
                          {isActive && (
                            <motion.div
                              layoutId="nav-glow"
                              className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-xl border border-indigo-500/10"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}

                          <div className="relative z-10 flex-shrink-0">
                            <IconMicro Icon={item.icon} active={isActive} />
                          </div>

                          <motion.span
                            animate={collapsed ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`relative z-10 font-medium whitespace-nowrap ${isActive ? 'font-semibold' : ''}`}
                          >
                            {item.name}
                          </motion.span>

                          {/* Active Indicator Dot */}
                          {isActive && !collapsed && (
                            <motion.div layoutId="nav-dot" className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                          )}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </LayoutGroup>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-white/5 px-1 space-y-3">
              {/* Profile Card */}
              <div className={`flex items-center gap-3 p-2 rounded-2xl bg-gradient-to-b from-white/50 to-white/20 dark:from-white/5 dark:to-transparent border border-white/20 shadow-sm backdrop-blur-sm transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}>
                <Avatar className="h-9 w-9 border-2 border-white dark:border-white/10 shadow-sm">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>

                <motion.div
                  animate={collapsed ? { opacity: 0, width: 0, display: 'none' } : { opacity: 1, width: 'auto', display: 'block' }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground truncate capitlzied">{user?.role || 'Patient'}</p>
                </motion.div>

                {!collapsed && (
                  <NavLink to="/logout" className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut className="h-4 w-4" />
                  </NavLink>
                )}
              </div>

              {/* Collapse Toggle */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors group"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <div className="p-1 rounded bg-white/40 dark:bg-white/10 border border-white/20 shadow-sm group-hover:scale-110 transition-transform">
                    {collapsed ? <Menu className="h-3 w-3" /> : <div className="i-lucide-chevron-left h-3 w-3"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg></div>}
                  </div>
                </motion.div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
