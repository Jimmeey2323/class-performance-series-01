
import React, { useMemo, useState } from 'react';
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
  Divide,
  Info,
} from 'lucide-react';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

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
    return `₹${Math.floor(value / 1000)}K`;
  } else {
    return `₹${Math.floor(value)}`;
  }
};

// Rich descriptions for tooltips
const metricDescriptions: Record<string, { desc: string; calculation: string }> = {
  'Total Classes': {
    desc: 'The total number of class sessions conducted.',
    calculation: 'Sum of all class occurrences across all classes.'
  },
  'Total Check-ins': {
    desc: 'The cumulative attendance across all classes.',
    calculation: 'Sum of all student check-ins recorded for each class.'
  },
  'Revenue': {
    desc: 'Total income generated from all classes.',
    calculation: 'Sum of all revenue recorded for each class.'
  },
  'Revenue Per Class': {
    desc: 'Average revenue generated per class session.',
    calculation: 'Total Revenue ÷ Total Classes'
  },
  'Avg. Attendance (All)': {
    desc: 'Average number of students per class, including empty classes.',
    calculation: 'Total Check-ins ÷ Total Classes'
  },
  'Avg. Attendance (Non-Empty)': {
    desc: 'Average number of students per class, excluding classes with zero attendance.',
    calculation: 'Total Check-ins ÷ (Total Classes - Empty Classes)'
  },
  'Utilization Rate': {
    desc: 'Percentage of classes that had at least one check-in.',
    calculation: '((Total Classes - Empty Classes) ÷ Total Classes) × 100%'
  },
  'Cancelled Classes': {
    desc: 'Number of scheduled classes that were cancelled.',
    calculation: 'Sum of all cancelled occurrences.'
  },
  'Total Hours': {
    desc: 'Total duration of all classes combined in hours.',
    calculation: 'Sum of the duration of all classes.'
  },
  'Class Types': {
    desc: 'Number of distinct class types or formats offered.',
    calculation: 'Count of unique class names.'
  },
  'Instructors': {
    desc: 'Number of unique instructors who taught classes.',
    calculation: 'Count of unique teacher names.'
  },
  'Empty Classes': {
    desc: 'Number of classes with zero attendance.',
    calculation: 'Count of classes with no check-ins.'
  }
};

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  const metrics = useMemo<MetricData[]>(() => {
    if (!data.length) return [];
    
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
    
    // Calculate average excluding empty classes
    const avgAttendanceExcludingEmpty = totalEmptyClasses < totalClasses 
      ? (totalCheckins / (totalClasses - totalEmptyClasses)).toFixed(1) 
      : '0';
    
    // Get unique values
    const uniqueClassTypes = new Set(data.map(item => item.cleanedClass)).size;
    const uniqueInstructors = new Set(data.map(item => item.teacherName)).size;
    
    return [
      {
        title: 'Total Classes',
        value: totalClasses,
        icon: <Calendar className="h-6 w-6 text-blue-500" />,
        color: 'bg-blue-50 dark:bg-blue-950',
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-indigo-600',
      },
      {
        title: 'Total Check-ins',
        value: totalCheckins,
        icon: <CheckSquare className="h-6 w-6 text-green-500" />,
        color: 'bg-green-50 dark:bg-green-950',
        gradientFrom: 'from-green-500',
        gradientTo: 'to-emerald-600',
      },
      {
        title: 'Revenue',
        value: formatIndianCurrency(totalRevenue),
        rawValue: totalRevenue,
        icon: <IndianRupee className="h-6 w-6 text-amber-500" />,
        color: 'bg-amber-50 dark:bg-amber-950',
        gradientFrom: 'from-amber-500',
        gradientTo: 'to-yellow-600',
      },
      {
        title: 'Revenue Per Class',
        value: formatIndianCurrency(revenuePerClass),
        rawValue: revenuePerClass,
        icon: <Tag className="h-6 w-6 text-purple-500" />,
        color: 'bg-purple-50 dark:bg-purple-950',
        gradientFrom: 'from-purple-500',
        gradientTo: 'to-fuchsia-600',
      },
      {
        title: 'Avg. Attendance (All)',
        value: avgAttendance,
        icon: <Users className="h-6 w-6 text-indigo-500" />,
        color: 'bg-indigo-50 dark:bg-indigo-950',
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-blue-600',
      },
      {
        title: 'Avg. Attendance (Non-Empty)',
        value: avgAttendanceExcludingEmpty,
        icon: <Users className="h-6 w-6 text-sky-500" />,
        color: 'bg-sky-50 dark:bg-sky-950',
        gradientFrom: 'from-sky-500',
        gradientTo: 'to-cyan-600',
      },
      {
        title: 'Utilization Rate',
        value: `${avgUtilization}%`,
        rawValue: parseFloat(avgUtilization),
        icon: <BarChart className="h-6 w-6 text-pink-500" />,
        color: 'bg-pink-50 dark:bg-pink-950',
        gradientFrom: 'from-pink-500',
        gradientTo: 'to-rose-600',
      },
      {
        title: 'Cancelled Classes',
        value: totalCancelled,
        icon: <Divide className="h-6 w-6 text-orange-500" />,
        color: 'bg-orange-50 dark:bg-orange-950',
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-red-600',
      },
      {
        title: 'Total Hours',
        value: Math.round(totalTime),
        icon: <Clock className="h-6 w-6 text-red-500" />,
        color: 'bg-red-50 dark:bg-red-950',
        gradientFrom: 'from-red-500',
        gradientTo: 'to-rose-600',
      },
      {
        title: 'Class Types',
        value: uniqueClassTypes,
        icon: <Tag className="h-6 w-6 text-sky-500" />,
        color: 'bg-sky-50 dark:bg-sky-950',
        gradientFrom: 'from-sky-500',
        gradientTo: 'to-blue-600',
      },
      {
        title: 'Instructors',
        value: uniqueInstructors,
        icon: <Users className="h-6 w-6 text-emerald-500" />,
        color: 'bg-emerald-50 dark:bg-emerald-950',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-teal-600',
      },
      {
        title: 'Empty Classes',
        value: totalEmptyClasses,
        icon: <Calendar className="h-6 w-6 text-slate-500" />,
        color: 'bg-slate-50 dark:bg-slate-950',
        gradientFrom: 'from-slate-500',
        gradientTo: 'to-gray-600',
      }
    ];
  }, [data]);

  // Prepare drill-down data based on selected metric
  const getDrillDownData = () => {
    if (!selectedMetric || !data.length) return [];

    // For attendance metrics
    if (selectedMetric.title.includes('Attendance')) {
      // Group by class type
      const byClassType: Record<string, { name: string, value: number, count: number }> = {};
      
      data.forEach(item => {
        if (!byClassType[item.cleanedClass]) {
          byClassType[item.cleanedClass] = { 
            name: item.cleanedClass, 
            value: 0,
            count: 0
          };
        }
        
        byClassType[item.cleanedClass].value += item.totalCheckins;
        byClassType[item.cleanedClass].count += item.totalOccurrences;
      });
      
      return Object.values(byClassType)
        .map(item => ({
          name: item.name,
          value: item.count > 0 ? parseFloat((item.value / item.count).toFixed(1)) : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }
    
    // For revenue metrics
    if (selectedMetric.title.includes('Revenue')) {
      // Group by location
      const byLocation: Record<string, { name: string, value: number }> = {};
      
      data.forEach(item => {
        if (!byLocation[item.location]) {
          byLocation[item.location] = { 
            name: item.location, 
            value: 0 
          };
        }
        
        const revenue = typeof item.totalRevenue === 'number' ? 
          item.totalRevenue : 
          parseFloat(String(item.totalRevenue || 0));
          
        byLocation[item.location].value += revenue;
      });
      
      return Object.values(byLocation)
        .sort((a, b) => b.value - a.value);
    }
    
    // For class counts
    if (selectedMetric.title === 'Total Classes' || selectedMetric.title === 'Empty Classes') {
      // Group by day of week
      const byDayOfWeek: Record<string, { name: string, value: number }> = {};
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      dayOrder.forEach(day => {
        byDayOfWeek[day] = { name: day, value: 0 };
      });
      
      data.forEach(item => {
        if (selectedMetric.title === 'Total Classes') {
          byDayOfWeek[item.dayOfWeek].value += item.totalOccurrences;
        } else if (selectedMetric.title === 'Empty Classes') {
          byDayOfWeek[item.dayOfWeek].value += item.totalEmpty;
        }
      });
      
      return dayOrder.map(day => byDayOfWeek[day]);
    }
    
    // For utilization rate
    if (selectedMetric.title === 'Utilization Rate') {
      // Group by location
      const byLocation: Record<string, { name: string, total: number, empty: number }> = {};
      
      data.forEach(item => {
        if (!byLocation[item.location]) {
          byLocation[item.location] = { 
            name: item.location, 
            total: 0,
            empty: 0
          };
        }
        
        byLocation[item.location].total += item.totalOccurrences;
        byLocation[item.location].empty += item.totalEmpty;
      });
      
      return Object.values(byLocation)
        .map(item => ({
          name: item.name,
          value: item.total > 0 ? parseFloat((((item.total - item.empty) / item.total) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.value - a.value);
    }
    
    // Default - group by class type
    const byClassType: Record<string, { name: string, value: number }> = {};
      
    data.forEach(item => {
      if (!byClassType[item.cleanedClass]) {
        byClassType[item.cleanedClass] = { 
          name: item.cleanedClass, 
          value: 0 
        };
      }
      
      if (selectedMetric.title === 'Total Check-ins') {
        byClassType[item.cleanedClass].value += item.totalCheckins;
      } else if (selectedMetric.title === 'Cancelled Classes') {
        byClassType[item.cleanedClass].value += item.totalCancelled;
      } else if (selectedMetric.title === 'Total Hours') {
        const hours = typeof item.totalTime === 'number' ?
          item.totalTime :
          parseFloat(String(item.totalTime || 0));
        byClassType[item.cleanedClass].value += hours;
      }
    });
    
    return Object.values(byClassType)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Trends over time (by period)
  const getTrendData = () => {
    if (!selectedMetric || !data.length) return [];

    // Extract all periods and sort them chronologically
    const allPeriods = Array.from(new Set(data.map(item => item.period)));
    const periodOrder = allPeriods.sort((a, b) => {
      const [monthA, yearA] = a.split('-');
      const [monthB, yearB] = b.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
    
    const trends: Record<string, { name: string, value: number, attendance: number, revenue: number, count: number }> = {};
    
    periodOrder.forEach(period => {
      trends[period] = { 
        name: period, 
        value: 0,
        attendance: 0,
        revenue: 0,
        count: 0
      };
    });
    
    data.forEach(item => {
      if (!item.period || !trends[item.period]) return;
      
      const revenue = typeof item.totalRevenue === 'number' ? 
        item.totalRevenue : 
        parseFloat(String(item.totalRevenue || 0));
      
      trends[item.period].count += item.totalOccurrences;
      trends[item.period].attendance += item.totalCheckins;
      trends[item.period].revenue += revenue;
      
      if (selectedMetric.title.includes('Attendance')) {
        trends[item.period].value = trends[item.period].count > 0 ? 
          trends[item.period].attendance / trends[item.period].count : 0;
      } else if (selectedMetric.title.includes('Revenue')) {
        trends[item.period].value = trends[item.period].revenue;
      } else if (selectedMetric.title === 'Total Classes' || selectedMetric.title === 'Empty Classes') {
        trends[item.period].value = trends[item.period].count;
      } else if (selectedMetric.title === 'Total Check-ins') {
        trends[item.period].value = trends[item.period].attendance;
      } else {
        // Default fallback
        trends[item.period].value = trends[item.period].count;
      }
    });
    
    return periodOrder.map(period => ({
      name: period,
      value: typeof trends[period].value === 'number' ? 
        parseFloat(trends[period].value.toFixed(1)) : 0
    }));
  };

  const handleMetricClick = (metric: MetricData) => {
    setSelectedMetric(metric);
    setDrillDownOpen(true);
  };

  return (
    <>
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
            onClick={() => handleMetricClick(metric)}
          >
            <Card className={`h-full overflow-hidden border-none shadow-md hover:shadow-lg cursor-pointer transition-all ${metric.color}`}>
              <CardContent className="p-0">
                <div className={`relative h-full p-5 bg-gradient-to-br ${metric.gradientFrom} ${metric.gradientTo} text-white rounded-lg`}>
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 rounded-lg"></div>
                  
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
                        {metric.icon}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-white/70 hover:text-white transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <p><strong>Description:</strong> {metricDescriptions[metric.title]?.desc || 'No description available'}</p>
                              <p><strong>Calculation:</strong> {metricDescriptions[metric.title]?.calculation || 'No calculation info available'}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="mt-auto">
                      <h3 className="font-medium text-sm mb-1 opacity-90">{metric.title}</h3>
                      <div className="text-2xl font-bold leading-none">
                        {typeof metric.value === 'number' ? (
                          <CountUp 
                            end={metric.value} 
                            duration={1.5}
                            separator=","
                            decimal="."
                            decimals={metric.title.includes('Avg') ? 1 : 0}
                          />
                        ) : metric.value}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Drill-down Dialog */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedMetric?.icon}
              <span>{selectedMetric?.title} Analysis</span>
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown and trends for {selectedMetric?.title.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedMetric?.title.includes('Revenue') ? (
                      <BarChart
                        data={getDrillDownData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          tick={{ fontSize: 12 }}
                          height={70}
                        />
                        <YAxis />
                        <ReTooltip 
                          formatter={(value: any) => {
                            return selectedMetric?.title.includes('Revenue') 
                              ? formatIndianCurrency(value)
                              : value;
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill={selectedMetric?.gradientFrom.replace('from-', '#').replace('-500', '')} 
                          name={selectedMetric?.title}
                        >
                          {getDrillDownData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={getDrillDownData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {getDrillDownData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <ReTooltip 
                          formatter={(value: any) => {
                            return selectedMetric?.title.includes('Revenue') 
                              ? formatIndianCurrency(value)
                              : value;
                          }}
                        />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Trend Over Time</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getTrendData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop 
                            offset="5%" 
                            stopColor={selectedMetric?.gradientFrom.replace('from-', '#').replace('-500', '')} 
                            stopOpacity={0.8}
                          />
                          <stop 
                            offset="95%" 
                            stopColor={selectedMetric?.gradientFrom.replace('from-', '#').replace('-500', '')} 
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        tick={{ fontSize: 12 }}
                        height={70}
                      />
                      <YAxis />
                      <ReTooltip 
                        formatter={(value: any) => {
                          return selectedMetric?.title.includes('Revenue') 
                            ? formatIndianCurrency(value)
                            : value;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={selectedMetric?.gradientFrom.replace('from-', '#').replace('-500', '')}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        name={selectedMetric?.title}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setDrillDownOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MetricsPanel;
