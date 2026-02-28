'use client';

import { SWRConfig } from 'swr';
import { fetcher } from './fetcher';

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
