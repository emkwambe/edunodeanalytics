'use client';

import React, { useState } from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Plus,
  Filter,
  Calendar,
  FileText,
  Upload,
  Edit,
  Trash2,
  ChevronDown,
  Search,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'expired' | 'not_applicable';

type ComplianceCategory =
  | 'financial_audit'
  | 'board_governance'
  | 'health_safety'
  | 'special_education'
  | 'ell_services'
  | 'teacher_certification'
  | 'background_checks'
  | 'facility'
  | 'ferpa_privacy'
  | 'civil_rights'
  | 'reporting'
  | 'other';

interface ComplianceItem {
  id: string;
  category: ComplianceCategory;
  item_name: string;
  description: string | null;
  status: ComplianceStatus;
  due_date: string | null;
  completed_date: string | null;
  expiration_date: string | null;
  document_url: string | null;
  document_name: string | null;
  assigned_to: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
}

const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  financial_audit: 'Financial Audit',
  board_governance: 'Board Governance',
  health_safety: 'Health & Safety',
  special_education: 'Special Education',
  ell_services: 'ELL Services',
  teacher_certification: 'Teacher Certification',
  background_checks: 'Background Checks',
  facility: 'Facility',
  ferpa_privacy: 'FERPA/Privacy',
  civil_rights: 'Civil Rights',
  reporting: 'State Reporting',
  other: 'Other',
};

const CATEGORY_ICONS: Record<ComplianceCategory, React.ReactNode> = {
  financial_audit: <FileText className="h-4 w-4" />,
  board_governance: <Shield className="h-4 w-4" />,
  health_safety: <Shield className="h-4 w-4" />,
  special_education: <FileText className="h-4 w-4" />,
  ell_services: <FileText className="h-4 w-4" />,
  teacher_certification: <CheckCircle className="h-4 w-4" />,
  background_checks: <Shield className="h-4 w-4" />,
  facility: <FileText className="h-4 w-4" />,
  ferpa_privacy: <Shield className="h-4 w-4" />,
  civil_rights: <Shield className="h-4 w-4" />,
  reporting: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

const MOCK_COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: '1',
    category: 'financial_audit',
    item_name: 'Annual Financial Audit',
    description: 'Independent financial audit per state requirements',
    status: 'compliant',
    due_date: '2024-11-30',
    completed_date: '2024-10-15',
    expiration_date: '2025-11-30',
    document_url: '/docs/audit-2024.pdf',
    document_name: 'FY2024_Audit_Report.pdf',
    assigned_to: 'CFO',
    notes: 'Clean audit, no findings',
    is_recurring: true,
    recurrence_interval: '1 year',
  },
  {
    id: '2',
    category: 'board_governance',
    item_name: 'Board Member Training',
    description: 'Annual governance training for all board members',
    status: 'pending',
    due_date: '2024-12-31',
    completed_date: null,
    expiration_date: null,
    document_url: null,
    document_name: null,
    assigned_to: 'Board Chair',
    notes: 'Scheduled for December board retreat',
    is_recurring: true,
    recurrence_interval: '1 year',
  },
  {
    id: '3',
    category: 'background_checks',
    item_name: 'Staff Background Checks',
    description: 'All staff must have current background checks',
    status: 'non_compliant',
    due_date: '2024-08-15',
    completed_date: null,
    expiration_date: null,
    document_url: null,
    document_name: null,
    assigned_to: 'HR Director',
    notes: '3 new hires pending clearance',
    is_recurring: false,
    recurrence_interval: null,
  },
  {
    id: '4',
    category: 'health_safety',
    item_name: 'Fire Safety Inspection',
    description: 'Annual fire marshal inspection',
    status: 'expired',
    due_date: '2024-06-30',
    completed_date: '2023-06-28',
    expiration_date: '2024-06-30',
    document_url: '/docs/fire-2023.pdf',
    document_name: 'Fire_Inspection_2023.pdf',
    assigned_to: 'Facilities Manager',
    notes: 'Inspection overdue - scheduling in progress',
    is_recurring: true,
    recurrence_interval: '1 year',
  },
  {
    id: '5',
    category: 'special_education',
    item_name: 'SPED Compliance Review',
    description: 'State special education compliance monitoring',
    status: 'compliant',
    due_date: '2024-03-15',
    completed_date: '2024-03-10',
    expiration_date: '2025-03-15',
    document_url: '/docs/sped-review.pdf',
    document_name: 'SPED_Compliance_2024.pdf',
    assigned_to: 'SPED Coordinator',
    notes: 'All IEPs current, services documented',
    is_recurring: true,
    recurrence_interval: '1 year',
  },
  {
    id: '6',
    category: 'reporting',
    item_name: 'Q1 Enrollment Report',
    description: 'Quarterly enrollment verification to state',
    status: 'compliant',
    due_date: '2024-10-15',
    completed_date: '2024-10-12',
    expiration_date: null,
    document_url: null,
    document_name: null,
    assigned_to: 'Data Manager',
    notes: null,
    is_recurring: true,
    recurrence_interval: '3 months',
  },
];

