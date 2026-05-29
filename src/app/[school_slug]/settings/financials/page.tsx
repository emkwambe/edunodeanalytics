'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calculator,
  FileText,
  Upload,
  Save,
  Plus,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FinancialMetric {
  name: string;
  key: string;
  value: number | null;
  threshold: number;
  thresholdType: 'min' | 'max';
  unit: string;
  description: string;
  formula: string;
}

const FINANCIAL_METRICS: FinancialMetric[] = [
  {
    name: 'Current Ratio',
    key: 'current_ratio',
    value: null,
    threshold: 1.0,
    thresholdType: 'min',
    unit: 'ratio',
    description: 'Measures ability to pay short-term obligations',
    formula: 'Current Assets ÷ Current Liabilities',
  },
  {
    name: 'Days Cash on Hand',
    key: 'days_cash_on_hand',
    value: null,
    threshold: 60,
    thresholdType: 'min',
    unit: 'days',
    description: 'Number of days the school can operate with current cash',
    formula: 'Unrestricted Cash ÷ (Annual Expenses ÷ 365)',
  },
  {
    name: 'Debt to Asset Ratio',
    key: 'debt_to_asset_ratio',
    value: null,
    threshold: 0.9,
    thresholdType: 'max',
    unit: 'ratio',
    description: 'Proportion of assets financed by debt',
    formula: 'Total Liabilities ÷ Total Assets',
  },
  {
    name: 'Debt Service Coverage',
    key: 'debt_service_coverage',
    value: null,
    threshold: 1.1,
    thresholdType: 'min',
    unit: 'ratio',
    description: 'Ability to cover debt payments',
    formula: 'Net Operating Income ÷ Total Debt Service',
  },
  {
    name: 'Total Margin',
    key: 'total_margin',
    value: null,
    threshold: 0,
    thresholdType: 'min',
    unit: 'percent',
    description: 'Overall profitability',
    formula: '(Total Revenue - Total Expenses) ÷ Total Revenue × 100',
  },
  {
    name: 'Fund Balance Ratio',
    key: 'fund_balance_ratio',
    value: null,
    threshold: 0.15,
    thresholdType: 'min',
    unit: 'ratio',
    description: 'Reserves as percentage of expenses',
    formula: 'Unrestricted Fund Balance ÷ Total Expenses',
  },
];

function getMetricStatus(metric: FinancialMetric): 'meets' | 'approaching' | 'does_not_meet' | 'unknown' {
  if (metric.value === null) return 'unknown';

  if (metric.thresholdType === 'min') {
    if (metric.value >= metric.threshold) return 'meets';
    if (metric.value >= metric.threshold * 0.9) return 'approaching';
    return 'does_not_meet';
  } else {
    if (metric.value <= metric.threshold) return 'meets';
    if (metric.value <= metric.threshold * 1.1) return 'approaching';
    return 'does_not_meet';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'meets':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Meets Standard</Badge>;
    case 'approaching':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Approaching</Badge>;
    case 'does_not_meet':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Does Not Meet</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Not Entered</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'meets':
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    case 'approaching':
      return <AlertTriangle className="h-5 w-5 text-amber-400" />;
    case 'does_not_meet':
      return <AlertTriangle className="h-5 w-5 text-red-400" />;
    default:
      return <HelpCircle className="h-5 w-5 text-slate-400" />;
  }
}

