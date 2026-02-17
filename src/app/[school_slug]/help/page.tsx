'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Video,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  GraduationCap,
  Shield,
  Zap,
} from 'lucide-react';

/**
 * Help & Support Page
 *
 * Knowledge base, contact support, and onboarding resources.
 */

const HELP_SECTIONS = [
  {
    title: 'Getting Started',
    icon: GraduationCap,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
    items: [
      { label: 'Setting up your school', description: 'Configure school profile, colors, and basic settings' },
      { label: 'Importing student data', description: 'Connect SIS via Clever or CSV upload' },
      { label: 'Understanding your dashboard', description: 'Overview of key metrics and navigation' },
      { label: 'Inviting your team', description: 'Add teachers, coaches, and administrators' },
    ],
  },
  {
    title: 'Data & Analytics',
    icon: Zap,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    items: [
      { label: 'Reading MAP Growth data', description: 'Interpreting RIT scores and growth percentiles' },
      { label: 'Chronic absenteeism thresholds', description: 'How attendance tiers are calculated' },
      { label: 'Confounding variables', description: 'Understanding when growth data may be misleading' },
      { label: 'MTSS tier assignments', description: 'How risk levels map to intervention tiers' },
    ],
  },
  {
    title: 'Compliance & Reporting',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    items: [
      { label: 'FERPA compliance', description: 'How your student data is protected' },
      { label: 'Authorizer portal', description: 'Sharing data with charter authorizers' },
      { label: 'Exporting reports', description: 'Generate PDF and CSV exports' },
      { label: 'Audit logging', description: 'Understanding the data access audit trail' },
    ],
  },
];

export default function HelpPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  return (
    <>
      <PageHeader
        title="Help & Support"
        description="Resources, guides, and contact information"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Help & Support' },
        ]}
      />

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-900/30 to-slate-800/50 border-indigo-500/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Email Support</h3>
                <p className="text-xs text-slate-400">Response within 24 hours</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              support@edunodeanalytics.com
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Live Chat</h3>
                <p className="text-xs text-slate-400">Mon-Fri, 8am-6pm ET</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Training Sessions</h3>
                <p className="text-xs text-slate-400">Scheduled onboarding</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Book a Session
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Base */}
      <div className="space-y-6">
        {HELP_SECTIONS.map((section) => (
          <Card key={section.title} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <section.icon className={cn('w-5 h-5', section.color)} />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors text-left group"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', section.bg)}>
                      <BookOpen className={cn('w-4 h-4', section.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 ml-auto" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
