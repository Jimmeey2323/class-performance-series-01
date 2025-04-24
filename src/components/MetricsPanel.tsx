
import React from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkline, SparklineProps } from './Sparkline';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  IndianRupee,
  Flame,
  TrendingUp,
  BadgeCheck,
  BadgeMinus
} from 'lucide-react';
import CountUp from 'react-countup';

interface MetricsPanelProps {
  data: ProcessedData[];
}

interface SparklineData {
  name: string;
  value: number;
}

export const formatIndianCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  // Calculate period-based metrics for sparklines
  const periodMetrics = React.useMemo(() => {
    if (!data.length) return {};
    
    // Get unique periods sorted chronologically
    const periods = Array.from(new Set(data.map(item => item.period)))
      .filter(Boolean)
      .sort();
    
    // Initialize metrics by period
    const metrics: Record<string, Record<string, number>> = {};
    
    periods.forEach(period => {
      metrics[period] = {
        totalCheckins: 0,
        totalRevenue: 0,
        totalOccurrences: 0,
        totalCancelled: 0
      };
    });
    
    // Aggregate metrics by period
    data.forEach(item => {
      const period = item.period;
      if (period && metrics[period]) {
        metrics[period].totalCheckins += Number(item.totalCheckins) || 0;
        metrics[period].totalRevenue += Number(item.totalRevenue) || 0;
        metrics[period].totalOccurrences += Number(item.totalOccurrences) || 0;
        metrics[period].totalCancelled += Number(item.totalCancelled) || 0;
      }
    });
    
    // Convert to arrays for sparklines
    const sparklineData: Record<string, SparklineData[]> = {
      checkins: [],
      revenue: [],
      classes: [],
      cancelled: []
    };
    
    periods.forEach(period => {
      sparklineData.checkins.push({ name: period, value: metrics[period].totalCheckins });
      sparklineData.revenue.push({ name: period, value: metrics[period].totalRevenue });
      sparklineData.classes.push({ name: period, value: metrics[period].totalOccurrences });
      sparklineData.cancelled.push({ name: period, value: metrics[period].totalCancelled });
    });
    
    return sparklineData;
  }, [data]);

  // Calculate overall metrics
  const totalCheckins = React.useMemo(() => {
    return data.reduce((sum, item) => sum + (Number(item.totalCheckins) || 0), 0);
  }, [data]);
  
  const totalRevenue = React.useMemo(() => {
    return data.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);
  }, [data]);
  
  const totalClasses = React.useMemo(() => {
    return data.reduce((sum, item) => sum + (Number(item.totalOccurrences) || 0), 0);
  }, [data]);
  
  const totalCancellations = React.useMemo(() => {
    return data.reduce((sum, item) => sum + (Number(item.totalCancelled) || 0), 0);
  }, [data]);
  
  const averageClassSize = React.useMemo(() => {
    if (totalClasses === 0) return 0;
    return Math.round((totalCheckins / totalClasses) * 10) / 10;
  }, [totalCheckins, totalClasses]);
  
  const occupancyRate = React.useMemo(() => {
    // Assuming an average capacity of 12 students per class
    const avgCapacity = 12;
    if (totalClasses === 0) return 0;
    return Math.round((totalCheckins / (totalClasses * avgCapacity)) * 100);
  }, [totalCheckins, totalClasses]);
  
  const cancellationRate = React.useMemo(() => {
    if (totalClasses === 0) return 0;
    return Math.round((totalCancellations / totalClasses) * 100);
  }, [totalCancellations, totalClasses]);
  
  const averageRevenuePerClass = React.useMemo(() => {
    if (totalClasses === 0) return 0;
    return totalRevenue / totalClasses;
  }, [totalRevenue, totalClasses]);

  const revenuePerClient = React.useMemo(() => {
    if (totalCheckins === 0) return 0;
    return totalRevenue / totalCheckins;
  }, [totalRevenue, totalCheckins]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Check-ins */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Total Check-ins</p>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                <CountUp end={totalCheckins} />
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                <span className="font-medium">{averageClassSize}</span> per class
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          {periodMetrics.checkins && periodMetrics.checkins.length > 0 && (
            <div className="mt-3 h-16">
              <Sparkline 
                data={periodMetrics.checkins} 
                color="#8b5cf6" 
                fillGradient={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.01)']} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Revenue</p>
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {formatIndianCurrency(totalRevenue)}
              </h3>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                <span className="font-medium">{formatIndianCurrency(averageRevenuePerClass)}</span> per class
              </p>
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          {periodMetrics.revenue && periodMetrics.revenue.length > 0 && (
            <div className="mt-3 h-16">
              <Sparkline 
                data={periodMetrics.revenue} 
                color="#10b981" 
                fillGradient={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.01)']} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Classes */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Classes</p>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                <CountUp end={totalClasses} />
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                <span className="font-medium">{occupancyRate}%</span> occupancy rate
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {periodMetrics.classes && periodMetrics.classes.length > 0 && (
            <div className="mt-3 h-16">
              <Sparkline 
                data={periodMetrics.classes} 
                color="#3b82f6" 
                fillGradient={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.01)']} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Cancellations */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Cancellations</p>
              <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                <CountUp end={totalCancellations} />
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                <span className="font-medium">{cancellationRate}%</span> of total classes
              </p>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <BadgeMinus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          {periodMetrics.cancelled && periodMetrics.cancelled.length > 0 && (
            <div className="mt-3 h-16">
              <Sparkline 
                data={periodMetrics.cancelled} 
                color="#f59e0b" 
                fillGradient={['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.01)']} 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsPanel;
