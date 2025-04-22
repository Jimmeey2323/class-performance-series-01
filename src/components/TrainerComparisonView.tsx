
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TrainerComparisonViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

interface TrainerClassStats {
  dayOfWeek: string;
  classTime: string;
  cleanedClass: string;
  trainers: {
    name: string;
    avatarUrl: string;
    avgAttendance: number;
    totalOccurrences: number;
    totalCheckins: number;
  }[];
}

const TrainerComparisonView: React.FC<TrainerComparisonViewProps> = ({ data, trainerAvatars }) => {
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'difference' | 'highest'>('difference');

  // Process data to find same class-time-day combinations with different trainers
  const classComparisons = useMemo(() => {
    const classMap: Record<string, TrainerClassStats> = {};
    
    // Filter out "hosted" and "recovery" classes
    const filteredData = data.filter(item => 
      !item.cleanedClass.toLowerCase().includes('hosted') && 
      !item.cleanedClass.toLowerCase().includes('recovery')
    );
    
    // Group classes by day-time-class
    filteredData.forEach(item => {
      const key = `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}`;
      const avgAttendance = parseFloat(item.classAverageExcludingEmpty) || 0;
      
      if (!classMap[key]) {
        classMap[key] = {
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          cleanedClass: item.cleanedClass,
          trainers: []
        };
      }
      
      // Check if this trainer already exists in the list
      const existingTrainerIndex = classMap[key].trainers.findIndex(
        t => t.name === item.teacherName
      );
      
      if (existingTrainerIndex === -1) {
        // Add new trainer
        classMap[key].trainers.push({
          name: item.teacherName,
          avatarUrl: trainerAvatars[item.teacherName] || '',
          avgAttendance: avgAttendance,
          totalOccurrences: item.totalOccurrences,
          totalCheckins: item.totalCheckins
        });
      } else if (avgAttendance > classMap[key].trainers[existingTrainerIndex].avgAttendance) {
        // Update existing trainer if new average is higher
        classMap[key].trainers[existingTrainerIndex].avgAttendance = avgAttendance;
        classMap[key].trainers[existingTrainerIndex].totalOccurrences = item.totalOccurrences;
        classMap[key].trainers[existingTrainerIndex].totalCheckins = item.totalCheckins;
      }
    });
    
    // Filter to only include classes with multiple trainers and minimum occurrences
    const multiTrainerClasses = Object.values(classMap)
      .filter(item => 
        item.trainers.length > 1 && 
        item.trainers.every(trainer => trainer.totalOccurrences >= minOccurrences)
      );
    
    // Sort classes based on selected criteria
    if (sortBy === 'difference') {
      multiTrainerClasses.sort((a, b) => {
        const aDiff = getMaxDifference(a.trainers);
        const bDiff = getMaxDifference(b.trainers);
        return bDiff - aDiff;
      });
    } else {
      multiTrainerClasses.sort((a, b) => {
        const aMax = Math.max(...a.trainers.map(t => t.avgAttendance));
        const bMax = Math.max(...b.trainers.map(t => t.avgAttendance));
        return bMax - aMax;
      });
    }
    
    return multiTrainerClasses;
  }, [data, trainerAvatars, minOccurrences, sortBy]);
  
  // Helper function to get the maximum difference between trainers' average attendance
  const getMaxDifference = (trainers: TrainerClassStats['trainers']) => {
    if (trainers.length <= 1) return 0;
    const attendances = trainers.map(t => t.avgAttendance);
    return Math.max(...attendances) - Math.min(...attendances);
  };
  
  const toggleExpanded = (key: string) => {
    if (expanded.includes(key)) {
      setExpanded(expanded.filter(k => k !== key));
    } else {
      setExpanded([...expanded, key]);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Trainer Performance Comparison
        </CardTitle>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Min. Occurrences: {minOccurrences}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setMinOccurrences(1)}>
                Min. Occurrences: 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMinOccurrences(2)}>
                Min. Occurrences: 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMinOccurrences(3)}>
                Min. Occurrences: 3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMinOccurrences(5)}>
                Min. Occurrences: 5
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy === 'difference' ? 'Biggest Difference' : 'Highest Attendance'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('difference')}>
                Biggest Difference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('highest')}>
                Highest Attendance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {classComparisons.length > 0 ? (
            classComparisons.map(classItem => {
              const key = `${classItem.dayOfWeek}-${classItem.classTime}-${classItem.cleanedClass}`;
              const isExpanded = expanded.includes(key);
              
              // Sort trainers by average attendance (high to low)
              const sortedTrainers = [...classItem.trainers].sort((a, b) => b.avgAttendance - a.avgAttendance);
              const highestAvg = sortedTrainers[0]?.avgAttendance || 0;
              
              return (
                <Card key={key} className="overflow-hidden">
                  <CardHeader className="bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => toggleExpanded(key)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-base">{classItem.cleanedClass}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {classItem.dayOfWeek}, {classItem.classTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {sortedTrainers.slice(0, 3).map(trainer => (
                            <Avatar key={trainer.name} className="border-2 border-white dark:border-slate-800 h-8 w-8">
                              <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
                              <AvatarFallback className="text-xs">{getInitials(trainer.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {sortedTrainers.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs border-2 border-white dark:border-slate-800">
                              +{sortedTrainers.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded text-xs text-indigo-700 dark:text-indigo-300">
                          <BarChart3 className="h-3 w-3" />
                          <span>Difference: {getMaxDifference(classItem.trainers).toFixed(1)}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {sortedTrainers.map(trainer => {
                          // Calculate the percentage width for the bar chart
                          const percentage = (trainer.avgAttendance / highestAvg) * 100;
                          const isHighest = trainer.avgAttendance === highestAvg;
                          
                          return (
                            <div key={trainer.name} className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
                                <AvatarFallback>{getInitials(trainer.name)}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-sm font-medium mb-1">
                                  <span>{trainer.name}</span>
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <span className={`font-semibold ${isHighest ? 'text-green-600 dark:text-green-400' : ''}`}>
                                        {trainer.avgAttendance.toFixed(1)} avg
                                      </span>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-60">
                                      <div className="space-y-1">
                                        <h4 className="font-semibold text-sm">Trainer Stats:</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Occurrences: {trainer.totalOccurrences}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Check-ins: {trainer.totalCheckins}</p>
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                </div>
                                
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${isHighest ? 'bg-green-500 dark:bg-green-600' : 'bg-blue-400 dark:bg-blue-600'}`} 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">
                No comparable classes found with different trainers (min. {minOccurrences} occurrences each).
                Try adjusting the minimum occurrences requirement.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default TrainerComparisonView;
