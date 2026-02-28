'use client';

import * as React from 'react';
import { useNotifications } from '@/lib/notifications/context';
import { Toast } from '@/components/ui/toast';

export function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          action={notification.action}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
