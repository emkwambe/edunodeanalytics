'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { useCurrentSchool } from '@/lib/hooks/use-school-context';
import { useIntervention } from '@/lib/hooks/use-interventions';
import { StudentContextCard } from '@/components/interventions';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  FileText,
  TrendingUp,
} from 'lucide-react';

/**
 * Intervention Detail Page
 *
 * Shows intervention details, progress tracking, and session logging.
 * Connects to the dosage API for session management.
 */

type SessionStatus = 'scheduled' | 'completed' | 'partial' | 'cancelled' | 'no_show';

interface Session {
  id: string;
  interventionId: string;
  scheduledDate: string;
  scheduledStartTime: string | null;
  scheduledDurationMinutes: number;
  actualDate: string | null;
  actualDurationMinutes: number | null;
  status: SessionStatus;
  fidelityScore: number | null;
  studentEngaged: boolean | null;
  sessionNotes: string | null;
  deliveredBy: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planned', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-rose-400', bg: 'bg-rose-500/20' },
};

const SESSION_STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Scheduled', color: 'text-slate-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-emerald-400', icon: CheckCircle2 },
  partial: { label: 'Partial', color: 'text-amber-400', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'text-rose-400', icon: XCircle },
  no_show: { label: 'No Show', color: 'text-red-400', icon: XCircle },
};

