'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Shield,
  Headphones,
} from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  role: string;
  studentCount: string;
  message: string;
  interests: string[];
}

const INTEREST_OPTIONS = [
  { id: 'network-view', label: 'Network View (Multi-School Dashboard)' },
  { id: 'benchmarking', label: 'Network Benchmarking' },
  { id: 'custom-integrations', label: 'Custom Data Integrations' },
  { id: 'api-access', label: 'API Access' },
  { id: 'sso', label: 'SSO Configuration (SAML/OIDC)' },
  { id: 'white-label', label: 'Full White-Labeling' },
  { id: 'dedicated-support', label: 'Dedicated Success Partner' },
];

const ROLE_OPTIONS = [
  'Executive Director / CEO',
  'Chief Academic Officer',
  'Director of Data & Analytics',
  'Director of Operations',
  'Principal',
  'IT Director',
  'Other',
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    schoolName: '',
    role: '',
    studentCount: '',
    message: '',
    interests: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((i) => i !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - in production, this would send to your CRM/email service
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Thank you for reaching out!
          </h1>
          <p className="text-slate-600 mb-8">
            Our enterprise team will review your inquiry and get back to you within 1 business day.
            We look forward to discussing how EduNode can support your network.
          </p>
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              View Pricing Plans
            </Link>
            <Link
              href="/"
              className="block w-full border border-slate-300 text-slate-700 py-3 px-4 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Info */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Talk to our Enterprise team
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Get a custom solution tailored to your charter network&apos;s unique needs.
              Our team will work with you to design the perfect analytics platform.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-12">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Network-Wide Visibility</h3>
                  <p className="text-slate-600 text-sm">
                    Unified dashboard for CMOs to track performance across all schools
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Enterprise Security</h3>
                  <p className="text-slate-600 text-sm">
                    SSO, custom data retention, and dedicated compliance support
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Dedicated Success Partner</h3>
                  <p className="text-slate-600 text-sm">
                    Named contact with SLA-backed response times and priority support
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-slate-100 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Other ways to reach us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <a href="mailto:enterprise@edunode.io" className="hover:text-blue-600">
                    enterprise@edunode.io
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <a href="tel:+1-888-EDU-NODE" className="hover:text-blue-600">
                    1-888-EDU-NODE
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <a
                    href="https://calendly.com/edunode/enterprise-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    Schedule a demo
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                    First name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                    Last name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Work email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700 mb-1">
                  School / Network name *
                </label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  required
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Role & Size */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                    Your role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="">Select your role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="studentCount" className="block text-sm font-medium text-slate-700 mb-1">
                    Total students across network *
                  </label>
                  <select
                    id="studentCount"
                    name="studentCount"
                    required
                    value={formData.studentCount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="">Select range</option>
                    <option value="500-1000">500 - 1,000</option>
                    <option value="1000-2500">1,000 - 2,500</option>
                    <option value="2500-5000">2,500 - 5,000</option>
                    <option value="5000-10000">5,000 - 10,000</option>
                    <option value="10000+">10,000+</option>
                  </select>
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What features are you most interested in?
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {INTEREST_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        formData.interests.includes(option.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(option.id)}
                        onChange={() => handleInterestToggle(option.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Tell us about your needs
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="What challenges are you looking to solve? Any specific requirements?"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">&#9696;</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Contact Sales
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By submitting this form, you agree to our{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">EduNode Analytics</span>
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
