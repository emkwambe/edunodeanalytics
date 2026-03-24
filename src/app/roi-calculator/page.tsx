'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Calculator,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Download,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ROIInputs {
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  currentToolsCost: number;
  hoursOnDataPerWeek: number;
  atRiskPercent: number;
  avgInterventionCost: number;
}

interface ROIResults {
  timeSavingsHours: number;
  timeSavingsDollars: number;
  toolConsolidation: number;
  interventionEfficiency: number;
  totalAnnualSavings: number;
  threeYearSavings: number;
  roiPercent: number;
  paybackMonths: number;
}

const DEFAULT_INPUTS: ROIInputs = {
  studentCount: 500,
  teacherCount: 30,
  adminCount: 5,
  currentToolsCost: 5000,
  hoursOnDataPerWeek: 8,
  atRiskPercent: 15,
  avgInterventionCost: 200,
};

// Average hourly rates for calculations
const AVG_TEACHER_HOURLY = 45;
const AVG_ADMIN_HOURLY = 55;
const WEEKS_PER_YEAR = 40; // Academic weeks

function calculateROI(inputs: ROIInputs, selectedPlan: string): ROIResults {
  const planCosts: Record<string, number> = {
    starter: 199 * 12,
    professional: 499 * 12,
    enterprise: 999 * 12,
  };

  const annualCost = planCosts[selectedPlan] || planCosts.professional;

  // Time savings: Reduce data work by 60% for teachers, 50% for admins
  const teacherTimeSaved = inputs.hoursOnDataPerWeek * 0.6 * inputs.teacherCount * WEEKS_PER_YEAR;
  const adminTimeSaved = inputs.hoursOnDataPerWeek * 0.5 * inputs.adminCount * WEEKS_PER_YEAR;
  const timeSavingsHours = teacherTimeSaved + adminTimeSaved;
  const timeSavingsDollars = (teacherTimeSaved * AVG_TEACHER_HOURLY) + (adminTimeSaved * AVG_ADMIN_HOURLY);

  // Tool consolidation: Replace 70% of current tools
  const toolConsolidation = inputs.currentToolsCost * 0.7;

  // Intervention efficiency: 25% reduction in costs through early identification
  const atRiskStudents = Math.round(inputs.studentCount * (inputs.atRiskPercent / 100));
  const currentInterventionCost = atRiskStudents * inputs.avgInterventionCost;
  const interventionEfficiency = currentInterventionCost * 0.25;

  // Total savings
  const totalAnnualSavings = timeSavingsDollars + toolConsolidation + interventionEfficiency;
  const netAnnualSavings = totalAnnualSavings - annualCost;
  const threeYearSavings = netAnnualSavings * 3;

  // ROI calculation
  const roiPercent = ((totalAnnualSavings - annualCost) / annualCost) * 100;
  const paybackMonths = Math.max(1, Math.round((annualCost / totalAnnualSavings) * 12));

  return {
    timeSavingsHours: Math.round(timeSavingsHours),
    timeSavingsDollars: Math.round(timeSavingsDollars),
    toolConsolidation: Math.round(toolConsolidation),
    interventionEfficiency: Math.round(interventionEfficiency),
    totalAnnualSavings: Math.round(totalAnnualSavings),
    threeYearSavings: Math.round(threeYearSavings),
    roiPercent: Math.round(roiPercent),
    paybackMonths,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function ROICalculatorPage() {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_INPUTS);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = calculateROI(inputs, selectedPlan);

  const handleInputChange = (field: keyof ROIInputs, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  const handleDownloadPDF = () => {
    // In production, this would generate a PDF
    // For now, we'll create a text summary that can be printed
    const summary = `
EduNode Analytics ROI Report
Generated: ${new Date().toLocaleDateString()}

SCHOOL PROFILE
--------------
Students: ${formatNumber(inputs.studentCount)}
Teachers: ${formatNumber(inputs.teacherCount)}
Administrators: ${formatNumber(inputs.adminCount)}
At-Risk Students: ${inputs.atRiskPercent}%

CURRENT STATE
-------------
Current Tools Cost: ${formatCurrency(inputs.currentToolsCost)}/year
Hours on Data Tasks: ${inputs.hoursOnDataPerWeek} hours/week
Average Intervention Cost: ${formatCurrency(inputs.avgInterventionCost)}/student

ROI ANALYSIS (${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan)
---------------------------------------------------------------------------
Time Savings: ${formatNumber(results.timeSavingsHours)} hours/year (${formatCurrency(results.timeSavingsDollars)})
Tool Consolidation: ${formatCurrency(results.toolConsolidation)}/year
Intervention Efficiency: ${formatCurrency(results.interventionEfficiency)}/year

TOTAL ANNUAL SAVINGS: ${formatCurrency(results.totalAnnualSavings)}
3-YEAR NET SAVINGS: ${formatCurrency(results.threeYearSavings)}
ROI: ${results.roiPercent}%
PAYBACK PERIOD: ${results.paybackMonths} months

Ready to get started? Visit edunode.com/demo
    `.trim();

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edunode-roi-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-indigo-600">Node</span>
              </span>
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Pricing
            </Link>
            <Link href="/demo" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Request Demo
            </Link>
            <Link
              href="/sign-in"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            ROI Calculator
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Calculate Your Savings with EduNode
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Enter your school&apos;s details to see how much time and money you could save
            with EduNode Analytics.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                School Profile
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Number of Students
                  </label>
                  <input
                    type="number"
                    value={inputs.studentCount}
                    onChange={(e) => handleInputChange('studentCount', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Teachers
                    </label>
                    <input
                      type="number"
                      value={inputs.teacherCount}
                      onChange={(e) => handleInputChange('teacherCount', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Administrators
                    </label>
                    <input
                      type="number"
                      value={inputs.adminCount}
                      onChange={(e) => handleInputChange('adminCount', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    % of Students At-Risk
                  </label>
                  <input
                    type="number"
                    value={inputs.atRiskPercent}
                    onChange={(e) => handleInputChange('atRiskPercent', e.target.value)}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-8 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Current State
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Analytics Tools Cost ($/year)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentToolsCost}
                    onChange={(e) => handleInputChange('currentToolsCost', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hours Spent on Data Tasks (per person/week)
                  </label>
                  <input
                    type="number"
                    value={inputs.hoursOnDataPerWeek}
                    onChange={(e) => handleInputChange('hoursOnDataPerWeek', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Avg. Intervention Cost per Student ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.avgInterventionCost}
                    onChange={(e) => handleInputChange('avgInterventionCost', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-500" />
                Select Plan
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'starter', name: 'Starter', price: '$199' },
                  { id: 'professional', name: 'Professional', price: '$499' },
                  { id: 'enterprise', name: 'Enterprise', price: '$999' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      selectedPlan === plan.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{plan.name}</p>
                    <p className="text-sm text-slate-500">{plan.price}/mo</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div ref={resultsRef}>
            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-900/20 dark:to-emerald-900/20 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Your Estimated Savings
                </h2>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(results.totalAnnualSavings)}
                  </p>
                  <p className="text-sm text-slate-500">Annual Savings</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">
                    {results.roiPercent}%
                  </p>
                  <p className="text-sm text-slate-500">Return on Investment</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(results.threeYearSavings)}
                  </p>
                  <p className="text-sm text-slate-500">3-Year Net Savings</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {results.paybackMonths} mo
                  </p>
                  <p className="text-sm text-slate-500">Payback Period</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-900 dark:text-white">Savings Breakdown</h3>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Time Savings</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(results.timeSavingsDollars)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatNumber(results.timeSavingsHours)} hours freed up annually
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Tool Consolidation</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(results.toolConsolidation)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Replace 70% of existing analytics tools
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Intervention Efficiency</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(results.interventionEfficiency)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    25% cost reduction through early identification
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-800">
                <Link
                  href="/demo"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  See EduNode in Action
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>

            {/* Assumptions */}
            <Card className="p-4 mt-4">
              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Calculation Assumptions</p>
                  <ul className="space-y-1 text-xs">
                    <li>- Teacher hourly rate: $45 | Admin hourly rate: $55</li>
                    <li>- 40 academic weeks per year</li>
                    <li>- 60% reduction in teacher data tasks, 50% for admins</li>
                    <li>- 70% tool consolidation potential</li>
                    <li>- 25% intervention cost reduction through early warning</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Social Proof */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Schools That Achieved These Results
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                school: 'Lincoln Charter Academy',
                savings: '$42,000',
                metric: 'Annual savings in first year',
              },
              {
                school: 'Horizon STEM School',
                savings: '12 hrs/week',
                metric: 'Time saved on data tasks',
              },
              {
                school: 'Unity Preparatory',
                savings: '35%',
                metric: 'Reduction in intervention costs',
              },
            ].map((item) => (
              <Card key={item.school} className="p-6 text-center">
                <p className="text-3xl font-bold text-indigo-600 mb-2">{item.savings}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.metric}</p>
                <p className="font-medium text-slate-900 dark:text-white">{item.school}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduNode Analytics
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link href="/contact" className="hover:text-indigo-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
