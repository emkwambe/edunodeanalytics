'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Download,
  ChevronRight,
  School,
  DollarSign,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Mock data - in production, this comes from getAuthorizerPortfolio()
const mockPortfolio = {
  authorizer: {
    id: '1',
    name: 'State Department of Education',
    slug: 'state-doe',
    authorizer_type: 'sea',
    performance_framework: 'nacsa',
    renewal_cycle_years: 5,
  },
  schools: [
    {
      id: '1',
      name: 'Innovation Prep Academy',
      slug: 'innovation-prep',
      enrollment: 487,
      ela_proficiency: 68,
      math_proficiency: 62,
      chronic_absence_rate: 18.3,
      current_ratio: 1.35,
      days_cash_on_hand: 72,
      risk_level: 'medium' as const,
      students_at_risk_percent: 23,
      compliance_status: 'good' as const,
      compliance_items_due: 2,
      years_until_renewal: 2.3,
    },
    {
      id: '2',
      name: 'Academy Charter School',
      slug: 'academy-charter',
      enrollment: 312,
      ela_proficiency: 54,
      math_proficiency: 48,
      chronic_absence_rate: 24.1,
      current_ratio: 1.08,
      days_cash_on_hand: 45,
      risk_level: 'high' as const,
      students_at_risk_percent: 38,
      compliance_status: 'warning' as const,
      compliance_items_due: 5,
      years_until_renewal: 0.8,
    },
    {
      id: '3',
      name: 'Sunrise STEM Academy',
      slug: 'sunrise-stem',
      enrollment: 623,
      ela_proficiency: 72,
      math_proficiency: 78,
      chronic_absence_rate: 12.5,
      current_ratio: 1.62,
      days_cash_on_hand: 95,
      risk_level: 'low' as const,
      students_at_risk_percent: 14,
      compliance_status: 'good' as const,
      compliance_items_due: 0,
      years_until_renewal: 4.1,
    },
    {
      id: '4',
      name: 'Unity Community School',
      slug: 'unity-community',
      enrollment: 278,
      ela_proficiency: 45,
      math_proficiency: 41,
      chronic_absence_rate: 31.2,
      current_ratio: 0.92,
      days_cash_on_hand: 28,
      risk_level: 'critical' as const,
      students_at_risk_percent: 52,
      compliance_status: 'critical' as const,
      compliance_items_due: 8,
      years_until_renewal: 1.2,
    },
  ],
  total_schools: 4,
  total_enrollment: 1700,
  avg_ela_proficiency: 59.75,
  avg_math_proficiency: 57.25,
  avg_chronic_absence_rate: 21.5,
  schools_low_risk: 1,
  schools_medium_risk: 1,
  schools_high_risk: 1,
  schools_critical_risk: 1,
  schools_compliant: 2,
  schools_with_issues: 2,
  total_compliance_items_due: 15,
  schools_approaching_renewal: 2,
};

