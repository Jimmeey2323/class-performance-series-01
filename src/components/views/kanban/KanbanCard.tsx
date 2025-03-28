
import React from 'react';
import { KanbanItem } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, User, MapPin } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

  // Get initials from teacher name for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const teacherInitials = getInitials(item.data.teacherName);
  
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
  
  const avatarColor = generateAvatarColor(item.data.teacherName);

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
      {...attributes} 
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="font-medium mb-2 truncate text-indigo-700 dark:text-indigo-300">{item.title}</div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-indigo-400" />
            <span className="text-gray-700 dark:text-gray-300">{item.data.classTime}</span>
          </div>
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700">
            {item.data.period}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs mt-3">
          <div className="flex items-center gap-1 col-span-2 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarFallback className={`text-xs text-white ${avatarColor}`}>
                {teacherInitials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-gray-800 dark:text-gray-200">{item.data.teacherName}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-indigo-400" />
            <span className="truncate text-gray-600 dark:text-gray-400">{item.data.location}</span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3 text-indigo-400" />
            <span className="text-gray-600 dark:text-gray-400">{item.data.totalCheckins} check-ins</span>
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
