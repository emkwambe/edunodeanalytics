/**
 * Integration Pricing Configuration
 * ==================================
 *
 * Defines the cost structure for each integration.
 * Schools can be billed based on usage.
 */

import type { DataSourceCategory } from '../data/sources/registry';

/**
 * Pricing tier for an integration
 */
export interface IntegrationPricingTier {
  integrationId: string;
  name: string;
  category: DataSourceCategory;

  // Monthly base cost (charged regardless of usage)
  baseMonthlyCost: number;

  // Per-unit costs
  perStudentCost: number;    // Cost per unique student synced
  perSyncCost: number;       // Cost per sync operation
  perRecordCost: number;     // Cost per record processed

  // Free tier limits (usage below these limits is free)
  freeStudentsLimit: number;
  freeSyncsLimit: number;
  freeRecordsLimit: number;

  // Tier-specific multipliers
  starterMultiplier: number;
  proMultiplier: number;
  enterpriseMultiplier: number;
}

/**
 * Default pricing configuration for all integrations
 */
export const INTEGRATION_PRICING: IntegrationPricingTier[] = [
  // SIS Integrations
  {
    integrationId: 'clever',
    name: 'Clever',
    category: 'sis',
    baseMonthlyCost: 25.00,
    perStudentCost: 0.05,
    perSyncCost: 0.00,  // Free syncs for SIS
    perRecordCost: 0.0001,
    freeStudentsLimit: 100,
    freeSyncsLimit: 30,
    freeRecordsLimit: 10000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },
  {
    integrationId: 'classlink',
    name: 'ClassLink',
    category: 'sis',
    baseMonthlyCost: 25.00,
    perStudentCost: 0.05,
    perSyncCost: 0.00,
    perRecordCost: 0.0001,
    freeStudentsLimit: 100,
    freeSyncsLimit: 30,
    freeRecordsLimit: 10000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },
  {
    integrationId: 'powerschool',
    name: 'PowerSchool',
    category: 'sis',
    baseMonthlyCost: 35.00,
    perStudentCost: 0.08,
    perSyncCost: 0.00,
    perRecordCost: 0.0002,
    freeStudentsLimit: 100,
    freeSyncsLimit: 30,
    freeRecordsLimit: 10000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },

  // Assessment Integrations
  {
    integrationId: 'nwea_map',
    name: 'NWEA MAP',
    category: 'assessment',
    baseMonthlyCost: 20.00,
    perStudentCost: 0.03,
    perSyncCost: 0.10,
    perRecordCost: 0.0001,
    freeStudentsLimit: 100,
    freeSyncsLimit: 10,
    freeRecordsLimit: 5000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },
  {
    integrationId: 'iready',
    name: 'iReady',
    category: 'assessment',
    baseMonthlyCost: 20.00,
    perStudentCost: 0.03,
    perSyncCost: 0.10,
    perRecordCost: 0.0001,
    freeStudentsLimit: 100,
    freeSyncsLimit: 10,
    freeRecordsLimit: 5000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },
  {
    integrationId: 'renaissance_star',
    name: 'Renaissance STAR',
    category: 'assessment',
    baseMonthlyCost: 20.00,
    perStudentCost: 0.03,
    perSyncCost: 0.10,
    perRecordCost: 0.0001,
    freeStudentsLimit: 100,
    freeSyncsLimit: 10,
    freeRecordsLimit: 5000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },

  // LMS Integrations
  {
    integrationId: 'canvas',
    name: 'Canvas LMS',
    category: 'lms',
    baseMonthlyCost: 30.00,
    perStudentCost: 0.04,
    perSyncCost: 0.05,
    perRecordCost: 0.0001,
    freeStudentsLimit: 50,
    freeSyncsLimit: 30,
    freeRecordsLimit: 10000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },
  {
    integrationId: 'google_classroom',
    name: 'Google Classroom',
    category: 'lms',
    baseMonthlyCost: 15.00,
    perStudentCost: 0.02,
    perSyncCost: 0.00,  // Google API is free-ish
    perRecordCost: 0.00005,
    freeStudentsLimit: 100,
    freeSyncsLimit: 60,
    freeRecordsLimit: 20000,
    starterMultiplier: 1.0,
    proMultiplier: 1.0,
    enterpriseMultiplier: 0.8,
  },
];

/**
 * Get pricing for a specific integration
 */
export function getIntegrationPricing(integrationId: string): IntegrationPricingTier | undefined {
  return INTEGRATION_PRICING.find((p) => p.integrationId === integrationId);
}

/**
 * Get pricing by category
 */
export function getPricingByCategory(category: DataSourceCategory): IntegrationPricingTier[] {
  return INTEGRATION_PRICING.filter((p) => p.category === category);
}

/**
 * Calculate estimated monthly cost
 */
export function calculateMonthlyCost(
  integrationId: string,
  students: number,
  syncsPerMonth: number,
  recordsPerSync: number,
  tier: 'starter' | 'pro' | 'enterprise' = 'starter'
): number {
  const pricing = getIntegrationPricing(integrationId);
  if (!pricing) return 0;

  const multiplier =
    tier === 'enterprise'
      ? pricing.enterpriseMultiplier
      : tier === 'pro'
        ? pricing.proMultiplier
        : pricing.starterMultiplier;

  const totalRecords = syncsPerMonth * recordsPerSync;

  const baseCost = pricing.baseMonthlyCost;
  const studentCost =
    pricing.perStudentCost * Math.max(0, students - pricing.freeStudentsLimit);
  const syncCost =
    pricing.perSyncCost * Math.max(0, syncsPerMonth - pricing.freeSyncsLimit);
  const recordCost =
    pricing.perRecordCost * Math.max(0, totalRecords - pricing.freeRecordsLimit);

  return (baseCost + studentCost + syncCost + recordCost) * multiplier;
}

/**
 * Get pricing summary for all integrations
 */
export function getAllPricingSummary(): Array<{
  id: string;
  name: string;
  category: DataSourceCategory;
  monthlyCost: string;
  perStudent: string;
  freeStudents: number;
}> {
  return INTEGRATION_PRICING.map((p) => ({
    id: p.integrationId,
    name: p.name,
    category: p.category,
    monthlyCost: `$${p.baseMonthlyCost.toFixed(2)}`,
    perStudent: `$${p.perStudentCost.toFixed(2)}`,
    freeStudents: p.freeStudentsLimit,
  }));
}

/**
 * Estimate cost for a school based on size
 */
export function estimateSchoolCost(
  integrationIds: string[],
  studentCount: number,
  tier: 'starter' | 'pro' | 'enterprise' = 'starter'
): {
  totalMonthlyCost: number;
  breakdown: Array<{ integrationId: string; name: string; cost: number }>;
} {
  const breakdown: Array<{ integrationId: string; name: string; cost: number }> = [];
  let totalMonthlyCost = 0;

  for (const integrationId of integrationIds) {
    const pricing = getIntegrationPricing(integrationId);
    if (!pricing) continue;

    // Assume daily syncs, ~100 records per student per sync for SIS
    const syncsPerMonth = pricing.category === 'sis' ? 30 : 10;
    const recordsPerSync = studentCount * (pricing.category === 'sis' ? 2 : 1);

    const cost = calculateMonthlyCost(
      integrationId,
      studentCount,
      syncsPerMonth,
      recordsPerSync,
      tier
    );

    breakdown.push({
      integrationId,
      name: pricing.name,
      cost,
    });

    totalMonthlyCost += cost;
  }

  return { totalMonthlyCost, breakdown };
}
