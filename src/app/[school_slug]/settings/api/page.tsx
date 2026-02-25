'use client';

import * as React from 'react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { cn } from '@/lib/utils';
import {
  Key,
  Copy,
  Trash2,
  Plus,
  Activity,
  Code2,
  BookOpen,
  Shield,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Zap,
  Globe,
  ChevronRight,
} from 'lucide-react';

// --- Types ---

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  scopes: string[];
  status: 'active' | 'expired' | 'revoked';
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failing';
  lastTriggeredAt: string | null;
  failureCount: number;
}

type CodeTab = 'curl' | 'python' | 'javascript';

// --- Mock Data ---

const MOCK_API_KEYS: APIKey[] = [
  { id: 'key_1', name: 'Production Dashboard', prefix: 'edun_live_a3f8', createdAt: '2025-11-15T10:00:00Z', lastUsedAt: '2026-02-25T08:32:00Z', expiresAt: null, scopes: ['students:read', 'assessments:read', 'metrics:read'], status: 'active' },
  { id: 'key_2', name: 'Data Pipeline (ETL)', prefix: 'edun_live_7b2c', createdAt: '2025-12-01T14:00:00Z', lastUsedAt: '2026-02-24T22:15:00Z', expiresAt: '2026-06-01T00:00:00Z', scopes: ['students:read', 'assessments:read', 'interventions:read', 'interventions:write'], status: 'active' },
  { id: 'key_3', name: 'Legacy Integration', prefix: 'edun_live_1d9e', createdAt: '2025-08-20T09:00:00Z', lastUsedAt: '2025-10-05T11:45:00Z', expiresAt: '2025-12-31T00:00:00Z', scopes: ['students:read'], status: 'expired' },
];

const MOCK_WEBHOOKS: Webhook[] = [
  { id: 'wh_1', url: 'https://district-portal.example.com/webhooks/edunode', events: ['student.risk_changed', 'intervention.completed'], status: 'active', lastTriggeredAt: '2026-02-25T07:55:00Z', failureCount: 0 },
  { id: 'wh_2', url: 'https://alerts.example.com/api/notify', events: ['assessment.scores_imported'], status: 'failing', lastTriggeredAt: '2026-02-23T16:30:00Z', failureCount: 3 },
];

