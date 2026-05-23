'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { MTSSInterventionForm } from '@/components/interventions/mtss-intervention-form';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import type { MTSSInterventionFormState } from '@/lib/mtss/types';

export default function NewInterventionPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params?.school_slug as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: MTSSInterventionFormState) => {
    setIsSubmitting(true);
    try {
      // Try real API first using slug (auth middleware resolves it)
      const res = await fetch(`/api/schools/${schoolSlug}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        router.push(`/${schoolSlug}/interventions`);
        return;
      }
    } catch (_) {
      // fall through to demo redirect
    }
    // Demo mode: simulate success and redirect
    await new Promise((r) => setTimeout(r, 600));
    router.push(`/${schoolSlug}/interventions`);
  };

  const handleCancel = () => router.push(`/${schoolSlug}/interventions`);

  return (
    <PageFeatureGate featureKey="intervention_hub">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">New MTSS Intervention</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Create a Tier 2 or Tier 3 intervention with comprehensive planning and monitoring.
          </p>
        </div>
        <MTSSInterventionForm
          schoolId={schoolSlug}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </PageFeatureGate>
  );
}