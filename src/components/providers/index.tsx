'use client';

import { SWRProvider } from '@/lib/hooks/providers';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <SWRProvider>{children}</SWRProvider>;
}