export default function InterventionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.school_slug as string;
  const interventionId = params.interventionId as string;

  const { schoolId } = useCurrentSchool(schoolSlug);
  const { intervention, isLoading, mutate } = useIntervention(schoolId, interventionId);

  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);
  const [showLogForm, setShowLogForm] = React.useState<string | null>(null);
  const [showAddNote, setShowAddNote] = React.useState(false);
  const [noteText, setNoteText] = React.useState('');
  const [savingNote, setSavingNote] = React.useState(false);

  // Log form state
  const [logForm, setLogForm] = React.useState({
    status: 'completed' as SessionStatus,
    actualDurationMinutes: 30,
    fidelityScore: 85,
    studentEngaged: true,
    sessionNotes: '',
  });

  // Fetch sessions
  React.useEffect(() => {
    if (!schoolId || !interventionId) return;
    setSessionsLoading(true);
    fetch(`/api/schools/${schoolId}/dosage/${interventionId}/sessions`)
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []))
      .catch(console.error)
      .finally(() => setSessionsLoading(false));
  }, [schoolId, interventionId]);

  // Log session delivery
  const handleLogSession = async (sessionId: string) => {
    if (!schoolId) return;
    try {
      const res = await fetch(
        `/api/schools/${schoolId}/dosage/${interventionId}/sessions/${sessionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: logForm.status,
            actualDate: new Date().toISOString().split('T')[0],
            actualDurationMinutes: logForm.actualDurationMinutes,
            studentEngaged: logForm.studentEngaged,
            sessionNotes: logForm.sessionNotes,
          }),
        }
      );
      if (res.ok) {
        // Refresh sessions
        const updated = await fetch(
          `/api/schools/${schoolId}/dosage/${interventionId}/sessions`
        ).then((r) => r.json());
        setSessions(updated.data || []);
        setShowLogForm(null);
        setLogForm({
          status: 'completed',
          actualDurationMinutes: 30,
          fidelityScore: 85,
          studentEngaged: true,
          sessionNotes: '',
        });
      }
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  // Add progress note
  const handleAddNote = async () => {
    if (!schoolId || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/interventions/${interventionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_notes: [
            ...((intervention as Record<string, unknown>)?.progress_notes as Array<Record<string, string>> || []),
            {
              date: new Date().toISOString().split('T')[0],
              note: noteText,
              updatedBy: 'current-user',
            },
          ],
        }),
      });
      if (res.ok) {
        mutate();
        setNoteText('');
        setShowAddNote(false);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Schedule a new session
  const handleScheduleSession = async () => {
    if (!schoolId) return;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    try {
      const res = await fetch(
        `/api/schools/${schoolId}/dosage/${interventionId}/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledDate: nextDate.toISOString().split('T')[0],
            scheduledStartTime: '09:00',
            scheduledDurationMinutes: 30,
            modality: 'in_person',
          }),
        }
      );
      if (res.ok) {
        const updated = await fetch(
          `/api/schools/${schoolId}/dosage/${interventionId}/sessions`
        ).then((r) => r.json());
        setSessions(updated.data || []);
      }
    } catch (err) {
      console.error('Failed to schedule session:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading intervention...</div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-400">Intervention Not Found</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${schoolSlug}/interventions`)}
        >
          Back to Interventions
        </Button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iv = intervention as Record<string, any>;
  const statusConfig = STATUS_CONFIG[(iv.status as string) || 'planned'];
  const progressNotes = (iv.progress_notes as Array<{ date: string; note: string; updatedBy: string }>) || [];
  const progressPct =
    iv.baseline_value != null && iv.target_value != null && iv.current_value != null
      ? Math.round(
          (((iv.current_value as number) - (iv.baseline_value as number)) /
            ((iv.target_value as number) - (iv.baseline_value as number))) *
            100
        )
      : null;

  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'partial').length;
  const totalSessions = sessions.length;
  const _scheduledSessions = sessions.filter((s) => s.status === 'scheduled');

  return (
    <PageFeatureGate featureKey="intervention_hub">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/${schoolSlug}/interventions`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">{iv.title as string}</h1>
              <Badge className={cn('text-xs', statusConfig.bg, statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">{iv.description as string}</p>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-black text-white">{iv.type as string}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Type</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-black text-amber-400">{iv.priority as string}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Priority</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-black text-cyan-400">
                {completedSessions}/{totalSessions}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Sessions</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-5 pb-4 text-center">
              <div className={cn('text-2xl font-black', progressPct != null && progressPct >= 80 ? 'text-emerald-400' : progressPct != null && progressPct >= 50 ? 'text-amber-400' : 'text-rose-400')}>
                {progressPct != null ? `${Math.min(100, Math.max(0, progressPct))}%` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Sprint 5D: Student Context Card */}
        {schoolId && iv.student_id && (
          <StudentContextCard
            schoolId={schoolId}
            studentId={iv.student_id as string}
          />
        )}

        {/* Goal & Metrics */}
        {iv.goal && (
          <Card className="bg-indigo-900/20 border-indigo-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-white">Goal & Progress</h2>
              </div>
              <p className="text-sm text-slate-300 mb-4">{iv.goal as string}</p>
              {iv.baseline_value != null && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-slate-400">{iv.baseline_value as number}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Baseline</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-cyan-400">{iv.current_value as number}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Current</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">{iv.target_value as number}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Target</div>
                  </div>
                </div>
              )}
              {progressPct != null && (
                <div className="mt-4">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Sessions ({totalSessions})
              </h2>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                onClick={handleScheduleSession}
              >
                <Plus className="w-3 h-3 mr-1" />
                Schedule Session
              </Button>
            </div>

            {sessionsLoading ? (
              <div className="text-slate-400 text-sm animate-pulse">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="py-8 text-center">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No sessions scheduled yet.</p>
                  <Button
                    size="sm"
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-xs"
                    onClick={handleScheduleSession}
                  >
                    Schedule First Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const sConfig = SESSION_STATUS_CONFIG[session.status];
                  const StatusIcon = sConfig.icon;
                  const isLogging = showLogForm === session.id;

                  return (
                    <Card key={session.id} className="bg-slate-800/30 border-slate-700">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <StatusIcon className={cn('w-4 h-4', sConfig.color)} />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {new Date(session.scheduledDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                {session.scheduledStartTime && ` at ${session.scheduledStartTime}`}
                              </div>
                              <div className="text-xs text-slate-500">
                                {session.scheduledDurationMinutes} min
                                {session.sessionNotes && ` - ${session.sessionNotes}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn('text-[10px]', sConfig.color)}>
                              {sConfig.label}
                            </Badge>
                            {session.status === 'scheduled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => setShowLogForm(isLogging ? null : session.id)}
                              >
                                Log
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Log Form */}
                        {isLogging && (
                          <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Status</label>
                                <select
                                  value={logForm.status}
                                  onChange={(e) =>
                                    setLogForm({ ...logForm, status: e.target.value as SessionStatus })
                                  }
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                                >
                                  <option value="completed">Completed</option>
                                  <option value="partial">Partial</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="no_show">No Show</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                  Duration (min)
                                </label>
                                <input
                                  type="number"
                                  value={logForm.actualDurationMinutes}
                                  onChange={(e) =>
                                    setLogForm({
                                      ...logForm,
                                      actualDurationMinutes: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">
                                <input
                                  type="checkbox"
                                  checked={logForm.studentEngaged}
                                  onChange={(e) =>
                                    setLogForm({ ...logForm, studentEngaged: e.target.checked })
                                  }
                                  className="mr-2"
                                />
                                Student was engaged
                              </label>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Notes</label>
                              <textarea
                                value={logForm.sessionNotes}
                                onChange={(e) =>
                                  setLogForm({ ...logForm, sessionNotes: e.target.value })
                                }
                                rows={2}
                                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                                placeholder="Session notes..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleLogSession(session.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                                onClick={() => setShowLogForm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress Notes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Progress Notes ({progressNotes.length})
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setShowAddNote(!showAddNote)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Note
              </Button>
            </div>

            {showAddNote && (
              <Card className="bg-slate-800/50 border-indigo-500/30">
                <CardContent className="pt-4 space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                    placeholder="Enter progress note..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleAddNote}
                      disabled={savingNote || !noteText.trim()}
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        setShowAddNote(false);
                        setNoteText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {progressNotes.length === 0 ? (
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="py-8 text-center">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No progress notes yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {[...progressNotes].reverse().map((note, idx) => (
                  <Card key={idx} className="bg-slate-800/30 border-slate-700">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(note.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{note.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Timeline
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">Start Date</div>
                <div className="text-white font-medium">
                  {iv.start_date
                    ? new Date(iv.start_date as string).toLocaleDateString()
                    : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">Target End</div>
                <div className="text-white font-medium">
                  {iv.target_end_date
                    ? new Date(iv.target_end_date as string).toLocaleDateString()
                    : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">Created</div>
                <div className="text-white font-medium">
                  {iv.created_at
                    ? new Date(iv.created_at as string).toLocaleDateString()
                    : '--'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">Last Updated</div>
                <div className="text-white font-medium">
                  {iv.updated_at
                    ? new Date(iv.updated_at as string).toLocaleDateString()
                    : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFeatureGate>
  );
}
