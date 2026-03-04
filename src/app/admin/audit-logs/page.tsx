'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Shield,
  Database,
  Key,
  Eye,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
} from 'lucide-react';

type AuditAction =
  | 'login'
  | 'logout'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'settings_change'
  | 'permission_change'
  | 'api_access';

interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  category: 'auth' | 'data' | 'admin' | 'api' | 'security';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  school?: {
    id: string;
    name: string;
  };
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

// Mock audit log data
const AUDIT_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: '2026-03-04T14:32:15Z',
    action: 'login',
    category: 'auth',
    user: { id: 'u1', name: 'Sarah Johnson', email: 'sarah.johnson@lincoln.edu', role: 'School Admin' },
    school: { id: 's1', name: 'Lincoln Charter Academy' },
    resource: 'Session',
    details: 'Successful login via SSO (Google)',
    ipAddress: '192.168.1.105',
    userAgent: 'Chrome/122.0.0.0',
    success: true,
  },
  {
    id: '2',
    timestamp: '2026-03-04T14:28:42Z',
    action: 'export',
    category: 'data',
    user: { id: 'u2', name: 'Michael Chen', email: 'mchen@horizon.edu', role: 'Data Coordinator' },
    school: { id: 's2', name: 'Horizon STEM School' },
    resource: 'Student Report',
    resourceId: 'rpt_abc123',
    details: 'Exported at-risk students report (PDF, 45 records)',
    ipAddress: '10.0.0.52',
    userAgent: 'Firefox/123.0',
    success: true,
  },
  {
    id: '3',
    timestamp: '2026-03-04T14:15:33Z',
    action: 'update',
    category: 'data',
    user: { id: 'u3', name: 'Emily Rodriguez', email: 'erodriguez@unity.edu', role: 'Teacher' },
    school: { id: 's3', name: 'Unity Preparatory' },
    resource: 'Intervention',
    resourceId: 'int_xyz789',
    details: 'Updated intervention status: In Progress → Completed',
    ipAddress: '172.16.0.23',
    userAgent: 'Safari/17.3',
    success: true,
  },
  {
    id: '4',
    timestamp: '2026-03-04T13:55:10Z',
    action: 'login',
    category: 'auth',
    user: { id: 'u4', name: 'Unknown', email: 'admin@test.com', role: 'Unknown' },
    resource: 'Session',
    details: 'Failed login attempt - invalid credentials (3rd attempt)',
    ipAddress: '45.33.32.156',
    userAgent: 'curl/7.88.1',
    success: false,
  },
  {
    id: '5',
    timestamp: '2026-03-04T13:42:28Z',
    action: 'permission_change',
    category: 'admin',
    user: { id: 'u5', name: 'David Park', email: 'dpark@edunode.com', role: 'Super Admin' },
    school: { id: 's1', name: 'Lincoln Charter Academy' },
    resource: 'User Permission',
    resourceId: 'usr_def456',
    details: 'Changed role for jsmith@lincoln.edu: Teacher → School Admin',
    ipAddress: '10.10.10.1',
    userAgent: 'Chrome/122.0.0.0',
    success: true,
  },
  {
    id: '6',
    timestamp: '2026-03-04T13:30:00Z',
    action: 'api_access',
    category: 'api',
    user: { id: 'u6', name: 'API Key: prod_horizon', email: 'api@horizon.edu', role: 'API Client' },
    school: { id: 's2', name: 'Horizon STEM School' },
    resource: 'Students API',
    details: 'GET /api/schools/s2/students (200 OK, 890 records)',
    ipAddress: '52.14.144.171',
    userAgent: 'python-requests/2.31.0',
    success: true,
  },
  {
    id: '7',
    timestamp: '2026-03-04T13:15:45Z',
    action: 'settings_change',
    category: 'admin',
    user: { id: 'u7', name: 'Lisa Thompson', email: 'lthompson@evergreen.edu', role: 'School Admin' },
    school: { id: 's4', name: 'Evergreen Charter' },
    resource: 'School Settings',
    details: 'Updated notification preferences: Email digest changed to Weekly',
    ipAddress: '192.168.5.42',
    userAgent: 'Edge/122.0.0.0',
    success: true,
  },
  {
    id: '8',
    timestamp: '2026-03-04T12:58:12Z',
    action: 'view',
    category: 'data',
    user: { id: 'u8', name: 'James Wilson', email: 'jwilson@phoenix.edu', role: 'Principal' },
    school: { id: 's5', name: 'Phoenix Academy' },
    resource: 'Student 360',
    resourceId: 'stu_ghi789',
    details: 'Viewed student profile: Maria Garcia (Grade 8)',
    ipAddress: '10.20.30.40',
    userAgent: 'Chrome/122.0.0.0',
    success: true,
  },
  {
    id: '9',
    timestamp: '2026-03-04T12:45:30Z',
    action: 'create',
    category: 'data',
    user: { id: 'u9', name: 'Amanda Foster', email: 'afoster@lincoln.edu', role: 'Counselor' },
    school: { id: 's1', name: 'Lincoln Charter Academy' },
    resource: 'Intervention',
    resourceId: 'int_new001',
    details: 'Created new Tier 2 intervention for student ID stu_abc123',
    ipAddress: '192.168.1.110',
    userAgent: 'Chrome/122.0.0.0',
    success: true,
  },
  {
    id: '10',
    timestamp: '2026-03-04T12:30:00Z',
    action: 'delete',
    category: 'admin',
    user: { id: 'u5', name: 'David Park', email: 'dpark@edunode.com', role: 'Super Admin' },
    resource: 'API Key',
    resourceId: 'key_old123',
    details: 'Revoked API key for Summit Learning Center (expired account)',
    ipAddress: '10.10.10.1',
    userAgent: 'Chrome/122.0.0.0',
    success: true,
  },
];

