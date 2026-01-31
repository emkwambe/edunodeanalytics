'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  Activity,
  GraduationCap,
  Building2,
} from 'lucide-react';

/**
 * Client-only wrapper to prevent hydration mismatch with Clerk components
 */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
    );
  }

  return <>{children}</>;
}

/**
 * Dashboard Sidebar Navigation
 *
 * Responsive navigation with collapsible state
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  schoolSlug: string;
  schoolName: string;
  logoUrl?: string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({
  schoolSlug,
  schoolName,
  logoUrl,
  collapsed = false,
  onCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: `/${schoolSlug}/dashboard`,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Instructional Pulse',
      href: `/${schoolSlug}/dashboard/pulse`,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: 'Student 360',
      href: `/${schoolSlug}/dashboard/students`,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Attendance',
      href: `/${schoolSlug}/dashboard/attendance`,
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: 'Assessments',
      href: `/${schoolSlug}/dashboard/assessments`,
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      label: 'Reports',
      href: `/${schoolSlug}/dashboard/reports`,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: 'Analytics',
      href: `/${schoolSlug}/dashboard/analytics`,
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      label: 'School Settings',
      href: `/${schoolSlug}/settings`,
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      label: 'Help & Support',
      href: `/${schoolSlug}/help`,
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${schoolSlug}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 border-r border-slate-800',
        'flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <Link
            href={`/${schoolSlug}/dashboard`}
            className="flex items-center gap-2"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {schoolName.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-semibold text-slate-100 truncate">
              {schoolName}
            </span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse?.(!collapsed)}
          className={cn('text-slate-400', collapsed && 'mx-auto')}
        >
          <ChevronLeft
            className={cn(
              'w-5 h-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'nav-item',
              isActive(item.href) && 'active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-400">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-2 border-t border-slate-800 space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'nav-item',
              isActive(item.href) && 'active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span className="flex-1">{item.label}</span>}
          </Link>
        ))}

        {/* User Profile */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 mt-2',
            collapsed && 'justify-center px-2'
          )}
        >
          <ClientOnly>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </ClientOnly>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                Account
              </p>
              <p className="text-xs text-slate-500 truncate">
                Manage profile
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * Mobile Navigation Header
 */
export function MobileNav({
  schoolSlug,
  schoolName,
}: {
  schoolSlug: string;
  schoolName: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
      <Link href={`/${schoolSlug}/dashboard`} className="flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {schoolName.charAt(0)}
          </span>
        </div>
        <span className="font-semibold text-slate-100">{schoolName}</span>
      </Link>

      <div className="flex items-center gap-2">
        <ClientOnly>
          <UserButton afterSignOutUrl="/" />
        </ClientOnly>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 bg-slate-900/95 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        >
          <nav className="p-4 space-y-2">
            <Link
              href={`/${schoolSlug}/dashboard`}
              className="nav-item"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview</span>
            </Link>
            <Link
              href={`/${schoolSlug}/dashboard/pulse`}
              className="nav-item"
              onClick={() => setIsOpen(false)}
            >
              <Activity className="w-5 h-5" />
              <span>Instructional Pulse</span>
            </Link>
            <Link
              href={`/${schoolSlug}/dashboard/students`}
              className="nav-item"
              onClick={() => setIsOpen(false)}
            >
              <Users className="w-5 h-5" />
              <span>Student 360</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
