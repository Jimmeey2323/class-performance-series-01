
import React, { useState, useEffect } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import { motion } from 'framer-motion';

interface KanbanViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const KanbanView: React.FC<KanbanViewProps> = ({ data, trainerAvatars }) => {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, ProcessedData[]>>({});
  
  // Order days of week correctly
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  useEffect(() => {
    // Group the data by day of the week
    const grouped = data.reduce<Record<string, ProcessedData[]>>((acc, item) => {
      if (!acc[item.dayOfWeek]) {
        acc[item.dayOfWeek] = [];
      }
      acc[item.dayOfWeek].push(item);
      return acc;
    }, {});
    
    // Sort items within each day by classTime
    for (const day in grouped) {
      grouped[day].sort((a, b) => {
        // Convert time strings to comparable format
        const timeA = a.classTime;
        const timeB = b.classTime;
        return timeA.localeCompare(timeB);
      });
    }
    
    setGroupedByDay(grouped);
  }, [data]);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120
      }
    }
  };

  return (
    <div className="p-4 overflow-x-auto">
      <motion.div 
        className="flex space-x-4 min-w-[1200px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {daysOrder.map((day) => (
          <motion.div 
            key={day}
            className="flex-1"
            variants={columnVariants}
          >
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
              <h3 className="font-semibold text-center">{day}</h3>
              <div className="text-xs text-center text-muted-foreground">
                {groupedByDay[day]?.length || 0} Classes
              </div>
            </div>
            
            <div className="space-y-3 h-[calc(100vh-300px)] overflow-y-auto pr-2 pt-1 pb-10">
              {groupedByDay[day]?.map((item, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="transform transition-transform"
                >
                  <Card className="overflow-hidden hover:shadow-md border-l-4 border-l-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                          {item.classTime}
                        </Badge>
                        <div className="flex space-x-1">
                          {item.totalOccurrences > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {item.totalOccurrences}x
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1">{item.cleanedClass}</h4>
                      
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {trainerAvatars[item.teacherName] ? (
                            <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(item.teacherName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.teacherName}
                        </p>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Check-ins</p>
                          <p className="font-medium">{item.totalCheckins}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-medium">{formatIndianCurrency(Number(item.totalRevenue))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg. Attendance</p>
                          <p className="font-medium">
                            {typeof item.classAverageIncludingEmpty === 'number'
                              ? item.classAverageIncludingEmpty.toFixed(1)
                              : item.classAverageIncludingEmpty}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium truncate">{item.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {(!groupedByDay[day] || groupedByDay[day].length === 0) && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No classes for {day}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default KanbanView;
