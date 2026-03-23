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
  ERROR_CATEGORY_META,
  RESPONSIBLE_PARTY_META,
  getRecommendedAction,
  generateCorrelationId,
  type IntegrationErrorCategory,
  type ResponsibleParty,
  type IssueSeverity,
  type ConnectorHealthStatus,
  type ClassifiedIntegrationError,
} from '@/lib/integrations/error-taxonomy';
import {
  getPlaybook,
  matchFailureMode,
  generateEscalationMessage,
  type VendorPlaybook,
  type FailureMode,
} from '@/lib/integrations/vendor-playbooks';
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Activity,
  Shield,
  Building2,
  ExternalLink,
  Download,
  FileText,
  ChevronDown,
  ChevronRight,
  Copy,
  CheckCheck,
  Pause,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Eye,
  BookOpen,
} from 'lucide-react';

/**
 * Integration Health Console
 * ==========================
 *
 * The "command center" for integration governance.
 * Shows per-connector health, errors with ownership, and recommended actions.
 *
 * This is NOT a support desk - it's a visibility and accountability layer.
 */

// Mock connector health data
interface ConnectorHealth {
  sourceId: string;
  sourceName: string;
  status: ConnectorHealthStatus;
  healthScore: number;
  uptime: number;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  recordsProcessed: number;
  failureCount: number;
  recentErrors: ClassifiedIntegrationError[];
  trend: 'improving' | 'stable' | 'declining';
}

// Generate mock health data
function generateMockHealthData(): ConnectorHealth[] {
  return [
    {
      sourceId: 'clever',
      sourceName: 'Clever',
      status: 'healthy',
      healthScore: 98,
      uptime: 99.9,
      lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextSyncAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      recordsProcessed: 2847,
      failureCount: 0,
      recentErrors: [],
      trend: 'stable',
    },
    {
      sourceId: 'powerschool',
      sourceName: 'PowerSchool',
      status: 'degraded',
      healthScore: 72,
      uptime: 94.5,
      lastSyncAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      nextSyncAt: new Date(Date.now() + 16 * 60 * 60 * 1000),
      recordsProcessed: 1523,
      failureCount: 3,
      recentErrors: [
        {
          errorId: 'err-001',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          category: 'rate_limit_exceeded',
          responsibleParty: 'edunode',
          severity: 'medium',
          message: 'PowerSchool API rate limit exceeded (429). Automatic retry scheduled.',
          correlationId: generateCorrelationId(),
          recommendedAction: getRecommendedAction('rate_limit_exceeded', 'PowerSchool'),
          isAutoRecoverable: true,
          nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      ],
      trend: 'declining',
    },
    {
      sourceId: 'canvas',
      sourceName: 'Canvas LMS',
      status: 'failed',
      healthScore: 35,
      uptime: 78.2,
      lastSyncAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      nextSyncAt: null,
      recordsProcessed: 0,
      failureCount: 12,
      recentErrors: [
        {
          errorId: 'err-002',
          timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
          category: 'authentication_failure',
          responsibleParty: 'school_district',
          severity: 'critical',
          message: 'Canvas OAuth token expired. Re-authentication required.',
          vendorErrorCode: '401_INVALID_TOKEN',
          affectedRecords: 1245,
          correlationId: generateCorrelationId(),
          recommendedAction: getRecommendedAction('authentication_failure', 'Canvas LMS'),
          isAutoRecoverable: false,
        },
      ],
      trend: 'declining',
    },
    {
      sourceId: 'nwea_map',
      sourceName: 'NWEA MAP',
      status: 'healthy',
      healthScore: 100,
      uptime: 100,
      lastSyncAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      nextSyncAt: null, // Manual sync only
      recordsProcessed: 892,
      failureCount: 0,
      recentErrors: [],
      trend: 'stable',
    },
    {
      sourceId: 'classlink',
      sourceName: 'ClassLink',
      status: 'degraded',
      healthScore: 65,
      uptime: 91.2,
      lastSyncAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      nextSyncAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
      recordsProcessed: 1876,
      failureCount: 5,
      recentErrors: [
        {
          errorId: 'err-003',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          category: 'missing_required_fields',
          responsibleParty: 'school_district',
          severity: 'medium',
          message: '47 student records missing required grade_level field.',
          affectedRecords: 47,
          correlationId: generateCorrelationId(),
          recommendedAction: getRecommendedAction('missing_required_fields', 'ClassLink'),
          isAutoRecoverable: false,
        },
        {
          errorId: 'err-004',
          timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000),
          category: 'vendor_api_unavailable',
          responsibleParty: 'external_vendor',
          severity: 'high',
          message: 'ClassLink API returned 503 Service Unavailable during maintenance window.',
          vendorErrorCode: '503_MAINTENANCE',
          correlationId: generateCorrelationId(),
          recommendedAction: getRecommendedAction('vendor_api_unavailable', 'ClassLink'),
          isAutoRecoverable: true,
        },
      ],
      trend: 'improving',
    },
  ];
}

