import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight } from 'lucide-react';

/**
 * School Selection Page
 *
 * For users with access to multiple schools
 */

// Mock schools for demo - in production, fetch from Supabase based on user
const DEMO_SCHOOLS = [
  {
    slug: 'academy-charter',
    name: 'Academy Charter School',
    role: 'School Admin',
    studentCount: 487,
  },
  {
    slug: 'innovation-prep',
    name: 'Innovation Prep Academy',
    role: 'Data Manager',
    studentCount: 312,
  },
  {
    slug: 'stem-scholars',
    name: 'STEM Scholars Charter',
    role: 'Principal',
    studentCount: 628,
  },
];

export default async function SelectSchoolPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // In production, fetch user's schools from Supabase
  const schools = DEMO_SCHOOLS;

  // If user only has one school, redirect directly
  if (schools.length === 1) {
    redirect(`/${schools[0].slug}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="text-xl font-semibold text-slate-100">
              EduNode Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">
            Select a School
          </h1>
          <p className="text-slate-400">
            You have access to multiple schools. Choose one to continue.
          </p>
        </div>

        {/* School Cards */}
        <div className="space-y-4">
          {schools.map((school) => (
            <Link
              key={school.slug}
              href={`/${school.slug}/dashboard`}
              className="block"
            >
              <Card className="hover:border-slate-600/50 transition-all hover:shadow-glass group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Building2 className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {school.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span>{school.role}</span>
                      <span className="text-slate-600">|</span>
                      <span>{school.studentCount} students</span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Don't see your school?
          </p>
          <Button variant="outline" asChild>
            <Link href="/onboarding">Add a New School</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Select School',
};
