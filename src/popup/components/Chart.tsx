/**
 * 图表组件 - 使用 Chart.js 实现
 */

import React, { useEffect, useRef } from 'react';
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
} from 'chart.js';
import { Chart as ChartJSInstance } from 'chart.js';

// 注册 Chart.js 组件
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

interface ChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
    }[];
  };
  options?: any;
  height?: number;
}

export const Chart: React.FC<ChartProps> = ({ type, data, options = {}, height = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJSInstance | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 销毁旧图表
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // 创建新图表
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          enabled: true,
        },
      },
    };

    chartRef.current = new ChartJSInstance(ctx, {
      type,
      data,
      options: {
        ...defaultOptions,
        ...options,
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

// 线形图组件
interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      tension?: number;
    }[];
  };
  options?: any;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, options, height }) => {
  return <Chart type="line" data={data} options={options} height={height} />;
};

// 柱状图组件
interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  options?: any;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, options, height }) => {
  return <Chart type="bar" data={data} options={options} height={height} />;
};

// 饼图组件
interface PieChartProps {
  data: {
    labels: string[];
    datasets: {
      label?: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  options?: any;
  height?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, options, height }) => {
  return <Chart type="pie" data={data} options={options} height={height} />;
};

// 环形图组件
interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: {
      label?: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  options?: any;
  height?: number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, options, height }) => {
  return <Chart type="doughnut" data={data} options={options} height={height} />;
};

// 图表颜色预设
export const CHART_COLORS = {
  primary: 'rgb(59, 130, 246)',
  danger: 'rgb(239, 68, 68)',
  warning: 'rgb(245, 158, 11)',
  success: 'rgb(34, 197, 94)',
  info: 'rgb(14, 165, 233)',
  purple: 'rgb(168, 85, 247)',
  pink: 'rgb(236, 72, 153)',
  gray: 'rgb(107, 114, 128)',
};

export const CHART_COLORS_ALPHA = {
  primary: 'rgba(59, 130, 246, 0.2)',
  danger: 'rgba(239, 68, 68, 0.2)',
  warning: 'rgba(245, 158, 11, 0.2)',
  success: 'rgba(34, 197, 94, 0.2)',
  info: 'rgba(14, 165, 233, 0.2)',
  purple: 'rgba(168, 85, 247, 0.2)',
  pink: 'rgba(236, 72, 153, 0.2)',
  gray: 'rgba(107, 114, 128, 0.2)',
};
