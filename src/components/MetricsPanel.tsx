
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProcessedData } from '@/types/data';
import {
  LineChart,
  Clock,
  Calendar,
  User,
  Percent,
  DollarSign,
  Activity,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  BarChart,
} from 'lucide-react';
import CountUp from 'react-countup';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const formatIndianCurrency = (value: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
};

interface MetricsPanelProps {
  data: ProcessedData[];
}

const generateSparklineData = (data: ProcessedData[], field: keyof ProcessedData, periods: number = 10): number[] => {
  // Group data by period
  const periodData = data.reduce((acc: Record<string, number>, item) => {
    const period = item.period || 'Unknown';
    if (!acc[period]) acc[period] = 0;
    const value = typeof item[field] === 'number' ? item[field] as number : 
                  typeof item[field] === 'string' ? parseFloat(item[field] as string) || 0 : 0;
    acc[period] += value;
    return acc;
  }, {});

  // Sort periods chronologically and take the last `periods` number
  const sortedPeriods = Object.keys(periodData).sort();
  const recentPeriods = sortedPeriods.slice(-periods);

  // Return the values for the recent periods
  return recentPeriods.map(period => periodData[period]);
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const [showCountUp, setShowCountUp] = useState(false);

  useEffect(() => {
    // Trigger CountUp after component mounts
    setShowCountUp(true);
  }, []);

  const metrics = useMemo(() => {
    if (!data.length) return [];

    const totalClasses = data.reduce((sum, item) => sum + item.totalOccurrences, 0);
    const totalCheckins = data.reduce((sum, item) => sum + item.totalCheckins, 0);
    const totalRevenue = data.reduce((sum, item) => {
      const revenue = typeof item.totalRevenue === 'string' ? parseFloat(item.totalRevenue) : item.totalRevenue;
      return sum + (revenue || 0);
    }, 0);
    const totalCancelled = data.reduce((sum, item) => sum + item.totalCancelled, 0);
    const totalTime = data.reduce((sum, item) => sum + item.totalTime, 0);

    const totalNonEmpty = data.reduce((sum, item) => sum + item.totalNonEmpty, 0);
    const averageClassSize = totalClasses > 0 ? totalCheckins / totalClasses : 0;
    const averageRevenue = totalClasses > 0 ? totalRevenue / totalClasses : 0;
    const cancellationRate = totalCheckins + totalCancelled > 0 ? (totalCancelled / (totalCheckins + totalCancelled)) * 100 : 0;
    
    const uniqueTeachers = new Set(data.map(item => item.teacherName)).size;
    const uniqueClasses = new Set(data.map(item => item.cleanedClass)).size;
    const uniqueLocations = new Set(data.map(item => item.location)).size;

    return [
      {
        title: 'Total Classes',
        value: totalClasses,
        icon: Calendar,
        color: 'bg-blue-500',
        textColor: 'text-blue-500',
        sparkData: generateSparklineData(data, 'totalOccurrences')
      },
      {
        title: 'Total Check-ins',
        value: totalCheckins,
        icon: CheckCircle2,
        color: 'bg-green-500',
        textColor: 'text-green-500',
        sparkData: generateSparklineData(data, 'totalCheckins')
      },
      {
        title: 'Total Revenue',
        value: formatIndianCurrency(totalRevenue),
        icon: DollarSign,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        sparkData: generateSparklineData(data, 'totalRevenue')
      },
      {
        title: 'Avg. Class Size',
        value: averageClassSize.toFixed(1),
        icon: Users,
        color: 'bg-violet-500',
        textColor: 'text-violet-500',
        sparkData: []
      },
      {
        title: 'Cancellations',
        value: totalCancelled,
        icon: XCircle,
        color: 'bg-red-500',
        textColor: 'text-red-500',
        sparkData: generateSparklineData(data, 'totalCancelled')
      },
      {
        title: 'Cancellation Rate',
        value: `${cancellationRate.toFixed(1)}%`,
        icon: Percent,
        color: 'bg-orange-500',
        textColor: 'text-orange-500',
        sparkData: []
      },
      {
        title: 'Revenue Per Class',
        value: formatIndianCurrency(averageRevenue),
        icon: BarChart,
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        sparkData: []
      },
      {
        title: 'Total Hours',
        value: totalTime.toFixed(0),
        icon: Clock,
        color: 'bg-cyan-500',
        textColor: 'text-cyan-500',
        sparkData: generateSparklineData(data, 'totalTime')
      },
      {
        title: 'Unique Classes',
        value: uniqueClasses,
        icon: Activity,
        color: 'bg-fuchsia-500',
        textColor: 'text-fuchsia-500',
        sparkData: []
      },
      {
        title: 'Unique Trainers',
        value: uniqueTeachers,
        icon: User,
        color: 'bg-pink-500',
        textColor: 'text-pink-500',
        sparkData: []
      },
      {
        title: 'Locations',
        value: uniqueLocations,
        icon: BarChart3,
        color: 'bg-yellow-500',
        textColor: 'text-yellow-500',
        sparkData: []
      },
      {
        title: 'Class Attendance',
        value: `${(totalCheckins * 100 / (totalClasses * 10)).toFixed(1)}%`,
        icon: LineChart,
        color: 'bg-teal-500', 
        textColor: 'text-teal-500',
        sparkData: []
      }
    ];
  }, [data]);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card className="h-24 border shadow-sm overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-2 h-full flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[0.65rem] font-semibold text-muted-foreground truncate">{metric.title}</p>
                  <metric.icon className={cn("h-3 w-3", metric.textColor)} />
                </div>
                <div className="mt-0.5 text-base font-semibold">
                  {typeof metric.value === 'number' ? (
                    showCountUp ? (
                      <CountUp 
                        end={metric.value} 
                        decimals={metric.title.includes('Avg') || metric.title.includes('Rate') ? 1 : 0}
                      />
                    ) : 0
                  ) : (
                    metric.value
                  )}
                </div>
                <div className="mt-auto h-7">
                  {metric.sparkData && metric.sparkData.length > 1 && (
                    <Sparklines data={metric.sparkData} height={20} margin={0}>
                      <SparklinesLine 
                        color={metric.color.replace('bg-', '')} 
                        style={{ strokeWidth: 1.5, fill: "none" }} 
                      />
                      <SparklinesSpots size={1} style={{ stroke: metric.color.replace('bg-', '') }} />
                    </Sparklines>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MetricsPanel;
