
import React, { useState } from 'react';
import { ProcessedData, ClassStatsItem } from '@/types/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Check, X, InfoIcon } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [topClassesCount, setTopClassesCount] = useState(10);
  const [bottomClassesCount, setBottomClassesCount] = useState(10);
  const [includeTrainers, setIncludeTrainers] = useState(false);
  const [expandedClassKey, setExpandedClassKey] = useState<string | null>(null);

  // Filter out "hosted" and "recovery" classes
  const filteredData = React.useMemo(() => {
    return data.filter(item => 
      !item.cleanedClass.toLowerCase().includes('hosted') && 
      !item.cleanedClass.toLowerCase().includes('recovery')
    );
  }, [data]);

  // Calculate class statistics with proper aggregation
  const classStatistics = React.useMemo(() => {
    const classStats: Record<string, ClassStatsItem> = {};

    filteredData.forEach(item => {
      // Create a unique key based on day, time, class, and optionally trainer
      const uniqueKey = includeTrainers 
        ? `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}-${item.teacherName}`
        : `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}`;
      
      const attendance = parseFloat(item.classAverageExcludingEmpty) || 0;
      const occurrences = item.totalOccurrences || 0;
      const checkins = item.totalCheckins || 0;
      const revenue = typeof item.totalRevenue === 'number' ? item.totalRevenue : parseInt(item.totalRevenue) || 0;
      
      if (!classStats[uniqueKey]) {
        classStats[uniqueKey] = { 
          key: uniqueKey,
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          cleanedClass: item.cleanedClass,
          teacherName: item.teacherName,
          avgAttendance: attendance,
          totalOccurrences: occurrences,
          totalCheckins: checkins,
          totalRevenue: revenue
        };
      } else {
        // For duplicate entries, we should calculate a weighted average based on occurrences
        const existingStats = classStats[uniqueKey];
        const totalOccurrences = existingStats.totalOccurrences + occurrences;
        
        // Calculate weighted average attendance
        const weightedAvg = totalOccurrences > 0 
          ? ((existingStats.avgAttendance * existingStats.totalOccurrences) + 
             (attendance * occurrences)) / totalOccurrences
          : 0;
        
        // Update the stats with aggregated values
        classStats[uniqueKey] = {
          ...existingStats,
          avgAttendance: weightedAvg,
          totalOccurrences: totalOccurrences,
          totalCheckins: existingStats.totalCheckins + checkins,
          totalRevenue: existingStats.totalRevenue + revenue
        };
      }
    });

    return classStats;
  }, [filteredData, includeTrainers]);

  // Calculate top classes based on average attendance
  const topClasses = React.useMemo(() => {
    return Object.values(classStatistics)
      .filter(item => item.avgAttendance > 0 && item.totalOccurrences >= 2) // Filter out zero attendance and low occurrence classes
      .sort((a, b) => b.avgAttendance - a.avgAttendance)
      .slice(0, topClassesCount);
  }, [classStatistics, topClassesCount]);

  // Calculate bottom classes based on average attendance
  const bottomClasses = React.useMemo(() => {
    return Object.values(classStatistics)
      .filter(item => item.avgAttendance > 0 && item.totalOccurrences >= 2) // Filter out zero attendance and low occurrence classes
      .sort((a, b) => a.avgAttendance - b.avgAttendance)
      .slice(0, bottomClassesCount);
  }, [classStatistics, bottomClassesCount]);

  const toggleExpandClass = (key: string) => {
    if (expandedClassKey === key) {
      setExpandedClassKey(null);
    } else {
      setExpandedClassKey(key);
    }
  };

  // Find the highest attendance for visual comparisons
  const maxAttendance = Math.max(
    ...topClasses.map(c => c.avgAttendance),
    ...bottomClasses.map(c => c.avgAttendance)
  );

  const getPercentageOfMax = (value: number) => {
    return Math.max(5, Math.round((value / maxAttendance) * 100));
  };

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Top & Bottom Classes
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIncludeTrainers(!includeTrainers)}
            className={includeTrainers ? "bg-primary/10 text-primary" : ""}
          >
            {includeTrainers ? <Check className="h-3.5 w-3.5 mr-1.5" /> : null}
            {includeTrainers ? 'Trainers Included' : 'Include Trainers'}
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  {includeTrainers 
                    ? "Showing classes grouped by day, time, class name, AND trainer."
                    : "Showing classes grouped by day, time, and class name only."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Show: {topClassesCount} Top / {bottomClassesCount} Bottom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setTopClassesCount(5)}>
                {topClassesCount === 5 && <Check className="h-4 w-4 mr-2" />}Top 5 Classes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTopClassesCount(10)}>
                {topClassesCount === 10 && <Check className="h-4 w-4 mr-2" />}Top 10 Classes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTopClassesCount(15)}>
                {topClassesCount === 15 && <Check className="h-4 w-4 mr-2" />}Top 15 Classes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBottomClassesCount(5)}>
                {bottomClassesCount === 5 && <Check className="h-4 w-4 mr-2" />}Bottom 5 Classes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBottomClassesCount(10)}>
                {bottomClassesCount === 10 && <Check className="h-4 w-4 mr-2" />}Bottom 10 Classes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBottomClassesCount(15)}>
                {bottomClassesCount === 15 && <Check className="h-4 w-4 mr-2" />}Bottom 15 Classes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center text-blue-700 dark:text-blue-300">
              <TrendingUp className="h-4 w-4 mr-2" />
              Top Classes by Attendance
            </h3>
            <ul className="list-none pl-0 space-y-2">
              {topClasses.map((item, index) => (
                <motion.li 
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-md overflow-hidden"
                >
                  <div 
                    className={`bg-white dark:bg-gray-800 border ${expandedClassKey === item.key ? 'border-blue-200 dark:border-blue-800' : 'border-transparent'} shadow-sm`}
                  >
                    <div 
                      className="px-3 py-2 cursor-pointer relative"
                      onClick={() => toggleExpandClass(item.key)}
                    >
                      <div className="absolute top-0 left-0 h-full w-1 bg-blue-500"></div>
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-700 dark:text-gray-300 flex items-center">
                              {item.dayOfWeek}, {item.classTime}
                              <Badge variant="outline" className="ml-2 text-xs">#{index + 1}</Badge>
                            </span>
                            <div className="font-semibold text-blue-700 dark:text-blue-300 flex items-center">
                              {item.cleanedClass}
                              {expandedClassKey === item.key ? (
                                <ChevronUp className="h-4 w-4 ml-1" />
                              ) : (
                                <ChevronDown className="h-4 w-4 ml-1" />
                              )}
                            </div>
                            {includeTrainers && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Trainer: {item.teacherName}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-blue-700 dark:text-blue-300 font-semibold cursor-help">
                              {item.avgAttendance.toFixed(1)} avg
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Class Performance</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Occurrences</div>
                                  <div className="font-medium">{item.totalOccurrences}</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Total Check-ins</div>
                                  <div className="font-medium">{item.totalCheckins}</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Avg. Attendance</div>
                                  <div className="font-medium">{item.avgAttendance.toFixed(1)}</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Revenue</div>
                                  <div className="font-medium">${item.totalRevenue.toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${getPercentageOfMax(item.avgAttendance)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedClassKey === item.key && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/20"
                      >
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Performance Details</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Avg. Attendance:</span>
                                <span className="font-medium text-blue-700 dark:text-blue-300">{item.avgAttendance.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Total Check-ins:</span>
                                <span className="font-medium">{item.totalCheckins}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Revenue per Class:</span>
                                <span className="font-medium">${(item.totalRevenue / item.totalOccurrences).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Additional Metrics</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Day of Week:</span>
                                <span className="font-medium">{item.dayOfWeek}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Time:</span>
                                <span className="font-medium">{item.classTime}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Occurrences:</span>
                                <span className="font-medium">{item.totalOccurrences}</span>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Revenue</h4>
                            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                              ${item.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.li>
              ))}
              {topClasses.length === 0 && (
                <li className="py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-md text-center text-gray-500 dark:text-gray-400">
                  No data available
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/30 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center text-amber-700 dark:text-amber-300">
              <TrendingDown className="h-4 w-4 mr-2" />
              Bottom Classes by Attendance
            </h3>
            <ul className="list-none pl-0 space-y-2">
              {bottomClasses.map((item, index) => (
                <motion.li 
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-md overflow-hidden"
                >
                  <div 
                    className={`bg-white dark:bg-gray-800 border ${expandedClassKey === item.key ? 'border-amber-200 dark:border-amber-800' : 'border-transparent'} shadow-sm`}
                  >
                    <div 
                      className="px-3 py-2 cursor-pointer relative"
                      onClick={() => toggleExpandClass(item.key)}
                    >
                      <div className="absolute top-0 left-0 h-full w-1 bg-amber-500"></div>
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-700 dark:text-gray-300 flex items-center">
                              {item.dayOfWeek}, {item.classTime}
                              <Badge variant="outline" className="ml-2 text-xs">#{index + 1}</Badge>
                            </span>
                            <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center">
                              {item.cleanedClass}
                              {expandedClassKey === item.key ? (
                                <ChevronUp className="h-4 w-4 ml-1" />
                              ) : (
                                <ChevronDown className="h-4 w-4 ml-1" />
                              )}
                            </div>
                            {includeTrainers && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Trainer: {item.teacherName}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="text-sm bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded-full text-amber-700 dark:text-amber-300 font-semibold cursor-help">
                              {item.avgAttendance.toFixed(1)} avg
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Class Performance</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Occurrences</div>
                                  <div className="font-medium">{item.totalOccurrences}</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Total Check-ins</div>
                                  <div className="font-medium">{item.totalCheckins}</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Avg. Attendance</div>
                                  <div className="font-medium">{item.avgAttendance.toFixed(1)}</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                                  <div className="text-gray-500 dark:text-gray-400">Revenue</div>
                                  <div className="font-medium">${item.totalRevenue.toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full bg-amber-500"
                            style={{ width: `${getPercentageOfMax(item.avgAttendance)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedClassKey === item.key && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/20"
                      >
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Performance Details</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Avg. Attendance:</span>
                                <span className="font-medium text-amber-700 dark:text-amber-300">{item.avgAttendance.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Total Check-ins:</span>
                                <span className="font-medium">{item.totalCheckins}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Revenue per Class:</span>
                                <span className="font-medium">${(item.totalRevenue / item.totalOccurrences).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Additional Metrics</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Day of Week:</span>
                                <span className="font-medium">{item.dayOfWeek}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Time:</span>
                                <span className="font-medium">{item.classTime}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Occurrences:</span>
                                <span className="font-medium">{item.totalOccurrences}</span>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Revenue</h4>
                            <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                              ${item.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.li>
              ))}
              {bottomClasses.length === 0 && (
                <li className="py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-md text-center text-gray-500 dark:text-gray-400">
                  No data available
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default TopBottomClasses;
