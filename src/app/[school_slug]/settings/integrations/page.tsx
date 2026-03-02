'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DataSourceRegistry,
  DATA_SOURCE_CATEGORIES,
  type DataSourceAdapter,
  type DataSourceCategory,
  type SyncStatus,
} from '@/lib/data/sources';
import { getSchoolSeed } from '@/lib/data/seed-data';
import { hasFeatureAccess } from '@/lib/features/feature-gates';
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Lock,
  ExternalLink,
  Plug,
  Unplug,
  Settings,
  Play,
  Users,
  GraduationCap,
  BookOpen,
  Heart,
  DollarSign,
  LineChart,
  Target,
  Star,
  Database,
} from 'lucide-react';

// Map icon names to components
const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  GraduationCap,
  BookOpen,
  Heart,
  DollarSign,
  LineChart,
  Target,
  Star,
  Database,
};

// Map category icons
const CATEGORY_ICONS: Record<DataSourceCategory, React.ElementType> = {
  sis: Users,
  assessment: GraduationCap,
  lms: BookOpen,
  behavior: Heart,
  finance: DollarSign,
};

// Status display config
const STATUS_CONFIG: Record<SyncStatus, { color: string; icon: React.ElementType; label: string }> = {
  connected: { color: 'emerald', icon: CheckCircle2, label: 'Connected' },
  syncing: { color: 'blue', icon: RefreshCw, label: 'Syncing...' },
  error: { color: 'rose', icon: AlertCircle, label: 'Error' },
  disconnected: { color: 'slate', icon: Unplug, label: 'Not Connected' },
  pending_auth: { color: 'amber', icon: Clock, label: 'Pending Auth' },
  pending: { color: 'amber', icon: Clock, label: 'Pending' },
  failed: { color: 'rose', icon: AlertCircle, label: 'Failed' },
};

interface SourceWithStatus extends DataSourceAdapter {
  connectionStatus: SyncStatus;
  lastSyncAt: Date | null;
  recordCount: number;
  isLocked: boolean;
}