function getRiskBadge(level: string) {
  switch (level) {
    case 'low':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low Risk</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium Risk</Badge>;
    case 'high':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High Risk</Badge>;
    case 'critical':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}

function getComplianceBadge(status: string) {
  switch (status) {
    case 'good':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Compliant</Badge>;
    case 'warning':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Issues</Badge>;
    case 'critical':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}

function getFinancialHealthColor(ratio: number | null) {
  if (ratio === null) return 'text-slate-400';
  if (ratio >= 1.2) return 'text-emerald-400';
  if (ratio >= 1.0) return 'text-amber-400';
  return 'text-red-400';
}

export default function AuthorizerDashboardPage() {
  const portfolio = mockPortfolio;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{portfolio.authorizer.name}</h1>
                <p className="text-sm text-slate-400">Authorizer Portfolio Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600">
                <FileText className="h-4 w-4 mr-2" />
                Generate Annual Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Schools</p>
                  <p className="text-3xl font-bold">{portfolio.total_schools}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <School className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {portfolio.total_enrollment.toLocaleString()} total students
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Avg. Proficiency</p>
                  <p className="text-3xl font-bold">
                    {portfolio.avg_ela_proficiency?.toFixed(0) ?? '--'}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                ELA: {portfolio.avg_ela_proficiency?.toFixed(0)}% | Math: {portfolio.avg_math_proficiency?.toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Schools at Risk</p>
                  <p className="text-3xl font-bold text-red-400">
                    {portfolio.schools_high_risk + portfolio.schools_critical_risk}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {portfolio.schools_critical_risk} critical, {portfolio.schools_high_risk} high
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Approaching Renewal</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {portfolio.schools_approaching_renewal}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Within 18 months
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-400" />
                Portfolio Risk Distribution
              </CardTitle>
              <CardDescription>School performance status across your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-400">Low Risk</div>
                  <div className="flex-1">
                    <Progress
                      value={(portfolio.schools_low_risk / portfolio.total_schools) * 100}
                      className="h-8 bg-slate-700"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-emerald-400 font-semibold">{portfolio.schools_low_risk}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-400">Medium</div>
                  <div className="flex-1">
                    <Progress
                      value={(portfolio.schools_medium_risk / portfolio.total_schools) * 100}
                      className="h-8 bg-slate-700"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-amber-400 font-semibold">{portfolio.schools_medium_risk}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-400">High Risk</div>
                  <div className="flex-1">
                    <Progress
                      value={(portfolio.schools_high_risk / portfolio.total_schools) * 100}
                      className="h-8 bg-slate-700"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-orange-400 font-semibold">{portfolio.schools_high_risk}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-400">Critical</div>
                  <div className="flex-1">
                    <Progress
                      value={(portfolio.schools_critical_risk / portfolio.total_schools) * 100}
                      className="h-8 bg-slate-700"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-red-400 font-semibold">{portfolio.schools_critical_risk}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">Compliant Schools</span>
                  </div>
                  <span className="font-semibold text-emerald-400">{portfolio.schools_compliant}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm">Schools with Issues</span>
                  </div>
                  <span className="font-semibold text-amber-400">{portfolio.schools_with_issues}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm">Items Due (30 days)</span>
                  </div>
                  <span className="font-semibold text-cyan-400">{portfolio.total_compliance_items_due}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio Schools</CardTitle>
                <CardDescription>Click a school to view detailed performance data</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-slate-700">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">School</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Enrollment</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">ELA</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Math</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Absence</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Current Ratio</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Risk</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Compliance</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Renewal</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400"></th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.schools
                    .sort((a, b) => {
                      // Sort by risk level (critical first)
                      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                      return riskOrder[a.risk_level] - riskOrder[b.risk_level];
                    })
                    .map((school) => (
                      <tr
                        key={school.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                              <School className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-medium">{school.name}</p>
                              <p className="text-sm text-slate-400">{school.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{school.enrollment}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={school.ela_proficiency >= 60 ? 'text-emerald-400' : school.ela_proficiency >= 50 ? 'text-amber-400' : 'text-red-400'}>
                            {school.ela_proficiency}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={school.math_proficiency >= 60 ? 'text-emerald-400' : school.math_proficiency >= 50 ? 'text-amber-400' : 'text-red-400'}>
                            {school.math_proficiency}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={school.chronic_absence_rate <= 15 ? 'text-emerald-400' : school.chronic_absence_rate <= 20 ? 'text-amber-400' : 'text-red-400'}>
                            {school.chronic_absence_rate}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={getFinancialHealthColor(school.current_ratio)}>
                            {school.current_ratio.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {getRiskBadge(school.risk_level)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {getComplianceBadge(school.compliance_status)}
                          {school.compliance_items_due > 0 && (
                            <span className="ml-2 text-xs text-slate-400">
                              ({school.compliance_items_due} due)
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {school.years_until_renewal !== null && (
                            <span className={school.years_until_renewal <= 1.5 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                              {school.years_until_renewal.toFixed(1)} yrs
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/${school.slug}/authorizer`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolio.schools
                  .filter((s) => s.risk_level === 'critical')
                  .map((school) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-slate-400">
                          {school.chronic_absence_rate > 25 && 'High chronic absence • '}
                          {school.current_ratio < 1.0 && 'Financial concern • '}
                          {school.years_until_renewal && school.years_until_renewal <= 1.5 && 'Renewal approaching'}
                        </p>
                      </div>
                      <Link href={`/${school.slug}/authorizer`}>
                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                          Review
                        </Button>
                      </Link>
                    </div>
                  ))}
                {portfolio.schools.filter((s) => s.risk_level === 'critical').length === 0 && (
                  <p className="text-slate-400 text-center py-4">No critical alerts</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Calendar className="h-5 w-5" />
                Upcoming Renewals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolio.schools
                  .filter((s) => s.years_until_renewal !== null && s.years_until_renewal <= 2)
                  .sort((a, b) => (a.years_until_renewal ?? 99) - (b.years_until_renewal ?? 99))
                  .map((school) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-slate-400">
                          Renewal in {school.years_until_renewal?.toFixed(1)} years
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRiskBadge(school.risk_level)}
                        <Link href={`/${school.slug}/authorizer`}>
                          <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                {portfolio.schools.filter((s) => s.years_until_renewal !== null && s.years_until_renewal <= 2).length === 0 && (
                  <p className="text-slate-400 text-center py-4">No upcoming renewals within 2 years</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>EduNode Analytics - Authorizer Portal</p>
            <p>Data as of {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
