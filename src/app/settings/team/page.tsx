'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Edit,
  Trash2,
  Key,
  Settings,
  Building2,
  AlertTriangle,
} from 'lucide-react';

type UserRole = 'owner' | 'admin' | 'data_coordinator' | 'teacher' | 'counselor' | 'viewer';
type UserStatus = 'active' | 'pending' | 'deactivated';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
  invitedAt?: string;
  avatar?: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; description: string; color: string }> = {
  owner: {
    label: 'Owner',
    description: 'Full access including billing and team management',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  admin: {
    label: 'Admin',
    description: 'Full access except billing',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  data_coordinator: {
    label: 'Data Coordinator',
    description: 'Manage data imports, exports, and integrations',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  teacher: {
    label: 'Teacher',
    description: 'View assigned students and manage interventions',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  counselor: {
    label: 'Counselor',
    description: 'View all students and manage interventions',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to dashboards',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active: {
    label: 'Active',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-600',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-600',
  },
  deactivated: {
    label: 'Deactivated',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-slate-400',
  },
};

// Mock team data
const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@school.edu', role: 'owner', status: 'active', lastActive: '2 min ago' },
  { id: '2', name: 'Michael Chen', email: 'mchen@school.edu', role: 'admin', status: 'active', lastActive: '1 hour ago' },
  { id: '3', name: 'Emily Rodriguez', email: 'erodriguez@school.edu', role: 'data_coordinator', status: 'active', lastActive: '3 hours ago' },
  { id: '4', name: 'James Wilson', email: 'jwilson@school.edu', role: 'counselor', status: 'active', lastActive: '1 day ago' },
  { id: '5', name: 'Amanda Foster', email: 'afoster@school.edu', role: 'teacher', status: 'active', lastActive: '2 days ago' },
  { id: '6', name: 'David Park', email: 'dpark@school.edu', role: 'teacher', status: 'pending', lastActive: 'Never', invitedAt: '3 days ago' },
  { id: '7', name: 'Lisa Thompson', email: 'lthompson@school.edu', role: 'viewer', status: 'deactivated', lastActive: '30 days ago' },
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function TeamSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [_showInviteModal, _setShowInviteModal] = useState(false);

  const filteredMembers = TEAM_MEMBERS.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = TEAM_MEMBERS.filter(m => m.status === 'active').length;
  const pendingCount = TEAM_MEMBERS.filter(m => m.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-indigo-600">Node</span>
              </span>
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 dark:text-slate-400">Settings</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              <Link
                href="/settings/profile"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/settings/team"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                <Users className="w-4 h-4" />
                Team
              </Link>
              <Link
                href="/settings/roles"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Shield className="w-4 h-4" />
                Roles & Permissions
              </Link>
              <Link
                href="/settings/school"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Building2 className="w-4 h-4" />
                School Settings
              </Link>
              <Link
                href="/settings/api"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Key className="w-4 h-4" />
                API Keys
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Team Members
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {activeCount} active members, {pendingCount} pending invitations
                </p>
              </div>
              <Link
                href="/settings/team/invite"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite Members
              </Link>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </Card>

            {/* Team List */}
            <Card className="overflow-hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMembers.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const statusConfig = STATUS_CONFIG[member.status];

                  return (
                    <div
                      key={member.id}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900 dark:text-white">
                                {member.name}
                              </h3>
                              <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                                {statusConfig.icon}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              {member.status === 'pending'
                                ? `Invited ${member.invitedAt}`
                                : `Active ${member.lastActive}`}
                            </p>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </button>
                            {selectedMember === member.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10">
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                  <Edit className="w-4 h-4" />
                                  Edit Role
                                </button>
                                {member.status === 'pending' && (
                                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <Mail className="w-4 h-4" />
                                    Resend Invite
                                  </button>
                                )}
                                {member.status === 'active' && (
                                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <XCircle className="w-4 h-4" />
                                    Deactivate
                                  </button>
                                )}
                                {member.status === 'deactivated' && (
                                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <CheckCircle className="w-4 h-4" />
                                    Reactivate
                                  </button>
                                )}
                                {member.role !== 'owner' && (
                                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Usage Info */}
            <Card className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Plan Limit: 25 users
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    You have {25 - activeCount} user slots remaining on your Professional plan.
                    <Link href="/pricing" className="text-indigo-600 hover:underline ml-1">
                      Upgrade to Enterprise
                    </Link>{' '}
                    for unlimited users.
                  </p>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
