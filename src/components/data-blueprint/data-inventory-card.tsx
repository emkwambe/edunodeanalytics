'use client';

import { cn } from '@/lib/utils';
import type { DataItem, DataPriority } from '@/lib/data/strategic-taxonomy';

interface DataInventoryCardProps {
  item: DataItem;
  showSources?: boolean;
}

const priorityStyles: Record<DataPriority, string> = {
  Critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const levelBadgeStyles: Record<string, string> = {
  Descriptive: 'border-slate-300 text-slate-600',
  Diagnostic: 'border-indigo-300 text-indigo-600',
  Predictive: 'border-purple-300 text-purple-600',
  Prescriptive: 'border-emerald-300 text-emerald-600',
};

export function DataInventoryCard({ item, showSources = false }: DataInventoryCardProps) {
  return (
    <div className="group bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight pr-2">
            {item.title}
          </h4>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
              priorityStyles[item.priority]
            )}
          >
            {item.priority}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{item.usage}</p>
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium mb-4',
            levelBadgeStyles[item.analyticsLevel]
          )}
        >
          {item.analyticsLevel}
        </span>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
        {showSources && item.sources && item.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Sources
            </p>
            <p className="text-xs text-slate-500">{item.sources.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataInventoryCard;
