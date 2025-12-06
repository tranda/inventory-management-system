// Sidebar navigation component
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  FileText,
  History,
  Settings,
  LogOut,
  UserCog,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth, useHasPermission } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: 'canManageItems' | 'canManageUsers' | 'canViewReports' | 'canViewAudit';
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: ClipboardList },
  { label: 'Reports', href: '/reports', icon: FileText, permission: 'canViewReports' },
  { label: 'Audit Log', href: '/audit', icon: History, permission: 'canViewAudit' },
  { label: 'User Management', href: '/users', icon: UserCog, permission: 'canManageUsers' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const permissions = useHasPermission();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return permissions[item.permission];
  });

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Package className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">IT Inventory</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="mb-3 flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user?.firstName.charAt(0)}
            {user?.lastName.charAt(0)}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>

        {permissions.isAdmin && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mb-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </NavLink>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => logout()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
