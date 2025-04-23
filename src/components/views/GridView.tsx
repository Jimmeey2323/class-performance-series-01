
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from './kanban/KanbanCard';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Search, Users, Star, Calendar, Clock, X } from 'lucide-react';
import { formatIndianCurrency } from '@/components/MetricsPanel';

interface GridViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const GridView: React.FC<GridViewProps> = ({ data, trainerAvatars }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
  
  // Get unique days of week from data
  const days = Array.from(new Set(data.map(item => item.dayOfWeek))).sort((a, b) => {
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return order.indexOf(a) - order.indexOf(b);
  });
  
  // Get unique trainers from data
  const trainers = Array.from(new Set(data.map(item => item.teacherName))).sort();
  
  // Filter data based on search query and filters
  const filteredData = data.filter(item => {
    const matchesSearch = 
      !searchQuery || 
      item.cleanedClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDay = !selectedDay || item.dayOfWeek === selectedDay;
    const matchesTrainer = !selectedTrainer || item.teacherName === selectedTrainer;
    
    return matchesSearch && matchesDay && matchesTrainer;
  });
  
  // Sort data by attendance (high to low)
  const sortedData = [...filteredData].sort((a, b) => {
    const aAttendance = parseFloat(String(a.classAverageExcludingEmpty || 0)) || 0;
    const bAttendance = parseFloat(String(b.classAverageExcludingEmpty || 0)) || 0;
    return bAttendance - aAttendance;
  });
  
  const getAttendanceBadgeColor = (value: number) => {
    if (value >= 10) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    if (value >= 7) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    if (value >= 4) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  };
  
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes or trainers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          {selectedDay && (
            <Badge variant="secondary" className="flex gap-1 items-center">
              <Calendar className="h-3 w-3" />
              {selectedDay}
              <button onClick={() => setSelectedDay(null)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedTrainer && (
            <Badge variant="secondary" className="flex gap-1 items-center">
              <Users className="h-3 w-3" />
              {selectedTrainer}
              <button onClick={() => setSelectedTrainer(null)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(selectedDay || selectedTrainer) && (
            <Button variant="ghost" size="sm" className="h-7" onClick={() => {
              setSelectedDay(null);
              setSelectedTrainer(null);
            }}>
              Clear all
            </Button>
          )}
        </div>
        
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'compact' | 'detailed')} className="w-auto">
          <TabsList className="h-8">
            <TabsTrigger value="detailed" className="text-xs px-2">Detailed</TabsTrigger>
            <TabsTrigger value="compact" className="text-xs px-2">Compact</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex overflow-x-auto pb-1 gap-1 max-w-full">
          {days.map(day => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
            >
              {day}
            </Button>
          ))}
        </div>
        
        <div className="flex overflow-x-auto pb-1 gap-1 max-w-full">
          {trainers.slice(0, 8).map(trainer => (
            <Button
              key={trainer}
              variant={selectedTrainer === trainer ? "default" : "outline"}
              size="sm"
              className="h-7 flex gap-1 whitespace-nowrap text-xs"
              onClick={() => setSelectedTrainer(selectedTrainer === trainer ? null : trainer)}
            >
              <Avatar className="h-4 w-4 mr-1">
                <AvatarImage src={trainerAvatars[trainer]} alt={trainer} />
                <AvatarFallback className="text-[8px]">{getInitials(trainer)}</AvatarFallback>
              </Avatar>
              {trainer.split(' ')[0]}
            </Button>
          ))}
          
          {trainers.length > 8 && (
            <Button variant="outline" size="sm" className="h-7 text-xs">
              +{trainers.length - 8} more
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {sortedData.map((item, index) => (
            <motion.div 
              key={`${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}-${item.teacherName}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              {viewMode === 'detailed' ? (
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-1 w-full ${
                    item.dayOfWeek === 'Monday' ? 'bg-blue-500' :
                    item.dayOfWeek === 'Tuesday' ? 'bg-purple-500' :
                    item.dayOfWeek === 'Wednesday' ? 'bg-green-500' :
                    item.dayOfWeek === 'Thursday' ? 'bg-amber-500' :
                    item.dayOfWeek === 'Friday' ? 'bg-red-500' :
                    item.dayOfWeek === 'Saturday' ? 'bg-pink-500' :
                    'bg-indigo-500'
                  }`}></div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-sm font-medium">
                        {item.cleanedClass}
                      </CardTitle>
                      <Badge className={getAttendanceBadgeColor(parseFloat(String(item.classAverageExcludingEmpty || 0)))}>
                        {parseFloat(String(item.classAverageExcludingEmpty || 0)).toFixed(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.dayOfWeek}
                        <Clock className="h-3 w-3 ml-1" />
                        {item.classTime}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <Avatar className="h-7 w-7 mr-2">
                          <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                          <AvatarFallback>{getInitials(item.teacherName)}</AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                          <div className="font-medium">{item.teacherName}</div>
                          <div className="text-muted-foreground">{item.period || 'No period'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Classes</div>
                        <div className="font-semibold">{item.totalOccurrences}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Check-ins</div>
                        <div className="font-semibold">{item.totalCheckins}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Revenue</div>
                        <div className="font-semibold">
                          {formatIndianCurrency(typeof item.totalRevenue === 'number' ? item.totalRevenue : parseFloat(String(item.totalRevenue || 0)))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{item.cleanedClass}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {item.dayOfWeek}, {item.classTime}
                        </div>
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                        <AvatarFallback className="text-[10px]">{getInitials(item.teacherName)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground mr-1">Avg:</span>
                        <span className="font-medium">{parseFloat(String(item.classAverageExcludingEmpty || 0)).toFixed(1)}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground mr-1">Check-ins:</span>
                        <span className="font-medium">{item.totalCheckins}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {sortedData.length === 0 && (
        <div className="mt-10 text-center text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No classes match your search criteria</p>
          <Button variant="link" onClick={() => {
            setSearchQuery('');
            setSelectedDay(null);
            setSelectedTrainer(null);
          }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default GridView;
