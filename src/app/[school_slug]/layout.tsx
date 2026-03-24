import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getSchoolBranding } from '@/lib/db/queries/schools';
import { getSchoolSeed } from '@/lib/data/seed-data';

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

  // Get subscription tier from seed data (in production, from DB)
  const schoolSeed = getSchoolSeed(school_slug);
  const subscriptionTier = schoolSeed?.subscriptionTier ?? 'starter';

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
        subscriptionTier={subscriptionTier}
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
