/**
 * Privacy & Data Protection Module
 *
 * This module provides comprehensive PII protection for EduNode Analytics,
 * ensuring FERPA/COPPA compliance when handling student data.
 *
 * Usage:
 * ```typescript
 * import { createSecureAIProxy, getAnonymizer } from '@/lib/privacy';
 *
 * // For AI API calls
 * const proxy = createSecureAIProxy(schoolId);
 * const result = await proxy.callAI('anthropic', prompt, studentData, context);
 *
 * // For direct anonymization
 * const anonymizer = getAnonymizer(schoolId);
 * const safeData = anonymizer.anonymizeStudents(students);
 * ```
 */

export {
  PIIAnonymizer,
  getAnonymizer,
  aggregateStudentData,
  sanitizeFreeText,
  detectPotentialPII,
  DEFAULT_ANONYMIZATION_CONFIG,
  type StudentPII,
  type AnonymizedStudent,
  type AnonymizationLevel,
  type AnonymizationConfig,
  type AnonymizationMapping,
} from './pii-anonymizer';

export {
  SecureAIProxy,
  createSecureAIProxy,
  validatePayloadSafety,
  type AIProvider,
  type AIRequestContext,
  type AIAuditLogEntry,
} from './secure-ai-proxy';
