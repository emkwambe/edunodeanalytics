'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Search, Plus, Check, Loader2, Building2, Globe, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStrategies, getCategoryLabel, getSourceLabel } from '@/lib/hooks/use-strategies';
import type { StrategyRecord, InterventionStrategy, CustomStrategy } from '@/lib/mtss/types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StrategySelectorProps {
  schoolId: string | null;
  value: InterventionStrategy;
  onChange: (value: InterventionStrategy) => void;
  category?: string; // Filter strategies by category (matches intervention type)
  disabled?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StrategySelector({
  schoolId,
  value,
  onChange,
  category,
  disabled,
  error,
}: StrategySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState(category || '');

  // Fetch strategies
  const { strategies, isLoading } = useStrategies(schoolId, {
    category: category || undefined,
    limit: 100,
  });

  // Filter strategies by search
  const filteredStrategies = useMemo(() => {
    if (!searchQuery.trim()) return strategies;
    const query = searchQuery.toLowerCase();
    return strategies.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }, [strategies, searchQuery]);

  // Group strategies by source
  const groupedStrategies = useMemo(() => {
    const groups: Record<string, StrategyRecord[]> = {
      system: [],
      district: [],
      user: [],
    };
    for (const strategy of filteredStrategies) {
      groups[strategy.source].push(strategy);
    }
    return groups;
  }, [filteredStrategies]);

  // Get currently selected strategy display
  const selectedDisplay = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'string') {
      // Find the strategy by name
      const strategy = strategies.find((s) => s.name === value || s.id === value);
      if (strategy) {
        return { name: strategy.name, source: strategy.source };
      }
      return { name: value, source: 'user' as const };
    }
    return { name: value.name, source: value.source };
  }, [value, strategies]);

  // Handle strategy selection
  const handleSelect = (strategy: StrategyRecord) => {
    onChange(strategy.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle custom strategy creation
  const handleCreateCustom = () => {
    if (!customName.trim()) return;

    const customStrategy: CustomStrategy = {
      name: customName.trim(),
      source: 'user',
      category: customCategory || category || undefined,
    };

    onChange(customStrategy);
    setShowCustomForm(false);
    setCustomName('');
    setIsOpen(false);
  };

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'system':
        return <Globe className="w-3 h-3" />;
      case 'district':
        return <Building2 className="w-3 h-3" />;
      case 'user':
        return <User className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Selected value display / trigger */}
      {selectedDisplay && !isOpen ? (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={cn(
            INPUT_CLASS,
            'flex items-center justify-between text-left',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500'
          )}
        >
          <span className="flex items-center gap-2">
            {getSourceIcon(selectedDisplay.source)}
            <span className="truncate">{selectedDisplay.name}</span>
            <Badge variant="outline" size="sm">
              {getSourceLabel(selectedDisplay.source as 'system' | 'district' | 'user')}
            </Badge>
          </span>
          <span className="text-slate-500 text-xs shrink-0 ml-2">Change</span>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search strategies..."
            disabled={disabled}
            className={cn(INPUT_CLASS, 'pl-9', error && 'border-red-500')}
            autoComplete="off"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown content */}
          <div className="absolute z-20 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="ml-2 text-sm text-slate-400">Loading strategies...</span>
              </div>
            ) : showCustomForm ? (
              /* Custom strategy form */
              <div className="p-4 space-y-3">
                <h4 className="text-sm font-medium text-white">Create Custom Strategy</h4>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Strategy name..."
                  className={INPUT_CLASS}
                  autoFocus
                />
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select category (optional)</option>
                  <option value="academic">Academic</option>
                  <option value="behavior">Behavior</option>
                  <option value="sel">Social-Emotional</option>
                  <option value="attendance">Attendance</option>
                  <option value="family_engagement">Family Engagement</option>
                </select>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCustom}
                    disabled={!customName.trim()}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Add custom strategy button */}
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-700/60 transition-colors border-b border-slate-700 text-indigo-400"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Custom Strategy</span>
                </button>

                {/* System strategies */}
                {groupedStrategies.system.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-medium flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      System Strategies
                    </div>
                    {groupedStrategies.system.map((strategy) => (
                      <StrategyOption
                        key={strategy.id}
                        strategy={strategy}
                        isSelected={
                          (typeof value === 'string' && (value === strategy.name || value === strategy.id)) ||
                          (typeof value === 'object' && value.name === strategy.name)
                        }
                        onSelect={() => handleSelect(strategy)}
                      />
                    ))}
                  </div>
                )}

                {/* District strategies */}
                {groupedStrategies.district.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      District Strategies
                    </div>
                    {groupedStrategies.district.map((strategy) => (
                      <StrategyOption
                        key={strategy.id}
                        strategy={strategy}
                        isSelected={
                          (typeof value === 'string' && (value === strategy.name || value === strategy.id)) ||
                          (typeof value === 'object' && value.name === strategy.name)
                        }
                        onSelect={() => handleSelect(strategy)}
                      />
                    ))}
                  </div>
                )}

                {/* User strategies */}
                {groupedStrategies.user.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Custom Strategies
                    </div>
                    {groupedStrategies.user.map((strategy) => (
                      <StrategyOption
                        key={strategy.id}
                        strategy={strategy}
                        isSelected={
                          (typeof value === 'string' && (value === strategy.name || value === strategy.id)) ||
                          (typeof value === 'object' && value.name === strategy.name)
                        }
                        onSelect={() => handleSelect(strategy)}
                      />
                    ))}
                  </div>
                )}

                {/* No results */}
                {filteredStrategies.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">
                    No strategies found. Try a different search or create a custom strategy.
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Strategy Option Component
// ---------------------------------------------------------------------------

interface StrategyOptionProps {
  strategy: StrategyRecord;
  isSelected: boolean;
  onSelect: () => void;
}

function StrategyOption({ strategy, isSelected, onSelect }: StrategyOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-700/60 transition-colors',
        isSelected && 'bg-indigo-500/10 border-l-2 border-indigo-500'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{strategy.name}</span>
          {strategy.category && (
            <Badge variant="outline" size="sm">
              {getCategoryLabel(strategy.category)}
            </Badge>
          )}
        </div>
        {strategy.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{strategy.description}</p>
        )}
        {strategy.tags && strategy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {strategy.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {strategy.tags.length > 4 && (
              <span className="text-[10px] text-slate-500">+{strategy.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>
      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
    </button>
  );
}

export default StrategySelector;
