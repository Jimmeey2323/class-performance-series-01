
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

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [topClassesCount, setTopClassesCount] = useState(5);
  const [bottomClassesCount, setBottomClassesCount] = useState(5);
  const [includeTrainers, setIncludeTrainers] = useState(false);

  // Calculate top classes based on average attendance
  const topClasses = React.useMemo(() => {
    const classStats: { [key: string]: { className: string; avgAttendance: number } } = {};

    data.forEach(item => {
      const classKey = includeTrainers ? `${item.cleanedClass}-${item.teacherName}` : item.cleanedClass;
      if (!classStats[classKey]) {
        classStats[classKey] = { 
          className: classKey, 
          avgAttendance: parseFloat(item.classAverageExcludingEmpty) || 0 
        };
      } else {
        // If we already have this class, use the higher average value
        const currentAvg = parseFloat(item.classAverageExcludingEmpty) || 0;
        if (currentAvg > classStats[classKey].avgAttendance) {
          classStats[classKey].avgAttendance = currentAvg;
        }
      }
    });

    const sortedClasses = Object.values(classStats).sort((a, b) => b.avgAttendance - a.avgAttendance);
    return sortedClasses.slice(0, topClassesCount);
  }, [data, topClassesCount, includeTrainers]);

  // Calculate bottom classes based on average attendance
  const bottomClasses = React.useMemo(() => {
    const classStats: { [key: string]: { className: string; avgAttendance: number } } = {};

    data.forEach(item => {
       const classKey = includeTrainers ? `${item.cleanedClass}-${item.teacherName}` : item.cleanedClass;
      if (!classStats[classKey]) {
        classStats[classKey] = { 
          className: classKey, 
          avgAttendance: parseFloat(item.classAverageExcludingEmpty) || 0
        };
      } else {
        // If we already have this class, use the lower average value
        const currentAvg = parseFloat(item.classAverageExcludingEmpty) || 0;
        if (currentAvg < classStats[classKey].avgAttendance || classStats[classKey].avgAttendance === 0) {
          classStats[classKey].avgAttendance = currentAvg;
        }
      }
    });

    const sortedClasses = Object.values(classStats)
      .filter(item => item.avgAttendance > 0) // Filter out zero attendance
      .sort((a, b) => a.avgAttendance - b.avgAttendance);
    return sortedClasses.slice(0, bottomClassesCount);
  }, [data, bottomClassesCount, includeTrainers]);

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
          <DropdownMenuContent align="end" forceMount>
            <DropdownMenuItem onClick={() => setTopClassesCount(5)}>
              Top 5 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTopClassesCount(10)}>
              Top 10 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(5)}>
              Bottom 5 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(10)}>
              Bottom 10 Classes
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
                <li key={index} className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-indigo-100 dark:border-indigo-900 shadow-sm flex justify-between items-center">
                  <span className="font-medium text-sm">{item.className}</span>
                  <span className="text-sm bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-full text-indigo-700 dark:text-indigo-300">{item.avgAttendance.toFixed(1)} avg</span>
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
                <li key={index} className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-rose-100 dark:border-rose-900 shadow-sm flex justify-between items-center">
                  <span className="font-medium text-sm">{item.className}</span>
                  <span className="text-sm bg-rose-100 dark:bg-rose-900 px-2 py-1 rounded-full text-rose-700 dark:text-rose-300">{item.avgAttendance.toFixed(1)} avg</span>
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
