import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Video,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Play,
  CheckCircle,
  Bell,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Webinars & Events | EduNode Analytics',
  description: 'Join our live webinars and events to learn best practices for educational data analytics, MTSS implementation, and data-driven decision making.',
};

const UPCOMING_WEBINARS = [
  {
    title: 'Getting Started with EduNode: A Complete Walkthrough',
    description: 'Learn how to set up your school, connect data sources, and start tracking student progress in under 30 minutes.',
    date: 'March 15, 2026',
    time: '2:00 PM ET',
    duration: '45 min',
    presenter: 'Sarah Chen, CEO',
    attendees: 124,
    isLive: false,
  },
  {
    title: 'Building Effective MTSS Workflows with Data',
    description: 'Discover how to use EduNode\'s intervention tracking to identify at-risk students early and monitor progress systematically.',
    date: 'March 22, 2026',
    time: '1:00 PM ET',
    duration: '60 min',
    presenter: 'Elena Rodriguez, VP Product',
    attendees: 89,
    isLive: false,
  },
  {
    title: 'Advanced Analytics: Cohort Analysis & Predictive Insights',
    description: 'Deep dive into EduNode\'s advanced analytics features including cohort tracking, trend analysis, and predictive modeling.',
    date: 'March 29, 2026',
    time: '3:00 PM ET',
    duration: '60 min',
    presenter: 'David Park, VP Engineering',
    attendees: 67,
    isLive: false,
  },
];

const PAST_WEBINARS = [
  {
    title: 'FERPA Compliance for Modern EdTech',
    description: 'Understanding data privacy requirements and how EduNode keeps student data secure.',
    date: 'February 28, 2026',
    duration: '45 min',
    views: 1240,
  },
  {
    title: 'From Data to Action: Case Studies in Student Success',
    description: 'Real stories from charter schools using EduNode to improve outcomes.',
    date: 'February 14, 2026',
    duration: '50 min',
    views: 890,
  },
  {
    title: 'Integrating Canvas & Clever with EduNode',
    description: 'Step-by-step guide to connecting your LMS and SIS for unified analytics.',
    date: 'January 31, 2026',
    duration: '40 min',
    views: 2100,
  },
  {
    title: 'Data-Driven Intervention Strategies',
    description: 'How to use attendance, assessment, and engagement data to target interventions.',
    date: 'January 17, 2026',
    duration: '55 min',
    views: 1560,
  },
];

const WEBINAR_SERIES = [
  {
    title: 'EduNode Essentials',
    description: 'Perfect for new users getting started with the platform.',
    episodes: 6,
    totalTime: '4 hours',
  },
  {
    title: 'Data Leadership Academy',
    description: 'For administrators wanting to build data-driven school culture.',
    episodes: 8,
    totalTime: '6 hours',
  },
  {
    title: 'Technical Deep Dives',
    description: 'API integrations, custom reports, and advanced configurations.',
    episodes: 5,
    totalTime: '5 hours',
  },
];

export default function WebinarsPage() {
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
              <Link href="/blog" className="text-slate-400 hover:text-slate-200 transition-colors">
                Blog
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
            <Video className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">Live & On-Demand Learning</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
            Webinars &{' '}
            <span className="text-gradient-primary">Events</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
            Learn best practices for educational data analytics from our team of
            educators and data experts. Join live sessions or watch on-demand.
          </p>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-100">
              Upcoming Webinars
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="#subscribe">
                <Bell className="w-4 h-4 mr-2" />
                Get Notified
              </Link>
            </Button>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {UPCOMING_WEBINARS.map((webinar, i) => (
              <Card key={i} className="p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    Upcoming
                  </span>
                  <span className="text-slate-500 text-xs">{webinar.duration}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  {webinar.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 flex-1">
                  {webinar.description}
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{webinar.date}</span>
                    <span className="text-slate-600">•</span>
                    <Clock className="w-4 h-4" />
                    <span>{webinar.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{webinar.attendees} registered</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Presented by <span className="text-indigo-400">{webinar.presenter}</span>
                  </div>
                </div>
                <Button variant="gradient" className="w-full">
                  Register Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* On-Demand Series */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-4">
            On-Demand Learning Series
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Self-paced video courses to master EduNode Analytics at your own schedule.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {WEBINAR_SERIES.map((series, i) => (
              <Card key={i} className="p-6 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-4">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">
                  {series.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {series.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{series.episodes} episodes</span>
                  <span className="text-slate-600">•</span>
                  <span>{series.totalTime}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Past Webinars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-4">
            Past Webinars
          </h2>
          <p className="text-slate-400 text-center mb-12">
            Catch up on sessions you may have missed.
          </p>
          <div className="space-y-4">
            {PAST_WEBINARS.map((webinar, i) => (
              <Card key={i} className="p-6 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-slate-700/50 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                      <Play className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-1 group-hover:text-indigo-400 transition-colors">
                        {webinar.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-2">{webinar.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span>{webinar.date}</span>
                        <span className="text-slate-600">•</span>
                        <span>{webinar.duration}</span>
                        <span className="text-slate-600">•</span>
                        <span>{webinar.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full md:w-auto">
                    Watch Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline">
              View All Recordings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section id="subscribe" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mx-auto mb-6">
            <Bell className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Never Miss a Session
          </h2>
          <p className="text-slate-400 mb-8">
            Subscribe to get notified about upcoming webinars, new recordings,
            and exclusive educational content.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <Button variant="gradient" size="lg">
              Subscribe
            </Button>
          </form>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>No spam, unsubscribe anytime</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Ready to See EduNode in Action?
          </h2>
          <p className="text-slate-400 mb-8">
            Schedule a personalized demo with our team and see how EduNode
            can transform your school&apos;s approach to data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/demo">
                Request Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
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
