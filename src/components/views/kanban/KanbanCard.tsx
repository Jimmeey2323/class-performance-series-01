import React from 'react';
import { 
  motion, 
  Reorder,
  useDragControls,
} from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Grip, IndianRupee } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';

interface KanbanCardProps {
  item: ProcessedData;
  trainerAvatars?: Record<string, string>;
}

export const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

const KanbanCard: React.FC<KanbanCardProps> = ({ item, trainerAvatars = {} }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getAttendanceBadgeColor = (value: number) => {
    if (value >= 10) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    if (value >= 7) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    if (value >= 4) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  };

  const getAttendanceValue = () => {
    try {
      const attendance = parseFloat(String(item.classAverageExcludingEmpty || 0));
      return isNaN(attendance) ? "0.0" : attendance.toFixed(1);
    } catch (e) {
      return "0.0";
    }
  };

  const getRevenue = () => {
    try {
      const revenue = typeof item.totalRevenue === 'number' 
        ? item.totalRevenue 
        : parseFloat(String(item.totalRevenue || 0));
      return isNaN(revenue) ? 0 : revenue;
    } catch {
      return 0;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mb-3"
    >
      <Card className={`border shadow-sm overflow-hidden ${expanded ? 'border-primary/30' : ''}`}>
        <CardContent className="p-0">
          <div className={`p-3 border-l-4 ${
            item.dayOfWeek === 'Monday' ? 'border-blue-500' :
            item.dayOfWeek === 'Tuesday' ? 'border-purple-500' :
            item.dayOfWeek === 'Wednesday' ? 'border-green-500' :
            item.dayOfWeek === 'Thursday' ? 'border-amber-500' :
            item.dayOfWeek === 'Friday' ? 'border-red-500' :
            item.dayOfWeek === 'Saturday' ? 'border-pink-500' :
            'border-indigo-500'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{item.cleanedClass}</h3>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {item.dayOfWeek}, <Clock className="h-3 w-3 ml-1" /> {item.classTime}
                </div>
              </div>
              <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-800">
                <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                <AvatarFallback className="text-xs">
                  {getInitials(item.teacherName)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mt-3">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-0.5 cursor-help">
                    <Badge variant="secondary" className={`text-xs w-full flex justify-center ${getAttendanceBadgeColor(parseFloat(getAttendanceValue()))}`}>
                      {getAttendanceValue()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground mt-1">Avg. Attendance</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-48">
                  <div className="text-xs">
                    <p className="font-medium">Average Attendance</p>
                    <p className="text-muted-foreground mt-1">
                      Average of {getAttendanceValue()} students per class, calculated from {item.totalOccurrences} occurrences.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-0.5 cursor-help">
                    <Badge variant="outline" className="text-xs w-full flex justify-center">
                      {item.totalOccurrences}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground mt-1">Classes</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-48">
                  <div className="text-xs">
                    <p className="font-medium">Total Classes</p>
                    <p className="text-muted-foreground mt-1">
                      This class occurred {item.totalOccurrences} times in the selected period.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-0.5 cursor-help">
                    <Badge variant="outline" className="text-xs w-full flex justify-center">
                      {item.totalCheckins}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground mt-1">Check-ins</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-48">
                  <div className="text-xs">
                    <p className="font-medium">Total Check-ins</p>
                    <p className="text-muted-foreground mt-1">
                      {item.totalCheckins} students attended this class across all sessions.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 h-6 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {expanded ? "Less details" : "More details"}
            </Button>
            
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 pt-2 border-t text-xs space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary/20 p-2 rounded flex flex-col">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">{formatIndianCurrency(getRevenue())}</span>
                    </div>
                    <div className="bg-secondary/20 p-2 rounded flex flex-col">
                      <span className="text-muted-foreground">Rev. per Class</span>
                      <span className="font-medium">{formatIndianCurrency(getRevenue() / item.totalOccurrences)}</span>
                    </div>
                    <div className="bg-secondary/20 p-2 rounded flex flex-col">
                      <span className="text-muted-foreground">Trainer</span>
                      <span className="font-medium truncate">{item.teacherName}</span>
                    </div>
                    <div className="bg-secondary/20 p-2 rounded flex flex-col">
                      <span className="text-muted-foreground">Period</span>
                      <span className="font-medium">{item.period || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-secondary/20 p-2 rounded flex flex-col items-center">
                      <span className="text-muted-foreground">Empty</span>
                      <span className="font-medium">{item.totalEmpty}</span>
                    </div>
                    <div className="bg-secondary/20 p-2 rounded flex flex-col items-center">
                      <span className="text-muted-foreground">Non-paid</span>
                      <span className="font-medium">{item.totalNonPaid}</span>
                    </div>
                    <div className="bg-secondary/20 p-2 rounded flex flex-col items-center">
                      <span className="text-muted-foreground">Cancelled</span>
                      <span className="font-medium">{item.totalCancelled}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KanbanCard;
