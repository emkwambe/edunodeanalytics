'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Download,
  Calendar,
  Shield,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

/**
 * Reports Dashboard
 *
 * Pre-built compliance and summary reports.
 * Starter tier feature - available to all plans.
 */

// Loading skeleton for reports page
function ReportsPageSkeleton() {
  return (
    <>
      <div className="h-8 w-32 bg-slate-800/50 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-slate-800/50 rounded animate-pulse mb-6" />
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 bg-slate-800/50 rounded animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 animate-pulse" />
                <div className="w-16 h-5 bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="h-5 w-3/4 bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-slate-700 rounded animate-pulse mb-4" />
              <div className="h-8 w-24 bg-slate-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'academic' | 'attendance' | 'growth';
  lastGenerated: string;
  status: 'ready' | 'scheduled' | 'draft';
}

const AVAILABLE_REPORTS: Report[] = [
  {
    id: 'charter-renewal',
    name: 'Charter Renewal Summary',
    description: 'Board-ready overview of school performance against charter goals',
    category: 'compliance',
    lastGenerated: '2025-01-15',
    status: 'ready',
  },
  {
    id: 'annual-performance',
    name: 'Annual Performance Report',
    description: 'Year-over-year growth and proficiency trends',
    category: 'academic',
    lastGenerated: '2025-01-10',
    status: 'ready',
  },
  {
    id: 'attendance-monthly',
    name: 'Monthly Attendance Report',
    description: 'Chronic absenteeism metrics and daily attendance patterns',
    category: 'attendance',
    lastGenerated: '2025-01-31',
    status: 'ready',
  },
  {
    id: 'growth-summary',
    name: 'MAP Growth Summary',
    description: 'Fall-to-Winter growth percentiles by grade and subject',
    category: 'growth',
    lastGenerated: '2025-01-20',
    status: 'ready',
  },
  {
    id: 'subgroup-analysis',
    name: 'Subgroup Parity Analysis',
    description: 'Achievement comparison across demographic subgroups',
    category: 'compliance',
    lastGenerated: '2025-01-12',
    status: 'ready',
  },
  {
    id: 'intervention-summary',
    name: 'Intervention Effectiveness Report',
    description: 'MTSS tier movement and intervention dosage summary',
    category: 'academic',
    lastGenerated: '2024-12-15',
    status: 'draft',
  },
  {
    id: 'quarterly-board',
    name: 'Q2 Board Presentation',
    description: 'Quarterly board meeting data deck',
    category: 'compliance',
    lastGenerated: '',
    status: 'scheduled',
  },
];

const CATEGORY_CONFIG = {
  compliance: { label: 'Compliance', icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  academic: { label: 'Academic', icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  attendance: { label: 'Attendance', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  growth: { label: 'Growth', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

export default function ReportsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;
  const [filter, setFilter] = React.useState<string>('all');
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Simulate loading state
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Show loading skeleton
  if (loading) {
    return <ReportsPageSkeleton />;
  }

  const handleExport = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const response = await fetch(`/api/reports/${reportId}/download?format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId);
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportId.replace(/-/g, '_'),
          schoolId: school_slug,
          format: 'csv',
        }),
      });
      // Simulate generation time
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setGenerating(null);
    }
  };

  const filteredReports = filter === 'all'
    ? AVAILABLE_REPORTS
    : AVAILABLE_REPORTS.filter((r) => r.category === filter);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Pre-built compliance and summary reports for stakeholders"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Reports' },
        ]}
      />

      {/* Filter Row */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'all', label: 'All Reports' },
          { key: 'compliance', label: 'Compliance' },
          { key: 'academic', label: 'Academic' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'growth', label: 'Growth' },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'bg-indigo-600' : ''}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const config = CATEGORY_CONFIG[report.category];
          return (
            <Card
              key={report.id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
                    <config.icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      report.status === 'ready' ? 'border-emerald-500/50 text-emerald-400' :
                      report.status === 'scheduled' ? 'border-amber-500/50 text-amber-400' :
                      'border-slate-500/50 text-slate-400'
                    )}
                  >
                    {report.status === 'ready' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {report.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                    {report.status === 'draft' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {report.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-white mb-1">{report.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{report.description}</p>

                <div className="flex items-center justify-between">
                  {report.lastGenerated ? (
                    <span className="text-xs text-slate-500">
                      Generated {new Date(report.lastGenerated).toLocaleDateString()}
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleGenerate(report.id)}
                      disabled={generating === report.id}
                    >
                      {generating === report.id ? 'Generating...' : 'Generate Now'}
                    </Button>
                  )}
                  {report.status === 'ready' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleExport(report.id)}
                      disabled={downloadingId === report.id}
                    >
                      <Download className="w-3 h-3" />
                      {downloadingId === report.id ? 'Downloading...' : 'Export'}
                    </Button>
                  )}
                  {report.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleGenerate(report.id)}
                      disabled={generating === report.id}
                    >
                      {generating === report.id ? 'Generating...' : 'Generate'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
