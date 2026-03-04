import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

/**
 * EduNode Analytics Landing Page
 *
 * Public marketing page for the SaaS platform
 */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-semibold text-slate-100">EduNode Analytics</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/security"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Security
              </Link>
              <Link
                href="/integrations"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Integrations
              </Link>
              <Link
                href="/case-studies"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Case Studies
              </Link>
              <Link
                href="/pricing"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Pricing
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Sign In
              </Link>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>Modern Data Stack for Education</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-slate-100">Data Analytics for </span>
              <span className="text-gradient-primary">Independent Charter Schools</span>
            </h1>

            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Bridge the infrastructure gap. EduNode integrates your SIS, LMS, and
              assessment data into actionable dashboards that drive student outcomes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="gradient" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
            <div className="rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-4 text-sm text-slate-400">
                  app.edunode.com/academy-charter/dashboard
                </span>
              </div>
              <div className="bg-slate-900 p-8 min-h-[400px] bg-[url('/grid-pattern.svg')] bg-center">
                <div className="grid grid-cols-4 gap-4">
                  {/* Mock metric cards */}
                  {[
                    { label: 'Total Enrollment', value: '487' },
                    { label: 'Attendance Rate', value: '94.2%' },
                    { label: 'Chronic Absence', value: '52' },
                    { label: 'Growth Percentile', value: '58th' },
                  ].map((metric, i) => (
                    <Card key={i} className="p-4">
                      <p className="text-xs text-slate-400">{metric.label}</p>
                      <p className="text-2xl font-bold text-gradient-primary mt-1">
                        {metric.value}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Built for Charter Schools
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to track student outcomes, demonstrate growth,
              and prepare for charter renewal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Renewal Readiness Dashboard',
                description:
                  'Benchmark your growth against state/district averages. Track compliance status and financial liquidity.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Student 360 View',
                description:
                  'Holistic view merging SEL, behavior, and academic data. Teachers see only their roster with row-level security.',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Instructional Pulse',
                description:
                  'Real-time formative assessment mastery curves. Early warning system for chronic absenteeism.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'FERPA Compliant',
                description:
                  'Data processing agreements and encryption. SOC2 audit-ready logging for all access events.',
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: 'Clever/ClassLink Integration',
                description:
                  'Automated roster sync from your existing SIS. No manual data entry required.',
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Authorizer Portal',
                description:
                  'Secure read-only access for charter authorizers to verify compliance during renewal cycles.',
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:border-slate-600/50 transition-colors">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Ready to modernize your data infrastructure?
          </h2>
          <p className="text-slate-400 mb-8">
            Join charter schools across the country using EduNode to make data-driven decisions.
          </p>
          <Button size="lg" variant="gradient" asChild>
            <Link href="/sign-up">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="text-slate-500 hover:text-slate-300">Pricing</Link></li>
                <li><Link href="/integrations" className="text-slate-500 hover:text-slate-300">Integrations</Link></li>
                <li><Link href="/data-blueprint" className="text-slate-500 hover:text-slate-300">Data Blueprint</Link></li>
                <li><Link href="/security" className="text-slate-500 hover:text-slate-300">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/case-studies" className="text-slate-500 hover:text-slate-300">Case Studies</Link></li>
                <li><Link href="/testimonials" className="text-slate-500 hover:text-slate-300">Testimonials</Link></li>
                <li><Link href="/faq" className="text-slate-500 hover:text-slate-300">FAQ</Link></li>
                <li><Link href="/contact" className="text-slate-500 hover:text-slate-300">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-slate-500 hover:text-slate-300">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-slate-500 hover:text-slate-300">Privacy Policy</Link></li>
                <li><Link href="/ferpa" className="text-slate-500 hover:text-slate-300">FERPA Compliance</Link></li>
                <li><Link href="/cookies" className="text-slate-500 hover:text-slate-300">Cookie Policy</Link></li>
                <li><Link href="/accessibility" className="text-slate-500 hover:text-slate-300">Accessibility</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-slate-500 hover:text-slate-300">About Us</Link></li>
                <li><Link href="/partners" className="text-slate-500 hover:text-slate-300">Partners</Link></li>
                <li><Link href="/demo" className="text-slate-500 hover:text-slate-300">Request Demo</Link></li>
                <li><Link href="/sign-in" className="text-slate-500 hover:text-slate-300">Sign In</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span className="text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} EduNode Analytics. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
