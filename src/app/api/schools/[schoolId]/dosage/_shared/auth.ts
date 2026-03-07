// src/app/api/schools/[schoolId]/dosage/_shared/auth.ts
/**
 * Shared auth helper for dosage API routes.
 * Reuses the pattern from risk API routes.
 */

// Re-export from risk auth module
export {
  authenticateSchoolRequest,
  isAdmin,
  type AuthContext,
  type RiskRouteParams as DosageRouteParams,
} from '../../risk/_shared/auth';

/** Route params for intervention-specific dosage routes */
export interface DosageInterventionRouteParams {
  params: Promise<{ schoolId: string; interventionId: string }>;
}

/** Route params for session-specific routes */
export interface DosageSessionRouteParams {
  params: Promise<{ schoolId: string; interventionId: string; sessionId: string }>;
}
