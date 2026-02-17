'use client';

import * as React from 'react';
import {
  getWhiteLabelConfig,
  generateCSSVariables,
  canUseWhiteLabel,
  type WhiteLabelConfig,
} from '@/lib/branding/white-label';

interface WhiteLabelContextValue {
  config: WhiteLabelConfig;
  isWhiteLabelEnabled: boolean;
  updateConfig: (updates: Partial<WhiteLabelConfig>) => void;
}

const WhiteLabelContext = React.createContext<WhiteLabelContextValue | null>(null);

interface WhiteLabelProviderProps {
  children: React.ReactNode;
  schoolSlug: string;
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
}

export function WhiteLabelProvider({
  children,
  schoolSlug,
  subscriptionTier,
}: WhiteLabelProviderProps) {
  const [config, setConfig] = React.useState<WhiteLabelConfig>(() =>
    getWhiteLabelConfig(schoolSlug)
  );

  const isWhiteLabelEnabled = canUseWhiteLabel(subscriptionTier);

  // Apply CSS variables when config changes
  React.useEffect(() => {
    const cssVars = generateCSSVariables(config);
    const root = document.documentElement;

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update document title
    document.title = `${config.schoolName} | EduNode Analytics`;

    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', config.primaryColor);
    }
  }, [config]);

  const updateConfig = React.useCallback((updates: Partial<WhiteLabelConfig>) => {
    if (!isWhiteLabelEnabled) {
      console.warn('White-label customization requires Enterprise tier');
      return;
    }
    setConfig((prev) => ({ ...prev, ...updates }));
  }, [isWhiteLabelEnabled]);

  return (
    <WhiteLabelContext.Provider value={{ config, isWhiteLabelEnabled, updateConfig }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const context = React.useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
}

/**
 * Component that displays school logo or fallback
 */
export function SchoolLogo({
  size = 'md',
  showText = true,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}) {
  const { config } = useWhiteLabel();

  const sizes = {
    sm: { logo: 'w-6 h-6', text: 'text-sm' },
    md: { logo: 'w-8 h-8', text: 'text-base' },
    lg: { logo: 'w-12 h-12', text: 'text-xl' },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {config.logoMarkUrl ? (
        <img
          src={config.logoMarkUrl}
          alt={config.schoolName}
          className={`${sizeConfig.logo} rounded-lg object-contain`}
        />
      ) : (
        <div
          className={`${sizeConfig.logo} rounded-lg flex items-center justify-center font-bold text-white`}
          style={{ backgroundColor: config.primaryColor }}
        >
          {config.schoolName.charAt(0)}
        </div>
      )}
      {showText && (
        <span className={`font-bold text-white ${sizeConfig.text}`}>
          {config.schoolName}
        </span>
      )}
    </div>
  );
}

/**
 * "Powered by EduNode" badge (hidden for Enterprise with white-label)
 */
export function PoweredByBadge({ className = '' }: { className?: string }) {
  const { config, isWhiteLabelEnabled } = useWhiteLabel();

  if (isWhiteLabelEnabled && config.hidePoweredByEduNode) {
    return null;
  }

  return (
    <div className={`text-xs text-slate-500 ${className}`}>
      Powered by{' '}
      <span className="font-semibold text-indigo-400">EduNode</span>
    </div>
  );
}
