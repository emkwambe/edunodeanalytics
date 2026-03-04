import Link from 'next/link';
import {
  ArrowRight,
  Quote,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Award,
  MapPin,
  GraduationCap,
  BarChart3,
} from 'lucide-react';

interface CaseStudy {
  id: string;
  school: string;
  location: string;
  type: string;
  enrollment: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    description: string;
  }[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    image?: string;
  };
  featured?: boolean;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'horizons-academy',
    school: 'Horizons Academy Charter',
    location: 'Phoenix, AZ',
    type: 'K-8 Charter School',
    enrollment: '485 students',
    challenge:
      'Facing charter renewal with scattered data across 6 different systems. Staff spent 20+ hours monthly compiling board reports manually.',
    solution:
      'Implemented EduNode to unify data from PowerSchool, NWEA MAP, and iReady. Created automated dashboards for authorizer reporting.',
    results: [
      {
        metric: '85%',
        value: 'Less time on reports',
        description: 'Board report prep dropped from 20 hours to 3 hours per month',
      },
      {
        metric: '12%',
        value: 'Attendance improvement',
        description: 'Early warning system identified chronic absence risks early',
      },
      {
        metric: '100%',
        value: 'Renewal success',
        description: 'Authorizer praised data transparency during renewal review',
      },
    ],
    testimonial: {
      quote:
        "EduNode transformed how we present data to our authorizer. Instead of scrambling before each board meeting, we now have real-time dashboards that tell our school's story with data. Our renewal process was the smoothest it's ever been.",
      author: 'Dr. Maria Santos',
      role: 'Executive Director',
    },
    featured: true,
  },
  {
    id: 'stem-prep',
    school: 'STEM Prep Academy',
    location: 'Atlanta, GA',
    type: 'High School Charter',
    enrollment: '620 students',
    challenge:
      'Teachers lacked visibility into student performance across subjects. MTSS interventions were tracked in spreadsheets with no way to measure effectiveness.',
    solution:
      'Deployed Student 360 view for teachers and Intervention Hub for MTSS coordinators. Integrated Canvas LMS and Renaissance Star data.',
    results: [
      {
        metric: '23%',
        value: 'More interventions tracked',
        description: 'Staff now log and monitor all tier 2/3 interventions systematically',
      },
      {
        metric: '8%',
        value: 'Math proficiency gain',
        description: 'Targeted interventions based on data increased benchmark scores',
      },
      {
        metric: '3x',
        value: 'Faster data access',
        description: 'Teachers access student data in seconds instead of minutes',
      },
    ],
    testimonial: {
      quote:
        "Before EduNode, I'd spend my planning period hunting through three different systems to understand one student. Now I open Student 360 and everything's there—grades, assessments, behavior, attendance. I can actually use my planning time to plan.",
      author: 'James Mitchell',
      role: '10th Grade Math Teacher',
    },
  },
  {
    id: 'community-charter-network',
    school: 'Community Charter Network',
    location: 'Denver, CO',
    type: 'CMO (4 schools)',
    enrollment: '1,850 students',
    challenge:
      'Network leadership had no way to compare performance across schools. Each school used different assessment tools and reported data differently.',
    solution:
      'Enterprise deployment with Network View dashboard. Standardized data ingestion from all 4 schools with custom benchmarking.',
    results: [
      {
        metric: '4 schools',
        value: 'Unified view',
        description: 'Single dashboard comparing all schools on common metrics',
      },
      {
        metric: '40%',
        value: 'Faster board prep',
        description: 'Network-wide reports generated automatically',
      },
      {
        metric: '15%',
        value: 'Resource optimization',
        description: 'Identified underutilized programs across the network',
      },
    ],
    testimonial: {
      quote:
        "Managing four schools means I can't be everywhere at once. EduNode's Network View gives me visibility into every school's pulse without waiting for monthly reports. When I see a school trending down, I can ask the right questions immediately.",
      author: 'Dr. Angela Richardson',
      role: 'Chief Academic Officer',
    },
    featured: true,
  },
  {
    id: 'scholars-path',
    school: "Scholars' Path Academy",
    location: 'Newark, NJ',
    type: 'K-5 Charter School',
    enrollment: '340 students',
    challenge:
      'High mobility school serving housing-insecure families. Lost track of students who transferred and struggled to maintain continuity.',
    solution:
      'Implemented mobility tracking and Student 360 with quick-view summaries for incoming students. Automated data requests to previous schools.',
    results: [
      {
        metric: '48 hrs',
        value: 'Faster onboarding',
        description: 'New students get appropriate supports within 2 days vs 2 weeks',
      },
      {
        metric: '92%',
        value: 'Data capture rate',
        description: 'Student history now captured for nearly all transfers',
      },
      {
        metric: '18%',
        value: 'Retention improvement',
        description: 'Better supports led to fewer mid-year withdrawals',
      },
    ],
    testimonial: {
      quote:
        "Our students deserve continuity even when life is chaotic. EduNode helps us get students into the right interventions from day one, not week three. For a kid who's already been through trauma, those two weeks matter.",
      author: 'Principal Denise Williams',
      role: 'School Principal',
    },
  },
  {
    id: 'innovation-high',
    school: 'Innovation High School',
    location: 'Austin, TX',
    type: 'STEM-focused Charter',
    enrollment: '510 students',
    challenge:
      'Project-based learning made traditional assessment tracking inadequate. Needed to demonstrate growth to skeptical authorizers.',
    solution:
      'Customized Momentum Dashboard for PBL cycles. Integrated portfolio completion with standards mastery tracking.',
    results: [
      {
        metric: '96%',
        value: 'Standards coverage',
        description: 'Mapped PBL projects to state standards systematically',
      },
      {
        metric: '2x',
        value: 'Parent engagement',
        description: 'Portfolio progress visible to parents increased involvement',
      },
      {
        metric: '5-year',
        value: 'Charter renewed',
        description: 'Authorizer extended renewal based on demonstrated rigor',
      },
    ],
    testimonial: {
      quote:
        "Our authorizer was skeptical that project-based learning could be rigorous. EduNode let us show them exactly how every project maps to standards and how students progress. We got a 5-year renewal instead of the usual 3.",
      author: 'Dr. Robert Chen',
      role: 'Head of School',
    },
  },
];