// Status display config
const STATUS_CONFIG: Record<ConnectorHealthStatus, {
  color: string;
  bgColor: string;
  icon: React.ElementType;
  label: string;
}> = {
  healthy: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: CheckCircle2, label: 'Healthy' },
  degraded: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: AlertTriangle, label: 'Degraded' },
  failed: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', icon: XCircle, label: 'Failed' },
  paused: { color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: Pause, label: 'Paused' },
};

const SEVERITY_CONFIG: Record<IssueSeverity, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  critical: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', label: 'Critical' },
  high: { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'High' },
  medium: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Medium' },
  low: { color: 'text-slate-400', bgColor: 'bg-slate-500/20', label: 'Low' },
};

const PARTY_CONFIG: Record<ResponsibleParty, {
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  edunode: { color: 'text-violet-400', bgColor: 'bg-violet-500/20', icon: Shield },
  school_district: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: Building2 },
  external_vendor: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', icon: ExternalLink },
};

const TREND_CONFIG: Record<'improving' | 'stable' | 'declining', {
  color: string;
  icon: React.ElementType;
  label: string;
}> = {
  improving: { color: 'text-emerald-400', icon: TrendingUp, label: 'Improving' },
  stable: { color: 'text-slate-400', icon: Minus, label: 'Stable' },
  declining: { color: 'text-rose-400', icon: TrendingDown, label: 'Declining' },
};

