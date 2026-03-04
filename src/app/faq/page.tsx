'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, Search, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  faqs: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    name: 'Getting Started',
    faqs: [
      {
        question: 'How long does it take to set up EduNode?',
        answer: 'Most schools are up and running within 1-2 weeks. The timeline depends on your data sources: if you use Clever or ClassLink, roster sync takes minutes. For direct SIS integrations, allow 3-5 business days for setup and data validation. Our onboarding team guides you through every step.',
      },
      {
        question: 'Do I need technical expertise to use EduNode?',
        answer: 'No. EduNode is designed for educators, not IT departments. The interface is intuitive, and we provide comprehensive training during onboarding. That said, having a data coordinator or tech-savvy staff member can help with initial setup and ongoing administration.',
      },
      {
        question: 'Can I try EduNode before committing?',
        answer: 'Yes! We offer a 30-day free trial with full access to all features. We\'ll help you connect your data during the trial so you can evaluate with real insights, not just a demo environment. No credit card required to start.',
      },
      {
        question: 'What training and support do you provide?',
        answer: 'Every customer gets live onboarding sessions, access to our knowledge base and video tutorials, and email support. Professional and Enterprise customers get dedicated success managers, priority support, and custom training sessions for their staff.',
      },
    ],
  },
  {
    name: 'Data & Integrations',
    faqs: [
      {
        question: 'What data sources does EduNode integrate with?',
        answer: 'We integrate with major SIS platforms (PowerSchool, Infinite Campus, Skyward), roster providers (Clever, ClassLink), assessment systems (NWEA MAP, i-Ready, Renaissance STAR), and LMS platforms (Canvas, Google Classroom). See our Integrations page for the full list. Need something we don\'t have? Let us know.',
      },
      {
        question: 'How often is data synced?',
        answer: 'Roster data syncs daily by default, with options for more frequent syncing on higher tiers. Assessment data syncs when new results are available. You can also trigger manual syncs anytime. Real-time sync is available for Enterprise customers.',
      },
      {
        question: 'Can I import historical data?',
        answer: 'Yes. We can import up to 5 years of historical data to enable trend analysis and longitudinal tracking. Our team handles the heavy lifting during onboarding to ensure data integrity.',
      },
      {
        question: 'What if I use a system you don\'t integrate with?',
        answer: 'We offer CSV upload for any data source, a generic API for custom integrations, and we\'re constantly adding new integrations based on customer demand. Enterprise customers can request priority development of new integrations.',
      },
    ],
  },
  {
    name: 'Security & Privacy',
    faqs: [
      {
        question: 'Is EduNode FERPA compliant?',
        answer: 'Absolutely. We operate as a "school official" under FERPA, with strict Data Processing Agreements (DPAs) in place. We never sell student data, we encrypt everything, and we maintain comprehensive audit logs. See our FERPA Compliance page for details.',
      },
      {
        question: 'Where is my data stored?',
        answer: 'All data is stored in SOC 2 Type II certified data centers in the United States. We use industry-leading cloud infrastructure with encryption at rest (AES-256) and in transit (TLS 1.3). Data is logically separated by school with strict access controls.',
      },
      {
        question: 'Who can access student data?',
        answer: 'Only authorized users at your school can access data, based on role-based permissions. Teachers see only their students; administrators see school-wide data. EduNode staff access is strictly limited, logged, and only used for support purposes when authorized.',
      },
      {
        question: 'What happens to my data if I cancel?',
        answer: 'You own your data. Upon cancellation, we provide a 90-day window to export all your data. After that, we permanently delete it from our systems within 30 days. We provide a certification of deletion upon request.',
      },
      {
        question: 'Do you have a Data Processing Agreement (DPA)?',
        answer: 'Yes. We provide DPAs for all customers and have signed the Student Data Privacy Consortium (SDPC) National DPA. State-specific addenda are available for California, New York, and other states with additional requirements.',
      },
    ],
  },
  {
    name: 'Pricing & Billing',
    faqs: [
      {
        question: 'How much does EduNode cost?',
        answer: 'Pricing starts at $4,500/year for our Starter tier (up to 300 students). Professional tier is $7,500/year plus $5/student. Enterprise pricing is custom based on network size and needs. Visit our Pricing page for detailed feature comparison.',
      },
      {
        question: 'Is there a per-student cost?',
        answer: 'Our Starter tier has a flat rate. Professional tier includes a per-student fee ($5/student/year) which covers advanced features like Student 360 and AI insights. Enterprise pricing is typically negotiated as a flat rate for networks.',
      },
      {
        question: 'Do you offer discounts for multi-year contracts?',
        answer: 'Yes. We offer 10% off for 2-year commitments and 15% off for 3-year commitments. Charter networks with multiple schools also receive volume discounts.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept credit cards, ACH transfers, and purchase orders (for annual plans). Most schools pay via PO aligned with their fiscal year.',
      },
      {
        question: 'Can I change my plan mid-year?',
        answer: 'Yes. You can upgrade anytime, and we\'ll prorate the difference. Downgrades take effect at the next renewal period.',
      },
    ],
  },
  {
    name: 'Features & Functionality',
    faqs: [
      {
        question: 'What is the Early Warning System (EWS)?',
        answer: 'Our EWS uses a weighted algorithm combining attendance, behavior, and coursework data (the ABCs) to identify students at risk of falling behind or dropping out. It provides actionable alerts so you can intervene early.',
      },
      {
        question: 'How does the AI advisor work?',
        answer: 'The AI advisor (available in Professional+ tiers) analyzes student data patterns and provides evidence-based recommendations for interventions. It learns from your school\'s data but never shares it. All AI suggestions are meant to support—not replace—educator judgment.',
      },
      {
        question: 'Can authorizers access our data?',
        answer: 'With our Authorizer Portal feature, you can grant read-only access to charter authorizers for compliance reporting. You control exactly what they see, and all access is logged.',
      },
      {
        question: 'Does EduNode support MTSS/RTI tracking?',
        answer: 'Yes! Our Intervention Hub (Professional+ tiers) provides full MTSS/RTI workflow management: tier assignments, intervention planning, progress monitoring, and efficacy analysis. It integrates with your assessment data for data-driven tier decisions.',
      },
      {
        question: 'Can I create custom reports?',
        answer: 'Starter includes standard report templates. Professional adds customizable reports with filters and scheduling. Enterprise includes a custom report builder and API access for advanced reporting needs.',
      },
    ],
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-5 flex items-start justify-between text-left gap-4"
      >
        <span className="font-medium text-slate-100">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-slate-400 flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-slate-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredFAQs = searchQuery
    ? FAQ_DATA.map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.faqs.length > 0)
    : activeCategory
    ? FAQ_DATA.filter((c) => c.name === activeCategory)
    : FAQ_DATA;

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
              <Link href="/contact" className="text-slate-400 hover:text-slate-200 transition-colors">
                Contact
              </Link>
              <Button asChild>
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Find answers to common questions about EduNode Analytics.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      {!searchQuery && (
        <section className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  !activeCategory
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                All
              </button>
              {FAQ_DATA.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeCategory === category.name
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ List */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-400 mb-4">
                No FAQs match your search. Try different keywords or{' '}
                <Link href="/contact" className="text-indigo-400 hover:underline">
                  contact us
                </Link>{' '}
                directly.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              {filteredFAQs.map((category) => (
                <Card key={category.name} className="p-6">
                  <h2 className="text-lg font-semibold text-indigo-400 mb-4">
                    {category.name}
                  </h2>
                  <div className="divide-y divide-slate-700/50">
                    {category.faqs.map((faq, i) => {
                      const key = `${category.name}-${i}`;
                      return (
                        <AccordionItem
                          key={key}
                          question={faq.question}
                          answer={faq.answer}
                          isOpen={openItems.has(key)}
                          onToggle={() => toggleItem(key)}
                        />
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 text-center bg-slate-800/50">
            <MessageCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              Still Have Questions?
            </h2>
            <p className="text-slate-400 mb-6">
              Our team is here to help. Reach out and we&apos;ll get back to you within one business day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/demo">Schedule a Demo</Link>
              </Button>
            </div>
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
