import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Quote, Star, ArrowRight, Users, TrendingUp, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Testimonials | EduNode Analytics',
  description: 'See what educators are saying about EduNode Analytics and how it\'s transforming their schools.',
};

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  school: string;
  location: string;
  metrics?: {
    label: string;
    value: string;
  };
  featured?: boolean;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Before EduNode, I spent 10 hours a week manually compiling reports from different systems. Now I have a single dashboard that updates automatically. I\'ve gotten my weekends back.',
    author: 'Dr. Maria Santos',
    role: 'Principal',
    school: 'Esperanza Charter Academy',
    location: 'Los Angeles, CA',
    metrics: { label: 'Time Saved', value: '10 hrs/week' },
    featured: true,
  },
  {
    quote: 'The Early Warning System identified 12 students we would have missed. Three months later, 10 of them are back on track. That\'s the kind of impact that keeps me in education.',
    author: 'James Williams',
    role: 'Dean of Students',
    school: 'Innovation Prep',
    location: 'Houston, TX',
    metrics: { label: 'Students Recovered', value: '83%' },
    featured: true,
  },
  {
    quote: 'Our charter authorizer was impressed by the renewal dashboard. For the first time, we could show our growth story with data they trusted. We renewed with commendations.',
    author: 'Patricia Nguyen',
    role: 'Executive Director',
    school: 'Beacon Charter Network',
    location: 'Oakland, CA',
    metrics: { label: 'Charter Status', value: 'Renewed' },
    featured: true,
  },
  {
    quote: 'As a first-year principal, I was overwhelmed by data. EduNode made it simple. The MTSS tracking alone has transformed how we support struggling students.',
    author: 'Michael Thompson',
    role: 'Principal',
    school: 'Summit Scholars',
    location: 'Denver, CO',
  },
  {
    quote: 'We tried three different analytics platforms before EduNode. None of them understood charter schools. EduNode was built by people who get our reality.',
    author: 'Angela Robinson',
    role: 'COO',
    school: 'Pathways Charter Network',
    location: 'Atlanta, GA',
  },
  {
    quote: 'The Student 360 view is a game-changer for parent conferences. I can show families exactly where their child stands and what we\'re doing to help them grow.',
    author: 'David Kim',
    role: '4th Grade Teacher',
    school: 'Harmony Elementary',
    location: 'Seattle, WA',
  },
  {
    quote: 'Integration with our SIS was seamless. We were up and running in three days. Our previous vendor took three months and still had issues.',
    author: 'Lisa Hernandez',
    role: 'Technology Director',
    school: 'Excel Academy',
    location: 'Phoenix, AZ',
  },
  {
    quote: 'The FERPA compliance gave our board peace of mind. We know student data is protected, and we have the audit trails to prove it.',
    author: 'Robert Chen',
    role: 'Board Chair',
    school: 'Achievement First Charter',
    location: 'Newark, NJ',
  },
  {
    quote: 'EduNode helped us identify a 15% gap in reading proficiency between two cohorts. We reallocated resources and closed that gap in one semester.',
    author: 'Dr. Keisha Brown',
    role: 'Chief Academic Officer',
    school: 'Rising Stars Schools',
    location: 'Detroit, MI',
    metrics: { label: 'Gap Closed', value: '15%' },
  },
];

const STATS = [
  { icon: <Users className="w-6 h-6" />, value: '200+', label: 'Schools Trust Us' },
  { icon: <TrendingUp className="w-6 h-6" />, value: '94%', label: 'Customer Retention' },
  { icon: <Clock className="w-6 h-6" />, value: '8 hrs', label: 'Avg. Time Saved/Week' },
  { icon: <Star className="w-6 h-6" />, value: '4.9/5', label: 'Customer Satisfaction' },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className={`p-6 flex flex-col ${testimonial.featured ? 'md:col-span-2 lg:col-span-1' : ''}`}>
      <Quote className="w-8 h-8 text-indigo-400/50 mb-4" />
      <p className="text-slate-300 leading-relaxed mb-6 flex-grow">
        &quot;{testimonial.quote}&quot;
      </p>
      {testimonial.metrics && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 uppercase tracking-wider">{testimonial.metrics.label}</p>
          <p className="text-2xl font-bold text-emerald-400">{testimonial.metrics.value}</p>
        </div>
      )}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">
            {testimonial.author.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="font-semibold text-slate-100">{testimonial.author}</p>
          <p className="text-sm text-slate-400">{testimonial.role}</p>
          <p className="text-sm text-indigo-400">{testimonial.school}</p>
        </div>
      </div>
    </Card>
  );
}

export default function TestimonialsPage() {
  const featuredTestimonials = TESTIMONIALS.filter(t => t.featured);
  const otherTestimonials = TESTIMONIALS.filter(t => !t.featured);

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
              <Link href="/case-studies" className="text-slate-400 hover:text-slate-200 transition-colors">
                Case Studies
              </Link>
              <Button asChild>
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
            Trusted by{' '}
            <span className="text-gradient-primary">Educators Everywhere</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Don&apos;t just take our word for it. Hear from the principals, teachers,
            and administrators who use EduNode every day to drive student success.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="inline-flex p-3 rounded-lg bg-indigo-500/10 text-indigo-400 mb-3">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gradient-primary">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-100 mb-8 text-center">
            Featured Stories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTestimonials.map((testimonial, i) => (
              <TestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* All Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-100 mb-8 text-center">
            More From Our Community
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTestimonials.map((testimonial, i) => (
              <TestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonial Placeholder */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">
            See EduNode in Action
          </h2>
          <p className="text-slate-400 mb-8">
            Watch how Esperanza Charter Academy transformed their data culture with EduNode.
          </p>
          <Card className="aspect-video flex items-center justify-center bg-slate-800">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-slate-400">Video testimonial coming soon</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-slate-400 mb-8">
            Join hundreds of schools using EduNode to make data-driven decisions
            and improve student outcomes.
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
