'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getResourceLibrary,
  getRecommendedResources,
  getLearningPath,
  LearningModule,
  DownloadableAsset,
  ResourceCategory,
  UserRole,
  CATEGORY_LABELS,
  ROLE_LABELS,
  DIFFICULTY_LABELS,
} from '@/lib/resources';
import {
  BookOpen,
  Download,
  Clock,
  ChevronRight,
  Users,
  Target,
  Lightbulb,
  FileText,
  Video,
  ClipboardList,
  CheckSquare,
  GraduationCap,
  Briefcase,
  Building2,
  Filter,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Resource Center Page
 *
 * Central hub for data strategy and culture resources.
 */
export default function ResourceCenterPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  const [selectedRole, setSelectedRole] = React.useState<UserRole | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = React.useState<ResourceCategory | undefined>(undefined);

  const library = getResourceLibrary(selectedCategory, selectedRole);
  const recommendations = selectedRole ? getRecommendedResources(selectedRole) : null;
  const learningPath = selectedRole ? getLearningPath(selectedRole) : null;

  const roleIcons: Record<UserRole, React.ElementType> = {
    teacher: GraduationCap,
    school_leader: Briefcase,
    cmo_executive: Building2,
  };

  const categoryIcons: Record<ResourceCategory, React.ElementType> = {
    data_literacy: BarChart3,
    culture_change: Users,
    implementation: Target,
  };

  const formatIcons: Record<string, React.ElementType> = {
    article: FileText,
    video: Video,
    interactive: Lightbulb,
    worksheet: ClipboardList,
    checklist: CheckSquare,
    pdf: FileText,
    xlsx: FileText,
    docx: FileText,
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Resource Center</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Build data literacy, transform culture, and implement EduNode successfully.
            Guides, templates, and tools for every role.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{library.summary.totalModules}</div>
                <div className="text-sm text-slate-400">Learning Modules</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{library.summary.totalAssets}</div>
                <div className="text-sm text-slate-400">Downloadable Tools</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{library.summary.totalMinutes}</div>
                <div className="text-sm text-slate-400">Minutes of Content</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Filter */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">I am a...</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                const Icon = roleIcons[role];
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(isSelected ? undefined : role)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition',
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommended For You (when role selected) */}
        {recommendations && (
          <Card className="bg-gradient-to-br from-indigo-900/30 to-slate-800/50 border-indigo-500/30 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Recommended for {ROLE_LABELS[selectedRole!]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Start Here Modules */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Start Here</h4>
                  <div className="space-y-2">
                    {recommendations.startHere.slice(0, 4).map((module) => (
                      <Link
                        key={module.id}
                        href={`/${schoolSlug}/resources/modules/${module.slug}`}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition group"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {module.title}
                          </div>
                          <div className="text-xs text-slate-500">{module.estimatedMinutes} min</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Essential Assets */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Essential Tools</h4>
                  <div className="space-y-2">
                    {recommendations.essentialAssets.slice(0, 4).map((asset) => (
                      <button
                        key={asset.id}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition group w-full text-left"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {asset.title}
                          </div>
                          <div className="text-xs text-slate-500 uppercase">{asset.format}</div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                          Download
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Path (when role selected) */}
        {learningPath && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Your Learning Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {learningPath.map((phase, index) => (
                  <div key={phase.phase} className="relative">
                    {index < learningPath.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-px bg-slate-700" />
                    )}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center text-sm font-bold text-indigo-400 z-10">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{phase.phase}</h4>
                        <p className="text-sm text-slate-400 mb-3">{phase.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.modules.map((module) => (
                            <Link
                              key={module.id}
                              href={`/${schoolSlug}/resources/modules/${module.slug}`}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-600/50 transition"
                            >
                              <BookOpen className="w-3 h-3" />
                              {module.title}
                              <span className="text-slate-500">({module.estimatedMinutes}m)</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={cn(
              'px-4 py-2 rounded-lg transition text-sm font-medium',
              !selectedCategory
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            All Categories
          </button>
          {library.categories.map((cat) => {
            const Icon = categoryIcons[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium',
                  selectedCategory === cat.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                  {cat.moduleCount + cat.assetCount}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Modules Column */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Learning Modules
            </h3>
            <div className="space-y-4">
              {library.modules.map((module) => {
                const CatIcon = categoryIcons[module.category];
                return (
                  <Link
                    key={module.id}
                    href={`/${schoolSlug}/resources/modules/${module.slug}`}
                    className="block"
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 transition">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-slate-700 rounded-xl">
                            <CatIcon className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white">{module.title}</h4>
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
                            <p className="text-sm text-slate-400 mb-3">{module.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {module.estimatedMinutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {module.sections.length} sections
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {module.targetRoles.map((r) => ROLE_LABELS[r]).join(', ')}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Assets Column */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Downloadable Tools
            </h3>
            <div className="space-y-3">
              {library.assets.map((asset) => {
                const FormatIcon = formatIcons[asset.format] || FileText;
                return (
                  <Card key={asset.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <FormatIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white mb-1">{asset.title}</h4>
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                            {asset.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-700 text-slate-300 text-[10px] uppercase">
                              {asset.format}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
