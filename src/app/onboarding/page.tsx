'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Clock,
  Palette,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Calendar,
  Upload,
  Mail,
  Plus,
  Database,
  FileSpreadsheet,
  Link2,
} from 'lucide-react';

/**
 * Principal Onboarding Flow
 *
 * Purpose-Driven Data Settings: Forces the Principal to codify their data culture.
 * - School Identity (name, logo)
 * - Assessment Cadence (Weekly recommended for +45% predictive accuracy)
 * - Mastery Threshold
 * - White-Labeling (brand color selection)
 * - Staff Invitations with RBAC
 */

type OnboardingStep = 'identity' | 'datasource' | 'cadence' | 'invitations' | 'branding';

interface SchoolSetup {
  name: string;
  slug: string;
  logoUrl?: string;
  dataSource: 'csv' | 'sis' | null;
  cadence: 'weekly' | 'biweekly';
  masteryThreshold: number;
  diagnosticWindow: number;
  primaryColor: string;
  invites: { email: string; role: string; status: string }[];
}

const COLOR_OPTIONS = [
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Violet', value: '#8b5cf6', class: 'bg-violet-500' },
  { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
];

const STEPS: { id: OnboardingStep; label: string; icon: React.ReactNode }[] = [
  { id: 'identity', label: 'School Identity', icon: <Building2 size={18} /> },
  { id: 'datasource', label: 'Data Source', icon: <Database size={18} /> },
  { id: 'cadence', label: 'Data Cadence', icon: <Clock size={18} /> },
  { id: 'invitations', label: 'Staff Invitations', icon: <Users size={18} /> },
  { id: 'branding', label: 'White-Labeling', icon: <Palette size={18} /> },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>('identity');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [setup, setSetup] = React.useState<SchoolSetup>({
    name: '',
    slug: '',
    dataSource: null,
    cadence: 'weekly',
    masteryThreshold: 80,
    diagnosticWindow: 21,
    primaryColor: '#6366f1',
    invites: [],
  });

  const [newInviteEmail, setNewInviteEmail] = React.useState('');

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateSetup = (updates: Partial<SchoolSetup>) => {
    setSetup((prev) => ({ ...prev, ...updates }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    updateSetup({ name, slug: generateSlug(name) });
  };

  const addInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail) return;
    updateSetup({
      invites: [
        { email: newInviteEmail, role: 'Teacher', status: 'Pending' },
        ...setup.invites,
      ],
    });
    setNewInviteEmail('');
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    // In production: Save to Supabase, create tenant, etc.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const schoolSlug = setup.slug || 'demo';

    // Navigate based on data source selection
    if (setup.dataSource === 'csv') {
      // Go to CSV import page first
      router.push(`/${schoolSlug}/settings/import`);
    } else if (setup.dataSource === 'sis') {
      // Go to SIS configuration page
      router.push(`/${schoolSlug}/settings/integrations`);
    } else {
      // Default to dashboard
      router.push(`/${schoolSlug}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            E
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">EduNode</span>
        </div>

        <nav className="space-y-2 flex-grow">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition',
                currentStep === step.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              )}
            >
              {step.icon}
              <span>{step.label}</span>
              {idx < currentStepIndex && (
                <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-400" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Zap size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Onboarding {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-8 md:p-12">
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Identity */}
          {currentStep === 'identity' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-3xl font-black text-white">School Identity</h2>
                <p className="text-slate-400 mt-2">
                  Set up the foundational metadata for your school tenant.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={setup.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Academy of Tomorrow"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Subdomain Slug
                  </label>
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden px-4">
                    <span className="text-slate-500 text-sm">app.edunode.com/</span>
                    <input
                      type="text"
                      value={setup.slug}
                      onChange={(e) => updateSetup({ slug: generateSlug(e.target.value) })}
                      className="bg-transparent py-3 flex-grow focus:outline-none text-sm font-bold text-indigo-400"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-2xl">
                    {setup.name ? setup.name.charAt(0).toUpperCase() : '🏛️'}
                  </div>
                  <div>
                    <div className="font-bold text-white">School Logo</div>
                    <div className="text-xs text-slate-500">PNG or SVG, Max 2MB.</div>
                  </div>
                </div>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Data Source Selection */}
          {currentStep === 'datasource' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-3xl font-black text-white">Choose Your Data Source</h2>
                <p className="text-slate-400 mt-2">
                  How would you like to import your student data? You can always add more sources later.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => updateSetup({ dataSource: 'csv' })}
                  className={cn(
                    'p-6 rounded-2xl border-2 transition cursor-pointer',
                    setup.dataSource === 'csv'
                      ? 'border-emerald-500 bg-emerald-900/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <FileSpreadsheet size={24} />
                    </div>
                    {setup.dataSource === 'csv' && (
                      <CheckCircle2 className="text-emerald-400" size={20} />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white">CSV Upload</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Upload student rosters, attendance, and assessment data via CSV files.
                    Great for quick setup or schools without SIS integration.
                  </p>
                  <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Quick Start
                  </Badge>
                </div>

                <div
                  onClick={() => updateSetup({ dataSource: 'sis' })}
                  className={cn(
                    'p-6 rounded-2xl border-2 transition cursor-pointer',
                    setup.dataSource === 'sis'
                      ? 'border-indigo-500 bg-indigo-900/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Link2 size={24} />
                    </div>
                    {setup.dataSource === 'sis' && (
                      <CheckCircle2 className="text-indigo-400" size={20} />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white">SIS Integration</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Connect to PowerSchool, Infinite Campus, Clever, or ClassLink for
                    automatic daily sync of student data.
                  </p>
                  <Badge className="mt-3 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                    Recommended for Automation
                  </Badge>
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4 text-cyan-500">
                <Database size={20} className="flex-shrink-0" />
                <p className="text-xs leading-relaxed text-slate-300">
                  Don&apos;t worry — you can import data via CSV now and connect your SIS later.
                  The risk engine works with either source.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Data Cadence */}
          {currentStep === 'cadence' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-3xl font-black text-white">Data Entry Cadence</h2>
                <p className="text-slate-400 mt-2">
                  Codify your data culture. Define the &quot;Purpose-Driven&quot; frequency for your staff.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => updateSetup({ cadence: 'weekly' })}
                  className={cn(
                    'p-6 rounded-2xl border-2 transition cursor-pointer',
                    setup.cadence === 'weekly'
                      ? 'border-cyan-500 bg-cyan-900/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                      <Clock size={24} />
                    </div>
                    {setup.cadence === 'weekly' && (
                      <CheckCircle2 className="text-cyan-400" size={20} />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white">Weekly Formative</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Teachers enter at least 2 quizzes/checks per week. Best for high-velocity
                    intervention tracking.
                  </p>
                  <Badge className="mt-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Recommended
                  </Badge>
                </div>

                <div
                  onClick={() => updateSetup({ cadence: 'biweekly' })}
                  className={cn(
                    'p-6 rounded-2xl border-2 transition cursor-pointer',
                    setup.cadence === 'biweekly'
                      ? 'border-indigo-500 bg-indigo-900/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Calendar size={24} />
                    </div>
                    {setup.cadence === 'biweekly' && (
                      <CheckCircle2 className="text-indigo-400" size={20} />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white">Bi-Weekly Review</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Standard 14-day mastery cycles. Suitable for schools with lower data entry
                    overhead.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4 text-amber-500">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p className="text-xs leading-relaxed italic text-slate-300">
                  &quot;Setting a <strong className="text-amber-400">Weekly Cadence</strong> increases
                  predictive model accuracy by <strong className="text-amber-400">45%</strong> compared
                  to Monthly entry.&quot;
                </p>
              </div>

              {/* Mastery Threshold */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mastery Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="60"
                    max="90"
                    value={setup.masteryThreshold}
                    onChange={(e) => updateSetup({ masteryThreshold: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="text-2xl font-black text-cyan-400 w-20 text-right">
                    {setup.masteryThreshold}%
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Students reaching this threshold are considered &quot;Mastered&quot; and can exit Tier 2
                  interventions.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Staff Invitations */}
          {currentStep === 'invitations' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-3xl font-black text-white">Staff Invitations</h2>
                <p className="text-slate-400 mt-2">
                  Onboard your team into the EduNode ecosystem.
                </p>
              </header>

              <form onSubmit={addInvite} className="flex gap-2">
                <div className="relative flex-grow">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    placeholder="teacher@school.org"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
                <Button type="submit">
                  <Plus size={18} className="mr-2" />
                  Invite
                </Button>
              </form>

              {setup.invites.length > 0 && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {setup.invites.map((invite, idx) => (
                        <tr key={idx} className="text-sm text-white">
                          <td className="px-6 py-4 font-medium">{invite.email}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{invite.role}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-amber-400">
                              {invite.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {setup.invites.length === 0 && (
                <Card className="bg-slate-800/30">
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">No Invitations Yet</h3>
                    <p className="text-sm text-slate-500">
                      Add team members above to get started.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: White-Labeling */}
          {currentStep === 'branding' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-3xl font-black text-white">White-Labeling</h2>
                <p className="text-slate-400 mt-2">
                  Customize the dashboard to match your school&apos;s brand identity.
                </p>
              </header>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Primary Brand Color
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateSetup({ primaryColor: color.value })}
                      className={cn(
                        'p-4 rounded-2xl border-2 transition flex flex-col items-center gap-2',
                        setup.primaryColor === color.value
                          ? 'border-white bg-slate-800'
                          : 'border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl', color.class)} />
                      <span className="text-xs text-slate-400">{color.name}</span>
                      {setup.primaryColor === color.value && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                <h4 className="text-sm font-bold text-slate-400 mb-4">Preview</h4>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: setup.primaryColor }}
                  >
                    {setup.name ? setup.name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {setup.name || 'Your School Name'}
                    </div>
                    <div className="text-sm text-slate-500">
                      app.edunode.com/{setup.slug || 'your-school'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <footer className="mt-12 flex justify-between items-center border-t border-slate-800 pt-8">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              className="text-slate-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Step
            </Button>

            {currentStepIndex < STEPS.length - 1 ? (
              <Button onClick={goNext}>
                Save & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleLaunch}
                disabled={isSubmitting || !setup.name}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Launching...
                  </>
                ) : (
                  <>
                    Launch Portal
                    <Zap className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </footer>
        </div>
      </main>
    </div>
  );
}