function getStatusBadge(status: ComplianceStatus) {
  switch (status) {
    case 'compliant':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Compliant</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
    case 'non_compliant':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Non-Compliant</Badge>;
    case 'expired':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Expired</Badge>;
    case 'not_applicable':
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">N/A</Badge>;
    default:
      return null;
  }
}

function getStatusIcon(status: ComplianceStatus) {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-amber-400" />;
    case 'non_compliant':
      return <XCircle className="h-5 w-5 text-red-400" />;
    case 'expired':
      return <AlertTriangle className="h-5 w-5 text-orange-400" />;
    case 'not_applicable':
      return <Shield className="h-5 w-5 text-slate-400" />;
    default:
      return null;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>(MOCK_COMPLIANCE_ITEMS);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);

  const [newItem, setNewItem] = useState<Partial<ComplianceItem>>({
    category: 'other',
    item_name: '',
    description: '',
    status: 'pending',
    due_date: '',
    is_recurring: false,
  });

  const filteredItems = items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery && !item.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const compliantCount = items.filter((i) => i.status === 'compliant').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const nonCompliantCount = items.filter((i) => i.status === 'non_compliant').length;
  const expiredCount = items.filter((i) => i.status === 'expired').length;
  const upcomingDue = items.filter((i) => {
    const days = getDaysUntilDue(i.due_date);
    return days !== null && days > 0 && days <= 30 && i.status !== 'compliant';
  }).length;

  const complianceRate = items.length > 0
    ? Math.round((compliantCount / items.filter(i => i.status !== 'not_applicable').length) * 100)
    : 0;

  const handleAddItem = () => {
    const item: ComplianceItem = {
      id: Date.now().toString(),
      category: newItem.category as ComplianceCategory,
      item_name: newItem.item_name || '',
      description: newItem.description || null,
      status: newItem.status as ComplianceStatus,
      due_date: newItem.due_date || null,
      completed_date: null,
      expiration_date: null,
      document_url: null,
      document_name: null,
      assigned_to: newItem.assigned_to || null,
      notes: newItem.notes || null,
      is_recurring: newItem.is_recurring || false,
      recurrence_interval: newItem.recurrence_interval || null,
    };
    setItems([...items, item]);
    setIsAddDialogOpen(false);
    setNewItem({
      category: 'other',
      item_name: '',
      description: '',
      status: 'pending',
      due_date: '',
      is_recurring: false,
    });
  };

  const handleUpdateStatus = (itemId: string, newStatus: ComplianceStatus) => {
    setItems(items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: newStatus,
            completed_date: newStatus === 'compliant' ? new Date().toISOString().split('T')[0] : item.completed_date
          }
        : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const categoryCounts = Object.keys(CATEGORY_LABELS).reduce((acc, cat) => {
    const categoryItems = items.filter((i) => i.category === cat);
    const compliant = categoryItems.filter((i) => i.status === 'compliant').length;
    const issues = categoryItems.filter((i) => ['non_compliant', 'expired'].includes(i.status)).length;
    acc[cat as ComplianceCategory] = { total: categoryItems.length, compliant, issues };
    return acc;
  }, {} as Record<ComplianceCategory, { total: number; compliant: number; issues: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-slate-400">Track compliance requirements and documentation</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-500 hover:bg-indigo-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Compliance Item</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Create a new compliance tracking item
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(v: string) => setNewItem({ ...newItem, category: v as ComplianceCategory })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={newItem.item_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, item_name: e.target.value })}
                    placeholder="e.g., Annual Fire Inspection"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newItem.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Brief description of the requirement"
                    className="bg-slate-800 border-slate-700"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newItem.status}
                      onValueChange={(v: string) => setNewItem({ ...newItem, status: v as ComplianceStatus })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newItem.due_date || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, due_date: e.target.value })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input
                    value={newItem.assigned_to || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, assigned_to: e.target.value })}
                    placeholder="e.g., CFO, Principal"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleAddItem}
                  disabled={!newItem.item_name}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Compliance Rate</p>
                <p className="text-2xl font-bold">{complianceRate}%</p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                complianceRate >= 90 ? 'bg-emerald-500/20' : complianceRate >= 70 ? 'bg-amber-500/20' : 'bg-red-500/20'
              }`}>
                <Shield className={`h-6 w-6 ${
                  complianceRate >= 90 ? 'text-emerald-400' : complianceRate >= 70 ? 'text-amber-400' : 'text-red-400'
                }`} />
              </div>
            </div>
            <Progress value={complianceRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Compliant</p>
                <p className="text-2xl font-bold text-emerald-400">{compliantCount}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Issues</p>
                <p className="text-2xl font-bold text-red-400">{nonCompliantCount + expiredCount}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Due Soon</p>
                <p className="text-2xl font-bold text-orange-400">{upcomingDue}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="list">All Items</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <Card className="bg-slate-800 border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800">
                  <TableHead className="text-slate-400">Item</TableHead>
                  <TableHead className="text-slate-400">Category</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Due Date</TableHead>
                  <TableHead className="text-slate-400">Assigned To</TableHead>
                  <TableHead className="text-slate-400">Document</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const daysUntil = getDaysUntilDue(item.due_date);
                  const isOverdue = daysUntil !== null && daysUntil < 0 && item.status !== 'compliant';
                  const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 14 && item.status !== 'compliant';

                  return (
                    <TableRow key={item.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          {item.description && (
                            <p className="text-sm text-slate-400 truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[item.category]}
                          <span className="text-sm">{CATEGORY_LABELS[item.category]}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : ''}>
                            {formatDate(item.due_date)}
                          </span>
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          {isDueSoon && <Badge className="bg-amber-500/20 text-amber-400 text-xs">Soon</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">{item.assigned_to || '-'}</TableCell>
                      <TableCell>
                        {item.document_name ? (
                          <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-slate-500">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(item.id, 'compliant')}
                              className="text-emerald-400"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Compliant
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(item.id, 'pending')}
                              className="text-amber-400"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Mark Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(item.id, 'non_compliant')}
                              className="text-red-400"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark Non-Compliant
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      No compliance items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const counts = categoryCounts[key as ComplianceCategory];
              if (!counts || counts.total === 0) return null;
              const rate = Math.round((counts.compliant / counts.total) * 100);

              return (
                <Card key={key} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[key as ComplianceCategory]}
                        <CardTitle className="text-base">{label}</CardTitle>
                      </div>
                      {counts.issues > 0 && (
                        <Badge variant="destructive">{counts.issues} issues</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        {counts.compliant} of {counts.total} compliant
                      </span>
                      <span className={`text-sm font-medium ${
                        rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {rate}%
                      </span>
                    </div>
                    <Progress value={rate} className="h-2" />
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm"
                        onClick={() => {
                          setFilterCategory(key);
                          setFilterStatus('all');
                        }}
                      >
                        View All
                      </Button>
                      {counts.issues > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sm text-red-400"
                          onClick={() => {
                            setFilterCategory(key);
                            setFilterStatus('non_compliant');
                          }}
                        >
                          View Issues
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription className="text-slate-400">
                Compliance items due in the next 90 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items
                  .filter((item) => {
                    const days = getDaysUntilDue(item.due_date);
                    return days !== null && days >= -30 && days <= 90 && item.status !== 'compliant';
                  })
                  .sort((a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                  })
                  .map((item) => {
                    const days = getDaysUntilDue(item.due_date);
                    const isOverdue = days !== null && days < 0;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isOverdue
                            ? 'border-red-500/30 bg-red-500/10'
                            : days !== null && days <= 14
                            ? 'border-amber-500/30 bg-amber-500/10'
                            : 'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-slate-400">{CATEGORY_LABELS[item.category]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${isOverdue ? 'text-red-400' : ''}`}>
                            {formatDate(item.due_date)}
                          </p>
                          <p className={`text-sm ${
                            isOverdue ? 'text-red-400' : days !== null && days <= 14 ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {isOverdue
                              ? `${Math.abs(days!)} days overdue`
                              : `${days} days remaining`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {items.filter((item) => {
                  const days = getDaysUntilDue(item.due_date);
                  return days !== null && days >= -30 && days <= 90 && item.status !== 'compliant';
                }).length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                    <p>No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
