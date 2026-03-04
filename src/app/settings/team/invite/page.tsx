'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  UserPlus,
  Mail,
  Users,
  Shield,
  ArrowLeft,
  X,
  Plus,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

type UserRole = 'admin' | 'data_coordinator' | 'teacher' | 'counselor' | 'viewer';

interface InviteEntry {
  id: string;
  email: string;
  role: UserRole;
  error?: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Full access except billing' },
  { value: 'data_coordinator', label: 'Data Coordinator', description: 'Manage data imports and exports' },
  { value: 'teacher', label: 'Teacher', description: 'View assigned students' },
  { value: 'counselor', label: 'Counselor', description: 'View all students' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InviteTeamPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteEntry[]>([
    { id: generateId(), email: '', role: 'teacher' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkRole, setBulkRole] = useState<UserRole>('teacher');
  const [showBulkMode, setShowBulkMode] = useState(false);

  const addInvite = () => {
    setInvites([...invites, { id: generateId(), email: '', role: 'teacher' }]);
  };

  const removeInvite = (id: string) => {
    if (invites.length > 1) {
      setInvites(invites.filter(inv => inv.id !== id));
    }
  };

  const updateInvite = (id: string, field: 'email' | 'role', value: string) => {
    setInvites(invites.map(inv =>
      inv.id === id ? { ...inv, [field]: value, error: undefined } : inv
    ));
  };

  const validateInvites = (): boolean => {
    let isValid = true;
    const updatedInvites = invites.map(inv => {
      if (!inv.email.trim()) {
        return { ...inv, error: 'Email is required' };
      }
      if (!validateEmail(inv.email)) {
        isValid = false;
        return { ...inv, error: 'Invalid email format' };
      }
      return { ...inv, error: undefined };
    });
    setInvites(updatedInvites);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateInvites()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Redirect after showing success
    setTimeout(() => {
      router.push('/settings/team');
    }, 2000);
  };

  const handleBulkSubmit = () => {
    const emails = bulkEmails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const newInvites: InviteEntry[] = emails.map(email => ({
      id: generateId(),
      email,
      role: bulkRole,
      error: !validateEmail(email) ? 'Invalid email' : undefined,
    }));

    setInvites(newInvites);
    setShowBulkMode(false);
    setBulkEmails('');
  };

  const validCount = invites.filter(inv => inv.email && validateEmail(inv.email)).length;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Invitations Sent!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {validCount} team member{validCount !== 1 ? 's' : ''} will receive an email invitation to join your school.
          </p>
          <p className="text-sm text-slate-500">
            Redirecting to team settings...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/team"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white">
                Invite Team Members
              </h1>
              <p className="text-sm text-slate-500">Lincoln Charter Academy</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Mode Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowBulkMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !showBulkMode
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Individual Invites
          </button>
          <button
            onClick={() => setShowBulkMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showBulkMode
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 inline-block mr-2" />
            Bulk Import
          </button>
        </div>

        {showBulkMode ? (
          /* Bulk Import Mode */
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
              Bulk Import
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Paste email addresses separated by commas or new lines.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Addresses
              </label>
              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="john@school.edu, jane@school.edu&#10;mike@school.edu"
                rows={6}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Role for All Users
              </label>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as UserRole)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBulkSubmit}
              disabled={!bulkEmails.trim()}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process Emails
            </button>
          </Card>
        ) : (
          /* Individual Invites Mode */
          <>
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Invite Details
                </h2>
                <span className="text-sm text-slate-500">
                  {validCount} valid invitation{validCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {invites.map((invite, index) => (
                  <div key={invite.id} className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="sr-only">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="email"
                              value={invite.email}
                              onChange={(e) => updateInvite(invite.id, 'email', e.target.value)}
                              placeholder="email@school.edu"
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm ${
                                invite.error
                                  ? 'border-rose-300 dark:border-rose-700'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                            />
                          </div>
                          {invite.error && (
                            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {invite.error}
                            </p>
                          )}
                        </div>
                        <div className="w-48">
                          <label className="sr-only">Role</label>
                          <select
                            value={invite.role}
                            onChange={(e) => updateInvite(invite.id, 'role', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {ROLE_OPTIONS.map(role => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    {invites.length > 1 && (
                      <button
                        onClick={() => removeInvite(invite.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addInvite}
                className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Another
              </button>
            </Card>

            {/* Role Descriptions */}
            <Card className="p-4 mb-6 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    Role Permissions
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    {ROLE_OPTIONS.map(role => (
                      <div key={role.value} className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {role.label}:
                          </span>{' '}
                          <span className="text-slate-500">{role.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/settings/roles"
                    className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
                  >
                    Customize role permissions
                  </Link>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-between">
              <Link
                href="/settings/team"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={validCount === 0 || isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send {validCount} Invitation{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