const STATS = [
  { value: '500+', label: 'Charter Schools' },
  { value: '250K+', label: 'Students Served' },
  { value: '94%', label: 'Renewal Success Rate' },
  { value: '4.8/5', label: 'Principal Satisfaction' },
];

export default function CaseStudiesPage() {
  const featuredStudies = CASE_STUDIES.filter((s) => s.featured);
  const otherStudies = CASE_STUDIES.filter((s) => !s.featured);

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
              <Link href="/security" className="text-sm text-slate-600 hover:text-slate-900">
                Security
              </Link>
              <Link href="/integrations" className="text-sm text-slate-600 hover:text-slate-900">
                Integrations
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Real Results from Real Schools
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Charter Schools Succeeding
              <span className="block text-blue-600">with Data-Driven Decisions</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              See how charter schools across the country use EduNode to streamline operations,
              demonstrate growth, and achieve successful renewals.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Featured Success Stories</h2>
            <p className="text-slate-600">
              Deep dives into how schools transformed their data practices.
            </p>
          </div>

          <div className="space-y-16">
            {featuredStudies.map((study, index) => (
              <div
                key={study.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-start ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* School Info & Results */}
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    {/* School Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">{study.school}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {study.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            {study.enrollment}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {study.type}
                      </span>
                    </div>

                    {/* Challenge & Solution */}
                    <div className="space-y-4 mb-8">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                          The Challenge
                        </h4>
                        <p className="text-slate-600">{study.challenge}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                          The Solution
                        </h4>
                        <p className="text-slate-600">{study.solution}</p>
                      </div>
                    </div>

                    {/* Results */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                        Results
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {study.results.map((result) => (
                          <div key={result.metric} className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{result.metric}</div>
                            <div className="text-sm font-medium text-slate-900">{result.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{result.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 h-full flex flex-col justify-center">
                    <Quote className="w-12 h-12 text-blue-200 mb-6" />
                    <blockquote className="text-xl text-white leading-relaxed mb-8">
                      &ldquo;{study.testimonial.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{study.testimonial.author}</div>
                        <div className="text-blue-200 text-sm">{study.testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Case Studies */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">More Success Stories</h2>
            <p className="text-slate-600">Schools across the country achieving results with EduNode.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherStudies.map((study) => (
              <div
                key={study.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {study.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {study.location}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">{study.school}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{study.challenge}</p>

                {/* Key Result */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {study.results[0].metric}
                      </span>
                      <span className="text-sm text-slate-600 ml-2">{study.results[0].value}</span>
                    </div>
                  </div>
                </div>

                {/* Quote Preview */}
                <blockquote className="text-sm text-slate-600 italic border-l-2 border-blue-200 pl-3 mb-4 line-clamp-3">
                  &ldquo;{study.testimonial.quote}&rdquo;
                </blockquote>

                <div className="text-sm">
                  <span className="font-medium text-slate-900">{study.testimonial.author}</span>
                  <span className="text-slate-500"> • {study.testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What Principals Say</h2>
            <p className="text-slate-600">Direct feedback from school leaders using EduNode.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Finally, a data platform that understands charter schools. The authorizer portal alone is worth the investment.',
                author: 'Principal Michael Torres',
                school: 'Lighthouse Charter, Oakland, CA',
              },
              {
                quote:
                  "Our teachers used to dread data meetings. Now they come prepared with insights. It's changed our entire culture.",
                author: 'Dr. Lisa Park',
                school: 'Academy of Innovation, Miami, FL',
              },
              {
                quote:
                  'The onboarding team had us up and running in a week. Fastest EdTech implementation I\'ve ever seen.',
                author: 'Principal David Okonkwo',
                school: 'Heritage Prep, Chicago, IL',
              },
              {
                quote:
                  'We serve a high-mobility population. EduNode helps us ensure no student falls through the cracks during transitions.',
                author: 'Principal Rosa Martinez',
                school: 'Community Scholars, Houston, TX',
              },
              {
                quote:
                  "I can show my board exactly where we stand on every metric. No more 'we think' - now it's 'the data shows.'",
                author: 'Dr. James Wilson',
                school: 'Catalyst Academy, Nashville, TN',
              },
              {
                quote:
                  'The ROI was clear within 3 months. Staff time saved on reporting alone justified the cost.',
                author: 'Principal Amanda Chen',
                school: 'Excel Charter, Seattle, WA',
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                <Quote className="w-8 h-8 text-slate-200 mb-4" />
                <blockquote className="text-slate-700 mb-4">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                <div>
                  <div className="font-medium text-slate-900">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">{testimonial.school}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to write your success story?
          </h2>
          <p className="text-blue-100 mb-8">
            Join hundreds of charter schools using EduNode to drive student outcomes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-blue-100 font-medium"
            >
              Talk to Sales
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
              <Link href="/security" className="hover:text-slate-900">Security</Link>
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
