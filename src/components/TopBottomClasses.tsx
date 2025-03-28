
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
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

interface TopBottomClassesProps {
  data: ProcessedData[];
}

interface ClassStatsItem {
  key: string;
  dayOfWeek: string;
  classTime: string;
  cleanedClass: string;
  teacherName: string;
  avgAttendance: number;
  totalOccurrences: number;
  totalCheckins: number;
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [topClassesCount, setTopClassesCount] = useState(10);
  const [bottomClassesCount, setBottomClassesCount] = useState(10);
  const [includeTrainers, setIncludeTrainers] = useState(false);

  // Filter out "hosted" and "recovery" classes
  const filteredData = React.useMemo(() => {
    return data.filter(item => 
      !item.cleanedClass.toLowerCase().includes('hosted') && 
      !item.cleanedClass.toLowerCase().includes('recovery')
    );
  }, [data]);

  // Calculate top classes based on average attendance with unique combinations
  const topClasses = React.useMemo(() => {
    const classStats: Record<string, ClassStatsItem> = {};

    filteredData.forEach(item => {
      // Create a unique key based on day, time, class, and optionally teacher
      const uniqueKey = includeTrainers 
        ? `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}-${item.teacherName}`
        : `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}`;
      
      const avgAttendance = parseFloat(item.classAverageExcludingEmpty) || 0;
      
      if (!classStats[uniqueKey]) {
        classStats[uniqueKey] = { 
          key: uniqueKey,
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          cleanedClass: item.cleanedClass,
          teacherName: item.teacherName,
          avgAttendance: avgAttendance,
          totalOccurrences: item.totalOccurrences,
          totalCheckins: item.totalCheckins
        };
      } else {
        // If we already have this combination, use the higher average value
        if (avgAttendance > classStats[uniqueKey].avgAttendance) {
          classStats[uniqueKey].avgAttendance = avgAttendance;
          classStats[uniqueKey].totalOccurrences = item.totalOccurrences;
          classStats[uniqueKey].totalCheckins = item.totalCheckins;
        }
      }
    });

    const sortedClasses = Object.values(classStats)
      .filter(item => item.avgAttendance > 0 && item.totalOccurrences >= 2) // Filter out zero attendance and low occurrence classes
      .sort((a, b) => b.avgAttendance - a.avgAttendance);
    
    return sortedClasses.slice(0, topClassesCount);
  }, [filteredData, topClassesCount, includeTrainers]);

  // Calculate bottom classes based on average attendance with unique combinations
  const bottomClasses = React.useMemo(() => {
    const classStats: Record<string, ClassStatsItem> = {};

    filteredData.forEach(item => {
      // Create a unique key based on day, time, class, and optionally teacher
      const uniqueKey = includeTrainers 
        ? `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}-${item.teacherName}`
        : `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}`;
      
      const avgAttendance = parseFloat(item.classAverageExcludingEmpty) || 0;
      
      if (!classStats[uniqueKey]) {
        classStats[uniqueKey] = { 
          key: uniqueKey,
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          cleanedClass: item.cleanedClass,
          teacherName: item.teacherName,
          avgAttendance: avgAttendance,
          totalOccurrences: item.totalOccurrences,
          totalCheckins: item.totalCheckins
        };
      } else {
        // If we already have this combination, use the lower average value
        if (avgAttendance < classStats[uniqueKey].avgAttendance || classStats[uniqueKey].avgAttendance === 0) {
          classStats[uniqueKey].avgAttendance = avgAttendance;
          classStats[uniqueKey].totalOccurrences = item.totalOccurrences;
          classStats[uniqueKey].totalCheckins = item.totalCheckins;
        }
      }
    });

    const sortedClasses = Object.values(classStats)
      .filter(item => item.avgAttendance > 0 && item.totalOccurrences >= 2) // Filter out zero attendance and low occurrence classes
      .sort((a, b) => a.avgAttendance - b.avgAttendance);
    
    return sortedClasses.slice(0, bottomClassesCount);
  }, [filteredData, bottomClassesCount, includeTrainers]);

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Top & Bottom Classes
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-auto">
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
                <li key={index} className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-indigo-100 dark:border-indigo-900 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.dayOfWeek}, {item.classTime}</span>
                      <div className="font-semibold text-indigo-700 dark:text-indigo-300">{item.cleanedClass}</div>
                      {includeTrainers && <div className="text-xs text-gray-500 dark:text-gray-400">{item.teacherName}</div>}
                    </div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-sm bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-full text-indigo-700 dark:text-indigo-300 cursor-help">
                          {item.avgAttendance.toFixed(1)} avg
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-60 bg-white dark:bg-gray-800 shadow-md border border-indigo-100 dark:border-indigo-900">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">Class Details:</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Occurrences: {item.totalOccurrences}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Check-ins: {item.totalCheckins}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Average Attendance: {item.avgAttendance.toFixed(1)}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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
                <li key={index} className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-rose-100 dark:border-rose-900 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.dayOfWeek}, {item.classTime}</span>
                      <div className="font-semibold text-rose-700 dark:text-rose-300">{item.cleanedClass}</div>
                      {includeTrainers && <div className="text-xs text-gray-500 dark:text-gray-400">{item.teacherName}</div>}
                    </div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-sm bg-rose-100 dark:bg-rose-900 px-2 py-1 rounded-full text-rose-700 dark:text-rose-300 cursor-help">
                          {item.avgAttendance.toFixed(1)} avg
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-60 bg-white dark:bg-gray-800 shadow-md border border-rose-100 dark:border-rose-900">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">Class Details:</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Occurrences: {item.totalOccurrences}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Check-ins: {item.totalCheckins}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Average Attendance: {item.avgAttendance.toFixed(1)}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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
