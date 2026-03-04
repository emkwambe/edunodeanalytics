'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Shield,
  Users,
  Settings,
  Key,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Edit,
  Plus,
  Info,
  Lock,
  Eye,
  Pencil,
  Trash2,
  Database,
  BarChart3,
  FileText,
  Bell,
  Zap,
} from 'lucide-react';

type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: Record<string, PermissionLevel>;
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'students',
    name: 'Student Data',
    icon: <Users className="w-4 h-4" />,
    permissions: [
      { id: 'students.view', name: 'View Students', description: 'View student profiles and data' },
      { id: 'students.edit', name: 'Edit Students', description: 'Modify student information' },
      { id: 'students.export', name: 'Export Students', description: 'Export student data to CSV/PDF' },
      { id: 'students.360', name: 'Student 360', description: 'Access comprehensive student view' },
    ],
  },
  {
    id: 'interventions',
    name: 'Interventions',
    icon: <Zap className="w-4 h-4" />,
    permissions: [
      { id: 'interventions.view', name: 'View Interventions', description: 'View intervention plans' },
      { id: 'interventions.create', name: 'Create Interventions', description: 'Create new intervention plans' },
      { id: 'interventions.edit', name: 'Edit Interventions', description: 'Modify existing interventions' },
      { id: 'interventions.delete', name: 'Delete Interventions', description: 'Remove intervention records' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    icon: <BarChart3 className="w-4 h-4" />,
    permissions: [
      { id: 'analytics.dashboard', name: 'View Dashboard', description: 'Access main analytics dashboard' },
      { id: 'analytics.reports', name: 'View Reports', description: 'Access pre-built reports' },
      { id: 'analytics.custom', name: 'Custom Reports', description: 'Create custom reports' },
      { id: 'analytics.export', name: 'Export Reports', description: 'Download report data' },
    ],
  },
  {
    id: 'data',
    name: 'Data Management',
    icon: <Database className="w-4 h-4" />,
    permissions: [
      { id: 'data.import', name: 'Import Data', description: 'Upload data files' },
      { id: 'data.sync', name: 'Manage Sync', description: 'Configure data integrations' },
      { id: 'data.audit', name: 'View Audit Logs', description: 'Access audit trail' },
    ],
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: <Settings className="w-4 h-4" />,
    permissions: [
      { id: 'admin.users', name: 'Manage Users', description: 'Invite and manage team members' },
      { id: 'admin.roles', name: 'Manage Roles', description: 'Edit role permissions' },
      { id: 'admin.school', name: 'School Settings', description: 'Configure school preferences' },
      { id: 'admin.billing', name: 'Billing', description: 'Access billing and subscription' },
    ],
  },
];

const ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features including billing',
    isSystem: true,
    userCount: 1,
    permissions: Object.fromEntries(
      PERMISSION_CATEGORIES.flatMap(cat =>
        cat.permissions.map(p => [p.id, 'full' as PermissionLevel])
      )
    ),
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access except billing management',
    isSystem: true,
    userCount: 2,
    permissions: {
      ...Object.fromEntries(
        PERMISSION_CATEGORIES.flatMap(cat =>
          cat.permissions.map(p => [p.id, 'full' as PermissionLevel])
        )
      ),
      'admin.billing': 'none',
    },
  },
  {
    id: 'data_coordinator',
    name: 'Data Coordinator',
    description: 'Manage data imports and integrations',
    isSystem: true,
    userCount: 1,
    permissions: {
      'students.view': 'full',
      'students.edit': 'full',
      'students.export': 'full',
      'students.360': 'full',
      'interventions.view': 'view',
      'interventions.create': 'none',
      'interventions.edit': 'none',
      'interventions.delete': 'none',
      'analytics.dashboard': 'full',
      'analytics.reports': 'full',
      'analytics.custom': 'full',
      'analytics.export': 'full',
      'data.import': 'full',
      'data.sync': 'full',
      'data.audit': 'full',
      'admin.users': 'view',
      'admin.roles': 'none',
      'admin.school': 'view',
      'admin.billing': 'none',
    },
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'View assigned students and manage interventions',
    isSystem: true,
    userCount: 15,
    permissions: {
      'students.view': 'view',
      'students.edit': 'none',
      'students.export': 'none',
      'students.360': 'view',
      'interventions.view': 'full',
      'interventions.create': 'full',
      'interventions.edit': 'edit',
      'interventions.delete': 'none',
      'analytics.dashboard': 'view',
      'analytics.reports': 'view',
      'analytics.custom': 'none',
      'analytics.export': 'none',
      'data.import': 'none',
      'data.sync': 'none',
      'data.audit': 'none',
      'admin.users': 'none',
      'admin.roles': 'none',
      'admin.school': 'none',
      'admin.billing': 'none',
    },
  },
  {
    id: 'counselor',
    name: 'Counselor',
    description: 'View all students and manage interventions',
    isSystem: true,
    userCount: 3,
    permissions: {
      'students.view': 'full',
      'students.edit': 'view',
      'students.export': 'full',
      'students.360': 'full',
      'interventions.view': 'full',
      'interventions.create': 'full',
      'interventions.edit': 'full',
      'interventions.delete': 'edit',
      'analytics.dashboard': 'full',
      'analytics.reports': 'full',
      'analytics.custom': 'view',
      'analytics.export': 'full',
      'data.import': 'none',
      'data.sync': 'none',
      'data.audit': 'none',
      'admin.users': 'none',
      'admin.roles': 'none',
      'admin.school': 'none',
      'admin.billing': 'none',
    },
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboards',
    isSystem: true,
    userCount: 3,
    permissions: {
      'students.view': 'view',
      'students.edit': 'none',
      'students.export': 'none',
      'students.360': 'view',
      'interventions.view': 'view',
      'interventions.create': 'none',
      'interventions.edit': 'none',
      'interventions.delete': 'none',
      'analytics.dashboard': 'view',
      'analytics.reports': 'view',
      'analytics.custom': 'none',
      'analytics.export': 'none',
      'data.import': 'none',
      'data.sync': 'none',
      'data.audit': 'none',
      'admin.users': 'none',
      'admin.roles': 'none',
      'admin.school': 'none',
      'admin.billing': 'none',
    },
  },
];

