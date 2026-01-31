'use client';

import * as React from 'react';

/**
 * EduNode Theme Context
 *
 * Provides global white-labeling capabilities for multi-tenant SaaS.
 * Schools can customize their primary brand color during onboarding.
 * CSS variables are dynamically updated to reflect school branding.
 */

export type ThemeColor = 'indigo' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'amber';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themeName: ThemeColor;
}

interface SchoolConfig {
  name: string;
  slug: string;
  logoUrl?: string;
  assessmentCadence: 'weekly' | 'biweekly' | 'monthly';
  masteryThreshold: number;
  diagnosticWindowDays: number;
}

interface ThemeContextValue {
  theme: ThemeConfig;
  school: SchoolConfig;
  setTheme: (color: ThemeColor) => void;
  updateSchool: (config: Partial<SchoolConfig>) => void;
}

// Color presets for white-labeling
const COLOR_PRESETS: Record<ThemeColor, ThemeConfig> = {
  indigo: {
    primaryColor: '#6366f1',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    themeName: 'indigo',
  },
  cyan: {
    primaryColor: '#06b6d4',
    secondaryColor: '#6366f1',
    accentColor: '#10b981',
    themeName: 'cyan',
  },
  emerald: {
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    accentColor: '#6366f1',
    themeName: 'emerald',
  },
  violet: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    themeName: 'violet',
  },
  rose: {
    primaryColor: '#f43f5e',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    themeName: 'rose',
  },
  amber: {
    primaryColor: '#f59e0b',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    themeName: 'amber',
  },
};

const DEFAULT_THEME = COLOR_PRESETS.indigo;

const DEFAULT_SCHOOL: SchoolConfig = {
  name: 'EduNode Analytics',
  slug: 'demo',
  assessmentCadence: 'weekly',
  masteryThreshold: 80,
  diagnosticWindowDays: 21,
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme = 'indigo',
  initialSchool,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeColor;
  initialSchool?: Partial<SchoolConfig>;
}) {
  const [theme, setThemeState] = React.useState<ThemeConfig>(
    COLOR_PRESETS[initialTheme] || DEFAULT_THEME
  );
  const [school, setSchool] = React.useState<SchoolConfig>({
    ...DEFAULT_SCHOOL,
    ...initialSchool,
  });

  // Update CSS variables when theme changes
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--school-primary', theme.primaryColor);
    root.style.setProperty('--school-secondary', theme.secondaryColor);
    root.style.setProperty('--school-accent', theme.accentColor);

    // Update Tailwind classes dynamically
    root.setAttribute('data-theme', theme.themeName);
  }, [theme]);

  const setTheme = React.useCallback((color: ThemeColor) => {
    const newTheme = COLOR_PRESETS[color];
    if (newTheme) {
      setThemeState(newTheme);
      // Persist to localStorage for client-side persistence
      localStorage.setItem('edunode_theme', color);
    }
  }, []);

  const updateSchool = React.useCallback((config: Partial<SchoolConfig>) => {
    setSchool((prev) => ({ ...prev, ...config }));
  }, []);

  // Load persisted theme on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('edunode_theme') as ThemeColor | null;
    if (savedTheme && COLOR_PRESETS[savedTheme]) {
      setThemeState(COLOR_PRESETS[savedTheme]);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, school, setTheme, updateSchool }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get clinical data thresholds based on school config
 */
export function useClinicalThresholds() {
  const { school } = useTheme();

  return {
    // Mastery threshold for MTSS tier movement
    masteryThreshold: school.masteryThreshold,
    // Days before intervention data becomes "stale"
    diagnosticWindowDays: school.diagnosticWindowDays,
    // Attendance threshold for confounding analysis
    attendanceConfoundingThreshold: 90,
    // Growth percentile threshold for instructional gap detection
    lowGrowthThreshold: 55,
    // High attendance threshold for "pure instructional" analysis
    highAttendanceThreshold: 92,
  };
}

/**
 * Utility to determine if a student's data is "confounded" by attendance
 */
export function isConfoundedByAttendance(
  attendanceRate: number,
  growthPercentile: number,
  thresholds = {
    attendanceConfoundingThreshold: 90,
    lowGrowthThreshold: 55,
    highAttendanceThreshold: 92,
  }
): 'instructional_gap' | 'confounded' | 'on_track' {
  const { attendanceConfoundingThreshold, lowGrowthThreshold, highAttendanceThreshold } = thresholds;

  // High attendance but low growth = Pure instructional issue
  if (attendanceRate >= highAttendanceThreshold && growthPercentile < lowGrowthThreshold) {
    return 'instructional_gap';
  }

  // Low attendance and low growth = Confounded (can't attribute to instruction)
  if (attendanceRate < attendanceConfoundingThreshold && growthPercentile < lowGrowthThreshold) {
    return 'confounded';
  }

  // Otherwise on track or resilient
  return 'on_track';
}
