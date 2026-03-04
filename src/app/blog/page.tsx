import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  User,
  TrendingUp,
  Lightbulb,
  Shield,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | EduNode Analytics',
  description: 'Insights on educational data, MTSS best practices, and product updates from the EduNode team.',
};

type BlogCategory = 'product' | 'mtss' | 'data' | 'case-study' | 'announcement';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  publishedAt: string;
  readTime: string;
  featured?: boolean;
  image?: string;
}

const CATEGORY_CONFIG: Record<BlogCategory, { label: string; color: string; icon: React.ReactNode }> = {
  product: {
    label: 'Product',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: <Zap className="w-3 h-3" />,
  },
  mtss: {
    label: 'MTSS',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: <TrendingUp className="w-3 h-3" />,
  },
  data: {
    label: 'Data & Analytics',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <Lightbulb className="w-3 h-3" />,
  },
  'case-study': {
    label: 'Case Study',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: <BookOpen className="w-3 h-3" />,
  },
  announcement: {
    label: 'Announcement',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: <Shield className="w-3 h-3" />,
  },
};

const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'introducing-ai-advisor',
    title: 'Introducing EduNode Advisor: AI-Powered Intervention Recommendations',
    excerpt: 'We\'re excited to launch our new AI Advisor feature, which analyzes student data patterns and suggests personalized intervention strategies backed by research.',
    category: 'product',
    author: { name: 'Sarah Chen', role: 'Product Lead' },
    publishedAt: 'March 1, 2026',
    readTime: '5 min read',
    featured: true,
  },
  {
    slug: 'mtss-tier-2-strategies',
    title: '7 Evidence-Based Tier 2 Intervention Strategies That Actually Work',
    excerpt: 'Based on data from 500+ schools using EduNode, we\'ve identified the most effective Tier 2 intervention approaches for improving student outcomes.',
    category: 'mtss',
    author: { name: 'Dr. Michael Torres', role: 'Education Advisor' },
    publishedAt: 'February 24, 2026',
    readTime: '8 min read',
  },
  {
    slug: 'lincoln-charter-case-study',
    title: 'How Lincoln Charter Reduced Chronic Absenteeism by 34%',
    excerpt: 'A deep dive into how Lincoln Charter Academy used early warning data and targeted interventions to dramatically improve attendance rates.',
    category: 'case-study',
    author: { name: 'Emily Rodriguez', role: 'Customer Success' },
    publishedAt: 'February 18, 2026',
    readTime: '6 min read',
  },
  {
    slug: 'data-driven-plc-meetings',
    title: 'Transform Your PLC Meetings with Real-Time Data',
    excerpt: 'Tips for using live dashboards and collaborative data analysis to make your Professional Learning Community meetings more effective.',
    category: 'data',
    author: { name: 'James Wilson', role: 'Solutions Architect' },
    publishedAt: 'February 10, 2026',
    readTime: '4 min read',
  },
  {
    slug: 'soc2-type2-certification',
    title: 'EduNode Achieves SOC 2 Type II Certification',
    excerpt: 'We\'re proud to announce our SOC 2 Type II certification, demonstrating our commitment to the highest standards of data security.',
    category: 'announcement',
    author: { name: 'David Park', role: 'CTO' },
    publishedAt: 'February 5, 2026',
    readTime: '3 min read',
  },
  {
    slug: 'understanding-chronic-absence',
    title: 'Beyond the Numbers: Understanding Chronic Absence Patterns',
    excerpt: 'Learn how to interpret attendance data, identify warning signs, and take proactive steps before attendance issues escalate.',
    category: 'data',
    author: { name: 'Dr. Lisa Thompson', role: 'Data Scientist' },
    publishedAt: 'January 28, 2026',
    readTime: '7 min read',
  },
];

export default function BlogPage() {
  const featuredPost = BLOG_POSTS.find(post => post.featured);
  const recentPosts = BLOG_POSTS.filter(post => !post.featured);

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
            <span className="text-slate-400">Blog</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Docs
            </Link>
            <Link href="/changelog" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Changelog
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

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            EduNode Blog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Insights on educational data, MTSS best practices, and the latest from our team.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <Link
            href="/blog"
            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium"
          >
            All Posts
          </Link>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <Link
              key={key}
              href={`/blog/category/${key}`}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors"
            >
              {config.label}
            </Link>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`}>
            <Card className="p-8 mb-10 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Featured
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_CONFIG[featuredPost.category].color}`}>
                  {CATEGORY_CONFIG[featuredPost.category].icon}
                  {CATEGORY_CONFIG[featuredPost.category].label}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {featuredPost.author.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.publishedAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Card>
          </Link>
        )}

        {/* Recent Posts Grid */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Recent Posts
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {recentPosts.map((post) => {
            const categoryConfig = CATEGORY_CONFIG[post.category];
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="p-6 h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${categoryConfig.color}`}>
                      {categoryConfig.icon}
                      {categoryConfig.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{post.author.name}</span>
                    <span>{post.publishedAt}</span>
                    <span>{post.readTime}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Newsletter */}
        <Card className="mt-12 p-8 text-center bg-slate-100 dark:bg-slate-800/50">
          <BookOpen className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Get the latest insights on educational data and MTSS best practices delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
