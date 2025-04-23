import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIndianCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TimelineViewProps {
  data: ProcessedData[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const chartData = useMemo(() => {
    const classNames = [...new Set(data.map(item => item.cleanedClass))];
    const labels = [...new Set(data.map(item => item.date))].sort();

    const datasets = classNames.map(className => {
      const classData = data.filter(item => item.cleanedClass === className);
      const dataPoints = labels.map(date => {
        const dayData = classData.find(item => item.date === date);
        return dayData ? Number(dayData.classAverageIncludingEmpty) : 0;
      });

      return {
        label: className,
        data: dataPoints,
        borderColor: '#' + Math.floor(Math.random()*16777215).toString(16),
        backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16),
      };
    });

    return {
      labels,
      datasets,
    };
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Class Attendance Over Time',
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {chartType === 'line' ? (
          <Line options={options} data={chartData as any} />
        ) : (
          <Bar options={options} data={chartData as any} />
        )}
        <div className="mt-4">
          <button onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}>
            Toggle Chart Type
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineView;
