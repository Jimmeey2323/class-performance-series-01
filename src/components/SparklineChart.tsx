
import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ProcessedData } from '@/types/data';

interface SparklineChartProps {
  data: ProcessedData[];
  dataKey: keyof ProcessedData;
  groupBy?: 'period' | 'date' | 'dayOfWeek';
  height?: number;
  color?: string;
  showTooltip?: boolean;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  dataKey,
  groupBy = 'period',
  height = 50,
  color = '#8884d8',
  showTooltip = false,
}) => {
  // Group and aggregate data
  const chartData = React.useMemo(() => {
    if (!data.length) return [];
    
    const groupedData: Record<string, { name: string, value: number }> = {};
    
    // Sort data first by the groupBy field to ensure chronological order
    const sortedData = [...data].sort((a, b) => {
      const aValue = String(a[groupBy] || '');
      const bValue = String(b[groupBy] || '');
      return aValue.localeCompare(bValue);
    });
    
    sortedData.forEach(item => {
      const key = String(item[groupBy] || 'Unknown');
      const value = Number(item[dataKey]) || 0;
      
      if (!groupedData[key]) {
        groupedData[key] = { name: key, value: 0 };
      }
      
      groupedData[key].value += value;
    });
    
    return Object.values(groupedData);
  }, [data, dataKey, groupBy]);

  if (chartData.length <= 1) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400">
        Not enough data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
        {showTooltip && (
          <Tooltip
            formatter={(value: number) => [`${value}`, dataKey as string]}
            labelFormatter={(label) => `${label}`}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SparklineChart;
