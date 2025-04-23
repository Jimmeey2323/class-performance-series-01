
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProcessedData } from '@/types/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/formatters';

interface KanbanCardProps {
  item: ProcessedData;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `item:${item.uniqueID}:${item.dayOfWeek}`,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="mb-2 border-l-4 border-l-blue-500 dark:border-l-blue-400 cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-1 line-clamp-1">{item.cleanedClass}</h3>
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1 mr-2">
                <Clock className="h-3 w-3" />
                {item.classTime}
              </span>
              <span>{item.location}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100">
                  {item.teacherName}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 p-3 text-sm">
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium">{item.teacherName}</h4>
                  <p>Total Classes: {item.totalOccurrences}</p>
                  <p>Avg. Attendance: {(item.attendance || 0).toFixed(1)}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <HoverCard>
              <HoverCardTrigger asChild>
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 hover:bg-green-100 ml-1">
                  <Users className="h-3 w-3 mr-1" /> 
                  {item.totalCheckins}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 p-3 text-sm">
                <p>Total Checkins: {item.totalCheckins}</p>
                <p>Total Cancellations: {item.totalCancelled}</p>
                <p>Avg. Attendance: {item.attendance?.toFixed(1) || 'N/A'}</p>
              </HoverCardContent>
            </HoverCard>
            
            <HoverCard>
              <HoverCardTrigger asChild>
                <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 ml-1">
                  {formatIndianCurrency(item.totalRevenue)}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 p-3 text-sm">
                <p>Total Revenue: {formatIndianCurrency(item.totalRevenue)}</p>
                <p>Revenue Per Class: {formatIndianCurrency(item.totalRevenue / (item.totalOccurrences || 1))}</p>
              </HoverCardContent>
            </HoverCard>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {expanded && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Day:</span>
              <span>{item.dayOfWeek}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span>{item.classTime}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span>{item.location}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Classes:</span>
              <span>{item.totalOccurrences}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. Attendance:</span>
              <span>{item.attendance?.toFixed(1) || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue:</span>
              <span>{formatIndianCurrency(item.totalRevenue)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KanbanCard;
