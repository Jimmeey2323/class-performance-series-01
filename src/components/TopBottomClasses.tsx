
import React, { useMemo } from 'react';
import { ProcessedData, TopBottomClassData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountUp from 'react-countup';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const { topClasses, bottomClasses } = useMemo(() => {
    // Filter out classes with "Recovery" or "Hosted" in the name
    // Also filter classes with only 1 occurrence and future dates
    const today = new Date();
    
    const filteredData = data.filter(item => {
      const name = item.cleanedClass.toLowerCase();
      const isValidClass = !name.includes('recovery') && !name.includes('hosted');
      const hasMultipleOccurrences = item.totalOccurrences > 1;
      
      // Parse period (e.g., "Jan-22") to check if it's before today
      let isPastClass = true;
      if (item.period) {
        const [month, year] = item.period.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = months.indexOf(month);
        const fullYear = 2000 + parseInt(year); // Assuming years are in format '22' for 2022
        
        const periodDate = new Date(fullYear, monthIndex);
        isPastClass = periodDate <= today;
      }
      
      return isValidClass && hasMultipleOccurrences && isPastClass;
    });
    
    // Sort by class average (excluding empty)
    const sortedByAverage = [...filteredData].sort((a, b) => {
      const avgA = a.classAverageExcludingEmpty === 'N/A' ? 0 : parseFloat(a.classAverageExcludingEmpty);
      const avgB = b.classAverageExcludingEmpty === 'N/A' ? 0 : parseFloat(b.classAverageExcludingEmpty);
      return avgB - avgA; // Descending order
    });
    
    // Get the top 10 and bottom 10 classes
    const top = sortedByAverage.slice(0, 10).map(item => ({
      cleanedClass: item.cleanedClass,
      averageAttendance: parseFloat(item.classAverageExcludingEmpty === 'N/A' ? '0' : item.classAverageExcludingEmpty),
      totalOccurrences: item.totalOccurrences,
      isTopPerformer: true
    }));
    
    const bottom = sortedByAverage.slice(-10).reverse().map(item => ({
      cleanedClass: item.cleanedClass,
      averageAttendance: parseFloat(item.classAverageExcludingEmpty === 'N/A' ? '0' : item.classAverageExcludingEmpty),
      totalOccurrences: item.totalOccurrences,
      isTopPerformer: false
    }));
    
    return { topClasses: top, bottomClasses: bottom };
  }, [data]);

  const renderClassItem = (classData: TopBottomClassData, index: number) => (
    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        classData.isTopPerformer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {index + 1}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-medium truncate">{classData.cleanedClass}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{classData.totalOccurrences} classes</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xl font-bold">
          <CountUp 
            end={classData.averageAttendance} 
            decimals={1}
            duration={1.5}
            delay={index * 0.1}
          />
        </div>
        <div className={`flex items-center text-xs ${
          classData.isTopPerformer ? 'text-green-600' : 'text-red-600'
        }`}>
          {classData.isTopPerformer ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          Avg. Attendance
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Class Performance Ranking</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Classes with multiple occurrences (excluding Recovery and Hosted classes)
      </p>
      
      <Tabs defaultValue="top">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Top 10 Classes</span>
          </TabsTrigger>
          <TabsTrigger value="bottom" className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span>Bottom 10 Classes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="top" className="mt-4">
          {topClasses.length > 0 ? (
            <div className="grid gap-2">
              {topClasses.map((classData, index) => renderClassItem(classData, index))}
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No qualifying class data available
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bottom" className="mt-4">
          {bottomClasses.length > 0 ? (
            <div className="grid gap-2">
              {bottomClasses.map((classData, index) => renderClassItem(classData, index))}
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No qualifying class data available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopBottomClasses;
