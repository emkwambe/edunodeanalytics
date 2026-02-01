'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar, MobileNav } from './sidebar';

/**
 * Dashboard Shell Layout
 *
 * Wraps all dashboard pages with sidebar navigation
 */

interface DashboardShellProps {
  children: React.ReactNode;
  schoolSlug: string;
  schoolName: string;
  logoUrl?: string;
}

export function DashboardShell({
  children,
  schoolSlug,
  schoolName,
  logoUrl,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          logoUrl={logoUrl}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Header */}
      <MobileNav schoolSlug={schoolSlug} schoolName={schoolName} />

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          'pt-16 lg:pt-0', // Account for mobile header
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

/**
 * Page Header Component
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-slate-200 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-500">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="text-slate-600">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          {description && (
            <p className="text-slate-400 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Dashboard Grid Component
 */
interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn('dashboard-grid', className)}>
      {children}
    </div>
  );
}

/**
 * Grid Item Wrapper
 */
interface GridItemProps {
  children: React.ReactNode;
  span?: 3 | 4 | 6 | 8 | 12;
  className?: string;
}

export function GridItem({ children, span = 6, className }: GridItemProps) {
  const spanClasses = {
    3: 'grid-col-span-3',
    4: 'grid-col-span-4',
    6: 'grid-col-span-6',
    8: 'grid-col-span-8',
    12: 'grid-col-span-12',
  };

  return (
    <div className={cn(spanClasses[span], className)}>
      {children}
    </div>
  );
}
