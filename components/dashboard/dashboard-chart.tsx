"use client"

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface DashboardChartProps {
  data: ChartData[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Get colors from the CSS variables
  const getChartColors = () => {
    if (typeof window === 'undefined') {
      return ['#ef4444', '#f97316', '#10b981', '#06b6d4', '#8b5cf6'];
    }
    
    const colors = [
      getComputedStyle(document.documentElement).getPropertyValue('--chart-1').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--chart-2').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--chart-3').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--chart-4').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--chart-5').trim(),
    ];
    
    return colors.map(color => {
      // Convert hsl variables to actual color values
      if (color.startsWith('hsl')) {
        return color;
      }
      return `hsl(${color})`;
    });
  };
  
  const chartColors = getChartColors();
  
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          />
          <XAxis 
            dataKey="name" 
            tick={{ fill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              color: isDark ? 'white' : 'black',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}