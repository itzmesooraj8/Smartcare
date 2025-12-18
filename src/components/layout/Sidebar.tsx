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
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

type SidebarItem = {
  id: string;
  label: string;
  to: string;
  Icon: React.ComponentType<any>;
};

const navItems: SidebarItem[] = [
  { id: 'dash', label: 'Dashboard', to: '/dashboard', Icon: Home },
  { id: 'appointments', label: 'Appointments', to: '/appointments', Icon: Calendar },
  { id: 'records', label: 'Medical Records', to: '/medical-records', Icon: FileText },
  { id: 'messages', label: 'Messages', to: '/messages', Icon: MessageSquare },
  { id: 'waiting', label: 'Waiting Room', to: '/waiting-room', Icon: Archive },
  { id: 'book', label: 'Book Appointment', to: '/book-appointment', Icon: Calendar },
  { id: 'labs', label: 'Lab Results', to: '/patient/lab-results', Icon: Clipboard },
  { id: 'tele', label: 'Video Call', to: '/patient/video-call', Icon: Video },
  { id: 'doctors', label: 'Doctors', to: '/doctors', Icon: Users },
  { id: 'resources', label: 'Resources', to: '/resources', Icon: BookOpen },
  { id: 'financial', label: 'Financial Hub', to: '/financial-hub', Icon: CreditCard },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: Users },
  { id: 'settings', label: 'Settings', to: '/patient/settings', Icon: Settings },
];

