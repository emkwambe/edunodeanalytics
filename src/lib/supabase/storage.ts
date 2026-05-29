import { createClient } from './client';
import { createServerSupabaseClient } from './server';

export const STORAGE_BUCKETS = {
  COMPLIANCE_DOCS: 'compliance-documents',
  FINANCIAL_DOCS: 'financial-documents',
  AUDIT_REPORTS: 'audit-reports',
  BOARD_DOCS: 'board-documents',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface DocumentMetadata {
  school_id: string;
  document_type: string;
  uploaded_by?: string;
  fiscal_year?: string;
  category?: string;
}

function generateFilePath(
  schoolId: string,
  fileName: string,
  metadata?: Partial<DocumentMetadata>
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const yearFolder = metadata?.fiscal_year || new Date().getFullYear().toString();
  const categoryFolder = metadata?.category || 'general';

  return `${schoolId}/${yearFolder}/${categoryFolder}/${timestamp}-${sanitizedName}`;
}

export async function uploadDocumentClient(
  bucket: StorageBucket,
  file: File,
  schoolId: string,
  metadata?: Partial<DocumentMetadata>
): Promise<UploadResult> {
  const supabase = createClient();

  const path = generateFilePath(schoolId, file.name, metadata);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    success: true,
    path: data.path,
    url: publicUrl,
  };
}

export async function uploadDocumentServer(
  bucket: StorageBucket,
  file: Buffer | Blob,
  fileName: string,
  schoolId: string,
  metadata?: Partial<DocumentMetadata>
): Promise<UploadResult> {
  const supabase = await createServerSupabaseClient();

  const path = generateFilePath(schoolId, fileName, metadata);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    success: true,
    path: data.path,
    url: publicUrl,
  };
}

export async function deleteDocument(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getDocumentUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

export async function listDocuments(
  bucket: StorageBucket,
  schoolId: string,
  folder?: string
): Promise<{ name: string; path: string; createdAt: string; size: number }[]> {
  const supabase = createClient();

  const path = folder ? `${schoolId}/${folder}` : schoolId;

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Error listing documents:', error);
    return [];
  }

  return (data || [])
    .filter(item => item.name !== '.emptyFolderPlaceholder')
    .map(item => ({
      name: item.name,
      path: `${path}/${item.name}`,
      createdAt: item.created_at || '',
      size: item.metadata?.size || 0,
    }));
}
