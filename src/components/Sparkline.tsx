
import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface SparklineProps {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
  fillGradient?: [string, string];
  showTooltip?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = "#8884d8",
  height = 60,
  fillGradient,
  showTooltip = true
}) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-muted-foreground">No data available</div>;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-sm text-xs">
          <p className="font-medium">{`${payload[0].payload.name}`}</p>
          <p className="text-primary">{`Value: ${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 0, 0, 0.1)' }} />}
        <defs>
          {fillGradient && (
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillGradient[0]} />
              <stop offset="100%" stopColor={fillGradient[1]} />
            </linearGradient>
          )}
        </defs>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: color, strokeWidth: 1 }}
          fill={fillGradient ? "url(#sparkline-gradient)" : "none"}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Sparkline;
