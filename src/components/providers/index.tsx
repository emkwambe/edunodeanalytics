'use client';

import { SWRProvider } from '@/lib/hooks/providers';
import { NotificationProvider } from '@/lib/notifications/context';
import { ToastContainer } from '@/components/notifications/toast-container';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SWRProvider>
      <NotificationProvider>
        {children}
        <ToastContainer />
      </NotificationProvider>
    </SWRProvider>
  );
}
