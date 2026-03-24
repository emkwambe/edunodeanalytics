'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskScore } from '@/lib/hooks/use-risk-scores';
import {
  getRiskBadgeText,
  generateStudentSummary,
  generateActionPrompts,
  type RiskFactor,
} from '@/lib/risk-engine/interpreter';
import type { Trajectory } from '@/lib/risk-engine/types';

interface MeetingPrepExportProps {
  selectedStudents: RiskScore[];
  schoolName?: string;
  meetingDate?: Date;
  onClear?: () => void;
  className?: string;
}

function generateAgendaContent(
  students: RiskScore[],
  schoolName: string,
  meetingDate: Date
): string {
  const dateStr = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let content = `MTSS Meeting Agenda\n`;
  content += `${'='.repeat(50)}\n\n`;
  content += `School: ${schoolName}\n`;
  content += `Date: ${dateStr}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  content += `${'='.repeat(50)}\n\n`;

  content += `STUDENTS FOR REVIEW (${students.length})\n`;
  content += `${'-'.repeat(50)}\n\n`;

  students.forEach((student, index) => {
    // Convert topFactors to RiskFactor format
    const factors: RiskFactor[] = student.topFactors.map((f) => ({
      name: f.name,
      category: f.category as RiskFactor['category'],
      rawValue: 0,
      normalizedScore: f.score,
      weight: 1,
      weightedScore: f.score,
      description: f.description,
      trend: 'stable' as Trajectory,
    }));

    const summary = generateStudentSummary(
      student.studentName,
      student.riskLevel,
      factors,
      student.trajectory
    );

    const actions = generateActionPrompts(
      factors,
      student.riskLevel,
      !!student.activeIntervention
    );

    content += `${index + 1}. ${student.studentName}\n`;
    content += `   Grade: ${student.gradeLevel}\n`;
    content += `   Risk Level: ${getRiskBadgeText(student.riskLevel)} (${(student.riskScore * 100).toFixed(0)}%)\n`;

    // Tags
    const tags = [];
    if (student.hasIep) tags.push('IEP');
    if (student.has504Plan) tags.push('504');
    if (student.isChronicallyAbsent) tags.push('Chronic Absence');
    if (tags.length > 0) {
      content += `   Flags: ${tags.join(', ')}\n`;
    }

    content += `\n   Summary: ${summary}\n`;

    if (student.activeIntervention) {
      content += `   Current Intervention: ${student.activeIntervention.title}\n`;
    }

    if (factors.length > 0) {
      content += `\n   Top Risk Factors:\n`;
      factors.slice(0, 3).forEach((f) => {
        content += `   - ${f.name}: ${f.description}\n`;
      });
    }

    if (actions.length > 0) {
      content += `\n   Recommended Actions:\n`;
      actions.forEach((a) => {
        content += `   [ ] ${a}\n`;
      });
    }

    content += `\n${'-'.repeat(50)}\n\n`;
  });

  content += `\nNOTES\n`;
  content += `${'-'.repeat(50)}\n\n\n\n\n`;

  content += `\nACTION ITEMS\n`;
  content += `${'-'.repeat(50)}\n`;
  content += `[ ] \n`;
  content += `[ ] \n`;
  content += `[ ] \n`;

  return content;
}

export function MeetingPrepExport({
  selectedStudents,
  schoolName = 'School',
  meetingDate = new Date(),
  onClear,
  className,
}: MeetingPrepExportProps) {
  const [_isGenerating, _setIsGenerating] = React.useState(false);

  const handleExportText = () => {
    const content = generateAgendaContent(selectedStudents, schoolName, meetingDate);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mtss-agenda-${meetingDate.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const content = generateAgendaContent(selectedStudents, schoolName, meetingDate);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>MTSS Meeting Agenda</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${content.replace(/\n/g, '<br>')}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopyToClipboard = async () => {
    const content = generateAgendaContent(selectedStudents, schoolName, meetingDate);
    try {
      await navigator.clipboard.writeText(content);
      // Could show a toast here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (selectedStudents.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700',
        'p-4 shadow-lg z-50',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-slate-200 font-medium">
              Meeting Prep
            </span>
          </div>
          <span className="text-slate-400">
            {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
          </span>

          {/* Selected student avatars */}
          <div className="flex -space-x-2">
            {selectedStudents.slice(0, 5).map((student, _i) => (
              <div
                key={student.studentId}
                className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-slate-300"
                title={student.studentName}
              >
                {student.studentName.charAt(0)}
              </div>
            ))}
            {selectedStudents.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-slate-300">
                +{selectedStudents.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
          <Button size="sm" onClick={handleExportText}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Agenda
          </Button>
        </div>
      </div>
    </div>
  );
}
