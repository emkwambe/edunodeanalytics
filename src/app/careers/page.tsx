import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Heart,
  Users,
  Zap,
  GraduationCap,
  MapPin,
  Clock,
  ArrowRight,
  Building2,
  Laptop,
  Coffee,
  Plane,
  Shield,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Careers | EduNode Analytics',
  description: 'Join EduNode Analytics and help transform how schools use data to support student success. View open positions and learn about our culture.',
};

const BENEFITS = [
  {
    icon: <Laptop className="w-6 h-6" />,
    title: 'Remote-First',
    description: 'Work from anywhere. We believe great talent isn\'t limited by geography.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision coverage for you and your family.',
  },
  {
    icon: <Plane className="w-6 h-6" />,
    title: 'Unlimited PTO',
    description: 'Take the time you need. We trust you to manage your work and life balance.',
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Learning Budget',
    description: '$2,500/year for courses, conferences, and professional development.',
  },
  {
    icon: <Coffee className="w-6 h-6" />,
    title: 'Home Office Stipend',
    description: '$1,000 to set up your ideal workspace, plus monthly internet reimbursement.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '401(k) Match',
    description: '4% company match to help you build for the future.',
  },
];

const OPEN_POSITIONS = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Build scalable data pipelines and intuitive dashboards that serve 200+ schools.',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Design experiences that help educators understand complex data at a glance.',
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Partner with schools to maximize their impact using EduNode Analytics.',
  },
  {
    title: 'Data Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Integrate diverse educational data sources into a unified analytics platform.',
  },
  {
    title: 'Sales Development Rep',
    department: 'Sales',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Help charter schools discover how data can transform student outcomes.',
  },
];

const VALUES = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Students First',
    description: 'Every decision starts with: "How does this help students succeed?"',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Radical Collaboration',
    description: 'We win together. Ego-free teamwork across every function.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Bias for Action',
    description: 'Move fast, ship often, learn constantly. Perfect is the enemy of good.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Deep Empathy',
    description: 'We understand educators because many of us were educators.',
  },
];

export default function CareersPage() {
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
              <Link href="/about" className="text-slate-400 hover:text-slate-200 transition-colors">
                About
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">We&apos;re Hiring!</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
            Build the Future of{' '}
            <span className="text-gradient-primary">Educational Analytics</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
            Join a mission-driven team transforming how schools use data to support
            student success. We&apos;re looking for passionate people who believe
            every child deserves equitable access to great education.
          </p>
        </div>
      </section>

      {/* Culture Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-4">
            Our Culture
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            We&apos;re building a company where talented people thrive and do the best work of their careers.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, i) => (
              <Card key={i} className="p-6">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{value.title}</h3>
                <p className="text-slate-400 text-sm">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-4">
            Benefits & Perks
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            We take care of our team so they can focus on taking care of schools.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <Card key={i} className="p-6">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{benefit.title}</h3>
                <p className="text-slate-400 text-sm">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-4">
            Open Positions
          </h2>
          <p className="text-slate-400 text-center mb-12">
            Find your next opportunity. All positions are remote-first.
          </p>
          <div className="space-y-4">
            {OPEN_POSITIONS.map((position, i) => (
              <Card key={i} className="p-6 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-1 group-hover:text-indigo-400 transition-colors">
                      {position.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">{position.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full md:w-auto group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-colors">
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* No Match CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Don&apos;t See a Perfect Fit?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            We&apos;re always looking for exceptional people. Send us your resume and
            tell us how you&apos;d contribute to our mission.
          </p>
          <Button size="lg" variant="gradient" asChild>
            <Link href="mailto:careers@edunode.io">
              Send Your Resume
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Team Photo Placeholder */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-slate-700 p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5" />
            <div className="relative">
              <Users className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-slate-100 mb-4">
                Join Our Growing Team
              </h3>
              <p className="text-slate-400 max-w-2xl mx-auto">
                We&apos;re a diverse group of educators, engineers, designers, and data
                scientists united by a shared passion for improving education through data.
              </p>
            </div>
          </div>
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
