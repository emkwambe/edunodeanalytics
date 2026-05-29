'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Calendar,
  HardDrive,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  listDocuments,
  getDocumentUrl,
  deleteDocument,
  StorageBucket,
} from '@/lib/supabase/storage';

interface Document {
  name: string;
  path: string;
  createdAt: string;
  size: number;
}

interface DocumentListProps {
  bucket: StorageBucket;
  schoolId: string;
  folder?: string;
  onDocumentDeleted?: (path: string) => void;
  showDelete?: boolean;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-400" />;
  if (['xlsx', 'xls'].includes(ext || '')) return <FileText className="h-5 w-5 text-emerald-400" />;
  if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-400" />;
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <FileText className="h-5 w-5 text-purple-400" />;
  return <FileText className="h-5 w-5 text-slate-400" />;
}

export function DocumentList({
  bucket,
  schoolId,
  folder,
  onDocumentDeleted,
  showDelete = true,
  className,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [bucket, schoolId, folder]);

  const loadDocuments = async () => {
    setIsLoading(true);
    const docs = await listDocuments(bucket, schoolId, folder);
    setDocuments(docs);
    setIsLoading(false);
  };

  const handleView = async (doc: Document) => {
    const url = await getDocumentUrl(bucket, doc.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownload = async (doc: Document) => {
    const url = await getDocumentUrl(bucket, doc.path);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    const result = await deleteDocument(bucket, documentToDelete.path);

    if (result.success) {
      setDocuments((prev) => prev.filter((d) => d.path !== documentToDelete.path));
      onDocumentDeleted?.(documentToDelete.path);
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-slate-500" />
        <p className="text-slate-400">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800">
              <TableHead className="text-slate-400">Document</TableHead>
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Uploaded
                </div>
              </TableHead>
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  Size
                </div>
              </TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.path} className="border-slate-700 hover:bg-slate-700/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.name)}
                    <span className="font-medium">{doc.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-400">{formatDate(doc.createdAt)}</TableCell>
                <TableCell className="text-slate-400">{formatFileSize(doc.size)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(doc)}
                      className="h-8 w-8 p-0"
                      title="View"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {showDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(doc)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete &quot;{documentToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