export default function IntegrationHealthPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [connectors, setConnectors] = React.useState<ConnectorHealth[]>([]);
  const [selectedConnector, setSelectedConnector] = React.useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = React.useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showPlaybook, setShowPlaybook] = React.useState<string | null>(null);

  React.useEffect(() => {
    setConnectors(generateMockHealthData());
  }, []);

  const selectedConnectorData = connectors.find((c) => c.sourceId === selectedConnector);

  // Summary stats
  const healthyCount = connectors.filter((c) => c.status === 'healthy').length;
  const degradedCount = connectors.filter((c) => c.status === 'degraded').length;
  const failedCount = connectors.filter((c) => c.status === 'failed').length;
  const totalErrors = connectors.reduce((sum, c) => sum + c.recentErrors.length, 0);

  // Group errors by responsible party
  const errorsByParty = React.useMemo(() => {
    const all = connectors.flatMap((c) => c.recentErrors);
    return {
      edunode: all.filter((e) => e.responsibleParty === 'edunode'),
      school_district: all.filter((e) => e.responsibleParty === 'school_district'),
      external_vendor: all.filter((e) => e.responsibleParty === 'external_vendor'),
    };
  }, [connectors]);

  const toggleErrorExpanded = (errorId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(errorId)) {
        next.delete(errorId);
      } else {
        next.add(errorId);
      }
      return next;
    });
  };

  const copyCorrelationId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateSupportPacket = (error: ClassifiedIntegrationError, vendorName: string) => {
    const packet = {
      issue_summary: error.message,
      error_category: ERROR_CATEGORY_META[error.category].label,
      timestamp: error.timestamp.toISOString(),
      correlation_id: error.correlationId,
      affected_records: error.affectedRecords || 'N/A',
      vendor_error_code: error.vendorErrorCode || 'N/A',
      connector: vendorName,
      recommended_action: error.recommendedAction.title,
      steps_to_resolve: error.recommendedAction.steps,
    };

    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-packet-${error.correlationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Integration Health Console"
        description="Monitor connector health, diagnose issues, and understand accountability"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/${school_slug}/settings/integrations`}>
              <Button variant="outline" size="sm">
                Manage Integrations
              </Button>
            </Link>
            <Link href={`/${school_slug}/settings`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        }
      />

      {/* Strategic Position Banner */}
      <div className="mb-6 bg-gradient-to-r from-indigo-900/30 via-violet-900/20 to-slate-900/30 border-l-4 border-indigo-500 p-4 rounded-r-xl">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-indigo-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white text-sm mb-1">Integration Command Center</h3>
            <p className="text-xs text-slate-400">
              This console provides visibility, diagnosis, and accountability tracking.
              EduNode orchestrates your integrations but does not guarantee third-party vendor uptime
              or resolve vendor-side defects.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-emerald-900/20 border-emerald-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-400 mb-1">Healthy</div>
                <div className="text-2xl font-bold text-white">{healthyCount}</div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-900/20 border-amber-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-400 mb-1">Degraded</div>
                <div className="text-2xl font-bold text-white">{degradedCount}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-900/20 border-rose-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-rose-400 mb-1">Failed</div>
                <div className="text-2xl font-bold text-white">{failedCount}</div>
              </div>
              <XCircle className="w-8 h-8 text-rose-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 mb-1">Open Issues</div>
                <div className="text-2xl font-bold text-white">{totalErrors}</div>
              </div>
              <AlertCircle className="w-8 h-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Ownership Summary */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Issue Ownership Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(errorsByParty).map(([party, errors]) => {
              const meta = RESPONSIBLE_PARTY_META[party as ResponsibleParty];
              const config = PARTY_CONFIG[party as ResponsibleParty];
              const Icon = config.icon;
              return (
                <div
                  key={party}
                  className={cn('p-4 rounded-xl border', config.bgColor, 'border-transparent')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('w-4 h-4', config.color)} />
                    <span className={cn('text-sm font-medium', config.color)}>{meta.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{errors.length}</div>
                  <div className="text-xs text-slate-500">{meta.description}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connector List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-3">Connectors</h3>
          {connectors.map((connector) => {
            const statusConfig = STATUS_CONFIG[connector.status];
            const StatusIcon = statusConfig.icon;
            const trendConfig = TREND_CONFIG[connector.trend];
            const TrendIcon = trendConfig.icon;

            return (
              <button
                key={connector.sourceId}
                onClick={() => setSelectedConnector(connector.sourceId)}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition',
                  selectedConnector === connector.sourceId
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn('w-4 h-4', statusConfig.color)} />
                    <span className="font-medium text-white">{connector.sourceName}</span>
                  </div>
                  <Badge className={cn('text-xs', statusConfig.bgColor, statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">
                      Health: <span className="text-white">{connector.healthScore}%</span>
                    </span>
                    <span className="text-slate-500">
                      Uptime: <span className="text-white">{connector.uptime}%</span>
                    </span>
                  </div>
                  <div className={cn('flex items-center gap-1', trendConfig.color)}>
                    <TrendIcon className="w-3 h-3" />
                    <span className="text-[10px]">{trendConfig.label}</span>
                  </div>
                </div>
                {connector.recentErrors.length > 0 && (
                  <div className="mt-2 text-xs text-rose-400">
                    {connector.recentErrors.length} open issue{connector.recentErrors.length !== 1 ? 's' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Connector Details */}
        <div className="lg:col-span-2">
          {selectedConnectorData ? (
            <div className="space-y-4">
              {/* Connector Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {selectedConnectorData.sourceName}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            STATUS_CONFIG[selectedConnectorData.status].bgColor,
                            STATUS_CONFIG[selectedConnectorData.status].color
                          )}
                        >
                          {STATUS_CONFIG[selectedConnectorData.status].label}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          Health Score: {selectedConnectorData.healthScore}%
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPlaybook(selectedConnectorData.sourceId)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Playbook
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Last Sync</div>
                      <div className="text-sm text-white">
                        {selectedConnectorData.lastSyncAt
                          ? selectedConnectorData.lastSyncAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Next Sync</div>
                      <div className="text-sm text-white">
                        {selectedConnectorData.nextSyncAt
                          ? selectedConnectorData.nextSyncAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Manual'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Records</div>
                      <div className="text-sm text-white">
                        {selectedConnectorData.recordsProcessed.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">30-Day Uptime</div>
                      <div className="text-sm text-white">{selectedConnectorData.uptime}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Issues */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Recent Issues ({selectedConnectorData.recentErrors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedConnectorData.recentErrors.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <div className="text-white font-medium mb-1">No Issues</div>
                      <div className="text-sm text-slate-500">
                        This connector is running smoothly
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedConnectorData.recentErrors.map((error) => {
                        const isExpanded = expandedErrors.has(error.errorId);
                        const partyConfig = PARTY_CONFIG[error.responsibleParty];
                        const PartyIcon = partyConfig.icon;
                        const severityConfig = SEVERITY_CONFIG[error.severity];

                        return (
                          <div
                            key={error.errorId}
                            className="border border-slate-700 rounded-xl overflow-hidden"
                          >
                            {/* Error Header */}
                            <button
                              onClick={() => toggleErrorExpanded(error.errorId)}
                              className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-800/30 transition"
                            >
                              <div className="mt-0.5">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={cn('text-xs', severityConfig.bgColor, severityConfig.color)}>
                                    {severityConfig.label}
                                  </Badge>
                                  <Badge className={cn('text-xs', partyConfig.bgColor, partyConfig.color)}>
                                    <PartyIcon className="w-3 h-3 mr-1" />
                                    {RESPONSIBLE_PARTY_META[error.responsibleParty].label}
                                  </Badge>
                                  {error.isAutoRecoverable && (
                                    <Badge className="text-xs bg-blue-500/20 text-blue-400">
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Auto-retry
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-white mb-1">{error.message}</div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span>{error.timestamp.toLocaleString()}</span>
                                  {error.affectedRecords && (
                                    <span>{error.affectedRecords} records affected</span>
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="border-t border-slate-700 p-4 bg-slate-800/20">
                                {/* Recommended Action */}
                                <div className="mb-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                                    <span className="font-semibold text-indigo-400 text-sm">
                                      Recommended Action
                                    </span>
                                  </div>
                                  <div className="text-white font-medium mb-2">
                                    {error.recommendedAction.title}
                                  </div>
                                  <div className="text-sm text-slate-300 mb-3">
                                    {error.recommendedAction.description}
                                  </div>
                                  <div className="space-y-2">
                                    {error.recommendedAction.steps.map((step, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="text-indigo-400 font-mono text-xs mt-0.5">
                                          {idx + 1}.
                                        </span>
                                        <span className="text-slate-300">{step}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {error.recommendedAction.estimatedResolutionTime && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                      <Clock className="w-3 h-3" />
                                      Estimated time: {error.recommendedAction.estimatedResolutionTime}
                                    </div>
                                  )}
                                </div>

                                {/* Technical Details */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">Error Category</div>
                                    <div className="text-sm text-white">
                                      {ERROR_CATEGORY_META[error.category].label}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">Vendor Error Code</div>
                                    <div className="text-sm text-white font-mono">
                                      {error.vendorErrorCode || 'N/A'}
                                    </div>
                                  </div>
                                </div>

                                {/* Correlation ID */}
                                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg mb-4">
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">Correlation ID</div>
                                    <div className="text-sm text-white font-mono">
                                      {error.correlationId}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyCorrelationId(error.correlationId)}
                                  >
                                    {copiedId === error.correlationId ? (
                                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  {error.recommendedAction.requiresEscalation && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        generateSupportPacket(error, selectedConnectorData.sourceName)
                                      }
                                      className="bg-rose-600 hover:bg-rose-700"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Export Support Packet
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      generateSupportPacket(error, selectedConnectorData.sourceName)
                                    }
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export Details
                                  </Button>
                                  {error.recommendedAction.escalationInfo?.supportUrl && (
                                    <a
                                      href={error.recommendedAction.escalationInfo.supportUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button variant="ghost" size="sm">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Vendor Support
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Select a Connector</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Click on a connector from the list to view its health status, recent issues,
                  and recommended actions.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Playbook Modal */}
      {showPlaybook && (
        <PlaybookModal
          vendorId={showPlaybook}
          onClose={() => setShowPlaybook(null)}
        />
      )}

      {/* Support Boundaries Notice */}
      <Card className="mt-8 bg-slate-800/30 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-700 rounded-xl">
              <HelpCircle className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Understanding Support Boundaries</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <span className="font-medium text-violet-400">EduNode Owns</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Connection orchestration, sync scheduling, retry logic, health monitoring,
                    error classification, and diagnostics.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-amber-400">School/District Action</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Credential management, field mapping configuration, source data quality,
                    and permission/scope approvals.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ExternalLink className="w-4 h-4 text-rose-400" />
                    <span className="font-medium text-rose-400">Vendor Responsibility</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Third-party uptime, API stability, source data correctness,
                    and vendor-side defects or policy changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Playbook Modal Component
 */
function PlaybookModal({ vendorId, onClose }: { vendorId: string; onClose: () => void }) {
  const playbook = getPlaybook(vendorId);

  if (!playbook) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-400">No playbook available for this vendor.</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              {playbook.vendorName} Integration Playbook
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto py-6">
          {/* Support Info */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
            <h4 className="font-semibold text-white text-sm mb-2">Vendor Support</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href={playbook.supportInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Support Portal
              </a>
              {playbook.supportInfo.email && (
                <a
                  href={`mailto:${playbook.supportInfo.email}`}
                  className="text-indigo-400 hover:underline"
                >
                  {playbook.supportInfo.email}
                </a>
              )}
              {playbook.supportInfo.statusPage && (
                <a
                  href={playbook.supportInfo.statusPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" />
                  Status Page
                </a>
              )}
            </div>
          </div>

          {/* Sync Recommendations */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Recommended Sync Frequency</div>
              <div className="text-sm text-white">{playbook.recommendedSyncFrequency}</div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Typical Data Latency</div>
              <div className="text-sm text-white">{playbook.typicalLatency}</div>
            </div>
          </div>

          {/* Failure Modes */}
          <div className="mb-6">
            <h4 className="font-semibold text-white text-sm mb-3">Common Failure Modes</h4>
            <div className="space-y-3">
              {playbook.failureModes.map((mode) => {
                const severityConfig = SEVERITY_CONFIG[mode.severity];
                const partyConfig = PARTY_CONFIG[mode.responsibleParty];
                const PartyIcon = partyConfig.icon;

                return (
                  <div key={mode.id} className="p-4 border border-slate-700 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn('text-xs', severityConfig.bgColor, severityConfig.color)}>
                        {severityConfig.label}
                      </Badge>
                      <Badge className={cn('text-xs', partyConfig.bgColor, partyConfig.color)}>
                        <PartyIcon className="w-3 h-3 mr-1" />
                        {RESPONSIBLE_PARTY_META[mode.responsibleParty].label}
                      </Badge>
                      {mode.canAutoFix && (
                        <Badge className="text-xs bg-emerald-500/20 text-emerald-400">
                          Auto-fixable
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium text-white text-sm mb-1">{mode.name}</div>
                    <div className="text-xs text-slate-400 mb-3">{mode.description}</div>

                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-indigo-400 font-medium mb-1">School Action Required:</div>
                      <div className="text-xs text-slate-300">{mode.schoolAction}</div>
                    </div>

                    {mode.commonCauses.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-500 mb-1">Common Causes:</div>
                        <ul className="text-xs text-slate-400 list-disc list-inside">
                          {mode.commonCauses.map((cause, idx) => (
                            <li key={idx}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-6">
            <h4 className="font-semibold text-white text-sm mb-3">Best Practices</h4>
            <ul className="space-y-2">
              {playbook.bestPractices.map((practice, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Known Limitations */}
          {playbook.knownLimitations.length > 0 && (
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Known Limitations</h4>
              <ul className="space-y-2">
                {playbook.knownLimitations.map((limitation, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
