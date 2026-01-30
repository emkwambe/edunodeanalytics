import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a percentage string
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a date in a readable format
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sleep for a specified duration (for mock delays)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine risk level color
 */
export function getRiskColor(level: 'on_track' | 'at_risk' | 'critical' | string): string {
  switch (level) {
    case 'on_track':
      return 'emerald';
    case 'at_risk':
      return 'amber';
    case 'critical':
      return 'red';
    default:
      return 'slate';
  }
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status: 'on_track' | 'at_risk' | 'critical' | string): string {
  switch (status) {
    case 'on_track':
      return 'status-on-track';
    case 'at_risk':
      return 'status-at-risk';
    case 'critical':
      return 'status-critical';
    default:
      return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  }
}

/**
 * Calculate trend direction from two values
 */
export function getTrend(
  current: number,
  previous: number
): { direction: 'up' | 'down' | 'flat'; percentage: number } {
  if (previous === 0) return { direction: 'flat', percentage: 0 };

  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 0.5) return { direction: 'flat', percentage: 0 };

  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
}
