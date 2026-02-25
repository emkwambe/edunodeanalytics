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
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Upload,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Globe,
  Key,
  FileText,
  Link2,
  UserPlus,
  ShieldCheck,
  Loader2,
  XCircle,
  Info,
} from 'lucide-react';

// --- Types ---

type SSOProvider = 'saml' | 'oidc' | 'google_workspace' | 'azure_ad';
type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'testing';
type DefaultRole = 'viewer' | 'teacher' | 'admin';

interface SSOConfig {
  provider: SSOProvider;
  entityId: string;
  ssoUrl: string;
  certificate: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  autoCreateUsers: boolean;
  defaultRole: DefaultRole;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  connectedUsers: number;
}

// --- Constants ---

const SSO_PROVIDERS: { id: SSOProvider; name: string; description: string; icon: React.ElementType }[] = [
  { id: 'saml', name: 'SAML 2.0', description: 'Standard SAML 2.0 identity provider', icon: Shield },
  { id: 'oidc', name: 'OpenID Connect', description: 'OAuth 2.0 based identity layer', icon: Key },
  { id: 'google_workspace', name: 'Google Workspace', description: 'Sign in with Google school accounts', icon: Globe },
  { id: 'azure_ad', name: 'Microsoft Azure AD', description: 'Azure Active Directory integration', icon: ShieldCheck },
];

const DEFAULT_ROLE_OPTIONS: { value: DefaultRole; label: string; description: string }[] = [
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to dashboards' },
  { value: 'teacher', label: 'Teacher', description: 'Can view student data and add interventions' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
];

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string; icon: React.ElementType }> = {
  connected: { color: 'emerald', label: 'Connected', icon: CheckCircle2 },
  disconnected: { color: 'slate', label: 'Not Configured', icon: AlertCircle },
  error: { color: 'red', label: 'Connection Error', icon: XCircle },
  testing: { color: 'blue', label: 'Testing...', icon: Loader2 },
};

// --- Component ---

