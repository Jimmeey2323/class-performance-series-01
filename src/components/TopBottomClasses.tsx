import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatIndianCurrency } from './MetricsPanel';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [groupByTrainer, setGroupByTrainer] = useState(false);
  const [metric, setMetric] = useState<'attendance' | 'revenue'>('attendance');

  const getTopBottomClasses = () => {
    if (groupByTrainer) {
      // Group by trainer and class type
      const grouped = data.reduce((acc, item) => {
        const key = `${item.teacherName}-${item.cleanedClass}`;
        if (!acc[key]) {
          acc[key] = {
            teacherName: item.teacherName,
            cleanedClass: item.cleanedClass,
            dayOfWeek: item.dayOfWeek,
            classTime: item.classTime,
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
        // Keep the most common dayOfWeek and time for this group
        if (!acc[key].dayOfWeek) acc[key].dayOfWeek = item.dayOfWeek;
        if (!acc[key].classTime) acc[key].classTime = item.classTime;
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0
      }));

      return {
        top: classes
          .sort((a, b) => metric === 'attendance' 
            ? b.average - a.average 
            : b.totalRevenue - a.totalRevenue
          )
          .slice(0, 5),
        bottom: classes
          .sort((a, b) => metric === 'attendance'
            ? a.average - b.average
            : a.totalRevenue - b.totalRevenue
          )
          .slice(0, 5)
      };
    } else {
      // Group by class type only, ignoring trainers
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.cleanedClass]) {
          acc[item.cleanedClass] = {
            cleanedClass: item.cleanedClass,
            dayOfWeek: [],
            classTime: [],
            totalCheckins: 0,
            totalRevenue: 0,
            totalOccurrences: 0
          };
        }
        acc[item.cleanedClass].totalCheckins += Number(item.totalCheckins);
        acc[item.cleanedClass].totalRevenue += Number(item.totalRevenue);
        acc[item.cleanedClass].totalOccurrences += Number(item.totalOccurrences);
        
        // Track most common day and time
        if (!acc[item.cleanedClass].dayOfWeek.includes(item.dayOfWeek)) {
          acc[item.cleanedClass].dayOfWeek.push(item.dayOfWeek);
        }
        if (!acc[item.cleanedClass].classTime.includes(item.classTime)) {
          acc[item.cleanedClass].classTime.push(item.classTime);
        }
        return acc;
      }, {} as Record<string, any>);

      const classes = Object.values(grouped).map(item => ({
        ...item,
        average: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageIncludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        classAverageExcludingEmpty: item.totalOccurrences > 0 ? item.totalCheckins / item.totalOccurrences : 0,
        // Format day and time for display
        dayOfWeek: Array.isArray(item.dayOfWeek) ? item.dayOfWeek.join(', ') : item.dayOfWeek,
        classTime: Array.isArray(item.classTime) ? item.classTime.join(', ') : item.classTime
      }));

      return {
        top: classes
          .sort((a, b) => metric === 'attendance'
            ? b.average - a.average
            : b.totalRevenue - a.totalRevenue
          )
          .slice(0, 5),
        bottom: classes
          .sort((a, b) => metric === 'attendance'
            ? a.average - b.average
            : a.totalRevenue - b.totalRevenue
          )
          .slice(0, 5)
      };
    }
  };

  const { top, bottom } = getTopBottomClasses();

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
            <h3 className="text-lg font-semibold mb-4">Top 5 Classes</h3>
            <div className="space-y-4">
              {top.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 w-8">
                      #{index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="font-medium">{item.cleanedClass}</p>
                      {groupByTrainer && (
                        <p className="text-sm text-muted-foreground">{item.teacherName}</p>
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Classes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bottom 5 Classes</h3>
            <div className="space-y-4">
              {bottom.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-red-500 dark:text-red-400 w-8">
                      #{5 - index}
                    </span>
                    <div className="space-y-1">
                      <p className="font-medium">{item.cleanedClass}</p>
                      {groupByTrainer && (
                        <p className="text-sm text-muted-foreground">{item.teacherName}</p>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopBottomClasses;
