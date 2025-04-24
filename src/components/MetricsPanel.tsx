
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowUp, 
  ArrowDown, 
  Users, 
  Calendar,
  CreditCard, 
  BarChart, 
  Clock,
  CalendarDays,
  CalendarCheck,
  CalendarX
} from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import SparklineChart from './SparklineChart';

interface MetricsPanelProps {
  data: ProcessedData[];
}

export const formatIndianCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPercentage = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Define background colors for metric cards
const bgColors = [
  'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
  'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
  'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
  'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
  'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
  'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20',
];

// Define border colors for metric cards
const borderColors = [
  'border-blue-200 dark:border-blue-800',
  'border-purple-200 dark:border-purple-800',
  'border-green-200 dark:border-green-800',
  'border-amber-200 dark:border-amber-800',
  'border-red-200 dark:border-red-800',
  'border-teal-200 dark:border-teal-800',
];

// Define chart colors for sparklines
const chartColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
];

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '6m' | '3m' | '1m'>('all');
  
  const filteredData = React.useMemo(() => {
    if (selectedPeriod === 'all' || data.length === 0) return data;
    
    // Sort by period
    const sortedData = [...data].sort((a, b) => {
      const periodA = a.period || '';
      const periodB = b.period || '';
      return periodA.localeCompare(periodB);
    });
    
    // Get unique periods
    const uniquePeriods = Array.from(new Set(sortedData.map(item => item.period))).filter(Boolean);
    const numPeriods = uniquePeriods.length;
    
    // Determine how many periods to include based on selection
    const periodsToInclude = selectedPeriod === '1m' ? 1 : selectedPeriod === '3m' ? 3 : 6;
    const includedPeriods = uniquePeriods.slice(-Math.min(periodsToInclude, numPeriods));
    
    return sortedData.filter(item => includedPeriods.includes(item.period));
  }, [data, selectedPeriod]);
  
  // Calculate metrics
  const metrics = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalClasses: 0,
        totalCheckins: 0,
        averageAttendance: 0,
        totalRevenue: 0,
        totalCancellations: 0,
        averageFillRate: 0,
        classesRunPercentage: 0,
        uniqueTeachers: 0,
        uniqueClassTypes: 0,
        nonEmptyClassesPercentage: 0
      };
    }
    
    // For trend calculation, we need the previous period's data
    const periods = Array.from(new Set(data.map(item => item.period))).filter(Boolean).sort();
    const currentPeriodData = filteredData;
    
    // If we have multiple periods, get the previous period for comparison
    let previousPeriodsData: ProcessedData[] = [];
    if (periods.length > 1) {
      const currentPeriods = Array.from(new Set(filteredData.map(item => item.period))).filter(Boolean);
      const prevPeriodsCount = currentPeriods.length;
      const prevPeriods = periods.slice(-prevPeriodsCount * 2, -prevPeriodsCount);
      previousPeriodsData = data.filter(item => prevPeriods.includes(item.period));
    }
    
    // Calculate current metrics
    const totalClasses = currentPeriodData.reduce((sum, item) => sum + Number(item.totalOccurrences || 0), 0);
    const totalCheckins = currentPeriodData.reduce((sum, item) => sum + Number(item.totalCheckins || 0), 0);
    const totalRevenue = currentPeriodData.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
    const totalCancellations = currentPeriodData.reduce((sum, item) => sum + Number(item.totalCancelled || 0), 0);
    
    const nonEmptyClasses = currentPeriodData.reduce((sum, item) => sum + Number(item.totalNonEmpty || 0), 0);
    const emptyClasses = currentPeriodData.reduce((sum, item) => sum + Number(item.totalEmpty || 0), 0);
    
    // Calculate averages and percentages
    const averageAttendance = totalClasses > 0 ? totalCheckins / totalClasses : 0;
    const averageFillRate = (nonEmptyClasses > 0 ? totalCheckins / nonEmptyClasses : 0) / 15 * 100; // Assuming max class size is 15
    const classesRunPercentage = totalClasses > 0 ? (nonEmptyClasses / totalClasses) * 100 : 0;
    const nonEmptyClassesPercentage = totalClasses > 0 ? (nonEmptyClasses / totalClasses) * 100 : 0;
    
    // Unique teachers and class types
    const uniqueTeachers = new Set(currentPeriodData.map(item => item.teacherName)).size;
    const uniqueClassTypes = new Set(currentPeriodData.map(item => item.cleanedClass)).size;
    
    // Calculate trends by comparing with previous period
    let totalClassesTrend = 0;
    let totalCheckinsTrend = 0;
    let totalRevenueTrend = 0;
    let averageAttendanceTrend = 0;
    let classesRunPercentageTrend = 0;
    let cancellationsTrend = 0;
    
    if (previousPeriodsData.length > 0) {
      const prevTotalClasses = previousPeriodsData.reduce((sum, item) => sum + Number(item.totalOccurrences || 0), 0);
      const prevTotalCheckins = previousPeriodsData.reduce((sum, item) => sum + Number(item.totalCheckins || 0), 0);
      const prevTotalRevenue = previousPeriodsData.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
      const prevTotalCancellations = previousPeriodsData.reduce((sum, item) => sum + Number(item.totalCancelled || 0), 0);
      const prevNonEmptyClasses = previousPeriodsData.reduce((sum, item) => sum + Number(item.totalNonEmpty || 0), 0);
      
      const prevAverageAttendance = prevTotalClasses > 0 ? prevTotalCheckins / prevTotalClasses : 0;
      const prevClassesRunPercentage = prevTotalClasses > 0 ? (prevNonEmptyClasses / prevTotalClasses) * 100 : 0;
      
      totalClassesTrend = prevTotalClasses > 0 ? ((totalClasses - prevTotalClasses) / prevTotalClasses) * 100 : 0;
      totalCheckinsTrend = prevTotalCheckins > 0 ? ((totalCheckins - prevTotalCheckins) / prevTotalCheckins) * 100 : 0;
      totalRevenueTrend = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
      averageAttendanceTrend = prevAverageAttendance > 0 ? ((averageAttendance - prevAverageAttendance) / prevAverageAttendance) * 100 : 0;
      classesRunPercentageTrend = prevClassesRunPercentage > 0 ? (classesRunPercentage - prevClassesRunPercentage) : 0;
      cancellationsTrend = prevTotalCancellations > 0 ? ((totalCancellations - prevTotalCancellations) / prevTotalCancellations) * 100 : 0;
    }
    
    return {
      totalClasses,
      totalCheckins,
      averageAttendance,
      totalRevenue,
      totalCancellations,
      averageFillRate,
      classesRunPercentage,
      uniqueTeachers,
      uniqueClassTypes,
      nonEmptyClassesPercentage,
      // Trends
      totalClassesTrend,
      totalCheckinsTrend,
      totalRevenueTrend,
      averageAttendanceTrend,
      classesRunPercentageTrend,
      cancellationsTrend
    };
  }, [data, filteredData]);
  
  const calculateClass = (trend: number) => {
    if (trend > 0) return "text-green-600 dark:text-green-400";
    if (trend < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };
  
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-lg font-medium">Key Performance Metrics</h2>
        <div className="flex bg-muted dark:bg-gray-800 rounded-md overflow-hidden mt-2 sm:mt-0">
          <button
            className={`px-4 py-1.5 text-xs font-medium ${selectedPeriod === 'all' ? 'bg-primary text-white' : 'hover:bg-muted/80'}`}
            onClick={() => setSelectedPeriod('all')}
          >
            All Time
          </button>
          <button
            className={`px-4 py-1.5 text-xs font-medium ${selectedPeriod === '6m' ? 'bg-primary text-white' : 'hover:bg-muted/80'}`}
            onClick={() => setSelectedPeriod('6m')}
          >
            6 Months
          </button>
          <button
            className={`px-4 py-1.5 text-xs font-medium ${selectedPeriod === '3m' ? 'bg-primary text-white' : 'hover:bg-muted/80'}`}
            onClick={() => setSelectedPeriod('3m')}
          >
            3 Months
          </button>
          <button
            className={`px-4 py-1.5 text-xs font-medium ${selectedPeriod === '1m' ? 'bg-primary text-white' : 'hover:bg-muted/80'}`}
            onClick={() => setSelectedPeriod('1m')}
          >
            1 Month
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:grid-cols-6">
        {/* Total Classes */}
        <Card className={`overflow-hidden border ${borderColors[0]} bg-gradient-to-br ${bgColors[0]}`}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-1.5">
                  <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Classes</p>
              </div>
              
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  <CountUp end={metrics.totalClasses} preserveValue={true} />
                </div>
                <div className="flex items-center text-xs mt-1">
                  <div className={calculateClass(metrics.totalClassesTrend)}>
                    {metrics.totalClassesTrend > 0 ? (
                      <ArrowUp className="h-3 w-3 inline mr-1" />
                    ) : metrics.totalClassesTrend < 0 ? (
                      <ArrowDown className="h-3 w-3 inline mr-1" />
                    ) : null}
                    {formatPercentage(metrics.totalClassesTrend)}
                  </div>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              
              <div className="mt-4 -mb-6 -mx-6">
                <SparklineChart 
                  data={data} 
                  dataKey="totalOccurrences" 
                  color={chartColors[0]} 
                  height={50} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Check-ins */}
        <Card className={`overflow-hidden border ${borderColors[1]} bg-gradient-to-br ${bgColors[1]}`}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-1.5">
                  <Users className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                </div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Check-ins</p>
              </div>
              
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  <CountUp end={metrics.totalCheckins} preserveValue={true} />
                </div>
                <div className="flex items-center text-xs mt-1">
                  <div className={calculateClass(metrics.totalCheckinsTrend)}>
                    {metrics.totalCheckinsTrend > 0 ? (
                      <ArrowUp className="h-3 w-3 inline mr-1" />
                    ) : metrics.totalCheckinsTrend < 0 ? (
                      <ArrowDown className="h-3 w-3 inline mr-1" />
                    ) : null}
                    {formatPercentage(metrics.totalCheckinsTrend)}
                  </div>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              
              <div className="mt-4 -mb-6 -mx-6">
                <SparklineChart 
                  data={data} 
                  dataKey="totalCheckins" 
                  color={chartColors[1]} 
                  height={50} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Attendance */}
        <Card className={`overflow-hidden border ${borderColors[2]} bg-gradient-to-br ${bgColors[2]}`}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-1.5">
                  <BarChart className="h-4 w-4 text-green-700 dark:text-green-300" />
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Avg. Attendance</p>
              </div>
              
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  <CountUp end={metrics.averageAttendance} decimals={1} preserveValue={true} />
                </div>
                <div className="flex items-center text-xs mt-1">
                  <div className={calculateClass(metrics.averageAttendanceTrend)}>
                    {metrics.averageAttendanceTrend > 0 ? (
                      <ArrowUp className="h-3 w-3 inline mr-1" />
                    ) : metrics.averageAttendanceTrend < 0 ? (
                      <ArrowDown className="h-3 w-3 inline mr-1" />
                    ) : null}
                    {formatPercentage(metrics.averageAttendanceTrend)}
                  </div>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              
              <div className="mt-4 -mb-6 -mx-6">
                <SparklineChart 
                  data={data} 
                  dataKey="classAverageIncludingEmpty" 
                  color={chartColors[2]} 
                  height={50} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Revenue */}
        <Card className={`overflow-hidden border ${borderColors[3]} bg-gradient-to-br ${bgColors[3]}`}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-1.5">
                  <CreditCard className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Revenue</p>
              </div>
              
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  {formatIndianCurrency(metrics.totalRevenue)}
                </div>
                <div className="flex items-center text-xs mt-1">
                  <div className={calculateClass(metrics.totalRevenueTrend)}>
                    {metrics.totalRevenueTrend > 0 ? (
                      <ArrowUp className="h-3 w-3 inline mr-1" />
                    ) : metrics.totalRevenueTrend < 0 ? (
                      <ArrowDown className="h-3 w-3 inline mr-1" />
                    ) : null}
                    {formatPercentage(metrics.totalRevenueTrend)}
                  </div>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              
              <div className="mt-4 -mb-6 -mx-6">
                <SparklineChart 
                  data={data} 
                  dataKey="totalRevenue" 
                  color={chartColors[3]} 
                  height={50} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cancellations */}
        <Card className={`overflow-hidden border ${borderColors[4]} bg-gradient-to-br ${bgColors[4]}`}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-1.5">
                  <CalendarX className="h-4 w-4 text-red-700 dark:text-red-300" />
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Cancellations</p>
              </div>
              
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  <CountUp end={metrics.totalCancellations} preserveValue={true} />
                </div>
                <div className="flex items-center text-xs mt-1">
                  <div className={calculateClass(-metrics.cancellationsTrend)}>
                    {metrics.cancellationsTrend < 0 ? (
                      <ArrowUp className="h-3 w-3 inline mr-1" />
                    ) : metrics.cancellationsTrend > 0 ? (
                      <ArrowDown className="h-3 w-3 inline mr-1" />
                    ) : null}
                    {formatPercentage(metrics.cancellationsTrend)}
                  </div>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              
              <div className="mt-4 -mb-6 -mx-6">
                <SparklineChart 
                  data={data} 
                  dataKey="totalCancelled" 
                  color={chartColors[4]} 
                  height={50} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Class Completion Rate */}
        <Card className={`overflow-hidden border ${borderColors[5]} bg-gradient-to-br ${bgColors[5]}`}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-teal-100 dark:bg-teal-900/50 p-1.5">
                  <CalendarCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                </div>
                <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Running Rate</p>
              </div>
              
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  <CountUp end={metrics.classesRunPercentage} decimals={1} suffix="%" preserveValue={true} />
                </div>
                <div className="flex items-center text-xs mt-1">
                  <div className={calculateClass(metrics.classesRunPercentageTrend)}>
                    {metrics.classesRunPercentageTrend > 0 ? (
                      <ArrowUp className="h-3 w-3 inline mr-1" />
                    ) : metrics.classesRunPercentageTrend < 0 ? (
                      <ArrowDown className="h-3 w-3 inline mr-1" />
                    ) : null}
                    {formatPercentage(metrics.classesRunPercentageTrend)}
                  </div>
                  <span className="text-muted-foreground ml-1">vs previous</span>
                </div>
              </div>
              
              <div className="mt-4 -mb-6 -mx-6">
                <div className="h-[50px] relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-teal-700 dark:text-teal-300">{Math.round(metrics.classesRunPercentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsPanel;
