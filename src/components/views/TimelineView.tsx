
import React, { useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import { motion } from 'framer-motion';

interface TimelineViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const TimelineView: React.FC<TimelineViewProps> = ({ data, trainerAvatars }) => {
  const [period, setPeriod] = React.useState<string>('all');

  // Get unique periods from data
  const periods = React.useMemo(() => {
    const uniquePeriods = new Set(data.map(item => item.period));
    return Array.from(uniquePeriods).filter(Boolean).sort();
  }, [data]);

  // Filter data based on selected period
  const filteredData = React.useMemo(() => {
    if (period === 'all') {
      return data;
    }
    return data.filter(item => item.period === period);
  }, [data, period]);

  // Group data by month-year (period)
  const groupedByPeriod = React.useMemo(() => {
    const groups: Record<string, ProcessedData[]> = {};
    
    filteredData.forEach(item => {
      if (!groups[item.period]) {
        groups[item.period] = [];
      }
      groups[item.period].push(item);
    });
    
    // Sort periods chronologically
    const sortedGroups: Record<string, ProcessedData[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [filteredData]);

  // Calculate period metrics
  const periodMetrics = React.useMemo(() => {
    const metrics: Record<string, { 
      totalCheckins: number; 
      totalClasses: number; 
      totalRevenue: number;
      uniqueClasses: number;
      uniqueInstructors: number;
    }> = {};
    
    Object.entries(groupedByPeriod).forEach(([period, items]) => {
      const uniqueClasses = new Set(items.map(item => item.cleanedClass));
      const uniqueInstructors = new Set(items.map(item => item.teacherName));
      
      metrics[period] = {
        totalCheckins: items.reduce((sum, item) => sum + item.totalCheckins, 0),
        totalClasses: items.reduce((sum, item) => sum + item.totalOccurrences, 0),
        totalRevenue: items.reduce((sum, item) => sum + Number(item.totalRevenue), 0),
        uniqueClasses: uniqueClasses.size,
        uniqueInstructors: uniqueInstructors.size
      };
    });
    
    return metrics;
  }, [groupedByPeriod]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const periodVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Timeline View</h3>
          <div className="w-48">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Object.entries(groupedByPeriod).map(([periodKey, periodItems], index) => (
            <motion.div 
              key={periodKey}
              className="relative"
              variants={periodVariants}
            >
              {/* Period header */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-16 md:w-24 text-right pe-4">
                  <span className="font-medium text-lg text-primary">{periodKey}</span>
                </div>
                
                <div className="flex-grow h-0.5 bg-primary/20 relative">
                  <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-primary/20 border-4 border-white dark:border-gray-900 flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-shrink-0 w-64 ps-4">
                  <div className="flex gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Classes:</span>{' '}
                      <span className="font-medium">{periodMetrics[periodKey].totalClasses}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-ins:</span>{' '}
                      <span className="font-medium">{periodMetrics[periodKey].totalCheckins}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue:</span>{' '}
                      <span className="font-medium">{formatIndianCurrency(periodMetrics[periodKey].totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Period content */}
              <div className="ps-20 md:ps-28">
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={periodVariants}
                >
                  {periodItems
                    .sort((a, b) => b.totalCheckins - a.totalCheckins)
                    .slice(0, 9)
                    .map((item, itemIndex) => (
                      <motion.div 
                        key={itemIndex}
                        variants={itemVariants}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {item.dayOfWeek} {item.classTime}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                {item.totalOccurrences}x
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium mb-2">{item.cleanedClass}</h4>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Avatar className="h-6 w-6">
                                {trainerAvatars[item.teacherName] ? (
                                  <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(item.teacherName)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <p className="text-xs text-muted-foreground">{item.teacherName}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Check-ins</p>
                                <p className="font-medium">{item.totalCheckins}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                                <p className="font-medium">{formatIndianCurrency(Number(item.totalRevenue))}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Avg. Attendance</p>
                                <p className="font-medium">
                                  {typeof item.classAverageIncludingEmpty === 'number'
                                    ? item.classAverageIncludingEmpty.toFixed(1)
                                    : item.classAverageIncludingEmpty}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Location</p>
                                <p className="font-medium truncate">{item.location}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </motion.div>
                
                {periodItems.length > 9 && (
                  <div className="text-center mt-4">
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900">
                      +{periodItems.length - 9} more classes
                    </Badge>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TimelineView;
