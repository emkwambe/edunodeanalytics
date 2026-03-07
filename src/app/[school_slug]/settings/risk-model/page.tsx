'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSchoolBySlug } from '@/lib/hooks/use-school-context';
import { useRiskConfig } from '@/lib/hooks/use-risk';
import {
  Sliders,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  RefreshCw,
  ArrowLeft,
  Info,
} from 'lucide-react';

/**
 * Risk Model Configuration Page
 *
 * Allows school admins to configure:
 * - Weights for 5 risk indicators (must sum to 100%)
 * - Threshold boundaries for 3 risk tiers
 * - Indicator parameters (attendance floor, assessment floor, etc.)
 * - Preview: compute classification for sample student
 */

interface RiskWeights {
  attendance: number;
  academic: number;
  assignments: number;
  behavior: number;
  trend: number;
}

interface RiskThresholds {
  onTrack: number;
  watch: number;
  atRisk: number;
}

interface RiskIndicators {
  attendanceFloor: number;
  attendanceCritical: number;
  assignmentMissingWarn: number;
  behaviorIncidentCap: number;
  assessmentFloorPct: number;
  trendLookbackWeeks: number;
  trendDeclineThreshold: number;
}

const DEFAULT_WEIGHTS: RiskWeights = {
  attendance: 0.25,
  academic: 0.30,
  assignments: 0.20,
  behavior: 0.10,
  trend: 0.15,
};

const DEFAULT_THRESHOLDS: RiskThresholds = {
  onTrack: 0.30,
  watch: 0.50,
  atRisk: 0.70,
};

const DEFAULT_INDICATORS: RiskIndicators = {
  attendanceFloor: 90,
  attendanceCritical: 80,
  assignmentMissingWarn: 3,
  behaviorIncidentCap: 5,
  assessmentFloorPct: 25,
  trendLookbackWeeks: 6,
  trendDeclineThreshold: 0.15,
};

