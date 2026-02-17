/**
 * White-Label Configuration System
 * =================================
 *
 * Enterprise-tier feature for complete platform customization.
 * Schools can replace EduNode branding with their own identity.
 *
 * Features:
 * - Custom logo (sidebar, login, reports)
 * - Brand colors (primary, secondary, accent)
 * - Custom domain support
 * - Email templates with school branding
 * - Report headers/footers
 */

export interface WhiteLabelConfig {
  // Identity
  schoolName: string;
  schoolSlug: string;
  tagline?: string;

  // Logos
  logoUrl?: string;
  logoMarkUrl?: string; // Square icon version
  faviconUrl?: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Advanced theming
  darkMode?: {
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
  };

  // Custom domain
  customDomain?: string;
  customDomainVerified?: boolean;

  // Email branding
  emailFromName?: string;
  emailFromAddress?: string;
  emailFooterHtml?: string;

  // Report branding
  reportHeaderHtml?: string;
  reportFooterHtml?: string;
  reportLogoUrl?: string;

  // Feature flags
  hidePoweredByEduNode?: boolean;
  customLoginMessage?: string;
}

// Default EduNode branding
export const DEFAULT_BRANDING: WhiteLabelConfig = {
  schoolName: 'EduNode Analytics',
  schoolSlug: 'edunode',
  tagline: 'Purpose-Driven Intelligence for Charter Schools',
  primaryColor: '#6366f1',
  secondaryColor: '#06b6d4',
  accentColor: '#10b981',
  hidePoweredByEduNode: false,
};

// Demo white-label configs for different schools
export const WHITELABEL_CONFIGS: Record<string, Partial<WhiteLabelConfig>> = {
  'academy-tomorrow': {
    schoolName: 'Academy of Tomorrow',
    tagline: 'Preparing Leaders for Tomorrow',
    primaryColor: '#6366f1',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    hidePoweredByEduNode: true, // Enterprise feature
    customLoginMessage: 'Welcome back, Academy family!',
  },
  'innovation-prep': {
    schoolName: 'Innovation Prep Academy',
    tagline: 'Innovation Through Education',
    primaryColor: '#8b5cf6',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    hidePoweredByEduNode: false, // Starter tier
  },
  'stem-scholars': {
    schoolName: 'STEM Scholars Charter',
    tagline: 'Science. Technology. Excellence.',
    primaryColor: '#0ea5e9',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    hidePoweredByEduNode: false, // Pro tier
  },
};

/**
 * Get white-label config for a school
 */
export function getWhiteLabelConfig(schoolSlug: string): WhiteLabelConfig {
  const schoolConfig = WHITELABEL_CONFIGS[schoolSlug];

  if (!schoolConfig) {
    return {
      ...DEFAULT_BRANDING,
      schoolSlug,
      schoolName: schoolSlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    };
  }

  return {
    ...DEFAULT_BRANDING,
    ...schoolConfig,
    schoolSlug,
  };
}

/**
 * Generate CSS variables from white-label config
 */
export function generateCSSVariables(config: WhiteLabelConfig): Record<string, string> {
  return {
    '--brand-primary': config.primaryColor,
    '--brand-secondary': config.secondaryColor,
    '--brand-accent': config.accentColor,
    '--brand-primary-rgb': hexToRgb(config.primaryColor),
    '--brand-secondary-rgb': hexToRgb(config.secondaryColor),
    '--brand-accent-rgb': hexToRgb(config.accentColor),
  };
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '99, 102, 241'; // Default indigo

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * Check if a school can use white-label features
 */
export function canUseWhiteLabel(subscriptionTier: 'starter' | 'pro' | 'enterprise'): boolean {
  return subscriptionTier === 'enterprise';
}

/**
 * Get the display name for branding
 */
export function getBrandingDisplayName(
  config: WhiteLabelConfig,
  showPoweredBy: boolean = true
): { primary: string; secondary?: string } {
  if (config.hidePoweredByEduNode) {
    return { primary: config.schoolName };
  }

  if (showPoweredBy) {
    return {
      primary: config.schoolName,
      secondary: 'Powered by EduNode',
    };
  }

  return { primary: config.schoolName };
}
