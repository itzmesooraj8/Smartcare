import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { 
  FiHome as Home,
  FiCalendar as Calendar,
  FiUsers as Users,
  FiFileText as FileText,
  FiClipboard as ClipboardList,
  FiBarChart2 as BarChart3,
  FiMessageSquare as MessageSquare,
  FiDollarSign as DollarSign,
  FiDollarSign as RupeeSign,
  FiMonitor as Monitor,
  FiUser as User,
  FiSettings as Settings,
  FiBookOpen as BookOpen,
  FiUserCheck as DoctorIcon // Use FiUserCheck for Doctors
} from 'react-icons/fi';
import { Video } from 'lucide-react';
// Navigation array for sidebar (single source of truth)
const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'doctor', 'patient'],
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'doctor', 'patient'],
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'doctor'],
  },
  {
    name: 'Doctors',
    href: '/doctors',
    icon: DoctorIcon,
    roles: ['admin'],
  },
  {
    name: 'Medical Records',
    href: '/medical-records',
    icon: FileText,
    roles: ['admin', 'doctor', 'patient'],
  },
  {
    name: 'Waiting Room',
    href: '/waiting-room',
    icon: Monitor,
    roles: ['doctor', 'patient'],
  },
  {
    name: 'Video Call',
    href: '/video-call',
    icon: Video,
    roles: ['doctor', 'patient'],
  },
  ,

  {
    name: 'Lab Results Center',
    href: '/lab-results',
    icon: ClipboardList,
    roles: ['patient'],
  },
  {
    name: 'Reports & Analytics',
    href: '/reports-analytics',
    icon: BarChart3,
    roles: ['admin', 'doctor'],
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: ['admin', 'doctor', 'patient'],
  },
  // Patient: Payments below Messages
  {
    name: 'Payments',
    href: '/financial-hub',
    icon: RupeeSign,
    roles: ['patient'],
  },
  // Doctor: Payments below Messages
  {
    name: 'Payments',
    href: '/financial-hub',
    icon: RupeeSign,
    roles: ['doctor'],
  },
  // Admin: Financial Hub
  {
    name: 'Financial Hub',
    href: '/financial-hub',
    icon: RupeeSign,
    roles: ['admin'],
  },
  // Removed duplicate Video Call entry
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['admin', 'doctor', 'patient'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'doctor', 'patient'],
  },
  // Patient: Resource Center at end
  {
    name: 'Resource Center',
    href: '/resources',
    icon: BookOpen,
    roles: ['patient'],
  },
];

// Sidebar component
const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="sidebar bg-background h-full flex flex-col justify-between">
      <nav className="flex-1 px-2 py-4">
        {navigation
          .filter(item => item.roles.includes(user.role))
          .map(item => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2 mb-2 rounded hover:bg-primary/10 transition-colors ${location.pathname === item.href ? 'bg-primary/10 font-semibold' : ''}`}
            >
              <span className="mr-3">
                {React.createElement(item.icon, { size: 20 })}
              </span>
              {item.name}
            </Link>
          ))}
      </nav>
      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;