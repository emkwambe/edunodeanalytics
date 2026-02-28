'use client';

import { useNotifications } from '@/lib/notifications/context';
import { notify } from '@/lib/notifications';

/**
 * Convenience hook for showing toast notifications
 *
 * Usage:
 * const toast = useToast();
 * toast.success('Saved!');
 * toast.error('Failed to save', 'Please try again');
 */
export function useToast() {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string) => {
      addNotification(notify.success(title, message));
    },
    error: (title: string, message?: string) => {
      addNotification(notify.error(title, message));
    },
    warning: (title: string, message?: string) => {
      addNotification(notify.warning(title, message));
    },
    info: (title: string, message?: string) => {
      addNotification(notify.info(title, message));
    },
  };
}
