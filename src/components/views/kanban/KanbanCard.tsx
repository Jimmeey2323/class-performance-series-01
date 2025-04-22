
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
import { motion } from 'framer-motion';

interface KanbanCardProps {
  item: KanbanItem;
}

// Function to format currency in Indian format (lakhs and crores)
export const formatIndianCurrency = (value: number): string => {
  if (value >= 10000000) { // 1 crore = 10^7
    return `${(value / 10000000).toFixed(1)} Cr`;
  } else if (value >= 100000) { // 1 lakh = 10^5
    return `${(value / 100000).toFixed(1)} L`;
  } else {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
};

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
  
  // Convert revenue to number and format it
  const totalRevenue = typeof item.data.totalRevenue === 'number' 
    ? item.data.totalRevenue 
    : parseFloat(item.data.totalRevenue.toString());
  
  // Format revenue as Indian currency
  const formattedRevenue = formatIndianCurrency(totalRevenue);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
    >
      <Card 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className="bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-sm">{item.title}</h3>
            <Badge variant="outline" className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
              {item.data.dayOfWeek}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-indigo-500/20">
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
            <div className="flex items-center gap-1 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Clock className="h-3 w-3 text-indigo-500" />
              <span>{item.data.classTime}</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <MapPin className="h-3 w-3 text-pink-500" />
              <span className="truncate">{item.data.location}</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Users className="h-3 w-3 text-amber-500" />
              <span>{item.data.classAverageIncludingEmpty} avg</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <IndianRupee className="h-3 w-3 text-green-500" />
              <span>{formattedRevenue}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KanbanCard;
