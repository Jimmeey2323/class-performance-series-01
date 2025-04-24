
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trainerAvatars } from './Dashboard';
import { formatIndianCurrency } from './MetricsPanel';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [showCount, setShowCount] = useState({ top: 5, bottom: 5 });

  // Handle cases with no data
  if (!data.length) {
    return <div>No data available</div>;
  }

  // Helper function to filter excluded classes
  const shouldExcludeClass = (className: string, count: number): boolean => {
    return className.toLowerCase().includes('hosted') || 
           className.toLowerCase().includes('recovery') || 
           count < 2;
  };

  // Helper to get color based on value
  const getColorByValue = (value: number, min: number, max: number) => {
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    if (ratio > 0.7) return 'bg-green-600 text-white';
    if (ratio > 0.4) return 'bg-blue-600 text-white';
    return 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100';
  };

  // Group classes for more accurate analysis
  const groupedClasses = data.reduce((acc, curr) => {
    // Create a grouping key based on the combined factors
    const groupKey = `${curr.cleanedClass}|${curr.dayOfWeek}|${curr.classTime}|${curr.location}`;
    
    if (!acc[groupKey]) {
      acc[groupKey] = {
        key: groupKey,
        cleanedClass: curr.cleanedClass,
        dayOfWeek: curr.dayOfWeek,
        classTime: curr.classTime,
        location: curr.location,
        totalOccurrences: 0,
        totalCheckins: 0,
        totalRevenue: 0,
        teacherNames: new Set<string>(),
        classAverageIncludingEmpty: 0
      };
    }
    
    // Accumulate values
    acc[groupKey].totalOccurrences += curr.totalOccurrences;
    acc[groupKey].totalCheckins += curr.totalCheckins;
    acc[groupKey].totalRevenue += typeof curr.totalRevenue === 'string' ? 
      parseFloat(curr.totalRevenue) : curr.totalRevenue;
    acc[groupKey].teacherNames.add(curr.teacherName);
    
    // Recalculate averages
    acc[groupKey].classAverageIncludingEmpty = 
      acc[groupKey].totalOccurrences > 0 ? 
      acc[groupKey].totalCheckins / acc[groupKey].totalOccurrences : 0;
    
    return acc;
  }, {} as Record<string, any>);

  // Convert grouped data to array for sorting and filtering
  const groupedClassesArray = Object.values(groupedClasses)
    .filter(cls => !shouldExcludeClass(cls.cleanedClass, cls.totalOccurrences));

  // Sort by totalCheckins for top/bottom classes
  const topClassesByAttendance = [...groupedClassesArray]
    .sort((a, b) => b.totalCheckins - a.totalCheckins)
    .slice(0, showCount.top);

  const bottomClassesByAttendance = [...groupedClassesArray]
    .sort((a, b) => a.totalCheckins - b.totalCheckins)
    .slice(0, showCount.bottom);

  // Sort by revenue for top/bottom revenue classes
  const topClassesByRevenue = [...groupedClassesArray]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, showCount.top);

  const bottomClassesByRevenue = [...groupedClassesArray]
    .sort((a, b) => a.totalRevenue - b.totalRevenue)
    .slice(0, showCount.bottom);

  // Sort by average for top/bottom average classes
  const topClassesByAverage = [...groupedClassesArray]
    .sort((a, b) => b.classAverageIncludingEmpty - a.classAverageIncludingEmpty)
    .slice(0, showCount.top);

  const bottomClassesByAverage = [...groupedClassesArray]
    .sort((a, b) => a.classAverageIncludingEmpty - b.classAverageIncludingEmpty)
    .slice(0, showCount.bottom);

  // Max values for visualization
  const maxAttendance = Math.max(...groupedClassesArray.map(c => c.totalCheckins));
  const minAttendance = Math.min(...groupedClassesArray.map(c => c.totalCheckins));
  
  const maxRevenue = Math.max(...groupedClassesArray.map(c => c.totalRevenue));
  const minRevenue = Math.min(...groupedClassesArray.map(c => c.totalRevenue));
  
  const maxAverage = Math.max(...groupedClassesArray.map(c => c.classAverageIncludingEmpty));
  const minAverage = Math.min(...groupedClassesArray.map(c => c.classAverageIncludingEmpty));

  const handleShowMore = (type: 'top' | 'bottom') => {
    setShowCount(prev => ({
      ...prev,
      [type]: prev[type] + 5
    }));
  };

  const renderClassItem = (cls: any, index: number, metric: 'attendance' | 'revenue' | 'average') => {
    let value: number | string = 0;
    let max = 0;
    let min = 0;
    
    if (metric === 'attendance') {
      value = cls.totalCheckins;
      max = maxAttendance;
      min = minAttendance;
    } else if (metric === 'revenue') {
      value = formatIndianCurrency(cls.totalRevenue);
      max = maxRevenue;
      min = minRevenue;
    } else {
      value = cls.classAverageIncludingEmpty.toFixed(1);
      max = maxAverage;
      min = minAverage;
    }
    
    return (
      <div key={index} className="flex items-center gap-4 p-3 rounded-md bg-white dark:bg-slate-950 mb-2 shadow-sm">
        <div className="font-medium text-lg w-8 text-center">{index + 1}</div>
        <div className="flex-grow">
          <h4 className="font-medium text-base">{cls.cleanedClass}</h4>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span>{cls.dayOfWeek} • {cls.classTime} • {cls.location}</span>
          </div>
          {cls.teacherNames.size > 0 && (
            <div className="flex mt-1 -space-x-2">
              {Array.from(cls.teacherNames).slice(0, 3).map((teacher: string, i: number) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-white dark:border-slate-900">
                  <AvatarImage src={trainerAvatars[teacher]} alt={teacher} />
                  <AvatarFallback className="text-xs">
                    {teacher.split(' ').map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {cls.teacherNames.size > 3 && (
                <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800">
                  <AvatarFallback className="text-xs">
                    +{cls.teacherNames.size - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium mb-1">
            {metric === 'attendance' && `${value} check-ins`}
            {metric === 'revenue' && `${value}`}
            {metric === 'average' && `${value} avg/class`}
          </div>
          <div className="w-24">
            <Progress 
              className={getColorByValue(
                metric === 'attendance' ? cls.totalCheckins : 
                metric === 'revenue' ? cls.totalRevenue : 
                cls.classAverageIncludingEmpty,
                metric === 'attendance' ? minAttendance : 
                metric === 'revenue' ? minRevenue : 
                minAverage,
                metric === 'attendance' ? maxAttendance : 
                metric === 'revenue' ? maxRevenue : 
                maxAverage
              )} 
              value={
                ((metric === 'attendance' ? cls.totalCheckins : 
                metric === 'revenue' ? cls.totalRevenue : 
                cls.classAverageIncludingEmpty) - 
                (metric === 'attendance' ? minAttendance : 
                metric === 'revenue' ? minRevenue : 
                minAverage)) / 
                ((metric === 'attendance' ? maxAttendance : 
                metric === 'revenue' ? maxRevenue : 
                maxAverage) - 
                (metric === 'attendance' ? minAttendance : 
                metric === 'revenue' ? minRevenue : 
                minAverage)) * 100
              } 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-semibold">Class Performance</h2>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="attendance">By Attendance</TabsTrigger>
          <TabsTrigger value="revenue">By Revenue</TabsTrigger>
          <TabsTrigger value="average">By Average</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Classes by Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {topClassesByAttendance.map((cls, index) => renderClassItem(cls, index, 'attendance'))}
                {topClassesByAttendance.length < groupedClassesArray.length && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => handleShowMore('top')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bottom Classes by Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {bottomClassesByAttendance.map((cls, index) => renderClassItem(cls, index, 'attendance'))}
                {bottomClassesByAttendance.length < groupedClassesArray.length && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => handleShowMore('bottom')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Classes by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {topClassesByRevenue.map((cls, index) => renderClassItem(cls, index, 'revenue'))}
                {topClassesByRevenue.length < groupedClassesArray.length && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => handleShowMore('top')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bottom Classes by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {bottomClassesByRevenue.map((cls, index) => renderClassItem(cls, index, 'revenue'))}
                {bottomClassesByRevenue.length < groupedClassesArray.length && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => handleShowMore('bottom')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="average" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Classes by Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {topClassesByAverage.map((cls, index) => renderClassItem(cls, index, 'average'))}
                {topClassesByAverage.length < groupedClassesArray.length && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => handleShowMore('top')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bottom Classes by Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {bottomClassesByAverage.map((cls, index) => renderClassItem(cls, index, 'average'))}
                {bottomClassesByAverage.length < groupedClassesArray.length && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => handleShowMore('bottom')}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopBottomClasses;
