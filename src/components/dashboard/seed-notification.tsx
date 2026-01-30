'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Seed Import Notification
 *
 * Displayed when a school has no data seeded.
 * Offers to trigger autonomous seed import.
 */

interface SeedImportNotificationProps {
  schoolSlug: string;
  className?: string;
}

export function SeedImportNotification({
  schoolSlug,
  className,
}: SeedImportNotificationProps) {
  const [isImporting, setIsImporting] = React.useState(false);
  const [importComplete, setImportComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSeedImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      // Simulate seed import process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would call an API to trigger the seed
      // await fetch(`/api/schools/${schoolSlug}/seed`, { method: 'POST' });

      setImportComplete(true);

      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError('Failed to import seed data. Please try again.');
      setIsImporting(false);
    }
  };

  if (importComplete) {
    return (
      <Card className={cn('border-emerald-500/30 bg-emerald-500/5', className)}>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-emerald-400 mb-2">
            Seed Import Complete!
          </h3>
          <p className="text-slate-400">
            Loading your dashboard with strategic data...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-amber-500/30 bg-amber-500/5', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Database className="w-6 h-6 text-amber-400" />
          </div>
          <CardTitle className="text-lg text-slate-100">
            No Data Available
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-400">
          This school (<span className="text-slate-200 font-mono">{schoolSlug}</span>) doesn't have any data yet.
          Would you like to import the strategic seed data to populate the dashboards?
        </p>

        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Seed Data Includes:
          </h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Student roster with demographic data
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              NWEA MAP assessment scores (Fall & Winter)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Attendance records with chronic absence flags
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              "Independent Excellence" growth narrative
            </li>
          </ul>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSeedImport}
            disabled={isImporting}
            className="flex-1"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Seed Data
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <a href="/select-school">Choose Different School</a>
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          The seed data demonstrates the "Independent Excellence" narrative:
          high student growth despite lower initial proficiency.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Compact seed notification banner
 */
export function SeedNotificationBanner({
  schoolSlug,
  className,
}: SeedImportNotificationProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3 rounded-lg',
        'bg-amber-500/10 border border-amber-500/20',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-200">
          Using demo seed data for <span className="font-mono">{schoolSlug}</span>
        </span>
      </div>
      <span className="text-xs text-amber-400/70">
        Connect real data sources in Settings
      </span>
    </div>
  );
}
