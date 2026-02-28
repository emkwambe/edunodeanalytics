'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Home,
  Users,
  AlertTriangle,
  Settings,
  HelpCircle,
  FileText,
  Download,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  schoolSlug?: string;
}

export function CommandPalette({ schoolSlug }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Toggle with Cmd+K or Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigate = (path: string) => {
    runCommand(() => router.push(path));
  };

  const basePath = schoolSlug ? `/${schoolSlug}` : '';

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center pt-[20vh]',
        'bg-slate-900/80 backdrop-blur-sm'
      )}
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-slate-700 px-3">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <Command.Input
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <kbd className="px-2 py-1 text-xs text-slate-500 bg-slate-700 rounded">ESC</kbd>
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="text-xs text-slate-500 px-2 py-1.5">
            <CommandItem onSelect={() => navigate(`${basePath}/dashboard`)}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigate(`${basePath}/dashboard/students`)}>
              <Users className="w-4 h-4 mr-2" />
              Students
            </CommandItem>
            <CommandItem onSelect={() => navigate(`${basePath}/interventions`)}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Interventions
            </CommandItem>
            <CommandItem onSelect={() => navigate(`${basePath}/analytics/impact`)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </CommandItem>
          </Command.Group>

          <Command.Group heading="Actions" className="text-xs text-slate-500 px-2 py-1.5">
            <CommandItem onSelect={() => navigate(`${basePath}/dashboard/reports`)}>
              <FileText className="w-4 h-4 mr-2" />
              View Reports
            </CommandItem>
            <CommandItem onSelect={() => window.open(`/api/schools/demo/export/students`, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Export Students CSV
            </CommandItem>
          </Command.Group>

          <Command.Group heading="Settings" className="text-xs text-slate-500 px-2 py-1.5">
            <CommandItem onSelect={() => navigate(`${basePath}/settings`)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </CommandItem>
            <CommandItem onSelect={() => navigate(`${basePath}/help`)}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </CommandItem>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'flex items-center px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer',
        'data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100'
      )}
    >
      {children}
    </Command.Item>
  );
}
