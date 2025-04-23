import React from 'react';
import { ProcessedData } from '@/types/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, IndianRupee } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';

interface GridViewProps {
  data: ProcessedData[];
  trainerAvatars?: Record<string, string>;
}

const GridView: React.FC<GridViewProps> = ({ data, trainerAvatars = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.map((item) => {
        const avatarUrl = trainerAvatars[item.teacherName];
        const initials = item.teacherName
          .split(' ')
          .map(part => part.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);
        
        const hash = item.teacherName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = [
          'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
          'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
          'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
          'bg-cyan-500', 'bg-sky-500'
        ];
        const avatarColor = colors[hash % colors.length];

        return (
          <Card key={item.uniqueID} className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-3">
                <Avatar className="h-10 w-10">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={item.teacherName} />
                  ) : (
                    <AvatarFallback className={`text-xs text-white ${avatarColor}`}>
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{item.cleanedClass}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.teacherName}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{item.dayOfWeek}, {item.classTime}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>Avg: {item.classAverageIncludingEmpty}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                  <span>Revenue: {formatIndianCurrency(Number(item.totalRevenue))}</span>
                </div>
                <div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Occurrences: {item.totalOccurrences}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GridView;
