'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Building2,
  Calendar,
  Percent,
  FileCheck,
  Loader2,
  Eye,
  Printer,
  MapPin,
} from 'lucide-react';
import { stateTemplates, type StateReportTemplate } from '@/lib/reports/templates';

interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  state: string;
  generatedAt: Date;
  status: 'complete' | 'generating' | 'failed';
  overallScore?: number;
  downloadUrl?: string;
}

// US States with charter school presence
const US_STATES = [
  { code: 'AZ', name: 'Arizona' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  { code: 'OH', name: 'Ohio' },
  { code: 'TX', name: 'Texas' },
];

export default function ReportsPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  const [selectedState, setSelectedState] = React.useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<StateReportTemplate | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedReports, setGeneratedReports] = React.useState<GeneratedReport[]>([]);
  const [activeTab, setActiveTab] = React.useState('templates');

  // Filter templates by selected state
  const filteredTemplates = selectedState
    ? stateTemplates.filter((t) => t.stateCode === selectedState)
    : stateTemplates;

  // Handle template selection
  const handleSelectTemplate = (template: StateReportTemplate) => {
    setSelectedTemplate(template);
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const newReport: GeneratedReport = {
      id: crypto.randomUUID(),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      state: selectedTemplate.state,
      generatedAt: new Date(),
      status: 'complete',
      overallScore: Math.floor(Math.random() * 20) + 75, // 75-95
      downloadUrl: `/api/reports/download/${crypto.randomUUID()}`,
    };

    setGeneratedReports((prev) => [newReport, ...prev]);
    setIsGenerating(false);
    setActiveTab('history');
  };

  // Get status badge
  const getStatusBadge = (status: GeneratedReport['status']) => {
    switch (status) {
      case 'complete':
        return (
          <Badge variant="accent" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 text-cyan-400 mb-2">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              State Report Templates
            </span>
          </div>
          <h1 className="text-3xl font-black">Renewal Reports</h1>
          <p className="text-slate-400 mt-1">
            Generate state-specific charter renewal reports with pre-built templates
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
            <TabsTrigger value="history">
              Generated Reports
              {generatedReports.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {generatedReports.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Template Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* State Filter */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Filter by State:</span>
                      </div>
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="w-[200px] bg-slate-800 border-slate-600">
                          <SelectValue placeholder="All States" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All States</SelectItem>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedState && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedState('')}
                          className="text-slate-400"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-indigo-500/50 ${
                        selectedTemplate?.id === template.id
                          ? 'ring-2 ring-indigo-500 border-indigo-500'
                          : ''
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="mb-2">
                            {template.stateCode}
                          </Badge>
                          {selectedTemplate?.id === template.id && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {template.authorizer}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {template.renewalCycle}-year cycle
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            {template.sections.length} sections
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p className="text-slate-400">
                        No templates found for the selected state.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Template Details */}
              <div className="space-y-6">
                {selectedTemplate ? (
                  <>
                    {/* Template Info */}
                    <Card className="bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border-indigo-500/30">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-indigo-400" />
                          <Badge variant="outline" className="border-indigo-400 text-indigo-400">
                            {selectedTemplate.state}
                          </Badge>
                        </div>
                        <CardTitle>{selectedTemplate.name}</CardTitle>
                        <CardDescription className="text-slate-300">
                          {selectedTemplate.authorizer}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-300">{selectedTemplate.description}</p>

                        {/* Scoring Rubric */}
                        {selectedTemplate.scoringRubric && (
                          <div className="p-3 bg-slate-900/50 rounded-lg">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                              Scoring Weights
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Academic</span>
                                <span className="font-bold text-indigo-400">
                                  {selectedTemplate.scoringRubric.academic}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Financial</span>
                                <span className="font-bold text-emerald-400">
                                  {selectedTemplate.scoringRubric.financial}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Organizational</span>
                                <span className="font-bold text-amber-400">
                                  {selectedTemplate.scoringRubric.organizational}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Compliance</span>
                                <span className="font-bold text-cyan-400">
                                  {selectedTemplate.scoringRubric.compliance}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Deadlines */}
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                            Submission Deadlines
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Initial Submission</span>
                              <span className="text-white">
                                {selectedTemplate.submissionDeadlines.initial}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Final Submission</span>
                              <span className="text-white">
                                {selectedTemplate.submissionDeadlines.final}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleGenerateReport}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating Report...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Report
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Sections Preview */}
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-cyan-400" />
                          Report Sections ({selectedTemplate.sections.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedTemplate.sections.map((section, idx) => (
                            <li
                              key={section.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/30"
                            >
                              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {section.title}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {section.dataPoints.length} data points
                                </p>
                              </div>
                              {section.required && (
                                <Badge variant="outline" size="sm" className="text-amber-400 border-amber-400/30">
                                  Required
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Required Attachments */}
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          Required Attachments ({selectedTemplate.requiredAttachments.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {selectedTemplate.requiredAttachments.map((attachment, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm text-slate-400"
                            >
                              <ChevronRight className="w-3 h-3" />
                              {attachment}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p className="text-slate-400 mb-2">Select a template to get started</p>
                      <p className="text-sm text-slate-500">
                        Choose a state-specific renewal report template from the list
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Generated Reports
                </CardTitle>
                <CardDescription>
                  View and download previously generated renewal reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedReports.length > 0 ? (
                  <div className="space-y-4">
                    {generatedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <FileText className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{report.templateName}</h4>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              <span>{report.state}</span>
                              <span>|</span>
                              <span>
                                {report.generatedAt.toLocaleDateString()}{' '}
                                {report.generatedAt.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {report.overallScore && (
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-slate-400" />
                              <span
                                className={`font-bold ${
                                  report.overallScore >= 80
                                    ? 'text-emerald-400'
                                    : report.overallScore >= 60
                                      ? 'text-amber-400'
                                      : 'text-red-400'
                                }`}
                              >
                                {report.overallScore}%
                              </span>
                            </div>
                          )}
                          {getStatusBadge(report.status)}
                          {report.status === 'complete' && (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                              </Button>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 mb-2">No reports generated yet</p>
                    <p className="text-sm text-slate-500">
                      Select a template and generate your first report
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab('templates')}
                    >
                      Browse Templates
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