export default function RiskModelConfigPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.school_slug as string;
  const { school, isLoading: schoolLoading } = useSchoolBySlug(schoolSlug);
  const schoolId = school?.id ?? null;

  // Load current config
  const { config, isLoading: configLoading, mutate } = useRiskConfig(schoolId);

  // Local state for editing
  const [weights, setWeights] = React.useState<RiskWeights>(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = React.useState<RiskThresholds>(DEFAULT_THRESHOLDS);
  const [indicators, setIndicators] = React.useState<RiskIndicators>(DEFAULT_INDICATORS);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Preview student values
  const [previewAttendance, setPreviewAttendance] = React.useState(82);
  const [previewMathPercentile, setPreviewMathPercentile] = React.useState(35);

  // Sync config to local state
  React.useEffect(() => {
    if (config) {
      setWeights(config.weights);
      setThresholds(config.thresholds);
      setIndicators(config.indicators);
    }
  }, [config]);

  // Calculate weight sum
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const weightsValid = Math.abs(weightSum - 1.0) < 0.01;

  // Validate thresholds
  const thresholdsValid =
    thresholds.onTrack < thresholds.watch &&
    thresholds.watch < thresholds.atRisk &&
    thresholds.atRisk <= 1.0;

  // Calculate preview risk score
  const calculatePreviewRisk = () => {
    // Simplified risk calculation for preview
    let score = 0;

    // Attendance factor (normalized 0-1, lower attendance = higher risk)
    const attendanceScore = Math.max(0, (100 - previewAttendance) / 20);
    score += attendanceScore * weights.attendance;

    // Academic factor (normalized 0-1, lower percentile = higher risk)
    const academicScore = Math.max(0, (100 - previewMathPercentile) / 75);
    score += academicScore * weights.academic;

    // Assume neutral for other factors
    score += 0.3 * weights.assignments;
    score += 0.2 * weights.behavior;
    score += 0.3 * weights.trend;

    return Math.min(1, Math.max(0, score));
  };

  const previewScore = calculatePreviewRisk();
  const previewLevel =
    previewScore <= thresholds.onTrack
      ? 'on_track'
      : previewScore <= thresholds.watch
      ? 'watch'
      : previewScore <= thresholds.atRisk
      ? 'at_risk'
      : 'critical';

  // Save config
  const handleSave = async () => {
    if (!schoolId || !weightsValid || !thresholdsValid) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/schools/${schoolId}/risk/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weights,
          thresholds,
          indicators,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSaveSuccess(true);
      mutate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    setThresholds(DEFAULT_THRESHOLDS);
    setIndicators(DEFAULT_INDICATORS);
  };

  // Weight slider change
  const handleWeightChange = (key: keyof RiskWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value / 100 }));
  };

  if (schoolLoading || configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Risk Model Configuration"
        description="Configure risk calculation weights, thresholds, and indicators"
        breadcrumbs={[
          { label: 'Settings', href: `/${schoolSlug}/settings` },
          { label: 'Risk Model' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/${schoolSlug}/settings`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !weightsValid || !thresholdsValid}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Save Status */}
      {saveError && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{saveError}</span>
        </div>
      )}
      {saveSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300">Configuration saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weights & Thresholds */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Risk Factor Weights
                </CardTitle>
                <Badge
                  className={cn(
                    'text-xs',
                    weightsValid
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  Total: {Math.round(weightSum * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-400">
                Adjust how much each factor contributes to the overall risk score.
                Weights must sum to 100%.
              </p>

              {[
                { key: 'attendance', label: 'Attendance', description: 'Days present vs enrolled' },
                { key: 'academic', label: 'Academic Performance', description: 'Assessment scores & proficiency' },
                { key: 'assignments', label: 'Assignments', description: 'Missing assignment rate' },
                { key: 'behavior', label: 'Behavior', description: 'Discipline incidents' },
                { key: 'trend', label: 'Trend', description: 'Historical trajectory' },
              ].map(({ key, label, description }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-white">{label}</label>
                      <p className="text-xs text-slate-500">{description}</p>
                    </div>
                    <span className="text-lg font-bold text-cyan-400">
                      {Math.round(weights[key as keyof RiskWeights] * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={Math.round(weights[key as keyof RiskWeights] * 100)}
                    onChange={(e) =>
                      handleWeightChange(key as keyof RiskWeights, parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              ))}

              {!weightsValid && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">
                    Weights must sum to exactly 100%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Level Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-400">
                Define score boundaries for each risk tier. Values must be ascending.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'onTrack', label: 'On Track', color: 'emerald', description: '< this score' },
                  { key: 'watch', label: 'Watch', color: 'amber', description: '< this score' },
                  { key: 'atRisk', label: 'At Risk', color: 'orange', description: '< this score' },
                ].map(({ key, label, color, description }) => (
                  <div
                    key={key}
                    className={cn(
                      'p-4 rounded-lg border',
                      `border-${color}-500/30 bg-${color}-500/10`
                    )}
                  >
                    <label className="text-sm font-medium text-white block mb-1">
                      {label}
                    </label>
                    <p className="text-xs text-slate-500 mb-2">{description}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(thresholds[key as keyof RiskThresholds] * 100)}
                        onChange={(e) =>
                          setThresholds((prev) => ({
                            ...prev,
                            [key]: parseInt(e.target.value) / 100,
                          }))
                        }
                        className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-center focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-400">
                Students scoring above {Math.round(thresholds.atRisk * 100)}% are classified as <strong className="text-red-400">Critical</strong>.
              </p>

              {!thresholdsValid && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">
                    Thresholds must be in ascending order: On Track &lt; Watch &lt; At Risk
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indicator Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicator Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Fine-tune how individual indicators are calculated.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Attendance Floor (%)</label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={indicators.attendanceFloor}
                    onChange={(e) =>
                      setIndicators((prev) => ({
                        ...prev,
                        attendanceFloor: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">Below this = concerning</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Attendance Critical (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="90"
                    value={indicators.attendanceCritical}
                    onChange={(e) =>
                      setIndicators((prev) => ({
                        ...prev,
                        attendanceCritical: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">Below this = critical</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Assessment Floor (percentile)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={indicators.assessmentFloorPct}
                    onChange={(e) =>
                      setIndicators((prev) => ({
                        ...prev,
                        assessmentFloorPct: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">Below this = significant concern</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Trend Lookback (weeks)</label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={indicators.trendLookbackWeeks}
                    onChange={(e) =>
                      setIndicators((prev) => ({
                        ...prev,
                        trendLookbackWeeks: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">Weeks to analyze for trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                Preview Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Enter sample student data to see how they would be classified.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Attendance Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={previewAttendance}
                    onChange={(e) => setPreviewAttendance(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Math Percentile</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={previewMathPercentile}
                    onChange={(e) => setPreviewMathPercentile(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-2">Calculated Risk Score</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {Math.round(previewScore * 100)}%
                  </p>
                  <Badge
                    className={cn(
                      'text-sm px-3 py-1',
                      previewLevel === 'on_track' && 'bg-emerald-500/20 text-emerald-400',
                      previewLevel === 'watch' && 'bg-amber-500/20 text-amber-400',
                      previewLevel === 'at_risk' && 'bg-orange-500/20 text-orange-400',
                      previewLevel === 'critical' && 'bg-red-500/20 text-red-400'
                    )}
                  >
                    {previewLevel === 'on_track'
                      ? 'On Track'
                      : previewLevel === 'watch'
                      ? 'Watch'
                      : previewLevel === 'at_risk'
                      ? 'At Risk'
                      : 'Critical'}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                  <p className="text-xs text-slate-400">
                    With these settings, a student with {previewAttendance}% attendance and{' '}
                    {previewMathPercentile}th percentile math would be classified as:{' '}
                    <strong
                      className={cn(
                        previewLevel === 'on_track' && 'text-emerald-400',
                        previewLevel === 'watch' && 'text-amber-400',
                        previewLevel === 'at_risk' && 'text-orange-400',
                        previewLevel === 'critical' && 'text-red-400'
                      )}
                    >
                      {previewLevel === 'on_track'
                        ? 'On Track'
                        : previewLevel === 'watch'
                        ? 'Watch'
                        : previewLevel === 'at_risk'
                        ? 'At Risk'
                        : 'Critical'}
                    </strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
