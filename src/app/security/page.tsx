import Link from 'next/link';
import {
  Shield,
  Lock,
  FileCheck,
  Eye,
  Server,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
  FileText,
  Database,
} from 'lucide-react';

const COMPLIANCE_FEATURES = [
  {
    icon: Shield,
    title: 'FERPA Compliant',
    description:
      'Full compliance with the Family Educational Rights and Privacy Act. We maintain strict controls over student PII and provide parents with required access rights.',
    details: [
      'Annual FERPA training for all employees',
      'Data Processing Agreements (DPAs) for every school',
      'Parent/guardian access portal support',
      'Strict directory information controls',
    ],
  },
  {
    icon: Award,
    title: 'SOC 2 Type II Certified',
    description:
      'Our systems undergo rigorous annual audits by independent third parties to verify security controls for data protection, availability, and confidentiality.',
    details: [
      'Annual third-party security audits',
      'Continuous control monitoring',
      'Audit reports available on request',
      'Trust Services Criteria compliance',
    ],
  },
  {
    icon: FileText,
    title: 'Student Data Privacy Agreements',
    description:
      'We comply with state student privacy laws including California SOPIPA, New York Education Law 2-d, and state-specific DPA requirements.',
    details: [
      'Signed DPAs with every district',
      'State-specific compliance documentation',
      'No advertising or data monetization',
      'Strict data retention policies',
    ],
  },
  {
    icon: Lock,
    title: 'Enterprise Encryption',
    description:
      'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Database backups are encrypted and stored in geographically redundant facilities.',
    details: [
      'TLS 1.3 for all data in transit',
      'AES-256 encryption at rest',
      'Encrypted database backups',
      'Hardware Security Module (HSM) key management',
    ],
  },
];

const SECURITY_FEATURES = [
  {
    icon: Eye,
    title: 'Complete Audit Trails',
    description:
      'Every data access is logged with who, what, when, and why. Generate compliance reports for authorizers and auditors with one click.',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description:
      'Granular permissions ensure teachers see only their students. Administrators can customize roles to match your organizational structure.',
  },
  {
    icon: Server,
    title: 'SOC 2 Data Centers',
    description:
      'Hosted in AWS GovCloud-eligible data centers with physical security, redundant power, and 24/7 monitoring.',
  },
  {
    icon: Database,
    title: 'Data Minimization',
    description:
      'We only collect data necessary for platform functionality. Automatic data purging when students leave your school.',
  },
  {
    icon: FileCheck,
    title: 'Incident Response',
    description:
      '24-hour breach notification commitment. Documented incident response procedures tested quarterly.',
  },
  {
    icon: Lock,
    title: 'SSO & MFA Support',
    description:
      'Integrate with your existing identity provider. Enforce multi-factor authentication for all administrative accounts.',
  },
];

const CERTIFICATIONS = [
  { name: 'SOC 2 Type II', logo: '/certifications/soc2.svg' },
  { name: 'FERPA', logo: '/certifications/ferpa.svg' },
  { name: 'COPPA', logo: '/certifications/coppa.svg' },
  { name: 'Student Privacy Pledge', logo: '/certifications/privacy-pledge.svg' },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">EduNode</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/integrations" className="text-sm text-slate-600 hover:text-slate-900">
                Integrations
              </Link>
              <Link href="/case-studies" className="text-sm text-slate-600 hover:text-slate-900">
                Case Studies
              </Link>
              <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900">
                Pricing
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              SOC 2 Type II Certified
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Security & Compliance
              <span className="block text-blue-600">Built for Education</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              EduNode is designed from the ground up to meet the rigorous security and privacy
              requirements of K-12 education. FERPA compliance isn&apos;t an add-on—it&apos;s our foundation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Request Security Documentation
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/sign-up"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-8">
            Certified and compliant with industry standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.name} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{cert.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Compliance You Can Count On
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              We understand the unique regulatory requirements facing schools. Our compliance
              program is designed to make your audits easier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {COMPLIANCE_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail) => (
                        <li key={detail} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              The same security infrastructure trusted by Fortune 500 companies,
              purpose-built for education.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECURITY_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Handling */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Your Data, Your Control
              </h2>
              <p className="text-slate-600 mb-6">
                We believe schools should have complete control over their data. EduNode provides
                comprehensive data governance tools and clear policies.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-900">Data Export</span>
                    <p className="text-sm text-slate-600">
                      Export all your data in standard formats at any time. No lock-in.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-900">Data Deletion</span>
                    <p className="text-sm text-slate-600">
                      Request complete data deletion when you leave. We provide certification.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-900">No Data Selling</span>
                    <p className="text-sm text-slate-600">
                      We never sell, share, or monetize student data. Ever.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-900">Subprocessor Transparency</span>
                    <p className="text-sm text-slate-600">
                      Complete list of subprocessors available. Notification of changes.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-slate-100 rounded-2xl p-8">
              <h3 className="font-semibold text-slate-900 mb-4">Request Documentation</h3>
              <p className="text-sm text-slate-600 mb-6">
                Need security documentation for your procurement process? We provide:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  SOC 2 Type II Report
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Data Processing Agreement (DPA)
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Security Questionnaire Responses
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Penetration Test Summary
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Business Continuity Plan
                </li>
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Request Documentation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to see our security in action?
          </h2>
          <p className="text-blue-100 mb-8">
            Schedule a security review with our team. We&apos;ll walk through our controls and
            answer your compliance questions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Schedule Security Review
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/sign-up"
              className="text-white hover:text-blue-100 font-medium"
            >
              Or start your free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">EduNode Analytics</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
              <Link href="/security" className="hover:text-slate-900 text-blue-600 font-medium">Security</Link>
              <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} EduNode Analytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