const PERMISSION_LEVELS: { value: PermissionLevel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'none', label: 'No Access', icon: <X className="w-3 h-3" />, color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500' },
  { value: 'view', label: 'View', icon: <Eye className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'edit', label: 'Edit', icon: <Pencil className="w-3 h-3" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'full', label: 'Full', icon: <Check className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

function PermissionBadge({ level }: { level: PermissionLevel }) {
  const config = PERMISSION_LEVELS.find(p => p.value === level)!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    PERMISSION_CATEGORIES.map(c => c.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const currentRole = ROLES.find(r => r.id === selectedRole)!;

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
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Users className="w-4 h-4" />
                Team
              </Link>
              <Link
                href="/settings/roles"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium"
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
                  Roles & Permissions
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Configure access levels for your team
                </p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" />
                Create Custom Role
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Role List */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      Roles
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          selectedRole === role.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900 dark:text-white">
                                {role.name}
                              </h3>
                              {role.isSystem && (
                                <Lock className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                            selectedRole === role.id ? 'text-indigo-600' : ''
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Permission Matrix */}
              <div className="lg:col-span-2">
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                          {currentRole.name} Permissions
                        </h2>
                        <p className="text-sm text-slate-500">
                          {currentRole.description}
                        </p>
                      </div>
                      {!currentRole.isSystem && (
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                          <Edit className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {PERMISSION_CATEGORIES.map((category) => (
                      <div key={category.id}>
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {category.icon}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {category.name}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                            expandedCategories.includes(category.id) ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {expandedCategories.includes(category.id) && (
                          <div className="px-4 pb-4 space-y-2">
                            {category.permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between py-2 pl-12"
                              >
                                <div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {permission.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {permission.description}
                                  </p>
                                </div>
                                <PermissionBadge
                                  level={currentRole.permissions[permission.id] || 'none'}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* System Role Notice */}
                {currentRole.isSystem && (
                  <Card className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-400">
                          System Role
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          This is a default system role and cannot be modified. Create a custom role if you need different permissions.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
