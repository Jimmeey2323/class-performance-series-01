
import React from 'react';
import { KanbanItem } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Clock, 
  Users, 
  IndianRupee 
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanCardProps {
  item: KanbanItem;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Generate a consistent color based on the teacher's name
  const generateAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500', 'bg-sky-500'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const teacherName = item.data.teacherName;
  const teacherInitials = getInitials(teacherName);
  const avatarColor = generateAvatarColor(teacherName);
  
  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm">{item.title}</h3>
          <Badge variant="outline" className="text-xs">{item.data.dayOfWeek}</Badge>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-5 w-5">
            {item.avatarUrl ? (
              <AvatarImage src={item.avatarUrl} alt={teacherName} />
            ) : (
              <AvatarFallback className={`text-xs text-white ${avatarColor}`}>
                {teacherInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{teacherName}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{item.data.classTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{item.data.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{item.data.classAverageIncludingEmpty} avg</span>
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee className="h-3 w-3 text-muted-foreground" />
            <span>₹{parseFloat(item.data.totalRevenue).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;
