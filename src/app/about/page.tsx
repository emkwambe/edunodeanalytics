import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Target,
  Heart,
  Users,
  Lightbulb,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us | EduNode Analytics',
  description: 'Learn about EduNode Analytics - our mission, values, and the team building the future of educational data.',
};

const VALUES = [
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Student-Centered',
    description: 'Every feature we build asks one question: will this help educators help students succeed?',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Privacy First',
    description: 'Student data is sacred. We build with FERPA compliance as a foundation, not an afterthought.',
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: 'Actionable Insights',
    description: 'Data without action is just noise. We surface insights that lead to better decisions.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Equity in Access',
    description: 'Every school deserves enterprise-grade analytics, regardless of size or budget.',
  },
];

const TEAM = [
  {
    name: 'Dr. Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former charter school principal with 15 years in education. Ed.D. from Stanford.',
  },
  {
    name: 'Marcus Johnson',
    role: 'CTO & Co-Founder',
    bio: 'Previously led data infrastructure at Clever. Built systems serving 30M students.',
  },
  {
    name: 'Elena Rodriguez',
    role: 'VP of Product',
    bio: 'Former MTSS coordinator and product leader. Passionate about evidence-based intervention.',
  },
  {
    name: 'David Park',
    role: 'VP of Engineering',
    bio: 'Security-focused engineer from EdFi. Expert in educational data standards.',
  },
];

const MILESTONES = [
  { year: '2021', event: 'Founded by educators frustrated with fragmented data systems' },
  { year: '2022', event: 'Launched beta with 5 charter schools in California' },
  { year: '2023', event: 'Raised Series A, expanded to 50+ schools across 8 states' },
  { year: '2024', event: 'SOC 2 Type II certified, launched Enterprise tier' },
  { year: '2025', event: 'Serving 200+ schools, processing 500K+ student records' },
];

export default function AboutPage() {
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
              <Link href="/pricing" className="text-slate-400 hover:text-slate-200 transition-colors">
                Pricing
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
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
            Built by Educators,{' '}
            <span className="text-gradient-primary">For Educators</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            We started EduNode because we lived the problem. As charter school leaders,
            we spent more time wrestling with spreadsheets than supporting students.
            We knew there had to be a better way.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-100 mb-6">Our Mission</h2>
              <p className="text-lg text-slate-400 mb-6">
                To democratize educational data analytics, giving every school—regardless
                of size or resources—the tools to understand their students deeply and
                intervene effectively.
              </p>
              <p className="text-lg text-slate-400 mb-6">
                We believe that data should illuminate, not overwhelm. That insights
                should lead to action. And that every educator deserves to know:
              </p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <span><strong>Who</strong> needs help right now</span>
                </li>
                <li className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                  <span><strong>What</strong> intervention will work best</span>
                </li>
                <li className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  <span><strong>Whether</strong> it&apos;s actually working</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-2xl blur-3xl" />
              <Card className="relative p-8 text-center">
                <div className="text-5xl font-bold text-gradient-primary mb-2">200+</div>
                <div className="text-slate-400 mb-6">Schools Served</div>
                <div className="text-5xl font-bold text-gradient-primary mb-2">500K+</div>
                <div className="text-slate-400 mb-6">Student Records</div>
                <div className="text-5xl font-bold text-gradient-primary mb-2">15+</div>
                <div className="text-slate-400">States</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Our Values
          </h2>
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

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Our Journey
          </h2>
          <div className="space-y-8">
            {MILESTONES.map((milestone, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center">
                    <span className="text-indigo-400 font-bold text-sm">{milestone.year}</span>
                  </div>
                  {i < MILESTONES.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-700 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <p className="text-slate-300 text-lg">{milestone.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-4">
            Leadership Team
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Educators, engineers, and data scientists united by a shared mission
            to transform how schools use data.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{member.name}</h3>
                <p className="text-indigo-400 text-sm mb-3">{member.role}</p>
                <p className="text-slate-400 text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Ready to Transform Your School&apos;s Data?
          </h2>
          <p className="text-slate-400 mb-8">
            Join the growing community of charter schools making data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/demo">
                Schedule a Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-studies">Read Case Studies</Link>
            </Button>
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
