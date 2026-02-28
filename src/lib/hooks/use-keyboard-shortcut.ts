'use client';

import * as React from 'react';

type KeyboardModifier = 'ctrl' | 'meta' | 'alt' | 'shift';

interface UseKeyboardShortcutOptions {
  key: string;
  modifiers?: KeyboardModifier[];
  callback: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 *
 * Usage:
 * useKeyboardShortcut({
 *   key: 's',
 *   modifiers: ['meta'], // Cmd on Mac, Ctrl on Windows
 *   callback: () => save(),
 * });
 */
export function useKeyboardShortcut({
  key,
  modifiers = [],
  callback,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutOptions) {
  React.useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      // Check key match (case-insensitive)
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifiers
      const hasCtrl = modifiers.includes('ctrl');
      const hasMeta = modifiers.includes('meta');
      const hasAlt = modifiers.includes('alt');
      const hasShift = modifiers.includes('shift');

      // For cross-platform support, treat 'meta' as either Cmd or Ctrl
      const ctrlOrMeta = hasMeta || hasCtrl;
      const eventCtrlOrMeta = event.metaKey || event.ctrlKey;

      if (ctrlOrMeta && !eventCtrlOrMeta) return;
      if (!ctrlOrMeta && eventCtrlOrMeta) return;
      if (hasAlt && !event.altKey) return;
      if (!hasAlt && event.altKey) return;
      if (hasShift && !event.shiftKey) return;
      if (!hasShift && event.shiftKey) return;

      if (preventDefault) {
        event.preventDefault();
      }
      callback();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, modifiers, callback, enabled, preventDefault]);
}

/**
 * Common keyboard shortcuts
 */
export const shortcuts = {
  save: { key: 's', modifiers: ['meta'] as KeyboardModifier[] },
  search: { key: 'k', modifiers: ['meta'] as KeyboardModifier[] },
  escape: { key: 'Escape', modifiers: [] as KeyboardModifier[] },
  newItem: { key: 'n', modifiers: ['meta'] as KeyboardModifier[] },
  delete: { key: 'Backspace', modifiers: ['meta'] as KeyboardModifier[] },
  refresh: { key: 'r', modifiers: ['meta'] as KeyboardModifier[] },
};
