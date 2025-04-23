
import React, { useState, useEffect } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from './kanban/KanbanCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, ArrowUp, ArrowDown, Users, CalendarDays } from 'lucide-react';
import { formatIndianCurrency } from '@/components/MetricsPanel';

interface TimelineViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const TimelineView: React.FC<TimelineViewProps> = ({ data, trainerAvatars }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'attendance'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Get all unique periods from data
  const periods = React.useMemo(() => {
    return Array.from(new Set(data.map(item => item.period))).filter(Boolean).sort((a, b) => {
      // Sort periods (format: "Jan-22", "Feb-22", etc.)
      if (!a || !b) return 0;
      const [aMonth, aYear] = a.split('-');
      const [bMonth, bYear] = b.split('-');
      
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
  }, [data]);
  
  // Days of week in correct order
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Group and sort data for timeline view
  const timelineData = React.useMemo(() => {
    // Filter data based on search and selected period
    let filteredData = data.filter(item => {
      const matchesSearch = !searchQuery || 
        item.cleanedClass.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPeriod = !selectedPeriod || item.period === selectedPeriod;
      
      return matchesSearch && matchesPeriod;
    });
    
    // Group by day of week
    const groupedByDay = daysOfWeek.map(day => {
      const dayItems = filteredData.filter(item => item.dayOfWeek === day);
      
      // Sort items based on selected criteria
      let sortedItems = [...dayItems];
      if (sortBy === 'time') {
        sortedItems.sort((a, b) => {
          // Convert time strings (e.g. "6:00 AM") to comparable values
          const getTimeValue = (timeStr: string) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          };
          
          const aTime = getTimeValue(a.classTime);
          const bTime = getTimeValue(b.classTime);
          
          return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
        });
      } else if (sortBy === 'attendance') {
        sortedItems.sort((a, b) => {
          const aAttendance = parseFloat(String(a.classAverageExcludingEmpty || 0)) || 0;
          const bAttendance = parseFloat(String(b.classAverageExcludingEmpty || 0)) || 0;
          
          return sortDirection === 'asc' ? aAttendance - bAttendance : bAttendance - aAttendance;
        });
      }
      
      return {
        day,
        items: sortedItems
      };
    });
    
    // Filter out days with no classes
    return groupedByDay.filter(group => group.items.length > 0);
  }, [data, searchQuery, selectedPeriod, sortBy, sortDirection]);
  
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  // Get attendance badge color
  const getAttendanceBadgeColor = (value: number) => {
    if (value >= 10) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    if (value >= 7) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    if (value >= 4) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  };
  
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          <Select value={selectedPeriod || ''} onValueChange={(value) => setSelectedPeriod(value || null)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All periods</SelectItem>
              {periods.map(period => (
                <SelectItem key={period} value={period as string}>{period}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'time' | 'attendance')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">Sort by time</SelectItem>
              <SelectItem value="attendance">Sort by attendance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={toggleSortDirection}>
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <AnimatePresence>
          {timelineData.map(dayGroup => (
            <motion.div 
              key={dayGroup.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {dayGroup.day}
                    <Badge variant="outline">{dayGroup.items.length} classes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative pl-10 pr-4 pt-4 pb-4">
                    {/* Timeline track */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    
                    <div className="space-y-4">
                      {dayGroup.items.map((item, index) => {
                        const attendance = parseFloat(String(item.classAverageExcludingEmpty || 0)) || 0;
                        
                        return (
                          <motion.div 
                            key={`${item.dayOfWeek}-${item.classTime}-${item.cleanedClass}-${item.teacherName}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="relative"
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-6 mt-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background"></div>
                            
                            {/* Time label */}
                            <div className="absolute -left-24 mt-1 text-xs font-medium text-muted-foreground">
                              {item.classTime}
                            </div>
                            
                            <Card className="mb-1 hover:shadow-md transition-shadow">
                              <CardContent className="p-3 flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{item.cleanedClass}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" /> {item.classTime}
                                    <span className="mx-1">•</span>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1">{item.period}</Badge>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <Badge className={getAttendanceBadgeColor(attendance)}>
                                    {attendance.toFixed(1)}
                                  </Badge>
                                  
                                  <div className="text-xs mr-2 text-right">
                                    <div className="font-medium">{formatIndianCurrency(typeof item.totalRevenue === 'number' ? item.totalRevenue : parseFloat(String(item.totalRevenue || 0)))}</div>
                                    <div className="text-muted-foreground">{item.totalCheckins} check-ins</div>
                                  </div>
                                  
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                                    <AvatarFallback>{getInitials(item.teacherName)}</AvatarFallback>
                                  </Avatar>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {timelineData.length === 0 && (
          <div className="mt-10 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No classes match your search criteria</p>
            <Button variant="link" onClick={() => {
              setSearchQuery('');
              setSelectedPeriod(null);
            }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