export default function IntegrationsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const schoolSeed = getSchoolSeed(school_slug);
  const currentTier = schoolSeed?.subscriptionTier || 'starter';

  const [selectedCategory, setSelectedCategory] = React.useState<DataSourceCategory | 'all'>('all');
  const [isConnecting, setIsConnecting] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState<string | null>(null);

  // Get all sources with mock status data
  const sources: SourceWithStatus[] = React.useMemo(() => {
    const adapters = DataSourceRegistry.getAll();

    return adapters.map((adapter) => {
      // Check if this source is available for the current tier
      const isLocked = !hasFeatureAccess(currentTier, 'api_access') &&
        adapter.requiredTier !== 'starter';

      // Mock connection status based on source ID
      const isConnected = ['clever', 'nwea-map'].includes(adapter.id);

      return {
        ...adapter,
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        lastSyncAt: isConnected ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null,
        recordCount: isConnected ? Math.floor(Math.random() * 2000) + 500 : 0,
        isLocked,
      };
    });
  }, [currentTier]);

  // Filter by category
  const filteredSources = selectedCategory === 'all'
    ? sources
    : sources.filter((s) => s.category === selectedCategory);

  // Group by category for display
  const groupedSources = React.useMemo(() => {
    const groups: Record<DataSourceCategory, SourceWithStatus[]> = {
      sis: [],
      assessment: [],
      lms: [],
      behavior: [],
      finance: [],
    };

    filteredSources.forEach((source) => {
      groups[source.category].push(source);
    });

    return groups;
  }, [filteredSources]);

  const handleConnect = async (sourceId: string) => {
    setIsConnecting(sourceId);
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(null);
  };

  const handleSync = async (sourceId: string) => {
    setIsSyncing(sourceId);
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsSyncing(null);
  };

  const connectedCount = sources.filter((s) => s.connectionStatus === 'connected').length;
  const availableCount = sources.filter((s) => !s.isLocked).length;

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect your SIS, assessment platforms, and LMS to sync data automatically"
        actions={
          <Link href={`/${school_slug}/settings`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-emerald-900/20 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-400 mb-1">Connected</div>
                <div className="text-3xl font-bold text-white">{connectedCount}</div>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Plug className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-900/20 border-indigo-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-indigo-400 mb-1">Available for Your Plan</div>
                <div className="text-3xl font-bold text-white">{availableCount}</div>
              </div>
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400 mb-1">Total Sources</div>
                <div className="text-3xl font-bold text-white">{sources.length}</div>
              </div>
              <div className="p-3 bg-slate-700 rounded-xl">
                <Database className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap',
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          )}
        >
          All Sources
        </button>
        {Object.entries(DATA_SOURCE_CATEGORIES).map(([key, meta]) => {
          const Icon = CATEGORY_ICONS[key as DataSourceCategory];
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as DataSourceCategory)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 whitespace-nowrap',
                selectedCategory === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {meta.name}
            </button>
          );
        })}
      </div>

      {/* Sources by Category */}
      <div className="space-y-8">
        {Object.entries(groupedSources).map(([category, categorySources]) => {
          if (categorySources.length === 0) return null;

          const categoryMeta = DATA_SOURCE_CATEGORIES[category as DataSourceCategory];
          const CategoryIcon = CATEGORY_ICONS[category as DataSourceCategory];

          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <CategoryIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{categoryMeta.name}</h2>
                  <p className="text-sm text-slate-500">{categoryMeta.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySources.map((source) => {
                  const statusConfig = STATUS_CONFIG[source.connectionStatus];
                  const StatusIcon = statusConfig.icon;
                  const isLoading = isConnecting === source.id || isSyncing === source.id;

                  return (
                    <Card
                      key={source.id}
                      className={cn(
                        'relative transition',
                        source.isLocked && 'opacity-60',
                        source.connectionStatus === 'connected' && 'border-emerald-500/30'
                      )}
                    >
                      {source.isLocked && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-slate-700 text-slate-400 text-[10px]">
                            <Lock className="w-3 h-3 mr-1" />
                            {source.requiredTier.toUpperCase()}
                          </Badge>
                        </div>
                      )}

                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: source.brandColor + '20', color: source.brandColor }}
                          >
                            {source.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{source.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{source.description}</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn(
                                'w-4 h-4',
                                statusConfig.color === 'emerald' && 'text-emerald-400',
                                statusConfig.color === 'blue' && 'text-blue-400 animate-spin',
                                statusConfig.color === 'rose' && 'text-rose-400',
                                statusConfig.color === 'amber' && 'text-amber-400',
                                statusConfig.color === 'slate' && 'text-slate-500'
                              )}
                            />
                            <span
                              className={cn(
                                'text-sm',
                                statusConfig.color === 'emerald' && 'text-emerald-400',
                                statusConfig.color === 'blue' && 'text-blue-400',
                                statusConfig.color === 'rose' && 'text-rose-400',
                                statusConfig.color === 'amber' && 'text-amber-400',
                                statusConfig.color === 'slate' && 'text-slate-500'
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                          {source.connectionStatus === 'connected' && source.recordCount > 0 && (
                            <Badge className="bg-slate-700 text-slate-300 text-xs">
                              {source.recordCount.toLocaleString()} records
                            </Badge>
                          )}
                        </div>

                        {/* Last Sync */}
                        {source.lastSyncAt && (
                          <div className="text-xs text-slate-500 mb-4">
                            Last sync: {source.lastSyncAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}

                        {/* Data Tables */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {source.tables.slice(0, 3).map((table) => (
                            <Badge key={table} className="bg-slate-800 text-slate-400 text-[10px]">
                              {table}
                            </Badge>
                          ))}
                          {source.tables.length > 3 && (
                            <Badge className="bg-slate-800 text-slate-500 text-[10px]">
                              +{source.tables.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {source.isLocked ? (
                            <Link href={`/${school_slug}/settings/billing`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                              >
                                Upgrade to Connect
                              </Button>
                            </Link>
                          ) : source.connectionStatus === 'connected' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSync(source.id)}
                                disabled={isLoading}
                                className="flex-1"
                              >
                                {isSyncing === source.id ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4 mr-2" />
                                )}
                                Sync Now
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(source.id)}
                              disabled={isLoading}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                              {isConnecting === source.id ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Plug className="w-4 h-4 mr-2" />
                              )}
                              Connect
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="mt-8 bg-slate-800/30 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <ExternalLink className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Need help connecting?</h3>
              <p className="text-sm text-slate-400 mb-3">
                Check our documentation for step-by-step setup guides, or contact our support team
                for assistance with custom integrations.
              </p>
              <div className="flex items-center gap-3">
                <Link href={`/${school_slug}/help`}>
                  <Button variant="outline" size="sm">
                    View Documentation
                  </Button>
                </Link>
                <Link href={`/${school_slug}/help`}>
                  <Button variant="ghost" size="sm" className="text-indigo-400">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
