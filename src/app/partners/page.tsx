import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  Laptop,
  Building2,
  CheckCircle,
  ArrowRight,
  Mail,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partners | EduNode Analytics',
  description: 'Join the EduNode Partner Ecosystem - Technology partners, implementation consultants, and resellers.',
};

const PARTNER_TYPES = [
  {
    icon: <Laptop className="w-8 h-8" />,
    title: 'Technology Partners',
    description: 'SIS vendors, assessment providers, and LMS platforms that integrate with EduNode.',
    benefits: [
      'API integration support',
      'Joint marketing opportunities',
      'Partner portal access',
      'Technical documentation',
    ],
    cta: 'Become a Tech Partner',
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Implementation Partners',
    description: 'Educational consultants and service providers who help schools succeed with data.',
    benefits: [
      'Partner certification program',
      'Implementation playbooks',
      'Revenue sharing',
      'Lead referrals',
    ],
    cta: 'Join as Consultant',
  },
  {
    icon: <Building2 className="w-8 h-8" />,
    title: 'Reseller Partners',
    description: 'Organizations that resell EduNode to their school networks or regions.',
    benefits: [
      'Wholesale pricing',
      'White-label options',
      'Sales enablement',
      'Dedicated account manager',
    ],
    cta: 'Become a Reseller',
  },
];

const INTEGRATION_PARTNERS = [
  { name: 'Clever', category: 'Roster Sync', status: 'Certified' },
  { name: 'ClassLink', category: 'Roster Sync', status: 'Certified' },
  { name: 'PowerSchool', category: 'SIS', status: 'Certified' },
  { name: 'NWEA MAP', category: 'Assessment', status: 'Certified' },
  { name: 'i-Ready', category: 'Assessment', status: 'Certified' },
  { name: 'Renaissance STAR', category: 'Assessment', status: 'Certified' },
  { name: 'Canvas', category: 'LMS', status: 'Certified' },
  { name: 'Google Classroom', category: 'LMS', status: 'Certified' },
  { name: 'Infinite Campus', category: 'SIS', status: 'In Progress' },
  { name: 'Skyward', category: 'SIS', status: 'In Progress' },
  { name: 'Schoology', category: 'LMS', status: 'Planned' },
  { name: 'Illuminate', category: 'Assessment', status: 'Planned' },
];

const TESTIMONIALS = [
  {
    quote: 'Partnering with EduNode has allowed us to offer our clients a complete data solution. The integration was seamless.',
    author: 'Jessica Martinez',
    role: 'CEO, EdTech Solutions Group',
    type: 'Implementation Partner',
  },
  {
    quote: 'The partner certification program gave our team the confidence to implement EduNode across our entire network.',
    author: 'Robert Chen',
    role: 'Director, Charter Support Services',
    type: 'Reseller Partner',
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-semibold text-slate-100">EduNode Analytics</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/integrations" className="text-slate-400 hover:text-slate-200 transition-colors">
                Integrations
              </Link>
              <Button asChild>
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
            <Users className="w-4 h-4" />
            <span>Partner Program</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
            Grow With the{' '}
            <span className="text-gradient-primary">EduNode Ecosystem</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Join our partner network to expand your reach, delight your customers,
            and drive revenue together. We&apos;re stronger when we work together.
          </p>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Partner Programs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {PARTNER_TYPES.map((partner, i) => (
              <Card key={i} className="p-8 flex flex-col">
                <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-6">
                  {partner.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">{partner.title}</h3>
                <p className="text-slate-400 mb-6">{partner.description}</p>
                <ul className="space-y-3 mb-8 flex-grow">
                  {partner.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact?type=partner">
                    {partner.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Integration Partners
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              EduNode integrates with the tools schools already use. Here&apos;s our
              current integration ecosystem.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {INTEGRATION_PARTNERS.map((partner, i) => (
              <Card
                key={i}
                className="p-4 flex items-center justify-between hover:border-slate-600/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-100">{partner.name}</p>
                  <p className="text-sm text-slate-500">{partner.category}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    partner.status === 'Certified'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : partner.status === 'In Progress'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}
                >
                  {partner.status}
                </span>
              </Card>
            ))}
          </div>

          <p className="text-center text-slate-500 mt-8">
            Don&apos;t see your platform?{' '}
            <Link href="/contact?type=integration" className="text-indigo-400 hover:underline">
              Request an integration
            </Link>
          </p>
        </div>
      </section>

      {/* Partner Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Partner Success Stories
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <Card key={i} className="p-8">
                <p className="text-lg text-slate-300 italic mb-6">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{testimonial.author}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                    <p className="text-xs text-indigo-400">{testimonial.type}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-indigo-500/20">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Ready to Partner?
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Whether you&apos;re a technology vendor, consultant, or reseller, we&apos;d love
              to explore how we can work together to help schools succeed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="gradient" asChild>
                <Link href="/contact?type=partner">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Partnership Team
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/integrations">View Integrations</Link>
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-6">
              Email us directly at{' '}
              <a href="mailto:partners@edunode.com" className="text-indigo-400 hover:underline">
                partners@edunode.com
              </a>
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} EduNode Analytics
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
            <Link href="/contact" className="hover:text-slate-300">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
