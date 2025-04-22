
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, IndianRupee, AlertTriangle, Check } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

// Format number to Indian format with lakhs and crores
const formatIndianCurrency = (value: number): string => {
  if (value >= 10000000) { // 1 crore
    return `${(value / 10000000).toFixed(1)} Cr`;
  } else if (value >= 100000) { // 1 lakh
    return `${(value / 100000).toFixed(1)} L`;
  } else {
    return value.toLocaleString('en-IN');
  }
};

// Helper function to convert month abbreviation to number
const monthToNumber = (month: string): number => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.indexOf(month);
};

const TimelineView: React.FC<TimelineViewProps> = ({ data, trainerAvatars }) => {
  const [expandedPeriods, setExpandedPeriods] = useState<string[]>([]);

  // Group classes by period
  const classesGroupedByPeriod = useMemo(() => {
    const groupedData: Record<string, ProcessedData[]> = {};
    
    data.forEach(classItem => {
      const period = classItem.period || 'Unknown';
      
      if (!groupedData[period]) {
        groupedData[period] = [];
      }
      
      groupedData[period].push(classItem);
    });
    
    // Sort periods by date (newest first)
    return Object.entries(groupedData)
      .map(([period, classes]) => {
        // Sort classes within each period by average attendance (highest first)
        const sortedClasses = [...classes].sort((a, b) => {
          const attendanceA = parseFloat(a.classAverageExcludingEmpty);
          const attendanceB = parseFloat(b.classAverageExcludingEmpty);
          return attendanceB - attendanceA;
        });
        
        return { period, classes: sortedClasses };
      })
      .sort((a, b) => {
        if (a.period === 'Unknown') return 1;
        if (b.period === 'Unknown') return -1;
        
        const [monthA, yearA] = a.period.split('-');
        const [monthB, yearB] = b.period.split('-');
        
        // Compare years
        const yearDiff = parseInt(yearB) - parseInt(yearA);
        if (yearDiff !== 0) return yearDiff;
        
        // Compare months
        return monthToNumber(monthB) - monthToNumber(monthA);
      });
  }, [data]);

  const togglePeriod = (period: string) => {
    setExpandedPeriods(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period) 
        : [...prev, period]
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const periodItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const classItem = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <div className="p-4">
      <motion.div 
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {classesGroupedByPeriod.map(({ period, classes }, index) => {
          const isExpanded = expandedPeriods.includes(period);
          const totalClasses = classes.length;
          const totalCheckins = classes.reduce((sum, c) => sum + c.totalCheckins, 0);
          const totalRevenue = classes.reduce((sum, c) => {
            const revenue = typeof c.totalRevenue === 'number' 
              ? c.totalRevenue 
              : parseInt(c.totalRevenue) || 0;
            return sum + revenue;
          }, 0);
          
          return (
            <motion.div 
              key={period} 
              variants={periodItem}
              className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
            >
              <div 
                className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => togglePeriod(period)}
              >
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-3 text-lg font-semibold px-3 py-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {period}
                  </Badge>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="font-medium">{totalCheckins} check-ins</span>
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="font-medium">₹{formatIndianCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Badge className="mr-2">{totalClasses} Classes</Badge>
                  {isExpanded ? (
                    <Button variant="ghost" size="sm" className="gap-1">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="feather feather-chevron-up"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                      Collapse
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="feather feather-chevron-down"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                      Expand
                    </Button>
                  )}
                </div>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {classes.map((classData, classIndex) => {
                          // Determine color based on attendance
                          const attendance = parseFloat(classData.classAverageExcludingEmpty);
                          let statusColor = 'bg-red-100 dark:bg-red-900/40';
                          let statusText = 'Low Attendance';
                          let statusIcon = <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
                          
                          if (attendance >= 15) {
                            statusColor = 'bg-green-100 dark:bg-green-900/40';
                            statusText = 'High Attendance';
                            statusIcon = <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
                          } else if (attendance >= 10) {
                            statusColor = 'bg-blue-100 dark:bg-blue-900/40';
                            statusText = 'Good Attendance';
                            statusIcon = <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
                          } else if (attendance >= 5) {
                            statusColor = 'bg-amber-100 dark:bg-amber-900/40';
                            statusText = 'Average Attendance';
                            statusIcon = <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
                          }
                          
                          const revenue = typeof classData.totalRevenue === 'number' 
                            ? classData.totalRevenue 
                            : parseInt(classData.totalRevenue) || 0;
                          
                          return (
                            <motion.div 
                              key={`${classData.id}-${classIndex}`}
                              variants={classItem}
                              className="h-full"
                            >
                              <Card className="h-full hover:shadow-md transition-all duration-300">
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="mb-2">{classData.dayOfWeek}, {classData.classTime}</Badge>
                                    <HoverCard>
                                      <HoverCardTrigger asChild>
                                        <Badge 
                                          variant="secondary" 
                                          className={`${statusColor} flex items-center gap-1 cursor-help`}
                                        >
                                          {statusIcon}
                                          {classData.classAverageExcludingEmpty}
                                        </Badge>
                                      </HoverCardTrigger>
                                      <HoverCardContent className="w-60">
                                        <div className="text-sm font-medium">{statusText}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>Total Classes:</div>
                                            <div className="font-medium">{classData.totalOccurrences}</div>
                                            <div>Total Check-ins:</div>
                                            <div className="font-medium">{classData.totalCheckins}</div>
                                            <div>Avg. Attendance:</div>
                                            <div className="font-medium">{classData.classAverageExcludingEmpty}</div>
                                            <div>Revenue:</div>
                                            <div className="font-medium">₹{formatIndianCurrency(revenue)}</div>
                                          </div>
                                        </div>
                                      </HoverCardContent>
                                    </HoverCard>
                                  </div>
                                  
                                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{classData.cleanedClass}</h3>
                                  
                                  <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                      <Avatar className="h-6 w-6 mr-1.5">
                                        <AvatarImage src={trainerAvatars[classData.teacherName]} alt={classData.teacherName} />
                                        <AvatarFallback className="text-[10px]">
                                          {classData.teacherName.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs line-clamp-1 max-w-[120px]">{classData.teacherName}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">₹{formatIndianCurrency(revenue)}</div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default TimelineView;
