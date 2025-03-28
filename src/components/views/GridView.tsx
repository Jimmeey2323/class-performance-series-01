
import React from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  User,
  IndianRupee,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GridViewProps {
  data: ProcessedData[];
  trainerAvatars?: Record<string, string>;
}

const GridView: React.FC<GridViewProps> = ({ data, trainerAvatars = {} }) => {
  // Get initials from teacher name for avatar
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {data.length > 0 ? (
        data.map((item, index) => {
          const teacherInitials = getInitials(item.teacherName);
          const avatarColor = generateAvatarColor(item.teacherName);
          const avatarUrl = trainerAvatars[item.teacherName];
          
          return (
            <Card key={index} className="overflow-hidden transition-all hover:shadow-lg border-indigo-100 dark:border-indigo-900 bg-white dark:bg-gray-900">
              <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 text-white">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2 bg-white/20 text-white border-white/30">
                    {item.period}
                  </Badge>
                  <Badge 
                    variant={parseInt(item.classAverageIncludingEmpty) > 10 ? "default" : "secondary"}
                    className="flex items-center gap-1 bg-white/20 text-white hover:bg-white/30 border-white/30"
                  >
                    <Users className="h-3 w-3" />
                    {item.classAverageIncludingEmpty}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-1">{item.cleanedClass}</CardTitle>
              </CardHeader>
              
              <CardContent className="pb-2 pt-4">
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="flex items-center text-sm gap-1">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center text-sm gap-1">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item.classTime}</span>
                  </div>
                  <div className="flex items-center text-sm gap-1">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    <span className="truncate text-gray-700 dark:text-gray-300">{item.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm gap-1 col-span-2 mt-1">
                    <Avatar className="h-6 w-6">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={item.teacherName} />
                      ) : (
                        <AvatarFallback className={`text-xs text-white ${avatarColor}`}>
                          {teacherInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="truncate text-gray-800 dark:text-gray-200 font-medium">{item.teacherName}</span>
                  </div>
                  
                  <div className="flex items-center text-sm gap-1">
                    <CalendarIcon className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item.totalOccurrences} classes</span>
                  </div>
                  <div className="flex items-center text-sm gap-1">
                    <IndianRupee className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-700 dark:text-gray-300">₹{parseFloat(item.totalRevenue).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-3 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-center text-sm bg-indigo-50/50 dark:bg-indigo-900/30">
                <div>
                  <span className="text-indigo-600 dark:text-indigo-400">Check-ins: </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.totalCheckins}</span>
                </div>
                <div>
                  <span className="text-indigo-600 dark:text-indigo-400">Avg (Non-Empty): </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.classAverageExcludingEmpty}</span>
                </div>
              </CardFooter>
            </Card>
          );
        })
      ) : (
        <div className="col-span-full flex items-center justify-center h-48 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
};

export default GridView;