export default function FinancialsPage() {
  const [fiscalYear, setFiscalYear] = useState('2024-25');
  const [reportType, setReportType] = useState<'annual' | 'quarterly'>('annual');
  const [metrics, setMetrics] = useState<FinancialMetric[]>(FINANCIAL_METRICS);
  const [isSaving, setIsSaving] = useState(false);

  // Revenue & Expense inputs
  const [financialData, setFinancialData] = useState({
    total_revenue: '',
    total_expenses: '',
    net_income: '',
    current_assets: '',
    current_liabilities: '',
    total_assets: '',
    total_liabilities: '',
    unrestricted_cash: '',
    unrestricted_fund_balance: '',
    total_debt_service: '',
    actual_adm: '',
    projected_adm: '',
  });

  const handleInputChange = (key: string, value: string) => {
    setFinancialData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMetricChange = (index: number, value: string) => {
    const newMetrics = [...metrics];
    newMetrics[index].value = value === '' ? null : parseFloat(value);
    setMetrics(newMetrics);
  };

  const calculateMetrics = () => {
    const data = financialData;
    const newMetrics = [...metrics];

    // Current Ratio
    if (data.current_assets && data.current_liabilities) {
      const idx = newMetrics.findIndex((m) => m.key === 'current_ratio');
      newMetrics[idx].value = parseFloat(data.current_assets) / parseFloat(data.current_liabilities);
    }

    // Days Cash on Hand
    if (data.unrestricted_cash && data.total_expenses) {
      const idx = newMetrics.findIndex((m) => m.key === 'days_cash_on_hand');
      newMetrics[idx].value = Math.round(parseFloat(data.unrestricted_cash) / (parseFloat(data.total_expenses) / 365));
    }

    // Debt to Asset Ratio
    if (data.total_liabilities && data.total_assets) {
      const idx = newMetrics.findIndex((m) => m.key === 'debt_to_asset_ratio');
      newMetrics[idx].value = parseFloat(data.total_liabilities) / parseFloat(data.total_assets);
    }

    // Total Margin
    if (data.total_revenue && data.total_expenses) {
      const idx = newMetrics.findIndex((m) => m.key === 'total_margin');
      const revenue = parseFloat(data.total_revenue);
      const expenses = parseFloat(data.total_expenses);
      newMetrics[idx].value = ((revenue - expenses) / revenue) * 100;
    }

    // Fund Balance Ratio
    if (data.unrestricted_fund_balance && data.total_expenses) {
      const idx = newMetrics.findIndex((m) => m.key === 'fund_balance_ratio');
      newMetrics[idx].value = parseFloat(data.unrestricted_fund_balance) / parseFloat(data.total_expenses);
    }

    setMetrics(newMetrics);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement actual save to database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const meetsCount = metrics.filter((m) => getMetricStatus(m) === 'meets').length;
  const issuesCount = metrics.filter((m) => getMetricStatus(m) === 'does_not_meet').length;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Health</h1>
            <p className="text-slate-400">Track and report financial performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-25">2024-25</SelectItem>
                <SelectItem value="2023-24">2023-24</SelectItem>
                <SelectItem value="2022-23">2022-23</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={(v: string) => setReportType(v as 'annual' | 'quarterly')}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Report'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Overall Status</p>
                  <p className="text-2xl font-bold">
                    {issuesCount === 0 ? (
                      <span className="text-emerald-400">Healthy</span>
                    ) : issuesCount <= 2 ? (
                      <span className="text-amber-400">Watch</span>
                    ) : (
                      <span className="text-red-400">Concern</span>
                    )}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  issuesCount === 0 ? 'bg-emerald-500/20' : issuesCount <= 2 ? 'bg-amber-500/20' : 'bg-red-500/20'
                }`}>
                  {issuesCount === 0 ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className={`h-6 w-6 ${issuesCount <= 2 ? 'text-amber-400' : 'text-red-400'}`} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Metrics Meeting Standard</p>
                  <p className="text-2xl font-bold text-emerald-400">{meetsCount}/{metrics.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Current Ratio</p>
                  <p className="text-2xl font-bold">
                    {metrics.find((m) => m.key === 'current_ratio')?.value?.toFixed(2) ?? '--'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">Target: ≥ 1.0</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Days Cash</p>
                  <p className="text-2xl font-bold">
                    {metrics.find((m) => m.key === 'days_cash_on_hand')?.value ?? '--'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">Target: ≥ 60 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="metrics">Financial Metrics</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>NACSA Financial Performance Framework</CardTitle>
                <CardDescription>Enter or auto-calculate your financial health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {metrics.map((metric, index) => {
                    const status = getMetricStatus(metric);
                    return (
                      <div
                        key={metric.key}
                        className="flex items-center gap-6 p-4 bg-slate-700/30 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{metric.name}</h4>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-medium mb-1">{metric.description}</p>
                                <p className="text-xs text-slate-400">Formula: {metric.formula}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-sm text-slate-400">
                            Target: {metric.thresholdType === 'min' ? '≥' : '≤'} {metric.threshold}
                            {metric.unit === 'percent' ? '%' : metric.unit === 'days' ? ' days' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <Input
                              type="number"
                              step="0.01"
                              value={metric.value ?? ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange(index, e.target.value)}
                              placeholder="Enter value"
                              className="bg-slate-700 border-slate-600"
                            />
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-400" />
                  Financial Calculator
                </CardTitle>
                <CardDescription>
                  Enter your financial statement values to auto-calculate ratios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Sheet */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg border-b border-slate-700 pb-2">Balance Sheet</h3>

                    <div className="space-y-2">
                      <Label>Current Assets ($)</Label>
                      <Input
                        type="number"
                        value={financialData.current_assets}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('current_assets', e.target.value)}
                        placeholder="e.g., 500000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Current Liabilities ($)</Label>
                      <Input
                        type="number"
                        value={financialData.current_liabilities}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('current_liabilities', e.target.value)}
                        placeholder="e.g., 350000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total Assets ($)</Label>
                      <Input
                        type="number"
                        value={financialData.total_assets}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('total_assets', e.target.value)}
                        placeholder="e.g., 2000000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total Liabilities ($)</Label>
                      <Input
                        type="number"
                        value={financialData.total_liabilities}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('total_liabilities', e.target.value)}
                        placeholder="e.g., 800000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unrestricted Cash ($)</Label>
                      <Input
                        type="number"
                        value={financialData.unrestricted_cash}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('unrestricted_cash', e.target.value)}
                        placeholder="e.g., 300000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unrestricted Fund Balance ($)</Label>
                      <Input
                        type="number"
                        value={financialData.unrestricted_fund_balance}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('unrestricted_fund_balance', e.target.value)}
                        placeholder="e.g., 400000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>

                  {/* Income Statement */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg border-b border-slate-700 pb-2">Income Statement</h3>

                    <div className="space-y-2">
                      <Label>Total Revenue ($)</Label>
                      <Input
                        type="number"
                        value={financialData.total_revenue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('total_revenue', e.target.value)}
                        placeholder="e.g., 3500000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total Expenses ($)</Label>
                      <Input
                        type="number"
                        value={financialData.total_expenses}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('total_expenses', e.target.value)}
                        placeholder="e.g., 3300000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total Debt Service ($)</Label>
                      <Input
                        type="number"
                        value={financialData.total_debt_service}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('total_debt_service', e.target.value)}
                        placeholder="e.g., 150000"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <h3 className="font-medium text-lg border-b border-slate-700 pb-2 mt-6">Enrollment</h3>

                    <div className="space-y-2">
                      <Label>Actual ADM (Average Daily Membership)</Label>
                      <Input
                        type="number"
                        value={financialData.actual_adm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('actual_adm', e.target.value)}
                        placeholder="e.g., 450"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Projected ADM</Label>
                      <Input
                        type="number"
                        value={financialData.projected_adm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('projected_adm', e.target.value)}
                        placeholder="e.g., 475"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={calculateMetrics} className="bg-indigo-500 hover:bg-indigo-600">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Ratios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  Financial Documents
                </CardTitle>
                <CardDescription>Upload audit reports and financial statements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500/50 transition-colors">
                    <Upload className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-1">Drop files here or click to upload</p>
                    <p className="text-sm text-slate-400 mb-4">PDF, Excel, or CSV files up to 10MB</p>
                    <Button variant="outline" className="border-slate-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Select Files
                    </Button>
                  </div>

                  {/* Document List */}
                  <div className="space-y-3 mt-6">
                    <h4 className="font-medium text-sm text-slate-400">Uploaded Documents</h4>

                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="font-medium">FY2023-24_Audit_Report.pdf</p>
                          <p className="text-sm text-slate-400">Uploaded Dec 15, 2024 • 2.4 MB</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="font-medium">Q2_Interim_Financials.xlsx</p>
                          <p className="text-sm text-slate-400">Uploaded Jan 30, 2025 • 156 KB</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-400">Pending Review</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                  Financial History
                </CardTitle>
                <CardDescription>View historical financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Fiscal Year</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Current Ratio</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Days Cash</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Debt/Asset</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Total Margin</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-4 px-4 font-medium">2023-24</td>
                        <td className="py-4 px-4 text-right text-emerald-400">1.35</td>
                        <td className="py-4 px-4 text-right text-emerald-400">72</td>
                        <td className="py-4 px-4 text-right text-emerald-400">0.42</td>
                        <td className="py-4 px-4 text-right text-emerald-400">5.7%</td>
                        <td className="py-4 px-4 text-center">
                          <Badge className="bg-emerald-500/20 text-emerald-400">Clean</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-4 px-4 font-medium">2022-23</td>
                        <td className="py-4 px-4 text-right text-emerald-400">1.28</td>
                        <td className="py-4 px-4 text-right text-amber-400">58</td>
                        <td className="py-4 px-4 text-right text-emerald-400">0.45</td>
                        <td className="py-4 px-4 text-right text-emerald-400">4.2%</td>
                        <td className="py-4 px-4 text-center">
                          <Badge className="bg-emerald-500/20 text-emerald-400">Clean</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-4 px-4 font-medium">2021-22</td>
                        <td className="py-4 px-4 text-right text-amber-400">1.12</td>
                        <td className="py-4 px-4 text-right text-amber-400">45</td>
                        <td className="py-4 px-4 text-right text-emerald-400">0.52</td>
                        <td className="py-4 px-4 text-right text-amber-400">1.8%</td>
                        <td className="py-4 px-4 text-center">
                          <Badge className="bg-amber-500/20 text-amber-400">Qualified</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
