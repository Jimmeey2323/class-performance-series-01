
import React, { useState } from 'react';
import { ProcessedData, ClassStatsItem } from '@/types/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ChevronDown, ChevronRight, Calendar, Clock, MapPin, User } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trainerAvatars } from './Dashboard';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [topClassesCount, setTopClassesCount] = useState(10);
  const [bottomClassesCount, setBottomClassesCount] = useState(10);
  const [includeTrainers, setIncludeTrainers] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

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
      // Create a unique key based on day, time, class, and optionally teacher
      const uniqueKey = includeTrainers 
        ? `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}-${item.teacherName}`
        : `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}`;
      
      const attendance = parseFloat(item.classAverageExcludingEmpty) || 0;
      const occurrences = item.totalOccurrences || 0;
      const checkins = item.totalCheckins || 0;
      const revenue = item.totalRevenue || "0";
      
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
        
        // Sum up revenue
        const totalRevenue = (parseFloat(existingStats.totalRevenue) + parseFloat(revenue)).toString();
        
        // Update the stats with aggregated values
        classStats[uniqueKey] = {
          ...existingStats,
          avgAttendance: weightedAvg,
          totalOccurrences: totalOccurrences,
          totalCheckins: existingStats.totalCheckins + checkins,
          totalRevenue: totalRevenue
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

  const toggleExpand = (key: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatRevenue = (value: string) => {
    return `₹${parseInt(value).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Top & Bottom Classes
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
            <DropdownMenuItem onClick={() => setTopClassesCount(5)}>
              Top 5 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTopClassesCount(10)}>
              Top 10 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTopClassesCount(15)}>
              Top 15 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(5)}>
              Bottom 5 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(10)}>
              Bottom 10 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(15)}>
              Bottom 15 Classes
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setIncludeTrainers(!includeTrainers)}>
              {includeTrainers && <Check className="h-4 w-4" />}
              {includeTrainers ? 'Exclude Trainers' : 'Include Trainers'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium mb-3 text-indigo-700 dark:text-indigo-300">Top Classes by Attendance</h3>
            <ul className="list-none pl-0 space-y-2">
              {topClasses.map((item, index) => (
                <li key={index} className="overflow-hidden">
                  <div 
                    className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-indigo-100 dark:border-indigo-900 shadow-sm"
                  >
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand(item.key)}
                    >
                      <div className="font-medium text-sm">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.dayOfWeek}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.classTime}</span>
                        </div>
                        <div className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center">
                          {item.cleanedClass}
                          {expandedClasses[item.key] ? 
                            <ChevronDown className="h-4 w-4 ml-1" /> : 
                            <ChevronRight className="h-4 w-4 ml-1" />
                          }
                        </div>
                        {includeTrainers && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Avatar className="h-4 w-4 mr-1">
                              <AvatarImage src={trainerAvatars[item.teacherName] || ''} alt={item.teacherName} />
                              <AvatarFallback className="text-[8px]">
                                {item.teacherName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {item.teacherName}
                          </div>
                        )}
                      </div>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="text-sm bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-full text-indigo-700 dark:text-indigo-300 cursor-help transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-800">
                            {item.avgAttendance.toFixed(1)} avg
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 bg-white dark:bg-gray-800 shadow-md border border-indigo-100 dark:border-indigo-900">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Class Details:</h4>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Total Occurrences:</span>
                              <span className="font-medium">{item.totalOccurrences}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Total Check-ins:</span>
                              <span className="font-medium">{item.totalCheckins}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Average Attendance:</span>
                              <span className="font-medium">{item.avgAttendance.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Total Revenue:</span>
                              <span className="font-medium">{formatRevenue(item.totalRevenue)}</span>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    
                    {expandedClasses[item.key] && (
                      <div className="mt-3 pt-3 border-t border-indigo-50 dark:border-indigo-900/50 animate-accordion-down">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-indigo-50/70 dark:bg-indigo-900/30 rounded p-2 text-xs">
                            <div className="text-indigo-700 dark:text-indigo-300 font-medium mb-1">Performance</div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Occurrences:</span>
                              <Badge variant="outline">{item.totalOccurrences}</Badge>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Check-ins:</span>
                              <Badge variant="outline">{item.totalCheckins}</Badge>
                            </div>
                          </div>
                          <div className="bg-indigo-50/70 dark:bg-indigo-900/30 rounded p-2 text-xs">
                            <div className="text-indigo-700 dark:text-indigo-300 font-medium mb-1">Revenue</div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Total:</span>
                              <Badge variant="outline">{formatRevenue(item.totalRevenue)}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Per Class:</span>
                              <Badge variant="outline">
                                {formatRevenue((parseFloat(item.totalRevenue) / item.totalOccurrences).toString())}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span>Location: Various</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              Average Attendance: {item.avgAttendance.toFixed(1)}
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              {(item.avgAttendance / item.totalOccurrences * 100).toFixed(1)}% Fill Rate
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {topClasses.length === 0 && (
                <li className="py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-md text-center text-gray-500 dark:text-gray-400">
                  No data available
                </li>
              )}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950 dark:to-amber-950 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium mb-3 text-rose-700 dark:text-rose-300">Bottom Classes by Attendance</h3>
            <ul className="list-none pl-0 space-y-2">
              {bottomClasses.map((item, index) => (
                <li key={index} className="overflow-hidden">
                  <div 
                    className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-rose-100 dark:border-rose-900 shadow-sm"
                  >
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand(`bottom-${item.key}`)}
                    >
                      <div className="font-medium text-sm">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.dayOfWeek}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.classTime}</span>
                        </div>
                        <div className="font-semibold text-rose-700 dark:text-rose-300 flex items-center">
                          {item.cleanedClass}
                          {expandedClasses[`bottom-${item.key}`] ? 
                            <ChevronDown className="h-4 w-4 ml-1" /> : 
                            <ChevronRight className="h-4 w-4 ml-1" />
                          }
                        </div>
                        {includeTrainers && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Avatar className="h-4 w-4 mr-1">
                              <AvatarImage src={trainerAvatars[item.teacherName] || ''} alt={item.teacherName} />
                              <AvatarFallback className="text-[8px]">
                                {item.teacherName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {item.teacherName}
                          </div>
                        )}
                      </div>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="text-sm bg-rose-100 dark:bg-rose-900 px-2 py-1 rounded-full text-rose-700 dark:text-rose-300 cursor-help transition-colors hover:bg-rose-200 dark:hover:bg-rose-800">
                            {item.avgAttendance.toFixed(1)} avg
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 bg-white dark:bg-gray-800 shadow-md border border-rose-100 dark:border-rose-900">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Class Details:</h4>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Total Occurrences:</span>
                              <span className="font-medium">{item.totalOccurrences}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Total Check-ins:</span>
                              <span className="font-medium">{item.totalCheckins}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Average Attendance:</span>
                              <span className="font-medium">{item.avgAttendance.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Total Revenue:</span>
                              <span className="font-medium">{formatRevenue(item.totalRevenue)}</span>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    
                    {expandedClasses[`bottom-${item.key}`] && (
                      <div className="mt-3 pt-3 border-t border-rose-50 dark:border-rose-900/50 animate-accordion-down">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-rose-50/70 dark:bg-rose-900/30 rounded p-2 text-xs">
                            <div className="text-rose-700 dark:text-rose-300 font-medium mb-1">Performance</div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Occurrences:</span>
                              <Badge variant="outline">{item.totalOccurrences}</Badge>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Check-ins:</span>
                              <Badge variant="outline">{item.totalCheckins}</Badge>
                            </div>
                          </div>
                          <div className="bg-rose-50/70 dark:bg-rose-900/30 rounded p-2 text-xs">
                            <div className="text-rose-700 dark:text-rose-300 font-medium mb-1">Revenue</div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Total:</span>
                              <Badge variant="outline">{formatRevenue(item.totalRevenue)}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Per Class:</span>
                              <Badge variant="outline">
                                {formatRevenue((parseFloat(item.totalRevenue) / item.totalOccurrences).toString())}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span>Location: Various</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              Average Attendance: {item.avgAttendance.toFixed(1)}
                            </span>
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              {(item.avgAttendance / item.totalOccurrences * 100).toFixed(1)}% Fill Rate
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
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
