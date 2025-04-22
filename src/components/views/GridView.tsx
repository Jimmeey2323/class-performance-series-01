
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { CalendarDays, Users, IndianRupee, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface GridViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

// Format number to Indian format with lakhs and crores
const formatIndianCurrency = (value: number): string => {
  if (value >= 10000000) { // 1 crore
    return `${(value / 10000000).toFixed(1)} Cr`;
  } else if (value >= 100000) { // 1 lakh
    return `${(value / 100000).toFixed(1)} L`;
  } else {
    return value.toLocaleString('en-IN');
  }
};

const GridView: React.FC<GridViewProps> = ({ data, trainerAvatars }) => {
  const [visibleItems, setVisibleItems] = useState(24);
  
  const loadMore = () => {
    setVisibleItems(prev => prev + 24);
  };

  // Sort data by date (newest first) then by attendance (highest first)
  const sortedData = [...data].sort((a, b) => {
    // First by attendance (high to low)
    const attendanceA = parseFloat(a.classAverageExcludingEmpty);
    const attendanceB = parseFloat(b.classAverageExcludingEmpty);
    return attendanceB - attendanceA;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {sortedData.slice(0, visibleItems).map((classItem, index) => {
          // Calculate color based on attendance
          const attendance = parseFloat(classItem.classAverageExcludingEmpty);
          
          let accentColor = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
          if (attendance >= 15) {
            accentColor = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
          } else if (attendance >= 10) {
            accentColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
          } else if (attendance >= 5) {
            accentColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
          } else {
            accentColor = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
          }
          
          const revenue = typeof classItem.totalRevenue === 'number' 
            ? classItem.totalRevenue 
            : parseInt(classItem.totalRevenue) || 0;
          
          return (
            <motion.div
              key={`${classItem.id}-${index}`}
              variants={item}
              className="h-full"
            >
              <Card className="h-full hover:shadow-md transition-all duration-300 flex flex-col">
                <CardHeader className={`${accentColor} rounded-t-lg text-center p-3 relative`}>
                  <div className="absolute -top-3 right-2">
                    <Badge variant="outline" className="bg-white dark:bg-gray-800 shadow-sm font-medium text-gray-600 dark:text-gray-300">
                      {classItem.period}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{classItem.dayOfWeek}</Badge>
                    <Badge variant="secondary">{classItem.classTime}</Badge>
                  </div>
                  
                  <CardTitle className="text-base font-semibold mt-1 line-clamp-1 hover:line-clamp-none transition-all duration-300">
                    {classItem.cleanedClass}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-3 flex-grow">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center text-sm">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="font-medium">
                            {classItem.classAverageExcludingEmpty} avg
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium">Attendance Details</h4>
                            <div className="text-xs text-muted-foreground">
                              <div className="flex justify-between py-1">
                                <span>Total Check-ins:</span>
                                <span className="font-medium">{classItem.totalCheckins}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Total Classes:</span>
                                <span className="font-medium">{classItem.totalOccurrences}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Empty Classes:</span>
                                <span className="font-medium">{classItem.totalEmpty}</span>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <IndianRupee className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span className="font-medium">₹{formatIndianCurrency(revenue)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span className="font-medium">{classItem.totalOccurrences}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span className="font-medium">{classItem.totalTime.toFixed(1)}h</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="px-3 py-2 border-t flex justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-7 w-7 mr-2">
                      <AvatarImage src={trainerAvatars[classItem.teacherName]} alt={classItem.teacherName} />
                      <AvatarFallback className="text-xs">
                        {classItem.teacherName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs line-clamp-1 max-w-[120px]">{classItem.teacherName}</span>
                  </div>
                  <Badge variant="outline">
                    {`${Math.round((classItem.totalCheckins / classItem.totalOccurrences) * 100) / 100}/class`}
                  </Badge>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {visibleItems < sortedData.length && (
        <div className="flex justify-center mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadMore}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg transition-all duration-300"
          >
            Load More
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default GridView;
