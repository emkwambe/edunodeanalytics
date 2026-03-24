'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Bell,
  Shield,
} from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface Service {
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  latency: number;
  lastCheck: string;
}

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  warning?: number;
  critical?: number;
}

interface RegionStatus {
  name: string;
  code: string;
  status: ServiceStatus;
  latency: number;
  load: number;
}

// Mock data
const SERVICES: Service[] = [
  { name: 'Web Application', description: 'Main dashboard and UI', status: 'operational', uptime: 99.99, latency: 145, lastCheck: '30 sec ago' },
  { name: 'REST API', description: 'API endpoints v1', status: 'operational', uptime: 99.98, latency: 89, lastCheck: '30 sec ago' },
  { name: 'Authentication', description: 'Clerk integration', status: 'operational', uptime: 99.99, latency: 120, lastCheck: '30 sec ago' },
  { name: 'Database Primary', description: 'Supabase PostgreSQL', status: 'operational', uptime: 99.99, latency: 12, lastCheck: '30 sec ago' },
  { name: 'Database Replica', description: 'Read replicas', status: 'operational', uptime: 99.97, latency: 15, lastCheck: '30 sec ago' },
  { name: 'Data Sync Engine', description: 'SIS/LMS integrations', status: 'degraded', uptime: 99.85, latency: 450, lastCheck: '30 sec ago' },
  { name: 'Report Generator', description: 'PDF/CSV exports', status: 'operational', uptime: 99.95, latency: 890, lastCheck: '30 sec ago' },
  { name: 'AI Services', description: 'Gemini integration', status: 'operational', uptime: 99.90, latency: 1200, lastCheck: '30 sec ago' },
  { name: 'Email Service', description: 'Transactional emails', status: 'operational', uptime: 99.98, latency: 230, lastCheck: '30 sec ago' },
  { name: 'CDN', description: 'Static asset delivery', status: 'operational', uptime: 99.99, latency: 25, lastCheck: '30 sec ago' },
];

const SYSTEM_METRICS: SystemMetric[] = [
  { name: 'CPU Usage', value: 42, max: 100, unit: '%', trend: 'stable', warning: 70, critical: 90 },
  { name: 'Memory', value: 68, max: 100, unit: '%', trend: 'up', warning: 80, critical: 95 },
  { name: 'Disk Usage', value: 54, max: 100, unit: '%', trend: 'up', warning: 80, critical: 90 },
  { name: 'Network I/O', value: 2.4, max: 10, unit: 'Gbps', trend: 'stable', warning: 8, critical: 9.5 },
  { name: 'Active Connections', value: 3842, max: 10000, unit: '', trend: 'up', warning: 8000, critical: 9500 },
  { name: 'Request Queue', value: 12, max: 1000, unit: '', trend: 'down', warning: 500, critical: 800 },
];

const REGIONS: RegionStatus[] = [
  { name: 'US East (Virginia)', code: 'us-east-1', status: 'operational', latency: 45, load: 62 },
  { name: 'US West (Oregon)', code: 'us-west-2', status: 'operational', latency: 78, load: 48 },
  { name: 'Europe (Frankfurt)', code: 'eu-central-1', status: 'operational', latency: 112, load: 35 },
  { name: 'Asia Pacific (Tokyo)', code: 'ap-northeast-1', status: 'degraded', latency: 185, load: 72 },
];

const STATUS_CONFIG: Record<ServiceStatus, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  operational: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Operational',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  degraded: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Degraded',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  outage: {
    icon: <XCircle className="w-4 h-4" />,
    label: 'Outage',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  maintenance: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Maintenance',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

function MetricBar({ metric }: { metric: SystemMetric }) {
  const percentage = (metric.value / metric.max) * 100;
  const _warningPercent = metric.warning ? (metric.warning / metric.max) * 100 : 100;
  const _criticalPercent = metric.critical ? (metric.critical / metric.max) * 100 : 100;

  let barColor = 'bg-emerald-500';
  if (metric.critical && metric.value >= metric.critical) {
    barColor = 'bg-rose-500';
  } else if (metric.warning && metric.value >= metric.warning) {
    barColor = 'bg-amber-500';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {metric.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {metric.value}{metric.unit}
          </span>
          {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-amber-500" />}
          {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function SystemHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus: ServiceStatus = SERVICES.some(s => s.status === 'outage')
    ? 'outage'
    : SERVICES.some(s => s.status === 'degraded')
    ? 'degraded'
    : 'operational';

  const operationalCount = SERVICES.filter(s => s.status === 'operational').length;

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
              <Link href="/admin/audit-logs" className="text-slate-400 hover:text-white">Audit Logs</Link>
              <Link href="/admin/system" className="text-white font-medium">System</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Server className="w-7 h-7 text-indigo-500" />
              System Health
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time monitoring and system status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <Card className={`p-6 mb-6 ${STATUS_CONFIG[overallStatus].bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-white/50 ${STATUS_CONFIG[overallStatus].color}`}>
                {STATUS_CONFIG[overallStatus].icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {overallStatus === 'operational'
                    ? 'All Systems Operational'
                    : overallStatus === 'degraded'
                    ? 'Partial System Degradation'
                    : 'System Outage Detected'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {operationalCount} of {SERVICES.length} services operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/status"
                className="text-sm text-indigo-600 hover:underline"
              >
                View Public Status Page
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Services List */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Services
                </h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {SERVICES.map((service) => {
                  const config = STATUS_CONFIG[service.status];
                  return (
                    <div key={service.name} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={config.color}>{config.icon}</span>
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {service.name}
                            </h3>
                            <p className="text-sm text-slate-500">{service.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {service.uptime}%
                            </p>
                            <p className="text-xs text-slate-500">uptime</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {service.latency}ms
                            </p>
                            <p className="text-xs text-slate-500">latency</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${config.bgColor} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* System Metrics */}
            <Card className="p-4">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                System Resources
              </h2>
              <div className="space-y-4">
                {SYSTEM_METRICS.map((metric) => (
                  <MetricBar key={metric.name} metric={metric} />
                ))}
              </div>
            </Card>

            {/* Regions */}
            <Card className="p-4">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                Regions
              </h2>
              <div className="space-y-3">
                {REGIONS.map((region) => {
                  const config = STATUS_CONFIG[region.status];
                  return (
                    <div key={region.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {region.name}
                          </p>
                          <p className="text-xs text-slate-500">{region.code}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-slate-700 dark:text-slate-300">{region.latency}ms</p>
                        <p className="text-slate-500">{region.load}% load</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-left">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Configure Alerts</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-left">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Security Scan</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-left">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Database Maintenance</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-left">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Backup Status</span>
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Incident History */}
        <Card className="mt-6 p-4">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Incidents
          </h2>
          <div className="space-y-4">
            {[
              {
                title: 'Data Sync Engine Performance Degradation',
                status: 'monitoring',
                time: 'Started 2 hours ago',
                description: 'Elevated latency in SIS sync operations. Engineering team investigating.',
              },
              {
                title: 'Scheduled Maintenance - Database Upgrade',
                status: 'resolved',
                time: 'Feb 28, 2026 - 2:00 AM PST',
                description: 'Completed PostgreSQL upgrade. All systems operational.',
              },
            ].map((incident, i) => (
              <div key={i} className="border-l-4 border-slate-200 dark:border-slate-700 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {incident.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    incident.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {incident.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">{incident.time}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {incident.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
