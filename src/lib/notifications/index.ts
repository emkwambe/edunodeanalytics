export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function createNotification(
  type: NotificationType,
  title: string,
  options?: Partial<Omit<Notification, 'id' | 'type' | 'title'>>
): Notification {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    duration: 5000,
    ...options,
  };
}

// Convenience helpers
export const notify = {
  success: (title: string, message?: string) => createNotification('success', title, { message }),
  error: (title: string, message?: string) => createNotification('error', title, { message, duration: 8000 }),
  warning: (title: string, message?: string) => createNotification('warning', title, { message }),
  info: (title: string, message?: string) => createNotification('info', title, { message }),
};
