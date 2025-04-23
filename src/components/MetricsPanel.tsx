
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
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

interface MetricsPanelProps {
  data: ProcessedData[];
}

// Format Indian currency with lakhs and crores
export const formatIndianCurrency = (value: number): string => {
  if (value >= 10000000) { // 1 crore
    return `₹${(value / 10000000).toFixed(1)} Cr`;
  } else if (value >= 100000) { // 1 lakh
    return `₹${(value / 100000).toFixed(1)} L`;
  } else if (value >= 1000) {
    return `₹${Math.floor(value / 1000)},${(value % 1000).toString().padStart(3, '0')}`;
  } else {
    return `₹${Math.floor(value)}`;
  }
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const metrics = useMemo<MetricData[]>(() => {
    if (!data.length) return [];
    
    console.log(`MetricsPanel: Calculating metrics for ${data.length} items`);
    
    // Calculate totals
    const totalClasses = data.reduce((sum, item) => sum + item.totalOccurrences, 0);
    const totalCheckins = data.reduce((sum, item) => sum + item.totalCheckins, 0);
    const totalRevenue = data.reduce((sum, item) => {
      // Handle totalRevenue which might be a string or number
      const revenue = typeof item.totalRevenue === 'number' ? 
        item.totalRevenue : 
        parseFloat(String(item.totalRevenue || 0));
      return sum + revenue;
    }, 0);
    
    const totalTime = data.reduce((sum, item) => {
      // Handle totalTime which might be a string or number
      const time = typeof item.totalTime === 'number' ?
        item.totalTime :
        parseFloat(String(item.totalTime || 0));
      return sum + time;
    }, 0);
    
    const nonPaidCustomers = data.reduce((sum, item) => sum + item.totalNonPaid, 0);
    const totalCancelled = data.reduce((sum, item) => sum + item.totalCancelled, 0);
    const totalEmptyClasses = data.reduce((sum, item) => sum + item.totalEmpty, 0);
    
    // Calculate averages
    const avgAttendance = totalClasses > 0 ? (totalCheckins / totalClasses).toFixed(1) : '0';
    const revenuePerClass = totalClasses > 0 ? (totalRevenue / totalClasses) : 0;
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
        value: formatIndianCurrency(totalRevenue),
        icon: <IndianRupee className="h-6 w-6 text-amber-500" />,
        color: 'bg-amber-50 dark:bg-amber-950'
      },
      {
        title: 'Revenue Per Class',
        value: formatIndianCurrency(revenuePerClass),
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
        value: Math.round(totalTime),
        icon: <Clock className="h-6 w-6 text-red-500" />,
        color: 'bg-red-50 dark:bg-red-950'
      },
      {
        title: 'Class Types',
        value: uniqueClassTypes,
        icon: <Tag className="h-6 w-6 text-sky-500" />,
        color: 'bg-sky-50 dark:bg-sky-950'
      },
      {
        title: 'Instructors',
        value: uniqueInstructors,
        icon: <Users className="h-6 w-6 text-emerald-500" />,
        color: 'bg-emerald-50 dark:bg-emerald-950'
      },
      {
        title: 'Empty Classes',
        value: totalEmptyClasses,
        icon: <Calendar className="h-6 w-6 text-slate-500" />,
        color: 'bg-slate-50 dark:bg-slate-950'
      },
      {
        title: 'Non-Paid',
        value: nonPaidCustomers,
        icon: <Users className="h-6 w-6 text-rose-500" />,
        color: 'bg-rose-50 dark:bg-rose-950'
      }
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.05,
            ease: "easeOut"
          }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="col-span-1"
        >
          <Card className={`h-full overflow-hidden border-none shadow-md ${metric.color}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {typeof metric.value === 'number' ? (
                      <CountUp 
                        end={metric.value} 
                        duration={1.5} 
                        separator="," 
                      />
                    ) : (
                      metric.value
                    )}
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-white/30 dark:bg-gray-800/30">
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default MetricsPanel;
