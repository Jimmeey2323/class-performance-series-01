
import React, { useMemo } from 'react';
import { ProcessedData, MetricData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  IndianRupee, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Tag, 
  BarChart, 
  Divide 
} from 'lucide-react';

interface MetricsPanelProps {
  data: ProcessedData[];
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const metrics = useMemo<MetricData[]>(() => {
    if (!data.length) return [];
    
    // Calculate totals
    const totalClasses = data.reduce((sum, item) => sum + item.totalOccurrences, 0);
    const totalCheckins = data.reduce((sum, item) => sum + item.totalCheckins, 0);
    const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.totalRevenue), 0);
    const totalTime = data.reduce((sum, item) => sum + parseFloat(item.totalTime), 0);
    const nonPaidCustomers = data.reduce((sum, item) => sum + item.totalNonPaid, 0);
    const totalCancelled = data.reduce((sum, item) => sum + item.totalCancelled, 0);
    const totalEmptyClasses = data.reduce((sum, item) => sum + item.totalEmpty, 0);
    
    // Calculate averages
    const avgAttendance = totalClasses > 0 ? (totalCheckins / totalClasses).toFixed(1) : '0';
    const revenuePerClass = totalClasses > 0 ? (totalRevenue / totalClasses).toFixed(2) : '0';
    const avgUtilization = totalClasses > 0 ? ((totalClasses - totalEmptyClasses) / totalClasses * 100).toFixed(1) : '0';
    
    // Get unique values
    const uniqueClassTypes = new Set(data.map(item => item.cleanedClass)).size;
    const uniqueInstructors = new Set(data.map(item => item.teacherName)).size;
    
    return [
      {
        title: 'Total Classes',
        value: totalClasses,
        icon: <Calendar className="h-6 w-6 text-blue-500" />,
        color: 'bg-blue-50 dark:bg-blue-950'
      },
      {
        title: 'Total Check-ins',
        value: totalCheckins,
        icon: <CheckSquare className="h-6 w-6 text-green-500" />,
        color: 'bg-green-50 dark:bg-green-950'
      },
      {
        title: 'Revenue',
        value: `₹${totalRevenue.toLocaleString('en-IN')}`,
        icon: <IndianRupee className="h-6 w-6 text-amber-500" />,
        color: 'bg-amber-50 dark:bg-amber-950'
      },
      {
        title: 'Revenue Per Class',
        value: `₹${parseFloat(revenuePerClass).toLocaleString('en-IN')}`,
        icon: <Tag className="h-6 w-6 text-purple-500" />,
        color: 'bg-purple-50 dark:bg-purple-950'
      },
      {
        title: 'Average Attendance',
        value: avgAttendance,
        icon: <Users className="h-6 w-6 text-indigo-500" />,
        color: 'bg-indigo-50 dark:bg-indigo-950'
      },
      {
        title: 'Utilization Rate',
        value: `${avgUtilization}%`,
        icon: <BarChart className="h-6 w-6 text-pink-500" />,
        color: 'bg-pink-50 dark:bg-pink-950'
      },
      {
        title: 'Cancelled Classes',
        value: totalCancelled,
        icon: <Divide className="h-6 w-6 text-orange-500" />,
        color: 'bg-orange-50 dark:bg-orange-950'
      },
      {
        title: 'Total Hours',
        value: totalTime.toFixed(1),
        icon: <Clock className="h-6 w-6 text-red-500" />,
        color: 'bg-red-50 dark:bg-red-950'
      }
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="overflow-hidden border shadow-sm">
          <CardContent className={`p-6 ${metric.color}`}>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">{metric.title}</span>
                {metric.icon}
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <div className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsPanel;
