'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { MATURITY_MODEL } from '@/lib/data/strategic-taxonomy';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface MaturityRadarChartProps {
  showTypical?: boolean;
  showStrategic?: boolean;
  customScores?: number[];
  customLabel?: string;
  height?: number;
}

export function MaturityRadarChart({
  showTypical = true,
  showStrategic = true,
  customScores,
  customLabel = 'Your School',
  height = 350,
}: MaturityRadarChartProps) {
  const chartRef = useRef<ChartJS<'radar'>>(null);

  const datasets: ChartData<'radar'>['datasets'] = [];

  if (showTypical) {
    datasets.push({
      label: 'Typical School',
      data: MATURITY_MODEL.typicalSchool,
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      borderColor: '#4F46E5',
      pointBackgroundColor: '#4F46E5',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#4F46E5',
      borderWidth: 2,
    });
  }

  if (showStrategic) {
    datasets.push({
      label: 'Strategic Solution',
      data: MATURITY_MODEL.strategicSolution,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: '#10B981',
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#10B981',
      borderWidth: 2,
    });
  }

  if (customScores) {
    datasets.push({
      label: customLabel,
      data: customScores,
      backgroundColor: 'rgba(244, 63, 94, 0.2)',
      borderColor: '#F43F5E',
      pointBackgroundColor: '#F43F5E',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#F43F5E',
      borderWidth: 2,
    });
  }

  const data: ChartData<'radar'> = {
    labels: MATURITY_MODEL.labels,
    datasets,
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(148, 163, 184, 0.2)',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 500,
          },
          color: '#475569',
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          display: false,
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
          },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#E2E8F0',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}%`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full">
      <Radar ref={chartRef} data={data} options={options} />
    </div>
  );
}

export default MaturityRadarChart;
