import React from 'react';
import { KanbanCardProps } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, IndianRupee } from 'lucide-react';
import { formatIndianCurrency } from '@/components/MetricsPanel';

const KanbanCard: React.FC<KanbanCardProps> = ({ data, isActive }) => {
  return (
    <Card className={`border-2 ${isActive ? 'border-primary' : 'border-transparent'} hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 mr-1" />
          {data.cleanedClass}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>{data.dayOfWeek}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{data.classTime}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>{data.location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <IndianRupee className="h-4 w-4" />
          <span>{formatIndianCurrency(data.totalRevenue)}</span>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">{data.date}</CardFooter>
    </Card>
  );
};

export default KanbanCard;
