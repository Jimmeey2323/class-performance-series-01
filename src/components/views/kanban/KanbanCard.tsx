
import React from 'react';
import { KanbanItem } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, User, MapPin } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanCardProps {
  item: KanbanItem;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: item.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="cursor-grab active:cursor-grabbing"
      {...attributes} 
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="font-medium mb-2 truncate">{item.title}</div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{item.data.classTime}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {item.data.period}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{item.data.teacherName}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{item.data.location}</span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{item.data.totalCheckins} check-ins</span>
          </div>
          <Badge 
            variant={parseFloat(item.data.classAverageIncludingEmpty) > 10 ? "default" : "secondary"}
            className="text-xs"
          >
            Avg: {item.data.classAverageIncludingEmpty}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;