const ACTION_CONFIG: Record<AuditAction, { icon: React.ReactNode; label: string; color: string }> = {
  login: { icon: <LogIn className="w-4 h-4" />, label: 'Login', color: 'text-blue-600' },
  logout: { icon: <LogOut className="w-4 h-4" />, label: 'Logout', color: 'text-slate-500' },
  view: { icon: <Eye className="w-4 h-4" />, label: 'View', color: 'text-slate-600' },
  create: { icon: <CheckCircle className="w-4 h-4" />, label: 'Create', color: 'text-emerald-600' },
  update: { icon: <Edit className="w-4 h-4" />, label: 'Update', color: 'text-amber-600' },
  delete: { icon: <Trash2 className="w-4 h-4" />, label: 'Delete', color: 'text-rose-600' },
  export: { icon: <Download className="w-4 h-4" />, label: 'Export', color: 'text-indigo-600' },
  settings_change: { icon: <Settings className="w-4 h-4" />, label: 'Settings', color: 'text-purple-600' },
  permission_change: { icon: <Shield className="w-4 h-4" />, label: 'Permission', color: 'text-orange-600' },
  api_access: { icon: <Key className="w-4 h-4" />, label: 'API', color: 'text-cyan-600' },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  auth: { icon: <Key className="w-4 h-4" />, label: 'Authentication' },
  data: { icon: <Database className="w-4 h-4" />, label: 'Data Access' },
  admin: { icon: <Shield className="w-4 h-4" />, label: 'Administration' },
  api: { icon: <Settings className="w-4 h-4" />, label: 'API' },
  security: { icon: <AlertTriangle className="w-4 h-4" />, label: 'Security' },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const filteredLogs = AUDIT_LOGS.filter(log => {
    const matchesSearch =
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesCategory && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Category', 'User', 'Email', 'Resource', 'Details', 'IP Address', 'Success'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.action,
        log.category,
        log.user.name,
        log.user.email,
        log.resource,
        `"${log.details.replace(/"/g, '""')}"`,
        log.ipAddress,
        log.success ? 'Yes' : 'No',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold">
                  E
                </div>
                <span className="font-bold text-xl tracking-tight">
                  Edu<span className="text-indigo-400">Node</span>
                </span>
              </Link>
              <span className="text-xs bg-rose-500 px-2 py-1 rounded font-semibold uppercase">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/admin" className="text-slate-400 hover:text-white">Dashboard</Link>
              <Link href="/admin/schools" className="text-slate-400 hover:text-white">Schools</Link>
              <Link href="/admin/users" className="text-slate-400 hover:text-white">Users</Link>
              <Link href="/admin/audit-logs" className="text-white font-medium">Audit Logs</Link>
              <Link href="/admin/system" className="text-slate-400 hover:text-white">System</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-indigo-500" />
              Audit Logs
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Complete audit trail of all system activity
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user, email, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="data">Data Access</option>
              <option value="admin">Administration</option>
              <option value="api">API</option>
              <option value="security">Security</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="view">View</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
              <option value="settings_change">Settings Change</option>
              <option value="permission_change">Permission Change</option>
              <option value="api_access">API Access</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    User
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    School
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Details
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedLogs.map((log) => {
                  const actionConfig = ACTION_CONFIG[log.action];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-2 ${actionConfig.color}`}>
                          {actionConfig.icon}
                          <span className="font-medium">{actionConfig.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{log.resource}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {log.user.name}
                            </p>
                            <p className="text-xs text-slate-500">{log.user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.school ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {log.school.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-700 dark:text-slate-300 truncate" title={log.details}>
                          {log.details}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          IP: {log.ipAddress}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* FERPA Notice */}
        <Card className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-400">FERPA Compliance Notice</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                This audit log contains records of all access to student educational records as required by FERPA.
                Logs are retained for 7 years and are available for compliance audits upon request.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
