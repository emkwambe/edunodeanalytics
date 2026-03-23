'use client';

import useSWR from 'swr';
import { fetcher } from './fetcher';
import type { School } from '@/lib/database.types';

/**
 * Hook to resolve a school slug to a school object
 * Useful for getting the school ID from URL params
 */
export function useSchoolBySlug(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR<School>(
    slug ? `/api/schools/by-slug/${slug}` : null,
    fetcher
  );

  return {
    school: data ?? null,
    schoolId: data?.id ?? null,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Hook to get the current school from URL params
 * Combines slug resolution with school data fetching
 */
export function useCurrentSchool(slug: string | null) {
  const { school, schoolId, isLoading: isLoadingSchool, error: schoolError } = useSchoolBySlug(slug);

  return {
    school,
    schoolId,
    isLoading: isLoadingSchool,
    error: schoolError,
    // Helper to check if we're ready to make school-specific API calls
    isReady: !isLoadingSchool && schoolId !== null,
  };
}
