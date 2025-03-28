
import React, { useMemo, useState } from 'react';
import { ProcessedData, TopBottomClassData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountUp from 'react-countup';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [includeTrainers, setIncludeTrainers] = useState(false);

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
    
    // Create a map to group by class type (with or without trainer)
    const classMap = new Map<string, ProcessedData[]>();
    
    filteredData.forEach(item => {
      // Define the key based on whether we include trainers
      const key = includeTrainers ? 
        `${item.cleanedClass} - ${item.teacherName}` : 
        item.cleanedClass;
      
      if (!classMap.has(key)) {
        classMap.set(key, []);
      }
      
      classMap.get(key)!.push(item);
    });
    
    // Calculate averages for each unique class/class+trainer combination
    const classAverages: {
      key: string;
      cleanedClass: string;
      teacherName: string;
      averageAttendance: number;
      totalOccurrences: number;
      isTopPerformer: boolean;
    }[] = [];
    
    classMap.forEach((items, key) => {
      const totalAttendance = items.reduce((sum, item) => {
        const avg = item.classAverageExcludingEmpty === 'N/A' ? 
          0 : parseFloat(item.classAverageExcludingEmpty);
        return sum + avg;
      }, 0);
      
      const totalOccurrences = items.reduce((sum, item) => sum + item.totalOccurrences, 0);
      
      // Extract class and teacher from the first item
      const { cleanedClass, teacherName } = items[0];
      
      classAverages.push({
        key,
        cleanedClass,
        teacherName,
        averageAttendance: totalAttendance / items.length,
        totalOccurrences,
        isTopPerformer: true
      });
    });
    
    // Sort by average attendance
    classAverages.sort((a, b) => b.averageAttendance - a.averageAttendance);
    
    // Get top 10 and bottom 10
    const top = classAverages.slice(0, 10).map(item => ({
      ...item,
      isTopPerformer: true
    }));
    
    const bottom = classAverages.slice(-10).reverse().map(item => ({
      ...item,
      isTopPerformer: false
    }));
    
    return { topClasses: top, bottomClasses: bottom };
  }, [data, includeTrainers]);

  // Get initials from teacher name for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Generate a consistent color based on the teacher's name
  const generateAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500', 'bg-sky-500'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const renderClassItem = (classData: any, index: number) => {
    const teacherInitials = getInitials(classData.teacherName);
    const avatarColor = generateAvatarColor(classData.teacherName);
    
    return (
      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          classData.isTopPerformer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-medium truncate">{includeTrainers ? classData.key : classData.cleanedClass}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {includeTrainers && (
              <Avatar className="h-5 w-5">
                <AvatarFallback className={`text-xs text-white ${avatarColor}`}>
                  {teacherInitials}
                </AvatarFallback>
              </Avatar>
            )}
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
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h3 className="text-lg font-semibold">Class Performance Ranking</h3>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="include-trainers"
            checked={includeTrainers}
            onCheckedChange={setIncludeTrainers}
          />
          <Label htmlFor="include-trainers">Include Trainers</Label>
        </div>
      </div>
      
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
