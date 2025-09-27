import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  Users, 
  UserCog, 
  Settings, 
  FileText, 
  Heart,
  BarChart3,
  Stethoscope,
  User,
  ClipboardList,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navigation: NavigationItem[] = [
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
    icon: Stethoscope,
    roles: ['admin', 'patient'],
  },
  {
    name: 'Doctors',
    href: '/doctors',
    icon: Stethoscope,
    roles: ['patient'],
  },
  {
    name: 'Medical Records',
    href: '/medical-records',
    icon: FileText,
    roles: ['admin', 'doctor', 'patient'],
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'doctor'],
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: ['admin', 'doctor', 'patient'],
  },
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
];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className={cn("flex h-full w-64 flex-col bg-card border-r", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg medical-gradient">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-primary">SmartCare</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary text-primary-foreground shadow-medical"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
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