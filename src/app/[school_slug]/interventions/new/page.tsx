'use client';

import { useParams, useRouter } from 'next/navigation';
import { MTSSInterventionForm } from '@/components/interventions/mtss-intervention-form';
import { useSchool } from '@/lib/hooks/use-schools';
import type { MTSSInterventionFormState } from '@/lib/mtss/types';

export default function NewInterventionPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params?.school_slug as string;
  const { school, isLoading } = useSchool(schoolSlug);

  const handleSubmit = async (data: MTSSInterventionFormState) => {
    if (!school?.id) return;
    const res = await fetch(`/api/schools/${school.id}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push(`/${schoolSlug}/interventions`);
    } else {
      console.error('Failed to create intervention', await res.text());
    }
  };

  const handleCancel = () => router.push(`/${schoolSlug}/interventions`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New MTSS Intervention</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Create a Tier 2 or Tier 3 intervention with comprehensive planning and monitoring.
        </p>
      </div>
      <MTSSInterventionForm
        schoolId={school?.id ?? schoolSlug}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}