// Back-compat NAVIGATION export used by Header and other components.
// Header expects items with: { name, href, icon, roles }
export const NAVIGATION = [
  { name: 'Dashboard', href: '/patient/dashboard', icon: Home, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Appointments', href: '/patient/appointments', icon: Calendar, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Book Appointment', href: '/book-appointment', icon: Calendar, roles: ['patient'] },
  { name: 'Medical Records', href: '/patient/medical-records', icon: FileText, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Lab Results', href: '/patient/lab-results', icon: Clipboard, roles: ['patient'] },
  { name: 'Waiting Room', href: '/waiting-room', icon: Archive, roles: ['doctor', 'patient'] },
  { name: 'Video Call', href: '/patient/video-call', icon: Video, roles: ['doctor', 'patient'] },
  { name: 'Messages', href: '/patient/messages', icon: MessageSquare, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Doctors', href: '/doctors', icon: Users, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Resources', href: '/resources', icon: BookOpen, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Financial Hub', href: '/financial-hub', icon: CreditCard, roles: ['admin', 'doctor', 'patient'] },
  { name: 'Profile', href: '/patient/profile', icon: Users, roles: ['patient'] },
  { name: 'Settings', href: '/patient/settings', icon: Settings, roles: ['patient'] },
];

const pillTransition = { type: 'spring', stiffness: 350, damping: 30 } as const;

const IconMicro: React.FC<{ Icon: React.ComponentType<any>; active?: boolean }> = ({ Icon, active }) => {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <motion.div
        initial={false}
        animate={active ? { scale: 1.06 } : { scale: 1 }}
        whileHover={{ rotate: [-2, -8, 6, 0], scale: 1.12 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex items-center justify-center"
        aria-hidden
      >
        <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-zinc-700'}`} />
      </motion.div>

      <AnimatePresence>
        {active && (
          <motion.span
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 0.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full bg-primary/40 -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const MotionSidebarItem: React.FC<{
  item: SidebarItem;
  collapsed: boolean;
  active: boolean;
}> = ({ item, collapsed, active }) => {
  const [hover, setHover] = React.useState(false);

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `relative z-10 block px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          isActive ? 'text-black font-semibold' : 'text-zinc-700'
        }`
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-current={active ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <IconMicro Icon={item.Icon} active={active} />
        </div>

        <motion.span
          initial={false}
          animate={collapsed ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="whitespace-nowrap"
          aria-hidden={collapsed}
        >
          {item.label}
        </motion.span>

        {/* Tooltip when collapsed */}
        {collapsed && hover && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 8 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur rounded-md px-3 py-1 text-xs shadow-lg border border-white/20"
            role="tooltip"
          >
            {item.label}
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
  const [open, setOpen] = React.useState(false); // mobile drawer

  const activeIndex = navItems.findIndex((n) => location.pathname.startsWith(n.to));

  return (
    <>
      {isMobile && (
        <div className="fixed z-40 top-4 left-4">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="p-2 rounded-md bg-white/80 backdrop-blur border border-white/20 shadow-sm"
          >
            <Menu className="h-5 w-5 text-zinc-700" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {(open || !isMobile) && (
          <motion.aside
            initial={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`z-30 fixed top-0 left-0 h-full flex-shrink-0 flex flex-col ${
              collapsed ? 'w-20' : 'w-64'
            } p-4 lg:static lg:translate-x-0 bg-white/70 backdrop-blur-2xl border-r border-white/20 shadow-lg`}
            style={{ boxShadow: '0 12px 40px rgba(2,6,23,0.12)' }}
            aria-label="Primary navigation"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md p-1 bg-gradient-to-tr from-cyan-100 to-sky-100/60">
                  <svg width="28" height="28" viewBox="0 0 24 24" className="block">
                    <circle cx="12" cy="12" r="10" fill="#06b6d4" opacity="0.12" />
                    <path d="M4 12h16" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <motion.span
                  initial={false}
                  animate={collapsed ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="font-semibold text-lg"
                >
                  SmartCare
                </motion.span>
              </div>

              <div className="hidden lg:flex items-center">
                <button
                  onClick={() => setCollapsed((s) => !s)}
                  aria-pressed={collapsed}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/10"
                >
                  <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <Menu className="h-4 w-4 text-zinc-700" />
                  </motion.div>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <LayoutGroup>
                <motion.ul layout initial={false} className="space-y-2">
                  {navItems.map((item, idx) => {
                    const isActive = activeIndex === idx;
                    return (
                      <motion.li key={item.id} layout className="relative">
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            transition={pillTransition}
                            className="absolute inset-y-0 left-0 right-0 rounded-lg bg-white/30 backdrop-blur border border-white/10"
                            style={{ marginLeft: collapsed ? 6 : 0, marginRight: collapsed ? 6 : 0 }}
                          />
                        )}

                        <div className="relative z-20">
                          <MotionSidebarItem item={item} collapsed={collapsed} active={isActive} />
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </LayoutGroup>
            </div>

            <div className="mt-4">
              <div className="mb-3 px-1">
                <div className={`text-xs text-zinc-600 ${collapsed ? 'opacity-0 -translate-x-4' : ''}`}>Shortcuts</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 text-xs text-zinc-700">
                  <Phone className="h-4 w-4" />
                  <motion.span animate={collapsed ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }} className="whitespace-nowrap">
                    Call Clinic
                  </motion.span>
                </button>

                <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 text-xs text-zinc-700">
                  <MessageSquare className="h-4 w-4" />
                  <motion.span animate={collapsed ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }} className="whitespace-nowrap">
                    Messages
                  </motion.span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative group">
                <motion.div whileHover={{ y: -4 }} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user?.avatar || '/avatar.png'} alt={user?.name || 'User'} />
                    <AvatarFallback>{(user?.name || 'U').slice(0, 1)}</AvatarFallback>
                  </Avatar>

                  <motion.div animate={collapsed ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }} className="flex-1">
                    <div className="text-sm font-medium text-black">{user?.name || 'Demo Patient'}</div>
                    <div className="text-xs text-zinc-600">{user?.role || 'Patient'}</div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 bottom-full mb-2 w-40 rounded-md bg-white/80 backdrop-blur border border-white/20 shadow-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                >
                  <div className="flex flex-col gap-1">
                    <a href="/settings" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </a>
                    <a href="/logout" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10">
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Logout</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setCollapsed((s) => !s)}
                className="text-sm text-zinc-700 px-3 py-2 rounded-md bg-white/5"
                aria-pressed={collapsed}
              >
                {collapsed ? 'Expand' : 'Collapse'}
              </button>

              {isMobile && (
                <button onClick={() => setOpen(false)} className="text-xs text-zinc-600 px-2 py-1">
                  Close
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}