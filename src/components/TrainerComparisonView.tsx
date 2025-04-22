
import React, { useState, useMemo } from 'react';
import { ProcessedData, TrainerClassStats } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronDown, ChevronUp, BarChart3, Calendar, Clock, Search, SlidersHorizontal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface TrainerComparisonViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const TrainerComparisonView: React.FC<TrainerComparisonViewProps> = ({ data, trainerAvatars }) => {
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'difference' | 'highest'>('difference');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('class-comparison');

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
          totalCheckins: item.totalCheckins,
          totalRevenue: item.totalRevenue || "0"
        });
      } else if (avgAttendance > classMap[key].trainers[existingTrainerIndex].avgAttendance) {
        // Update existing trainer if new average is higher
        classMap[key].trainers[existingTrainerIndex].avgAttendance = avgAttendance;
        classMap[key].trainers[existingTrainerIndex].totalOccurrences = item.totalOccurrences;
        classMap[key].trainers[existingTrainerIndex].totalCheckins = item.totalCheckins;
        classMap[key].trainers[existingTrainerIndex].totalRevenue = item.totalRevenue || "0";
      }
    });
    
    // Filter by search query if present
    let comparisons = Object.values(classMap);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      comparisons = comparisons.filter(item => 
        item.cleanedClass.toLowerCase().includes(query) ||
        item.dayOfWeek.toLowerCase().includes(query) ||
        item.classTime.toLowerCase().includes(query) ||
        item.trainers.some(t => t.name.toLowerCase().includes(query))
      );
    }
    
    // Filter to only include classes with multiple trainers and minimum occurrences
    const multiTrainerClasses = comparisons.filter(item => 
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
  }, [data, trainerAvatars, minOccurrences, sortBy, searchQuery]);
  
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
  
  // Format revenue without decimals
  const formatRevenue = (value: string) => {
    return `₹${parseInt(value).toLocaleString('en-IN')}`;
  };

  // Calculate trainer overall stats
  const trainerStats = useMemo(() => {
    const stats: Record<string, { 
      name: string, 
      avatarUrl: string, 
      classes: number, 
      totalCheckins: number, 
      avgAttendance: number,
      totalRevenue: string
    }> = {};
    
    // Filter out "hosted" and "recovery" classes
    const filteredData = data.filter(item => 
      !item.cleanedClass.toLowerCase().includes('hosted') && 
      !item.cleanedClass.toLowerCase().includes('recovery')
    );
    
    filteredData.forEach(item => {
      if (!stats[item.teacherName]) {
        stats[item.teacherName] = {
          name: item.teacherName,
          avatarUrl: trainerAvatars[item.teacherName] || '',
          classes: 1,
          totalCheckins: item.totalCheckins,
          avgAttendance: parseFloat(item.classAverageExcludingEmpty) || 0,
          totalRevenue: item.totalRevenue || "0"
        };
      } else {
        // Update existing stats
        const current = stats[item.teacherName];
        const newClasses = current.classes + 1;
        const newTotalCheckins = current.totalCheckins + item.totalCheckins;
        const newTotalRevenue = (parseFloat(current.totalRevenue) + parseFloat(item.totalRevenue || "0")).toString();
        
        // Calculate weighted average
        const existingWeight = current.classes;
        const newItemWeight = 1;
        const newAvgAttendance = (
          (current.avgAttendance * existingWeight) + 
          (parseFloat(item.classAverageExcludingEmpty) * newItemWeight)
        ) / (existingWeight + newItemWeight);
        
        stats[item.teacherName] = {
          ...current,
          classes: newClasses,
          totalCheckins: newTotalCheckins,
          avgAttendance: newAvgAttendance,
          totalRevenue: newTotalRevenue
        };
      }
    });
    
    // Convert to array and sort by average attendance
    return Object.values(stats)
      .filter(trainer => trainer.classes >= minOccurrences)
      .sort((a, b) => b.avgAttendance - a.avgAttendance);
  }, [data, trainerAvatars, minOccurrences]);

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Trainer Performance Analysis
        </CardTitle>
        <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="class-comparison">Class Comparison</TabsTrigger>
              <TabsTrigger value="trainer-ranking">Trainer Ranking</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Options
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
                <BarChart3 className="h-4 w-4 mr-2" />
                {sortBy === 'difference' ? 'Sort: Difference' : 'Sort: Highest'}
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
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by class name or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <TabsContent value="class-comparison" className="mt-0">
          <div className="space-y-4">
            {classComparisons.length > 0 ? (
              classComparisons.map(classItem => {
                const key = `${classItem.dayOfWeek}-${classItem.classTime}-${classItem.cleanedClass}`;
                const isExpanded = expanded.includes(key);
                
                // Sort trainers by average attendance (high to low)
                const sortedTrainers = [...classItem.trainers].sort((a, b) => b.avgAttendance - a.avgAttendance);
                const highestAvg = sortedTrainers[0]?.avgAttendance || 0;
                
                return (
                  <Card key={key} className="overflow-hidden border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 py-3 cursor-pointer" 
                      onClick={() => toggleExpanded(key)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-base flex items-center gap-2">
                            <span className="text-indigo-700 dark:text-indigo-300">{classItem.cleanedClass}</span>
                            <Badge variant="outline" className="bg-white/70 dark:bg-gray-800/70">
                              Difference: {getMaxDifference(classItem.trainers).toFixed(1)}
                            </Badge>
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {classItem.dayOfWeek}
                            <span className="mx-1">•</span>
                            <Clock className="h-3.5 w-3.5" />
                            {classItem.classTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {sortedTrainers.slice(0, 3).map(trainer => (
                              <Avatar key={trainer.name} className="border-2 border-white dark:border-slate-800 h-8 w-8">
                                <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
                                <AvatarFallback className="text-xs bg-indigo-200 dark:bg-indigo-800">{getInitials(trainer.name)}</AvatarFallback>
                              </Avatar>
                            ))}
                            {sortedTrainers.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs border-2 border-white dark:border-slate-800">
                                +{sortedTrainers.length - 3}
                              </div>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-4 animate-accordion-down">
                        <div className="space-y-4">
                          {sortedTrainers.map((trainer, index) => {
                            // Calculate the percentage width for the bar chart
                            const percentage = (trainer.avgAttendance / highestAvg) * 100;
                            const isHighest = trainer.avgAttendance === highestAvg;
                            
                            return (
                              <div key={trainer.name} className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                    <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
                                    <AvatarFallback className={`${index === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                      {getInitials(trainer.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between text-sm font-medium mb-1">
                                      <div className="flex items-center gap-1">
                                        <span>{trainer.name}</span>
                                        {index === 0 && (
                                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] ml-1 py-0">
                                            TOP
                                          </Badge>
                                        )}
                                      </div>
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <span className={`font-semibold ${isHighest ? 'text-green-600 dark:text-green-400' : ''}`}>
                                            {trainer.avgAttendance.toFixed(1)} avg
                                          </span>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-60">
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Trainer Stats:</h4>
                                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                              <span>Total Occurrences:</span>
                                              <span className="font-medium">{trainer.totalOccurrences}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                              <span>Total Check-ins:</span>
                                              <span className="font-medium">{trainer.totalCheckins}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                              <span>Total Revenue:</span>
                                              <span className="font-medium">{formatRevenue(trainer.totalRevenue)}</span>
                                            </div>
                                          </div>
                                        </HoverCardContent>
                                      </HoverCard>
                                    </div>
                                    
                                    <div className="w-full">
                                      <Progress value={percentage} className={isHighest ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-100 dark:bg-slate-800"} indicatorClassName={isHighest ? "bg-green-500 dark:bg-green-600" : "bg-blue-400 dark:bg-blue-600"} />
                                    </div>
                                    
                                    <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      <span>{trainer.totalOccurrences} classes</span>
                                      <span>{trainer.totalCheckins} check-ins</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {index < sortedTrainers.length - 1 && (
                                  <div className="border-b border-dashed border-slate-200 dark:border-slate-700 my-2"></div>
                                )}
                              </div>
                            );
                          })}
                          
                          <div className="pt-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium flex justify-between">
                            <span>Performance difference: {getMaxDifference(classItem.trainers).toFixed(1)} average attendance</span>
                            <span>
                              {((getMaxDifference(classItem.trainers) / highestAvg) * 100).toFixed(0)}% variation
                            </span>
                          </div>
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
                  Try adjusting the minimum occurrences requirement or search criteria.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="trainer-ranking" className="mt-0">
          <div className="space-y-4">
            {trainerStats.length > 0 ? (
              <div className="grid gap-4 grid-cols-1">
                {trainerStats.map((trainer, index) => {
                  // Calculate max for relative scaling
                  const maxAttendance = trainerStats[0].avgAttendance;
                  const attendancePercentage = (trainer.avgAttendance / maxAttendance) * 100;
                  
                  return (
                    <Card key={trainer.name} className="overflow-hidden border-slate-200 dark:border-slate-700">
                      <div className="flex md:flex-row flex-col p-4">
                        <div className="flex items-start space-x-4 mb-4 md:mb-0 md:w-1/3">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-md">
                              <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
                              <AvatarFallback className="text-lg bg-indigo-200 dark:bg-indigo-800">{getInitials(trainer.name)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -left-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold border border-white dark:border-gray-800">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold">{trainer.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{trainer.classes} classes taught</p>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                {trainer.avgAttendance.toFixed(1)} average attendees
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:w-2/3 space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Average Attendance</span>
                              <span className="font-medium">{trainer.avgAttendance.toFixed(1)}</span>
                            </div>
                            <Progress value={attendancePercentage} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                              <div className="text-xs text-slate-500 dark:text-slate-400">Total Check-ins</div>
                              <div className="text-lg font-semibold">{trainer.totalCheckins.toLocaleString()}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                              <div className="text-xs text-slate-500 dark:text-slate-400">Total Revenue</div>
                              <div className="text-lg font-semibold">{formatRevenue(trainer.totalRevenue)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">
                  No trainers found with at least {minOccurrences} classes.
                  Try adjusting the minimum occurrences requirement.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </CardContent>
    </div>
  );
};

export default TrainerComparisonView;