export default function SSOConfigurationPage() {
  const params = useParams();
  const schoolSlug = params?.school_slug as string;

  // Mock SSO configuration state
  const [config, setConfig] = useState<SSOConfig>({
    provider: 'saml',
    entityId: 'https://edunode.app/sso/saml/metadata',
    ssoUrl: '',
    certificate: '',
    attributeMapping: {
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      role: 'role',
    },
    autoCreateUsers: true,
    defaultRole: 'viewer',
    status: 'disconnected',
    lastTestedAt: null,
    connectedUsers: 0,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleProviderChange = (provider: SSOProvider) => {
    setConfig((prev) => ({
      ...prev,
      provider,
      status: 'disconnected',
      ssoUrl: '',
      certificate: '',
      lastTestedAt: null,
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setConfig((prev) => ({ ...prev, status: 'testing' }));

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const success = config.ssoUrl.length > 0 && config.certificate.length > 0;
    setTestResult(success ? 'success' : 'error');
    setConfig((prev) => ({
      ...prev,
      status: success ? 'connected' : 'error',
      lastTestedAt: new Date().toISOString(),
      connectedUsers: success ? 47 : 0,
    }));
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentStatus = STATUS_CONFIG[config.status];
  const StatusIcon = currentStatus.icon;

  return (
    <PageFeatureGate featureKey="sso_configuration">
      <div className="min-h-screen bg-slate-900 p-6 md:p-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">SSO Configuration</h1>
            <p className="text-slate-400 mt-1">
              Configure Single Sign-On for your school with SAML, OIDC, or managed providers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                currentStatus.color === 'emerald' && 'bg-emerald-500/20 text-emerald-400',
                currentStatus.color === 'slate' && 'bg-slate-700 text-slate-400',
                currentStatus.color === 'red' && 'bg-red-500/20 text-red-400',
                currentStatus.color === 'blue' && 'bg-blue-500/20 text-blue-400'
              )}
            >
              <StatusIcon
                className={cn(
                  'w-4 h-4',
                  config.status === 'testing' && 'animate-spin'
                )}
              />
              {currentStatus.label}
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        {config.status === 'connected' && (
          <Card className="bg-emerald-900/20 border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">SSO is Active</h3>
                  <p className="text-sm text-emerald-400/80">
                    {config.connectedUsers} users authenticated via{' '}
                    {SSO_PROVIDERS.find((p) => p.id === config.provider)?.name}
                  </p>
                </div>
                {config.lastTestedAt && (
                  <p className="text-xs text-slate-500">
                    Last verified: {new Date(config.lastTestedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Identity Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SSO_PROVIDERS.map((provider) => {
                const ProviderIcon = provider.icon;
                const isSelected = config.provider === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all duration-200',
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <ProviderIcon
                        className={cn(
                          'w-5 h-5',
                          isSelected ? 'text-indigo-400' : 'text-slate-400'
                        )}
                      />
                      <span className={cn('font-medium', isSelected ? 'text-white' : 'text-slate-300')}>
                        {provider.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{provider.description}</p>
                    {isSelected && (
                      <Badge variant="primary" className="mt-2">Selected</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Service Provider Details (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-indigo-400" />
              Service Provider Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Entity ID / Issuer', value: config.entityId, field: 'entityId' },
              { label: 'ACS URL', value: `https://edunode.app/api/auth/sso/${schoolSlug}/callback`, field: 'acs' },
              { label: 'Metadata URL', value: `https://edunode.app/api/auth/sso/${schoolSlug}/metadata.xml`, field: 'metadata' },
            ].map((item) => (
              <div key={item.field} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-slate-500 block mb-0.5">{item.label}</label>
                  <p className="text-sm text-slate-200 font-mono truncate">{item.value}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(item.value, item.field)} className="shrink-0">
                  {copiedField === item.field ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Provider Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">SSO URL / Login Endpoint</label>
              <input type="url" placeholder="https://idp.example.com/sso/saml" value={config.ssoUrl} onChange={(e) => setConfig((prev) => ({ ...prev, ssoUrl: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
              <p className="text-xs text-slate-500 mt-1">The URL where EduNode redirects users for authentication.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">IdP Entity ID / Issuer</label>
              <input type="text" placeholder="https://idp.example.com/metadata" value={config.entityId} onChange={(e) => setConfig((prev) => ({ ...prev, entityId: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">X.509 Certificate</label>
              <div className="relative">
                <textarea rows={4} placeholder="-----BEGIN CERTIFICATE-----&#10;Paste your IdP signing certificate here...&#10;-----END CERTIFICATE-----" value={config.certificate} onChange={(e) => setConfig((prev) => ({ ...prev, certificate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none" />
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-slate-500 hover:text-slate-300">
                  <Upload className="w-4 h-4 mr-1" /> Upload
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">PEM-encoded X.509 certificate from your identity provider.</p>
            </div>

            {/* Attribute Mapping */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Attribute Mapping
              </label>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400">
                    Map your IdP attributes to EduNode user fields.
                  </span>
                </div>
                {Object.entries(config.attributeMapping).map(([field, value]) => (
                  <div key={field} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-slate-400 capitalize shrink-0">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          attributeMapping: { ...prev.attributeMapping, [field]: e.target.value },
                        }))
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Provisioning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              User Provisioning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Auto-create toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Auto-create Users on First Login</p>
                  <p className="text-xs text-slate-500">
                    Automatically provision new user accounts when they authenticate via SSO.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, autoCreateUsers: !prev.autoCreateUsers }))}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  config.autoCreateUsers ? 'bg-indigo-600' : 'bg-slate-600'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                    config.autoCreateUsers ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Default Role */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Role for New Users
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEFAULT_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setConfig((prev) => ({ ...prev, defaultRole: role.value }))}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      config.defaultRole === role.value
                        ? 'bg-indigo-500/20 border-indigo-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    <p className={cn(
                      'text-sm font-medium',
                      config.defaultRole === role.value ? 'text-white' : 'text-slate-300'
                    )}>
                      {role.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition"
            >
              <ChevronDown
                className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')}
              />
              Advanced Provisioning Options
            </button>
            {showAdvanced && (
              <div className="space-y-3 pl-6 border-l-2 border-slate-700">
                {[
                  { title: 'Sync group memberships', desc: 'Map IdP groups to EduNode roles' },
                  { title: 'Deprovision on IdP removal', desc: 'Disable accounts when removed from IdP' },
                  { title: 'Require SSO for all users', desc: 'Disable password login when SSO is active' },
                ].map((opt) => (
                  <div key={opt.title} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-300">{opt.title}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Connection */}
        <Card
          className={cn(
            testResult === 'success' && 'border-emerald-500/30',
            testResult === 'error' && 'border-red-500/30'
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              Test Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Verify your SSO configuration by initiating a test authentication flow.
            </p>

            {testResult === 'success' && (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Connection Successful</p>
                  <p className="text-xs text-emerald-400/70">
                    SSO authentication flow completed. Users can now sign in.
                  </p>
                </div>
              </div>
            )}

            {testResult === 'error' && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Connection Failed</p>
                  <p className="text-xs text-red-400/70">
                    Please verify your SSO URL and certificate are correct, then try again.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="outline"
              className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isTesting ? 'Testing Connection...' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageFeatureGate>
  );
}
