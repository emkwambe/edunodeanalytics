'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  Calendar,
  Clock,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';

const DEMO_BENEFITS = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'See Your Data Come Alive',
    description: 'We\'ll show you how EduNode transforms raw data into actionable insights.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Personalized Walkthrough',
    description: 'Our education specialists tailor the demo to your school\'s specific needs.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Security & Compliance Review',
    description: 'Learn how we protect student data and maintain FERPA compliance.',
  },
];

const SCHOOL_SIZES = [
  'Under 200 students',
  '200-500 students',
  '500-1000 students',
  '1000-2500 students',
  '2500+ students',
  'Network/CMO (multiple schools)',
];

const ROLES = [
  'School Leader / Principal',
  'Assistant Principal',
  'Data Manager / Coordinator',
  'Instructional Coach',
  'District Administrator',
  'CMO Leadership',
  'Technology Director',
  'Other',
];

export default function DemoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    schoolName: '',
    schoolSize: '',
    role: '',
    currentTools: '',
    priorities: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit demo request');
      }

      setIsSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or email us at sales@edunode.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-4">
            Demo Request Received!
          </h1>
          <p className="text-slate-400 mb-6">
            Thank you for your interest in EduNode Analytics. Our team will reach out
            within 1 business day to schedule your personalized demo.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Check your email at <strong className="text-slate-300">{formData.email}</strong> for
            confirmation.
          </p>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </Card>
      </div>
    );
  }

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
              <Link href="/sign-in" className="text-slate-400 hover:text-slate-200 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Info */}
            <div className="lg:sticky lg:top-24">
              <h1 className="text-4xl font-bold text-slate-100 mb-4">
                See EduNode in Action
              </h1>
              <p className="text-xl text-slate-400 mb-8">
                Schedule a personalized demo and discover how EduNode can transform
                your school&apos;s approach to data-driven decision making.
              </p>

              <div className="space-y-6 mb-8">
                {DEMO_BENEFITS.map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 h-fit">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{benefit.title}</h3>
                      <p className="text-slate-400 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="p-6 bg-slate-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-slate-100">What to Expect</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    30-45 minute live demo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                    Q&A with education specialists
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                    Custom pricing discussion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                    Free trial setup (optional)
                  </li>
                </ul>
              </Card>
            </div>

            {/* Right Column - Form */}
            <Card className="p-8">
              <h2 className="text-xl font-bold text-slate-100 mb-6">
                Request Your Demo
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Sarah"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Johnson"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="sarah@myschool.org"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-slate-300 mb-2">
                    School / Organization Name *
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    required
                    value={formData.schoolName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Academy Charter School"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="schoolSize" className="block text-sm font-medium text-slate-300 mb-2">
                      School Size *
                    </label>
                    <select
                      id="schoolSize"
                      name="schoolSize"
                      required
                      value={formData.schoolSize}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select size...</option>
                      {SCHOOL_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                      Your Role *
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select role...</option>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="currentTools" className="block text-sm font-medium text-slate-300 mb-2">
                    Current Data Tools (optional)
                  </label>
                  <input
                    type="text"
                    id="currentTools"
                    name="currentTools"
                    value={formData.currentTools}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., PowerSchool, Google Sheets, Illuminate"
                  />
                </div>

                <div>
                  <label htmlFor="priorities" className="block text-sm font-medium text-slate-300 mb-2">
                    What are your top priorities? (optional)
                  </label>
                  <textarea
                    id="priorities"
                    name="priorities"
                    rows={3}
                    value={formData.priorities}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="e.g., MTSS tracking, charter renewal prep, reducing chronic absenteeism..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Request Demo'}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  By submitting this form, you agree to our{' '}
                  <Link href="/privacy" className="text-indigo-400 hover:underline">
                    Privacy Policy
                  </Link>
                  . We&apos;ll never share your information.
                </p>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
