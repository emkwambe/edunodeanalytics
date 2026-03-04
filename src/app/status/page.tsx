'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Bell,
  Activity,
} from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface Service {
  name: string;
  description: string;
  status: ServiceStatus;
  latency?: number;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
  updates: {
    time: string;
    message: string;
  }[];
}

const STATUS_CONFIG: Record<ServiceStatus, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  operational: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Operational',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
  },
  degraded: {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Degraded',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
  },
  outage: {
    icon: <XCircle className="w-5 h-5" />,
    label: 'Outage',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500',
  },
  maintenance: {
    icon: <Clock className="w-5 h-5" />,
    label: 'Maintenance',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
  },
};

// Simulated service data - in production, this would come from your monitoring system
const SERVICES: Service[] = [
  { name: 'Web Application', description: 'Main dashboard and UI', status: 'operational', latency: 145 },
  { name: 'API', description: 'REST API endpoints', status: 'operational', latency: 89 },
  { name: 'Authentication', description: 'Login and SSO services', status: 'operational', latency: 120 },
  { name: 'Database', description: 'Primary data storage', status: 'operational', latency: 12 },
  { name: 'Data Sync', description: 'SIS and LMS integrations', status: 'operational', latency: 450 },
  { name: 'Reports', description: 'Report generation service', status: 'operational', latency: 890 },
  { name: 'Notifications', description: 'Email and in-app alerts', status: 'operational', latency: 230 },
  { name: 'AI Services', description: 'EduNode Advisor and Pulse', status: 'operational', latency: 1200 },
];

const PAST_INCIDENTS: Incident[] = [
  {
    id: '1',
    title: 'Elevated API Response Times',
    status: 'resolved',
    severity: 'minor',
    createdAt: '2026-02-28T14:30:00Z',
    updatedAt: '2026-02-28T15:45:00Z',
    updates: [
      { time: '2:30 PM', message: 'Investigating elevated API latency.' },
      { time: '2:45 PM', message: 'Identified database connection pool exhaustion.' },
      { time: '3:15 PM', message: 'Deployed fix, monitoring recovery.' },
      { time: '3:45 PM', message: 'Resolved. All services operating normally.' },
    ],
  },
  {
    id: '2',
    title: 'Scheduled Maintenance - Database Upgrade',
    status: 'resolved',
    severity: 'minor',
    createdAt: '2026-02-25T06:00:00Z',
    updatedAt: '2026-02-25T06:45:00Z',
    updates: [
      { time: '6:00 AM', message: 'Beginning scheduled database maintenance.' },
      { time: '6:45 AM', message: 'Maintenance complete. All systems operational.' },
    ],
  },
];

function getOverallStatus(services: Service[]): ServiceStatus {
  if (services.some(s => s.status === 'outage')) return 'outage';
  if (services.some(s => s.status === 'degraded')) return 'degraded';
  if (services.some(s => s.status === 'maintenance')) return 'maintenance';
  return 'operational';
}

function UptimeBar({ days = 90 }: { days?: number }) {
  // Simulate uptime data - in production, this would be real data
  const uptimeData = Array.from({ length: days }, (_, i) => {
    const random = Math.random();
    if (random > 0.98) return 'degraded';
    if (random > 0.995) return 'outage';
    return 'operational';
  });

  return (
    <div className="flex gap-0.5">
      {uptimeData.map((status, i) => (
        <div
          key={i}
          className={`w-1 h-8 rounded-sm ${
            status === 'operational'
              ? 'bg-emerald-500'
              : status === 'degraded'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
          title={`Day ${days - i}: ${status}`}
        />
      ))}
    </div>
  );
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const overallStatus = getOverallStatus(SERVICES);
  const operationalCount = SERVICES.filter(s => s.status === 'operational').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-indigo-600">Node</span>
              </span>
            </Link>
            <span className="text-slate-400">Status</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Docs
            </Link>
            <Link href="/changelog" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Changelog
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Overall Status */}
        <Card className={`p-8 mb-8 ${overallStatus === 'operational' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${STATUS_CONFIG[overallStatus].bgColor}/20`}>
                <span className={STATUS_CONFIG[overallStatus].color}>
                  {STATUS_CONFIG[overallStatus].icon}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overallStatus === 'operational'
                    ? 'All Systems Operational'
                    : overallStatus === 'degraded'
                    ? 'Partial System Degradation'
                    : overallStatus === 'outage'
                    ? 'System Outage Detected'
                    : 'Scheduled Maintenance'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {operationalCount} of {SERVICES.length} services operational
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </Card>

        {/* Uptime */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              90-Day Uptime
            </h2>
            <span className="text-2xl font-bold text-emerald-600">99.98%</span>
          </div>
          <UptimeBar days={90} />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </Card>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Service Status
          </h2>
          <Card className="divide-y divide-slate-200 dark:divide-slate-700">
            {SERVICES.map((service) => {
              const config = STATUS_CONFIG[service.status];
              return (
                <div key={service.name} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={config.color}>{config.icon}</span>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {service.name}
                      </h3>
                      <p className="text-sm text-slate-500">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    {service.latency && (
                      <p className="text-xs text-slate-500">{service.latency}ms</p>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </section>

        {/* Past Incidents */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Recent Incidents
          </h2>
          {PAST_INCIDENTS.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                No incidents in the past 90 days
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {PAST_INCIDENTS.map((incident) => (
                <Card key={incident.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {incident.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {new Date(incident.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      incident.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-3 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                    {incident.updates.map((update, i) => (
                      <div key={i}>
                        <span className="text-xs font-medium text-slate-500">{update.time}</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{update.message}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Subscribe */}
        <Card className="p-8 text-center bg-slate-100 dark:bg-slate-800/50">
          <Bell className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Get Status Updates
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Subscribe to receive notifications about service disruptions and maintenance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </Card>

        {/* Last Updated */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduNode Analytics
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link href="/contact" className="hover:text-indigo-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
