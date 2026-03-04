'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Server,
  Clock,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Shield,
  Settings,
  FileText,
  Bell,
} from 'lucide-react';

interface SchoolSummary {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'churned' | 'suspended';
  studentCount: number;
  userCount: number;
  lastSync: string;
  healthScore: number;
}

interface SystemMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

// Mock data
const SCHOOLS: SchoolSummary[] = [
  { id: '1', name: 'Lincoln Charter Academy', plan: 'professional', status: 'active', studentCount: 450, userCount: 32, lastSync: '2 min ago', healthScore: 98 },
  { id: '2', name: 'Horizon STEM School', plan: 'enterprise', status: 'active', studentCount: 890, userCount: 65, lastSync: '5 min ago', healthScore: 95 },
  { id: '3', name: 'Unity Preparatory', plan: 'professional', status: 'active', studentCount: 320, userCount: 24, lastSync: '12 min ago', healthScore: 92 },
  { id: '4', name: 'Phoenix Academy', plan: 'starter', status: 'trial', studentCount: 180, userCount: 8, lastSync: '1 hour ago', healthScore: 88 },
  { id: '5', name: 'Evergreen Charter', plan: 'professional', status: 'active', studentCount: 560, userCount: 41, lastSync: '3 min ago', healthScore: 97 },
  { id: '6', name: 'Summit Learning Center', plan: 'starter', status: 'churned', studentCount: 0, userCount: 0, lastSync: 'Never', healthScore: 0 },
];

const SYSTEM_METRICS: SystemMetric[] = [
  { label: 'Total Schools', value: 127, change: 5, trend: 'up' },
  { label: 'Active Users', value: '3,842', change: 12, trend: 'up' },
  { label: 'Students Tracked', value: '52,400', change: 8, trend: 'up' },
  { label: 'API Calls (24h)', value: '1.2M', change: -3, trend: 'down' },
];

const RECENT_ALERTS = [
  { id: '1', type: 'warning', message: 'High API latency detected in US-East region', time: '5 min ago' },
  { id: '2', type: 'info', message: 'Scheduled maintenance window: March 10, 2AM-4AM PST', time: '2 hours ago' },
  { id: '3', type: 'error', message: 'Sync failed for Phoenix Academy - retry in progress', time: '3 hours ago' },
  { id: '4', type: 'success', message: 'Database migration completed successfully', time: '1 day ago' },
];

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  professional: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  churned: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  suspended: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

function MetricCard({ metric }: { metric: SystemMetric }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{metric.label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
        {metric.change !== undefined && (
          <span className={`text-sm font-medium flex items-center gap-1 ${
            metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
          }`}>
            <TrendingUp className={`w-4 h-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
            {Math.abs(metric.change)}%
          </span>
        )}
      </div>
    </Card>
  );
}

function AlertIcon({ type }: { type: string }) {
  switch (type) {
    case 'error':
      return <XCircle className="w-5 h-5 text-rose-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-blue-500" />;
  }
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSchools = SCHOOLS.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <Link href="/admin" className="text-white font-medium">Dashboard</Link>
              <Link href="/admin/schools" className="text-slate-400 hover:text-white">Schools</Link>
              <Link href="/admin/users" className="text-slate-400 hover:text-white">Users</Link>
              <Link href="/admin/audit-logs" className="text-slate-400 hover:text-white">Audit Logs</Link>
              <Link href="/admin/system" className="text-slate-400 hover:text-white">System</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              System overview and school management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/system"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors"
            >
              <Server className="w-4 h-4" />
              System Health
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {SYSTEM_METRICS.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Schools List */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    Schools
                  </h2>
                  <Link href="/admin/schools" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search schools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="churned">Churned</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {school.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${PLAN_COLORS[school.plan]}`}>
                              {school.plan}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[school.status]}`}>
                              {school.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="text-right">
                          <p className="font-medium text-slate-900 dark:text-white">{school.studentCount}</p>
                          <p className="text-xs">students</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900 dark:text-white">{school.userCount}</p>
                          <p className="text-xs">users</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${school.healthScore >= 90 ? 'text-emerald-600' : school.healthScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {school.healthScore}%
                          </p>
                          <p className="text-xs">health</p>
                        </div>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-4">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link
                  href="/admin/schools/new"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Add New School</span>
                </Link>
                <Link
                  href="/admin/users/invite"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Invite Admin User</span>
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">View Audit Logs</span>
                </Link>
                <Link
                  href="/admin/security"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Security Settings</span>
                </Link>
              </div>
            </Card>

            {/* Recent Alerts */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  Recent Alerts
                </h2>
                <Link href="/admin/alerts" className="text-xs text-indigo-600 hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {RECENT_ALERTS.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3">
                    <AlertIcon type={alert.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-4">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                System Status
              </h2>
              <div className="space-y-3">
                {[
                  { name: 'API Services', status: 'operational' },
                  { name: 'Database', status: 'operational' },
                  { name: 'Data Sync', status: 'degraded' },
                  { name: 'AI Services', status: 'operational' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{service.name}</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      service.status === 'operational'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/system"
                className="mt-4 block text-center text-sm text-indigo-600 hover:underline"
              >
                View Details
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
