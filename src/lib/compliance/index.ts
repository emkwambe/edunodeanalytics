/**
 * Compliance Module
 * =================
 *
 * Layer 4: Evidence and Compliance Log
 *
 * Exports for FERPA-compliant audit trails and evidence collection.
 */

export {
  EvidenceLogger,
  createEvidenceLogger,
  type ComplianceEventType,
  type DataClassification,
  type ComplianceEvent,
  type DataAccessRecord,
  type ConsentRecord,
  type ComplianceReport,
} from './evidence-logger';

export {
  FerpaComplianceManager,
  createFerpaManager,
  PII_FIELDS,
  DIRECTORY_INFORMATION,
  FERPA_EXCEPTIONS,
  type FerpaException,
  type AccessRequest,
  type AccessDecision,
  type AmendmentRequest,
} from './ferpa-compliance';
