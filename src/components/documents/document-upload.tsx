'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  File,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  uploadDocumentClient,
  StorageBucket,
  UploadResult,
} from '@/lib/supabase/storage';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: UploadResult;
}

interface DocumentUploadProps {
  bucket: StorageBucket;
  schoolId: string;
  category?: string;
  fiscalYear?: string;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
}

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/*': ['.png', '.jpg', '.jpeg'],
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-400" />;
  if (['xlsx', 'xls'].includes(ext || '')) return <FileText className="h-5 w-5 text-emerald-400" />;
  if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-400" />;
  return <File className="h-5 w-5 text-slate-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DocumentUpload({
  bucket,
  schoolId,
  category,
  fiscalYear,
  onUploadComplete,
  onUploadError,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 5,
  className,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: isUploading,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (let i = 0; i < pendingFiles.length; i++) {
      const uploadFile = pendingFiles[i];
      const fileIndex = files.findIndex((f) => f.file === uploadFile.file);

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: 'uploading', progress: 10 } : f
        )
      );

      try {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, progress: 50 } : f
          )
        );

        const result = await uploadDocumentClient(
          bucket,
          uploadFile.file,
          schoolId,
          { category, fiscal_year: fiscalYear }
        );

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, status: result.success ? 'success' : 'error', progress: 100, result }
              : f
          )
        );

        if (result.success) {
          onUploadComplete?.(result);
        } else {
          onUploadError?.(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, status: 'error', progress: 0, result: { success: false, error: errorMsg } }
              : f
          )
        );
        onUploadError?.(errorMsg);
      }
    }

    setIsUploading(false);
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-slate-400" />
        {isDragActive ? (
          <p className="text-indigo-400">Drop files here...</p>
        ) : (
          <>
            <p className="text-slate-300 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-slate-500">
              PDF, Excel, Word, or images up to {formatFileSize(maxSize)}
            </p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {fileRejections.length} file(s) rejected (too large or wrong type)
            </span>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((uploadFile, index) => (
            <div
              key={`${uploadFile.file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700"
            >
              {getFileIcon(uploadFile.file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(uploadFile.file.size)}
                </p>
                {uploadFile.status === 'uploading' && (
                  <Progress value={uploadFile.progress} className="mt-2 h-1" />
                )}
                {uploadFile.status === 'error' && uploadFile.result?.error && (
                  <p className="text-xs text-red-400 mt-1">{uploadFile.result.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {uploadFile.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {uploadFile.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                )}
                {uploadFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
                {uploadFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {pendingCount > 0 && <span>{pendingCount} pending</span>}
            {successCount > 0 && <span className="ml-2 text-emerald-400">{successCount} uploaded</span>}
          </div>
          <div className="flex gap-2">
            {successCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear Completed
              </Button>
            )}
            {pendingCount > 0 && (
              <Button
                onClick={uploadFiles}
                disabled={isUploading}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {pendingCount} File{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
