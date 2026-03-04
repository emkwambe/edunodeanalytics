import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { DocsLayout, DocsBreadcrumb, CodeBlock } from '@/components/layout/docs-layout';
import { Shield, Key, Code, Database, Users, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Reference | EduNode Documentation',
  description: 'Complete API reference for EduNode Analytics REST API.',
};

const API_SECTIONS = [
  {
    title: 'Schools',
    description: 'Manage school profiles and settings.',
    icon: <Database className="w-5 h-5" />,
    endpoints: [
      { method: 'GET', path: '/api/schools', description: 'List all schools' },
      { method: 'GET', path: '/api/schools/:id', description: 'Get school details' },
      { method: 'PATCH', path: '/api/schools/:id', description: 'Update school' },
    ],
  },
  {
    title: 'Students',
    description: 'Access student records and metrics.',
    icon: <Users className="w-5 h-5" />,
    endpoints: [
      { method: 'GET', path: '/api/schools/:id/students', description: 'List students' },
      { method: 'GET', path: '/api/schools/:id/students/:studentId', description: 'Get student details' },
      { method: 'GET', path: '/api/schools/:id/students/at-risk', description: 'Get at-risk students' },
      { method: 'GET', path: '/api/schools/:id/students/metrics', description: 'Get aggregate metrics' },
    ],
  },
  {
    title: 'Interventions',
    description: 'Manage MTSS/RTI interventions.',
    icon: <BarChart3 className="w-5 h-5" />,
    endpoints: [
      { method: 'GET', path: '/api/schools/:id/interventions', description: 'List interventions' },
      { method: 'POST', path: '/api/schools/:id/interventions', description: 'Create intervention' },
      { method: 'PATCH', path: '/api/schools/:id/interventions/:interventionId', description: 'Update intervention' },
      { method: 'GET', path: '/api/schools/:id/interventions/metrics', description: 'Get intervention metrics' },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function ApiDocsPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl">
        <DocsBreadcrumb items={[{ label: 'API Reference' }]} />

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
              <Code className="w-4 h-4" />
              REST API
            </span>
            <span className="text-sm text-slate-500">v1.0</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            API Reference
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Build custom integrations with the EduNode REST API. Access student data,
            manage interventions, and automate workflows programmatically.
          </p>
        </div>

        {/* Quick Info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              Base URL
            </h3>
            <code className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-slate-700 dark:text-slate-300">
              https://api.edunode.com/v1
            </code>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              Authentication
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bearer token via <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Authorization</code> header
            </p>
          </Card>
        </div>

        {/* Authentication Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Authentication
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            All API requests require authentication using a Bearer token. Generate your API key
            from <Link href="/settings/api" className="text-indigo-600 hover:underline">Settings → API</Link> in your dashboard.
          </p>
          <CodeBlock
            language="bash"
            code={`curl -X GET "https://api.edunode.com/v1/schools" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
          />
        </section>

        {/* Rate Limiting */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Rate Limiting
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            API requests are rate limited based on your subscription tier:
          </p>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Tier</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Requests/min</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Requests/day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Starter</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">-</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">API not available</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Professional</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">60</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">10,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Enterprise</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">300</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">100,000</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        {/* API Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Endpoints
          </h2>

          <div className="space-y-8">
            {API_SECTIONS.map((section) => (
              <Card key={section.title} className="overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {section.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {section.endpoints.map((endpoint, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {endpoint.path}
                      </code>
                      <span className="text-sm text-slate-500 ml-auto hidden sm:block">
                        {endpoint.description}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Example Response */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Example Response
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            All responses are JSON-formatted with consistent structure:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "data": {
    "id": "stu_abc123",
    "firstName": "Maria",
    "lastName": "Garcia",
    "gradeLevel": 8,
    "riskLevel": "at_risk",
    "riskScore": 72,
    "attendanceRate": 0.89,
    "proficiencyLevel": "approaching"
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2026-03-04T10:30:00Z"
  }
}`}
          />
        </section>

        {/* Error Handling */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Error Handling
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Errors return appropriate HTTP status codes with detailed messages:
          </p>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="px-4 py-3"><code className="text-rose-600">400</code></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Bad Request - Invalid parameters</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code className="text-rose-600">401</code></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Unauthorized - Invalid or missing API key</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code className="text-rose-600">403</code></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Forbidden - Insufficient permissions</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code className="text-rose-600">404</code></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Not Found - Resource doesn&apos;t exist</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code className="text-rose-600">429</code></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Rate Limited - Too many requests</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code className="text-rose-600">500</code></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Server Error - Contact support</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        {/* SDKs */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            SDKs & Libraries
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Official client libraries (coming soon):
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {['JavaScript/TypeScript', 'Python', 'Ruby'].map((lang) => (
              <Card key={lang} className="p-4 text-center">
                <p className="font-medium text-slate-700 dark:text-slate-300">{lang}</p>
                <p className="text-xs text-slate-500">Coming Q2 2026</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Help */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Questions about the API? <Link href="/contact" className="text-indigo-600 hover:underline">Contact our developer support team</Link>.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
