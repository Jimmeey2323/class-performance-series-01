import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronDown, ChevronUp, BarChart3, Info, Search, Filter, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    totalRevenue: number;
  }[];
}

const TrainerComparisonView: React.FC<TrainerComparisonViewProps> = ({ data, trainerAvatars }) => {
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'difference' | 'highest'>('difference');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);

  const allTrainers = useMemo(() => {
    const trainers = new Set<string>();
    data.forEach(item => {
      if (item.teacherName) trainers.add(item.teacherName);
    });
    return Array.from(trainers).sort();
  }, [data]);

  const classComparisons = useMemo(() => {
    const classMap: Record<string, TrainerClassStats> = {};
    
    const filteredData = data.filter(item => 
      !item.cleanedClass.toLowerCase().includes('hosted') && 
      !item.cleanedClass.toLowerCase().includes('recovery')
    );
    
    filteredData.forEach(item => {
      const key = `${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}`;
      const avgAttendance = parseFloat(item.classAverageExcludingEmpty) || 0;
      const revenue = typeof item.totalRevenue === 'number' ? item.totalRevenue : parseInt(item.totalRevenue) || 0;
      
      if (!classMap[key]) {
        classMap[key] = {
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          cleanedClass: item.cleanedClass,
          trainers: []
        };
      }
      
      const existingTrainerIndex = classMap[key].trainers.findIndex(
        t => t.name === item.teacherName
      );
      
      if (existingTrainerIndex === -1) {
        classMap[key].trainers.push({
          name: item.teacherName,
          avatarUrl: trainerAvatars[item.teacherName] || '',
          avgAttendance: avgAttendance,
          totalOccurrences: item.totalOccurrences,
          totalCheckins: item.totalCheckins,
          totalRevenue: revenue
        });
      } else {
        const existingTrainer = classMap[key].trainers[existingTrainerIndex];
        const totalOccurrences = existingTrainer.totalOccurrences + item.totalOccurrences;
        const weightedAvg = totalOccurrences > 0 
          ? ((existingTrainer.avgAttendance * existingTrainer.totalOccurrences) + 
             (avgAttendance * item.totalOccurrences)) / totalOccurrences
          : 0;
        
        classMap[key].trainers[existingTrainerIndex] = {
          ...existingTrainer,
          avgAttendance: weightedAvg,
          totalOccurrences: totalOccurrences,
          totalCheckins: existingTrainer.totalCheckins + item.totalCheckins,
          totalRevenue: existingTrainer.totalRevenue + revenue
        };
      }
    });
    
    let multiTrainerClasses = Object.values(classMap)
      .filter(item => 
        item.trainers.length > 1 && 
        item.trainers.every(trainer => trainer.totalOccurrences >= minOccurrences)
      );
    
    if (selectedTrainers.length > 0) {
      multiTrainerClasses = multiTrainerClasses.filter(item => 
        item.trainers.some(trainer => selectedTrainers.includes(trainer.name))
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      multiTrainerClasses = multiTrainerClasses.filter(item => 
        item.cleanedClass.toLowerCase().includes(query) ||
        item.dayOfWeek.toLowerCase().includes(query) ||
        item.trainers.some(trainer => trainer.name.toLowerCase().includes(query))
      );
    }
    
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
  }, [data, trainerAvatars, minOccurrences, sortBy, searchQuery, selectedTrainers]);

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const toggleTrainerSelection = (name: string) => {
    if (selectedTrainers.includes(name)) {
      setSelectedTrainers(selectedTrainers.filter(t => t !== name));
    } else {
      setSelectedTrainers([...selectedTrainers, name]);
    }
  };

  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)} Cr`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(1)} L`;
    } else {
      return value.toLocaleString('en-IN');
    }
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  This view shows classes that have been taught by multiple trainers, allowing you to compare their performance.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search class name or trainer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <Filter className="h-4 w-4" />
                  {selectedTrainers.length ? `${selectedTrainers.length} Trainers` : 'Filter Trainers'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 max-h-[300px] overflow-y-auto">
                {allTrainers.map(trainer => (
                  <DropdownMenuItem 
                    key={trainer}
                    onClick={() => toggleTrainerSelection(trainer)}
                    className="flex items-center gap-2"
                  >
                    <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${selectedTrainers.includes(trainer) ? 'bg-primary border-primary' : 'border-input'}`}>
                      {selectedTrainers.includes(trainer) && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.5 2.5L3.5 7.5L1.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <Avatar className="h-6 w-6 mr-1">
                      <AvatarImage src={trainerAvatars[trainer]} alt={trainer} />
                      <AvatarFallback className="text-[10px]">{getInitials(trainer)}</AvatarFallback>
                    </Avatar>
                    {trainer}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {selectedTrainers.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedTrainers.map(trainer => (
                <Badge key={trainer} variant="secondary" className="flex items-center gap-1">
                  {trainer}
                  <button onClick={() => toggleTrainerSelection(trainer)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedTrainers.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTrainers([])}>
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {classComparisons.length > 0 ? (
            <AnimatePresence>
              {classComparisons.map((classItem, idx) => {
                const key = `${classItem.dayOfWeek}-${classItem.classTime}-${classItem.cleanedClass}`;
                const isExpanded = expanded.includes(key);
                
                const sortedTrainers = [...classItem.trainers].sort((a, b) => b.avgAttendance - a.avgAttendance);
                const highestAvg = sortedTrainers[0]?.avgAttendance || 0;
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-300">
                      <div 
                        className="p-4 cursor-pointer border-l-4 border-indigo-500 transition-colors hover:bg-gray-50 dark:hover:bg-gray-750" 
                        onClick={() => toggleExpanded(key)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-base">{classItem.cleanedClass}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {classItem.dayOfWeek}, {classItem.classTime}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {sortedTrainers.slice(0, 3).map(trainer => (
                                <Avatar key={trainer.name} className="border-2 border-white dark:border-gray-800 h-8 w-8">
                                  <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />
                                  <AvatarFallback className="text-xs">{getInitials(trainer.name)}</AvatarFallback>
                                </Avatar>
                              ))}
                              {sortedTrainers.length > 3 && (
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs border-2 border-white dark:border-gray-800">
                                  +{sortedTrainers.length - 3}
                                </div>
                              )}
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800">
                              Diff: {getMaxDifference(classItem.trainers).toFixed(1)}
                            </Badge>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                              <div className="space-y-4">
                                {sortedTrainers.map((trainer, idx) => {
                                  const percentage = (trainer.avgAttendance / highestAvg) * 100;
                                  const isHighest = trainer.avgAttendance === highestAvg;
                                  
                                  return (
                                    <motion.div 
                                      key={trainer.name}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                                      className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                                    >
                                      <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
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
                                            <HoverCardContent className="w-64">
                                              <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">Trainer Stats</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                  <div className="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                                                    <div className="text-gray-500 dark:text-gray-400">Occurrences</div>
                                                    <div className="font-medium">{trainer.totalOccurrences}</div>
                                                  </div>
                                                  <div className="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                                                    <div className="text-gray-500 dark:text-gray-400">Total Check-ins</div>
                                                    <div className="font-medium">{trainer.totalCheckins}</div>
                                                  </div>
                                                  <div className="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                                                    <div className="text-gray-500 dark:text-gray-400">Avg. Attendance</div>
                                                    <div className="font-medium">{trainer.avgAttendance.toFixed(1)}</div>
                                                  </div>
                                                  <div className="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                                                    <div className="text-gray-500 dark:text-gray-400">Total Revenue</div>
                                                    <div className="font-medium">₹{formatIndianCurrency(trainer.totalRevenue)}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            </HoverCardContent>
                                          </HoverCard>
                                        </div>
                                        
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                          <div 
                                            className={`h-2 rounded-full ${isHighest ? 'bg-green-500 dark:bg-green-600' : 'bg-indigo-400 dark:bg-indigo-600'}`}
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          <span>{trainer.totalOccurrences} classes</span>
                                          <span>{trainer.totalCheckins} check-ins</span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                                
                                <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Performance Summary</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Top Performer</div>
                                      <div className="font-medium flex items-center gap-2 mt-1">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={sortedTrainers[0]?.avatarUrl} />
                                          <AvatarFallback>{getInitials(sortedTrainers[0]?.name || '')}</AvatarFallback>
                                        </Avatar>
                                        {sortedTrainers[0]?.name}
                                      </div>
                                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        {sortedTrainers[0]?.avgAttendance.toFixed(1)} average
                                      </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Attendance Difference</div>
                                      <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                        {getMaxDifference(classItem.trainers).toFixed(1)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        between highest and lowest performer
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <Users className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No comparable classes found with different trainers (min. {minOccurrences} occurrences each).
                Try adjusting the minimum occurrences requirement or the trainer filter.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setMinOccurrences(1);
                  setSelectedTrainers([]);
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default TrainerComparisonView;
