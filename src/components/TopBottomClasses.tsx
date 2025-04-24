
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency } from './MetricsPanel';
import { Calendar, Clock, MapPin, ChevronDown } from 'lucide-react';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [groupByTrainer, setGroupByTrainer] = useState(false);
  const [metric, setMetric] = useState<'attendance' | 'revenue'>('attendance');
  const [displayCount, setDisplayCount] = useState(5);

  const getTopBottomClasses = () => {
    if (!data || data.length === 0) return { top: [], bottom: [] };

    if (groupByTrainer) {
      // Group by trainer and class type
      const grouped = data.reduce((acc, item) => {
        const key = `${item.teacherName}-${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.location}`;
        if (!acc[key]) {
          acc[key] = {
            teacherName: item.teacherName,
            cleanedClass: item.cleanedClass,
            dayOfWeek: item.dayOfWeek,
            classTime: item.classTime,
            location: item.location,
            totalCheckins: 0,
            totalRevenue: 0,
            totalOccurrences: 0,
            classAverageIncludingEmpty: 0,
            classAverageExcludingEmpty: 0
          };
        }
        acc[key].totalCheckins += Number(item.totalCheckins);
        acc[key].totalRevenue += Number(item.totalRevenue);
        acc[key].totalOccurrences += Number(item.totalOccurrences);
        
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0
      }));

      // Filter out classes that don't meet criteria
      const filteredClasses = classes.filter(item => {
        return !item.cleanedClass.includes('Hosted') && 
               !item.cleanedClass.includes('Recovery') && 
               item.totalOccurrences >= 2;
      });

      return {
        top: filteredClasses
          .sort((a, b) => metric === 'attendance' 
            ? b.average - a.average 
            : b.totalRevenue - a.totalRevenue
          )
          .slice(0, displayCount),
        bottom: filteredClasses
          .sort((a, b) => metric === 'attendance'
            ? a.average - b.average
            : a.totalRevenue - b.totalRevenue
          )
          .slice(0, displayCount)
      };
    } else {
      // Group by class type, day, time and location
      const grouped = data.reduce((acc, item) => {
        const key = `${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.location}`;
        if (!acc[key]) {
          acc[key] = {
            cleanedClass: item.cleanedClass,
            dayOfWeek: item.dayOfWeek,
            classTime: item.classTime,
            location: item.location,
            totalCheckins: 0,
            totalRevenue: 0,
            totalOccurrences: 0,
            trainers: new Set(),
          };
        }
        acc[key].totalCheckins += Number(item.totalCheckins);
        acc[key].totalRevenue += Number(item.totalRevenue);
        acc[key].totalOccurrences += Number(item.totalOccurrences);
        acc[key].trainers.add(item.teacherName);
        
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        trainers: Array.from(item.trainers),
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0
      }));

      // Filter out classes that don't meet criteria
      const filteredClasses = classes.filter(item => {
        return !item.cleanedClass.includes('Hosted') && 
               !item.cleanedClass.includes('Recovery') && 
               item.totalOccurrences >= 2;
      });

      return {
        top: filteredClasses
          .sort((a, b) => metric === 'attendance'
            ? b.average - a.average
            : b.totalRevenue - a.totalRevenue
          )
          .slice(0, displayCount),
        bottom: filteredClasses
          .sort((a, b) => metric === 'attendance'
            ? a.average - b.average
            : a.totalRevenue - b.totalRevenue
          )
          .slice(0, displayCount)
      };
    }
  };

  const { top, bottom } = getTopBottomClasses();
  const hasMoreData = useMemo(() => {
    const totalFilteredClasses = data.filter(item => 
      !item.cleanedClass.includes('Hosted') && 
      !item.cleanedClass.includes('Recovery')
    ).length;
    
    return totalFilteredClasses > displayCount;
  }, [data, displayCount]);

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Top & Bottom Classes</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={groupByTrainer}
              onCheckedChange={setGroupByTrainer}
              id="trainer-switch"
            />
            <Label htmlFor="trainer-switch">Group by Trainer</Label>
          </div>
          <Tabs defaultValue="attendance" className="w-[400px]">
            <TabsList>
              <TabsTrigger 
                value="attendance" 
                onClick={() => setMetric('attendance')}
              >
                By Attendance
              </TabsTrigger>
              <TabsTrigger 
                value="revenue" 
                onClick={() => setMetric('revenue')}
              >
                By Revenue
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Classes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top {displayCount} Classes</h3>
            <div className="space-y-4">
              {top.length > 0 ? top.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 w-8">
                      #{index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="font-medium">{item.cleanedClass}</p>
                      {groupByTrainer ? (
                        <p className="text-sm text-muted-foreground">{item.teacherName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(item.trainers) 
                            ? `${item.trainers.length} trainer${item.trainers.length > 1 ? 's' : ''}` 
                            : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.dayOfWeek}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.classTime}
                        </span>
                        <span>{item.totalOccurrences} classes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-semibold">
                      {metric === 'attendance' 
                        ? item.average.toFixed(1)
                        : formatIndianCurrency(item.totalRevenue)
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {metric === 'attendance' ? 'Avg. Attendance' : 'Total Revenue'}
                    </p>
                    <div className="text-xs flex justify-end gap-2">
                      <span>Total check-ins: {item.totalCheckins}</span>
                      <span>|</span>
                      <span>
                        Avg (incl. empty): {typeof item.classAverageIncludingEmpty === 'number' 
                          ? item.classAverageIncludingEmpty.toFixed(1) 
                          : item.classAverageIncludingEmpty}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-muted-foreground">
                  No classes found matching the criteria
                </div>
              )}
            </div>
            {hasMoreData && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={handleShowMore}
                  className="text-sm"
                >
                  Show More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Classes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bottom {displayCount} Classes</h3>
            <div className="space-y-4">
              {bottom.length > 0 ? bottom.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-red-500 dark:text-red-400 w-8">
                      #{displayCount - index}
                    </span>
                    <div className="space-y-1">
                      <p className="font-medium">{item.cleanedClass}</p>
                      {groupByTrainer ? (
                        <p className="text-sm text-muted-foreground">{item.teacherName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(item.trainers) 
                            ? `${item.trainers.length} trainer${item.trainers.length > 1 ? 's' : ''}` 
                            : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.dayOfWeek}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.classTime}
                        </span>
                        <span>{item.totalOccurrences} classes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-semibold">
                      {metric === 'attendance'
                        ? item.average.toFixed(1)
                        : formatIndianCurrency(item.totalRevenue)
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {metric === 'attendance' ? 'Avg. Attendance' : 'Total Revenue'}
                    </p>
                    <div className="text-xs flex justify-end gap-2">
                      <span>Total check-ins: {item.totalCheckins}</span>
                      <span>|</span>
                      <span>
                        Avg (incl. empty): {typeof item.classAverageIncludingEmpty === 'number' 
                          ? item.classAverageIncludingEmpty.toFixed(1) 
                          : item.classAverageIncludingEmpty}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-muted-foreground">
                  No classes found matching the criteria
                </div>
              )}
            </div>
            {hasMoreData && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={handleShowMore}
                  className="text-sm"
                >
                  Show More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopBottomClasses;