const RATE_LIMITS = {
  starter: { requests: 100, label: 'Starter' },
  professional: { requests: 1000, label: 'Professional' },
  enterprise: { requests: 10000, label: 'Enterprise' },
};

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/students', description: 'List students with risk scores' },
  { method: 'GET', path: '/api/v1/students/:id', description: 'Get a student profile' },
  { method: 'GET', path: '/api/v1/assessments', description: 'List assessment results' },
  { method: 'POST', path: '/api/v1/interventions', description: 'Create an intervention' },
  { method: 'GET', path: '/api/v1/metrics/overview', description: 'School-wide metrics' },
  { method: 'GET', path: '/api/v1/metrics/attendance', description: 'Attendance trends' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-amber-500/20 text-amber-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

const CODE_EXAMPLES: Record<CodeTab, string> = {
  curl: `curl -X GET "https://api.edunode.app/v1/students?limit=25" \\
  -H "Authorization: Bearer edun_live_YOUR_KEY" \\
  -H "Content-Type: application/json"

# Response: { "data": [{ "id": "stu_abc123", "name": "Maria Garcia",
#   "grade": 8, "risk_score": 0.23, "risk_level": "on_track" }],
#   "meta": { "total": 342, "page": 1, "per_page": 25 } }`,
  python: `import requests

API_KEY = "edun_live_YOUR_KEY"
BASE = "https://api.edunode.app/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

resp = requests.get(f"{BASE}/students",
    headers=headers, params={"limit": 25, "risk_level": "at_risk"})

for s in resp.json()["data"]:
    print(f"{s['name']}: {s['risk_score']:.0%}")`,
  javascript: `const API_KEY = "edun_live_YOUR_KEY";
const BASE = "https://api.edunode.app/v1";

const res = await fetch(\`\${BASE}/students?limit=25&risk_level=at_risk\`, {
  headers: { Authorization: \`Bearer \${API_KEY}\` },
});
const { data: students, meta } = await res.json();
console.log(\`Found \${meta.total} at-risk students\`);
students.forEach((s) => console.log(\`\${s.name}: \${s.risk_score}\`));`,
};

// --- Component ---

export default function APIKeysPage() {
  const params = useParams();
  const schoolSlug = params?.school_slug as string;

  const [apiKeys, setApiKeys] = useState<APIKey[]>(MOCK_API_KEYS);
  const [webhooks, setWebhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('curl');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const currentTier = 'enterprise';
  const rateLimit = RATE_LIMITS[currentTier];
  const activeKeys = apiKeys.filter((k) => k.status === 'active');

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newKey: APIKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: `edun_live_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: null,
      scopes: ['students:read', 'assessments:read', 'metrics:read'],
      status: 'active',
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName('');
    setShowNewKeyDialog(false);
    setIsGenerating(false);
    setRevealedKey(newKey.id);
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: 'revoked' as const } : k))
    );
  };

  const handleAddWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    const newHook: Webhook = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      events: ['student.risk_changed'],
      status: 'active',
      lastTriggeredAt: null,
      failureCount: 0,
    };
    setWebhooks((prev) => [newHook, ...prev]);
    setNewWebhookUrl('');
    setShowWebhookForm(false);
  };

  const handleRemoveWebhook = (hookId: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== hookId));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });

  return (
    <PageFeatureGate featureKey="api_access">
      <div className="min-h-screen bg-slate-900 p-6 md:p-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">API Keys & Documentation</h1>
            <p className="text-slate-400 mt-1">
              Manage API keys, review endpoints, and configure webhooks.
            </p>
          </div>
          <Button onClick={() => setShowNewKeyDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-indigo-900/20 border-indigo-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-400">Active Keys</p>
                  <p className="text-3xl font-bold text-white mt-1">{activeKeys.length}</p>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Key className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-900/20 border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-400">Rate Limit</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {rateLimit.requests.toLocaleString()}
                    <span className="text-sm font-normal text-slate-400">/min</span>
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Webhooks Active</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {webhooks.filter((w) => w.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-slate-700 rounded-xl">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showNewKeyDialog && (
          <Card className="border-indigo-500/30 bg-indigo-900/10">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Generate New API Key</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Key name (e.g., Production Dashboard)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" autoFocus />
                <div className="flex gap-2">
                  <Button onClick={handleGenerateKey} disabled={isGenerating || !newKeyName.trim()}>
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>Cancel</Button>
                </div>
              </div>
              <p className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5" /> The full key will only be shown once. Store it securely.
              </p>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition',
                    key.status === 'active'
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-slate-800/20 border-slate-700/50 opacity-60'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">{key.name}</p>
                      <Badge
                        variant={key.status === 'active' ? 'accent' : key.status === 'expired' ? 'warning' : 'destructive'}
                      >
                        {key.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-slate-400 font-mono">
                        {revealedKey === key.id ? `${key.prefix}...xxxxxxxxxxxx` : `${key.prefix}...****`}
                      </code>
                      <button
                        onClick={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                        className="text-slate-500 hover:text-slate-300 transition"
                      >
                        {revealedKey === key.id ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(key.prefix, key.id)}
                        className="text-slate-500 hover:text-slate-300 transition"
                      >
                        {copiedField === key.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="default" size="sm">{scope}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        Created {formatDate(key.createdAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {key.lastUsedAt ? `Last used ${formatDate(key.lastUsedAt)}` : 'Never used'}
                      </p>
                      {key.expiresAt && (
                        <p className="text-xs text-amber-400">
                          Expires {formatDate(key.expiresAt)}
                        </p>
                      )}
                    </div>
                    {key.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Endpoint Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Endpoint Quick Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ENDPOINTS.map((endpoint, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:border-slate-600 transition"
                >
                  <Badge className={cn('font-mono text-[10px] shrink-0', METHOD_COLORS[endpoint.method])}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm text-slate-200 font-mono shrink-0">{endpoint.path}</code>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />
                  <p className="text-sm text-slate-500 truncate hidden sm:block">{endpoint.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer">
                View full API documentation
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              Code Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tab Bar */}
            <div className="flex items-center gap-1 mb-4 bg-slate-800/50 rounded-lg p-1 w-fit">
              {(['curl', 'python', 'javascript'] as CodeTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition',
                    activeCodeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'JavaScript'}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
                onClick={() => handleCopy(CODE_EXAMPLES[activeCodeTab], 'code')}
              >
                {copiedField === 'code' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <pre className="text-sm text-slate-300 font-mono whitespace-pre overflow-x-auto">
                {CODE_EXAMPLES[activeCodeTab]}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                Webhooks
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowWebhookForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showWebhookForm && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                <input
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddWebhook} disabled={!newWebhookUrl.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowWebhookForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {webhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                      <code className="text-sm text-slate-200 font-mono truncate">{hook.url}</code>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {hook.events.map((event) => (
                        <Badge key={event} variant="primary" size="sm">{event}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <Badge
                        variant={
                          hook.status === 'active' ? 'accent' : hook.status === 'failing' ? 'destructive' : 'default'
                        }
                      >
                        {hook.status === 'failing' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {hook.status}
                        {hook.status === 'failing' && ` (${hook.failureCount})`}
                      </Badge>
                      {hook.lastTriggeredAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Last fired {formatDate(hook.lastTriggeredAt)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWebhook(hook.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No webhooks configured yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Info */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <Activity className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Rate Limits by Tier</h3>
                <p className="text-sm text-slate-400 mb-3">Current plan: {rateLimit.requests.toLocaleString()} requests/min.</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(RATE_LIMITS).map(([tier, info]) => (
                    <div key={tier} className={cn('px-3 py-2 rounded-lg border text-sm', tier === currentTier ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-500')}>
                      <span className="font-medium">{info.label}</span>{' '}{info.requests.toLocaleString()}/min
                      {tier === currentTier && <Badge variant="primary" size="sm" className="ml-2">Current</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFeatureGate>
  );
}
