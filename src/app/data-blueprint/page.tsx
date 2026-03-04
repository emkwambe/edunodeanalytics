'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DATA_TAXONOMY,
  ANALYTICS_LEVELS,
  type DataCategory,
} from '@/lib/data/strategic-taxonomy';
import { MaturityRadarChart } from '@/components/charts/maturity-radar-chart';
import { DataInventoryCard } from '@/components/data-blueprint/data-inventory-card';

const CATEGORY_TABS: { id: DataCategory; label: string }[] = [
  { id: 'foundational', label: 'Foundational' },
  { id: 'academic', label: 'Academic' },
  { id: 'operational', label: 'Operational' },
  { id: 'culture', label: 'Culture/SEL' },
  { id: 'strategic', label: 'Strategic' },
];

export default function DataBlueprintPage() {
  const [activeTab, setActiveTab] = useState<DataCategory>('academic');

  const activeCategory = DATA_TAXONOMY[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="font-bold text-xl tracking-tight">
              Edu<span className="text-indigo-600">Node</span>
            </span>
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </Link>
            <Link href="/integrations" className="hover:text-indigo-600 transition-colors">
              Integrations
            </Link>
            <Link href="/security" className="hover:text-indigo-600 transition-colors">
              Security
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-4">
            Strategic Framework
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            The Strategic Data Taxonomy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            A complete strategic data solution is not just about collecting &quot;more&quot; data; it
            is about categorizing data into actionable domains. This blueprint outlines the five
            critical pillars of school data&mdash;from foundational compliance to high-level
            strategic forecasting.
          </p>
        </section>

        {/* Maturity Radar Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
              Solution Maturity Model
            </h2>
            <MaturityRadarChart height={320} />
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 italic text-center">
              The gap between &quot;Typical School&quot; data and &quot;Strategic Solution&quot; is
              where institutional risk is mitigated.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              Why Categorization Matters
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Most organizations fail because they treat all data as equal. A strategic solution
              prioritizes data based on its{' '}
              <strong className="text-slate-900 dark:text-white">predictive power</strong>.
            </p>
            <ul className="space-y-4">
              {Object.entries(ANALYTICS_LEVELS).map(([level, info], index) => (
                <li key={level} className="flex items-start">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0',
                      index === 0 && 'bg-slate-100 text-slate-600',
                      index === 1 && 'bg-indigo-100 text-indigo-600',
                      index === 2 && 'bg-purple-100 text-purple-600',
                      index === 3 && 'bg-emerald-100 text-emerald-600'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="ml-4">
                    <span className="font-bold text-slate-900 dark:text-white">{level}:</span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">{info.question}</span>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interactive Taxonomy Matrix */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Data Needs Inventory
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Explore the five primary categories required for a 360-degree institutional view.
              </p>
            </div>
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Header */}
          <div
            className={cn(
              'mb-6 p-4 rounded-xl',
              activeCategory.bgColor,
              'dark:bg-opacity-20'
            )}
          >
            <h3 className={cn('text-lg font-bold', activeCategory.color)}>
              {activeCategory.name}: {activeCategory.subtitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {activeCategory.description}
            </p>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCategory.items.map((item) => (
              <DataInventoryCard key={item.id} item={item} showSources />
            ))}
          </div>
        </section>

        {/* The Synergy Block */}
        <section className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-10 text-white mb-20">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">
              The &quot;Golden Record&quot; Integration
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              A strategic solution isn&apos;t complete until these data points are unified. When
              academic data meets financial data, we can calculate{' '}
              <strong className="text-emerald-400">&quot;Return on Instruction&quot; (ROI)</strong>.
              When behavior data meets teacher retention data, we can measure{' '}
              <strong className="text-indigo-400">&quot;Leadership Efficacy.&quot;</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600">
                <div className="text-indigo-400 font-bold mb-1">Interoperability</div>
                <p className="text-sm text-slate-400">
                  Data must flow via APIs or Ed-Fi standards to prevent manual entry errors and
                  silos.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600">
                <div className="text-emerald-400 font-bold mb-1">Data Governance</div>
                <p className="text-sm text-slate-400">
                  Defined roles for who owns, cleans, and analyzes each category of information.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600">
                <div className="text-rose-400 font-bold mb-1">FERPA Compliance</div>
                <p className="text-sm text-slate-400">
                  Privacy-first design with audit trails, PII handling, and access controls.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Statistics */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Complete Data Architecture
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CATEGORY_TABS.map((tab) => {
              const category = DATA_TAXONOMY[tab.id];
              const criticalCount = category.items.filter(
                (i) => i.priority === 'Critical'
              ).length;
              return (
                <div
                  key={tab.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center"
                >
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {category.items.length}
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {tab.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {criticalCount} critical
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to Build Your Strategic Data Solution?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            EduNode Analytics provides the complete data infrastructure to move from compliance-only
            reporting to predictive, actionable intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Request Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} EduNode Analytics | Strategic Data Solutions for Education</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy
            </Link>
            <Link href="/security" className="hover:text-indigo-600 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
