'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getModuleBySlug,
  getRelatedModules,
  LearningModule,
  ModuleSection,
  CATEGORY_LABELS,
  ROLE_LABELS,
  DIFFICULTY_LABELS,
} from '@/lib/resources';
import {
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  Target,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Lightbulb,
  HelpCircle,
  Pencil,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Module Detail Page
 *
 * View and interact with a learning module.
 */
export default function ModuleDetailPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;
  const moduleSlug = params.slug as string;

  const module = getModuleBySlug(moduleSlug);
  const [activeSection, setActiveSection] = React.useState(0);
  const [completedSections, setCompletedSections] = React.useState<Set<string>>(new Set());

  if (!module) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Module not found</h1>
          <Link
            href={`/${schoolSlug}/resources`}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Return to Resource Center
          </Link>
        </div>
      </div>
    );
  }

  const currentSection = module.sections[activeSection];
  const progress = (completedSections.size / module.sections.length) * 100;
  const relatedModules = getRelatedModules(module.id);

  const categoryIcons: Record<string, React.ElementType> = {
    data_literacy: BarChart3,
    culture_change: Users,
    implementation: Target,
  };

  const CatIcon = categoryIcons[module.category] || BookOpen;

  const markComplete = () => {
    setCompletedSections((prev) => new Set([...prev, currentSection.id]));
    if (activeSection < module.sections.length - 1) {
      setActiveSection(activeSection + 1);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for display
    // In production, use a proper markdown renderer
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-4">
              {line.substring(2)}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-xl font-semibold text-white mt-5 mb-3">
              {line.substring(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">
              {line.substring(4)}
            </h3>
          );
        }

        // Bold text
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-slate-300 mb-2">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-white font-semibold">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        }

        // Lists
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="text-slate-300 ml-4 mb-1">
              {line.substring(2)}
            </li>
          );
        }
        if (line.match(/^\d+\. /)) {
          return (
            <li key={i} className="text-slate-300 ml-4 mb-1 list-decimal">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        }

        // Horizontal rule
        if (line.startsWith('---')) {
          return <hr key={i} className="border-slate-700 my-6" />;
        }

        // Checkboxes
        if (line.startsWith('- [ ]')) {
          return (
            <div key={i} className="flex items-center gap-2 text-slate-300 ml-4 mb-1">
              <Circle className="w-4 h-4 text-slate-500" />
              {line.substring(6)}
            </div>
          );
        }
        if (line.startsWith('- [x]')) {
          return (
            <div key={i} className="flex items-center gap-2 text-slate-300 ml-4 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {line.substring(6)}
            </div>
          );
        }

        // Tables (simple detection)
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(Boolean);
          if (line.includes('---')) {
            return null; // Skip separator row
          }
          return (
            <div key={i} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-slate-700">
              {cells.map((cell, j) => (
                <div
                  key={j}
                  className={cn(
                    'px-2',
                    i === 0 ? 'font-semibold text-white' : 'text-slate-300'
                  )}
                >
                  {cell.trim()}
                </div>
              ))}
            </div>
          );
        }

        // Code blocks
        if (line.startsWith('```')) {
          return null; // Skip code fence markers
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }

        // Regular paragraphs
        return (
          <p key={i} className="text-slate-300 mb-2">
            {line}
          </p>
        );
      });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/${schoolSlug}/resources`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resource Center
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <CatIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                    {CATEGORY_LABELS[module.category]}
                  </Badge>
                  <Badge
                    className={cn(
                      'text-[10px]',
                      module.difficulty === 'beginner'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : module.difficulty === 'intermediate'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    )}
                  >
                    {DIFFICULTY_LABELS[module.difficulty]}
                  </Badge>
                </div>
                <h1 className="text-xl font-bold text-white mb-1">{module.title}</h1>
                <p className="text-slate-400 text-sm">{module.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {module.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {module.sections.length} sections
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {module.targetRoles.map((r) => ROLE_LABELS[r]).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Progress</div>
              <div className="text-2xl font-bold text-white">{Math.round(progress)}%</div>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Section Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-6">
              <CardContent className="pt-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Sections</h3>
                <div className="space-y-1">
                  {module.sections.map((section, index) => {
                    const isComplete = completedSections.has(section.id);
                    const isActive = activeSection === index;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(index)}
                        className={cn(
                          'flex items-center gap-2 w-full p-2 rounded-lg text-left transition text-sm',
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'hover:bg-slate-700/50 text-slate-400'
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardContent className="pt-6">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Badge className="bg-slate-700 text-slate-300 text-[10px] mb-2">
                      Section {activeSection + 1} of {module.sections.length}
                    </Badge>
                    <h2 className="text-xl font-bold text-white">{currentSection.title}</h2>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-400 text-xs capitalize">
                    {currentSection.format}
                  </Badge>
                </div>

                {/* Content */}
                <div className="prose prose-invert max-w-none">
                  {renderMarkdown(currentSection.content)}
                </div>

                {/* Key Takeaways */}
                {currentSection.keyTakeaways && currentSection.keyTakeaways.length > 0 && (
                  <div className="mt-8 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-semibold text-emerald-300">Key Takeaways</h4>
                    </div>
                    <ul className="space-y-2">
                      {currentSection.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reflection Questions */}
                {currentSection.reflectionQuestions && currentSection.reflectionQuestions.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-5 h-5 text-amber-400" />
                      <h4 className="font-semibold text-amber-300">Reflection Questions</h4>
                    </div>
                    <ul className="space-y-2">
                      {currentSection.reflectionQuestions.map((question, i) => (
                        <li key={i} className="text-sm text-amber-100">
                          {i + 1}. {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practice Activity */}
                {currentSection.practiceActivity && (
                  <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Pencil className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-semibold text-indigo-300">
                        Practice: {currentSection.practiceActivity.title}
                      </h4>
                      <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px]">
                        {currentSection.practiceActivity.estimatedMinutes} min
                      </Badge>
                    </div>
                    <p className="text-sm text-indigo-100 mb-2">
                      {currentSection.practiceActivity.instructions}
                    </p>
                    {currentSection.practiceActivity.deliverable && (
                      <p className="text-xs text-indigo-300">
                        <strong>Deliverable:</strong> {currentSection.practiceActivity.deliverable}
                      </p>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    disabled={activeSection === 0}
                    className="text-slate-400"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  {activeSection < module.sections.length - 1 ? (
                    <Button onClick={markComplete} className="bg-indigo-500 hover:bg-indigo-600">
                      {completedSections.has(currentSection.id) ? 'Next Section' : 'Mark Complete & Continue'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={markComplete}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Complete Module
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Learning Outcomes */}
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  What You&apos;ll Learn
                </h3>
                <ul className="grid md:grid-cols-2 gap-2">
                  {module.outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Related Modules */}
            {relatedModules.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-white mb-3">Related Modules</h3>
                  <div className="space-y-2">
                    {relatedModules.map((related) => (
                      <Link
                        key={related.id}
                        href={`/${schoolSlug}/resources/modules/${related.slug}`}
                        className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{related.title}</div>
                          <div className="text-xs text-slate-500">{related.estimatedMinutes} min</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
