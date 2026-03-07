/**
 * Chart.js Configuration for EduNode Analytics
 *
 * Centralized chart theming to match the "Cyber Ocean" design system
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// EduNode color palette
export const EDUNODE_COLORS = {
  indigo: {
    500: '#6366f1',
    400: '#818cf8',
    300: '#a5b4fc',
  },
  cyan: {
    500: '#06b6d4',
    400: '#22d3ee',
    300: '#67e8f9',
  },
  emerald: {
    500: '#10b981',
    400: '#34d399',
    300: '#6ee7b7',
  },
  yellow: {
    500: '#eab308',
    400: '#facc15',
    300: '#fde047',
  },
  amber: {
    500: '#f59e0b',
    400: '#fbbf24',
  },
  orange: {
    500: '#f97316',
    400: '#fb923c',
  },
  red: {
    500: '#ef4444',
    400: '#f87171',
  },
  slate: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1',
    200: '#e2e8f0',
    100: '#f1f5f9',
  },
};

// Gradient creation helper
export function createGradient(
  ctx: CanvasRenderingContext2D,
  colorStart: string,
  colorEnd: string,
  vertical = true
): CanvasGradient {
  const gradient = vertical
    ? ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
    : ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);

  return gradient;
}

// Default chart options with EduNode theming
export const defaultChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        color: EDUNODE_COLORS.slate[400],
        font: {
          family: 'Plus Jakarta Sans, system-ui, sans-serif',
          size: 12,
        },
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: EDUNODE_COLORS.slate[800],
      titleColor: EDUNODE_COLORS.slate[100],
      bodyColor: EDUNODE_COLORS.slate[300],
      borderColor: EDUNODE_COLORS.slate[700],
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        family: 'Plus Jakarta Sans, system-ui, sans-serif',
        size: 13,
        weight: 'bold',
      },
      bodyFont: {
        family: 'Plus Jakarta Sans, system-ui, sans-serif',
        size: 12,
      },
      displayColors: true,
      boxPadding: 4,
    },
  },
  scales: {
    x: {
      grid: {
        color: EDUNODE_COLORS.slate[800],
      },
      ticks: {
        color: EDUNODE_COLORS.slate[500],
        font: {
          family: 'Plus Jakarta Sans, system-ui, sans-serif',
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: EDUNODE_COLORS.slate[800],
      },
      ticks: {
        color: EDUNODE_COLORS.slate[500],
        font: {
          family: 'Plus Jakarta Sans, system-ui, sans-serif',
          size: 11,
        },
      },
    },
  },
};

// Line chart specific options
export const lineChartOptions: ChartOptions<'line'> = {
  ...defaultChartOptions,
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2,
    },
    point: {
      radius: 0,
      hoverRadius: 6,
      hoverBorderWidth: 2,
    },
  },
};

// Bar chart specific options
export const barChartOptions: ChartOptions<'bar'> = {
  ...defaultChartOptions,
  plugins: {
    ...defaultChartOptions.plugins,
  },
} as ChartOptions<'bar'>;

// Donut/pie chart options
export const donutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: EDUNODE_COLORS.slate[400],
        font: {
          family: 'Plus Jakarta Sans, system-ui, sans-serif',
          size: 12,
        },
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: EDUNODE_COLORS.slate[800],
      titleColor: EDUNODE_COLORS.slate[100],
      bodyColor: EDUNODE_COLORS.slate[300],
      borderColor: EDUNODE_COLORS.slate[700],
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  cutout: '70%',
};

// Dataset presets
export const datasetPresets = {
  attendance: {
    borderColor: EDUNODE_COLORS.cyan[500],
    backgroundColor: `${EDUNODE_COLORS.cyan[500]}20`,
    fill: true,
  },
  enrollment: {
    borderColor: EDUNODE_COLORS.indigo[500],
    backgroundColor: `${EDUNODE_COLORS.indigo[500]}20`,
    fill: true,
  },
  academic: {
    borderColor: EDUNODE_COLORS.emerald[500],
    backgroundColor: `${EDUNODE_COLORS.emerald[500]}20`,
    fill: true,
  },
  warning: {
    borderColor: EDUNODE_COLORS.amber[500],
    backgroundColor: `${EDUNODE_COLORS.amber[500]}20`,
    fill: true,
  },
  critical: {
    borderColor: EDUNODE_COLORS.red[500],
    backgroundColor: `${EDUNODE_COLORS.red[500]}20`,
    fill: true,
  },
};
