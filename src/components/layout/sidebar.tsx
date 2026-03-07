'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Target,
  Dna,
  Shield,
  ShieldAlert,
  Lock,
  Zap,
  Crown,
  Sparkles,
  BookOpen,
  Network,
  Search,
  Bell,
  TrendingUp,
  Key,
} from 'lucide-react';
import {
  type FeatureKey,
  type SubscriptionTier,
  hasFeatureAccess,
  TIER_INFO,
} from '@/lib/features/feature-gates';

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
  featureKey?: FeatureKey;
}

interface SidebarProps {
  schoolSlug: string;
  schoolName: string;
  logoUrl?: string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  subscriptionTier?: SubscriptionTier;
  onUpgradeClick?: () => void;
}

export function Sidebar({
  schoolSlug,
  schoolName,
  logoUrl,
  collapsed = false,
  onCollapse,
  subscriptionTier = 'pro',
  onUpgradeClick,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: `/${schoolSlug}/dashboard`,
      icon: <LayoutDashboard className="w-5 h-5" />,
      featureKey: 'dashboard_overview',
    },
    {
      label: 'Instructional Pulse',
      href: `/${schoolSlug}/dashboard/pulse`,
      icon: <Activity className="w-5 h-5" />,
      featureKey: 'ai_pulse',
    },
    {
      label: 'Momentum',
      href: `/${schoolSlug}/dashboard/momentum`,
      icon: <Zap className="w-5 h-5" />,
      featureKey: 'momentum_dashboard',
    },
    {
      label: 'Student 360',
      href: `/${schoolSlug}/dashboard/students`,
      icon: <Users className="w-5 h-5" />,
      featureKey: 'student_360',
    },
    {
      label: 'Early Warning',
      href: `/${schoolSlug}/dashboard/early-warning`,
      icon: <ShieldAlert className="w-5 h-5" />,
      featureKey: 'mtss_management',
    },
    {
      label: 'MTSS Interventions',
      href: `/${schoolSlug}/interventions`,
      icon: <Target className="w-5 h-5" />,
      featureKey: 'intervention_hub',
      badge: 'New',
    },
    {
      label: 'Impact Analyzer',
      href: `/${schoolSlug}/analytics/impact`,
      icon: <Dna className="w-5 h-5" />,
      featureKey: 'impact_analyzer',
      badge: 'New',
    },
    {
      label: 'Attendance',
      href: `/${schoolSlug}/dashboard/attendance`,
      icon: <Calendar className="w-5 h-5" />,
      featureKey: 'attendance_tracking',
    },
    {
      label: 'Assessments',
      href: `/${schoolSlug}/dashboard/assessments`,
      icon: <GraduationCap className="w-5 h-5" />,
      featureKey: 'basic_mastery_trends',
    },
    {
      label: 'Authorizer Portal',
      href: `/${schoolSlug}/authorizer`,
      icon: <Shield className="w-5 h-5" />,
      featureKey: 'authorizer_portal',
    },
    {
      label: 'Advanced Analytics',
      href: `/${schoolSlug}/analytics/advanced`,
      icon: <TrendingUp className="w-5 h-5" />,
      featureKey: 'advanced_analytics',
    },
    {
      label: 'Reports',
      href: `/${schoolSlug}/dashboard/reports`,
      icon: <FileText className="w-5 h-5" />,
      featureKey: 'basic_reports',
    },
    {
      label: 'Network View',
      href: `/${schoolSlug}/network`,
      icon: <Network className="w-5 h-5" />,
      featureKey: 'network_view',
    },
  ];

  // Check if a feature is locked
  const isFeatureLocked = (featureKey?: FeatureKey) => {
    if (!featureKey) return false;
    return !hasFeatureAccess(subscriptionTier, featureKey);
  };

  // Get the required tier badge for locked features
  const getLockedBadge = (featureKey?: FeatureKey) => {
    if (!featureKey || !isFeatureLocked(featureKey)) return null;
    // Determine required tier
    const proPlusFeatures: FeatureKey[] = [
      'student_360', 'intervention_hub', 'ai_pulse', 'ai_advisor',
      'impact_analyzer', 'momentum_dashboard', 'dosage_tracking',
      'mtss_management', 'advanced_analytics'
    ];
    return proPlusFeatures.includes(featureKey) ? 'PRO' : 'ENT';
  };

  const bottomNavItems: NavItem[] = [
    {
      label: 'Notifications',
      href: `/${schoolSlug}/notifications`,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      label: 'Resources',
      href: `/${schoolSlug}/resources`,
      icon: <BookOpen className="w-5 h-5" />,
    },
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
        {navItems.map((item) => {
          const locked = isFeatureLocked(item.featureKey);
          const lockedBadge = getLockedBadge(item.featureKey);

          if (locked) {
            return (
              <button
                key={item.href}
                onClick={onUpgradeClick}
                className={cn(
                  'nav-item w-full text-slate-500 hover:text-slate-400 hover:bg-slate-800/50 group',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? `${item.label} (Locked)` : undefined}
              >
                <div className="relative">
                  {item.icon}
                  <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-600 group-hover:text-indigo-400" />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-400 opacity-60 group-hover:opacity-100"
                    >
                      {lockedBadge}
                    </Badge>
                  </>
                )}
              </button>
            );
          }

          return (
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
          );
        })}
      </nav>

      {/* Upgrade Banner (for non-enterprise users) */}
      {subscriptionTier !== 'enterprise' && !collapsed && (
        <div className="mx-2 mb-2">
          <button
            onClick={onUpgradeClick}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">
                {subscriptionTier === 'starter' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
              </span>
            </div>
            <p className="text-xs text-slate-400 text-left">
              {subscriptionTier === 'starter'
                ? 'Unlock AI insights & interventions'
                : 'Network view & custom branding'
              }
            </p>
          </button>
        </div>
      )}

      {/* Current Tier Badge */}
      {!collapsed && (
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Current Plan</span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0',
                subscriptionTier === 'enterprise' ? 'border-emerald-500/50 text-emerald-400' :
                subscriptionTier === 'pro' ? 'border-indigo-500/50 text-indigo-400' :
                'border-slate-500/50 text-slate-400'
              )}
            >
              {TIER_INFO[subscriptionTier].name}
            </Badge>
          </div>
        </div>
      )}

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
