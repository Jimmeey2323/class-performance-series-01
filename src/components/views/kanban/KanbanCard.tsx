
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, IndianRupee, CalendarDays } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion } from 'framer-motion';

interface KanbanCardProps {
  classItem: ProcessedData;
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

const KanbanCard: React.FC<KanbanCardProps> = ({ classItem, trainerAvatars }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: classItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  };

  // Determine attendance level and color
  const attendance = parseFloat(classItem.classAverageExcludingEmpty);
  let attendanceColor = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  
  if (attendance >= 15) {
    attendanceColor = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  } else if (attendance >= 10) {
    attendanceColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  } else if (attendance >= 5) {
    attendanceColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  }
  
  const revenue = typeof classItem.totalRevenue === 'number' 
    ? classItem.totalRevenue 
    : parseInt(classItem.totalRevenue) || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab"
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardHeader className={`px-3 py-2 ${attendanceColor}`}>
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 shadow-sm">
                {classItem.period}
              </Badge>
              <Badge className={`${attendanceColor} border-none`}>
                {classItem.classAverageExcludingEmpty} avg
              </Badge>
            </div>
            <h3 className="font-medium text-sm mt-1 line-clamp-2">{classItem.cleanedClass}</h3>
          </CardHeader>
          
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-2 text-xs text-gray-500 dark:text-gray-400">
              <div>{classItem.dayOfWeek}</div>
              <div>{classItem.classTime}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center text-xs cursor-help">
                    <Users className="h-3 w-3 mr-1 text-gray-500" />
                    <span>{classItem.totalCheckins} checkins</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-48 p-2 text-xs">
                  <div className="grid grid-cols-2 gap-1">
                    <div>Total Classes:</div>
                    <div className="font-medium">{classItem.totalOccurrences}</div>
                    <div>Total Check-ins:</div>
                    <div className="font-medium">{classItem.totalCheckins}</div>
                    <div>Avg. Attendance:</div>
                    <div className="font-medium">{classItem.classAverageExcludingEmpty}</div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              
              <div className="flex items-center text-xs">
                <CalendarDays className="h-3 w-3 mr-1 text-gray-500" />
                <span>{classItem.totalOccurrences} classes</span>
              </div>
              
              <div className="flex items-center text-xs">
                <IndianRupee className="h-3 w-3 mr-1 text-gray-500" />
                <span>₹{formatIndianCurrency(revenue)}</span>
              </div>
              
              <div className="flex items-center text-xs">
                <span className="text-gray-500">
                  {classItem.totalEmpty > 0 && `${classItem.totalEmpty} empty`}
                </span>
              </div>
            </div>
            
            <div className="flex items-center mt-2 pt-2 border-t">
              <Avatar className="h-5 w-5 mr-1.5">
                <AvatarImage 
                  src={trainerAvatars[classItem.teacherName]} 
                  alt={classItem.teacherName} 
                />
                <AvatarFallback className="text-[9px]">
                  {classItem.teacherName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">{classItem.teacherName}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default KanbanCard;
