import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getSchoolBySlug, getSchoolBranding } from '@/lib/db/queries/schools';

/**
 * Tenant-Specific Layout
 *
 * Wraps all pages under /[school_slug]/ with the dashboard shell
 * Fetches school branding for white-labeling
 */

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ school_slug: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  // In Next.js 15+, params is a Promise
  const { school_slug } = await params;

  // Fetch school branding
  const branding = await getSchoolBranding(school_slug);

  // In production, this would 404 if school doesn't exist
  // For now, we allow any slug for development

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      }
    >
      <DashboardShell
        schoolSlug={school_slug}
        schoolName={branding.name}
        logoUrl={branding.logoUrl}
      >
        {children}
      </DashboardShell>
    </Suspense>
  );
}

// Generate metadata based on school
export async function generateMetadata({
  params,
}: {
  params: Promise<{ school_slug: string }>;
}) {
  const { school_slug } = await params;
  const branding = await getSchoolBranding(school_slug);

  return {
    title: {
      default: `${branding.name} | EduNode Analytics`,
      template: `%s | ${branding.name}`,
    },
  };
}
