'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  Lightbulb,
  Bug,
  ChevronUp,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Loader2,
  Tag,
  MessageCircle,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react';

type FeedbackType = 'feature' | 'improvement' | 'bug';
type FeedbackStatus = 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  votes: number;
  comments: number;
  author: string;
  createdAt: string;
  tags: string[];
  hasVoted?: boolean;
}

const TYPE_CONFIG: Record<FeedbackType, { icon: React.ReactNode; label: string; color: string }> = {
  feature: {
    icon: <Lightbulb className="w-4 h-4" />,
    label: 'Feature Request',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  improvement: {
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Improvement',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  bug: {
    icon: <Bug className="w-4 h-4" />,
    label: 'Bug Report',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

const STATUS_CONFIG: Record<FeedbackStatus, { icon: React.ReactNode; label: string; color: string }> = {
  under_review: {
    icon: <Clock className="w-3 h-3" />,
    label: 'Under Review',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  planned: {
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Planned',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  in_progress: {
    icon: <Loader2 className="w-3 h-3" />,
    label: 'In Progress',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  completed: {
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  declined: {
    icon: <X className="w-3 h-3" />,
    label: 'Declined',
    color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
  },
};

// Mock feedback data
const FEEDBACK_ITEMS: FeedbackItem[] = [
  {
    id: '1',
    type: 'feature',
    title: 'Parent Portal for Progress Updates',
    description: 'Allow parents to view their child\'s progress, intervention status, and communicate with teachers through a dedicated portal.',
    status: 'planned',
    votes: 142,
    comments: 28,
    author: 'Sarah M.',
    createdAt: '2 weeks ago',
    tags: ['parent-engagement', 'communication'],
  },
  {
    id: '2',
    type: 'feature',
    title: 'Mobile App for Teachers',
    description: 'Native iOS/Android app for teachers to quickly log interventions, view student data, and receive alerts on the go.',
    status: 'in_progress',
    votes: 98,
    comments: 15,
    author: 'Michael C.',
    createdAt: '1 month ago',
    tags: ['mobile', 'teachers'],
    hasVoted: true,
  },
  {
    id: '3',
    type: 'improvement',
    title: 'Bulk Edit for Intervention Plans',
    description: 'Ability to select multiple students and apply the same intervention plan or update status in bulk.',
    status: 'under_review',
    votes: 67,
    comments: 8,
    author: 'Emily R.',
    createdAt: '3 days ago',
    tags: ['interventions', 'productivity'],
  },
  {
    id: '4',
    type: 'feature',
    title: 'Custom Dashboard Widgets',
    description: 'Let users create and arrange their own dashboard widgets to show the metrics most important to them.',
    status: 'planned',
    votes: 54,
    comments: 12,
    author: 'James W.',
    createdAt: '1 week ago',
    tags: ['dashboard', 'customization'],
  },
  {
    id: '5',
    type: 'bug',
    title: 'CSV Export Missing Special Characters',
    description: 'When exporting student data to CSV, names with accents or special characters appear incorrectly.',
    status: 'completed',
    votes: 23,
    comments: 5,
    author: 'David P.',
    createdAt: '2 weeks ago',
    tags: ['export', 'data'],
  },
  {
    id: '6',
    type: 'improvement',
    title: 'Keyboard Shortcuts for Common Actions',
    description: 'Add keyboard shortcuts for navigating between students, marking interventions complete, etc.',
    status: 'under_review',
    votes: 31,
    comments: 4,
    author: 'Lisa T.',
    createdAt: '5 days ago',
    tags: ['accessibility', 'productivity'],
  },
];

export default function FeedbackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState(FEEDBACK_ITEMS);

  const filteredItems = feedbackItems
    .filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => sortBy === 'votes' ? b.votes - a.votes : 0);

  const handleVote = (id: string) => {
    setFeedbackItems(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              votes: item.hasVoted ? item.votes - 1 : item.votes + 1,
              hasVoted: !item.hasVoted,
            }
          : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-indigo-600">Node</span>
              </span>
            </Link>
            <span className="text-slate-400">Feedback</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/changelog" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Changelog
            </Link>
            <Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Docs
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MessageSquare className="w-4 h-4" />
            Product Feedback
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Help Shape EduNode&apos;s Future
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Vote on features, suggest improvements, and report bugs. Your feedback directly influences our roadmap.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {feedbackItems.filter(i => i.status === 'completed').length}
            </p>
            <p className="text-sm text-slate-500">Shipped</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {feedbackItems.filter(i => i.status === 'in_progress').length}
            </p>
            <p className="text-sm text-slate-500">In Progress</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-600">
              {feedbackItems.filter(i => i.status === 'planned').length}
            </p>
            <p className="text-sm text-slate-500">Planned</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="feature">Feature Requests</option>
              <option value="improvement">Improvements</option>
              <option value="bug">Bug Reports</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="under_review">Under Review</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'votes' | 'recent')}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="votes">Most Voted</option>
              <option value="recent">Most Recent</option>
            </select>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Submit Feedback
            </button>
          </div>
        </Card>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const typeConfig = TYPE_CONFIG[item.type];
            const statusConfig = STATUS_CONFIG[item.status];

            return (
              <Card key={item.id} className="p-5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                <div className="flex gap-4">
                  {/* Vote Button */}
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-colors ${
                      item.hasVoted
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <ChevronUp className={`w-5 h-5 ${item.hasVoted ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-lg font-bold ${item.hasVoted ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.votes}
                    </span>
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{item.author}</span>
                          <span>{item.createdAt}</span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {item.comments} comments
                          </span>
                        </div>
                      </div>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              No feedback found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Try adjusting your filters or be the first to submit feedback!
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Submit Feedback
            </button>
          </Card>
        )}
      </main>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Submit Feedback
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of your feedback"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your feedback in detail..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>
            Have urgent issues? <Link href="/contact" className="text-indigo-600 hover:underline">Contact support</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
