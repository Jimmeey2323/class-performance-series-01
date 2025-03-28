
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

interface GridViewProps {
  data: ProcessedData[];
}

const GridView: React.FC<GridViewProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {data.length > 0 ? (
        data.map((item, index) => (
          <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-2">
                  {item.period}
                </Badge>
                <Badge 
                  variant={parseInt(item.classAverageIncludingEmpty) > 10 ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  {item.classAverageIncludingEmpty}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold line-clamp-1">{item.cleanedClass}</CardTitle>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center text-sm gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{item.dayOfWeek}</span>
                </div>
                <div className="flex items-center text-sm gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{item.classTime}</span>
                </div>
                <div className="flex items-center text-sm gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.location}</span>
                </div>
                <div className="flex items-center text-sm gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.teacherName}</span>
                </div>
                
                <div className="flex items-center text-sm gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.totalOccurrences} classes</span>
                </div>
                <div className="flex items-center text-sm gap-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span>₹{parseFloat(item.totalRevenue).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-3 border-t flex justify-between items-center text-sm">
              <div>
                <span className="text-muted-foreground">Check-ins: </span>
                <span className="font-medium">{item.totalCheckins}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg (Non-Empty): </span>
                <span className="font-medium">{item.classAverageExcludingEmpty}</span>
              </div>
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="col-span-full flex items-center justify-center h-48 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
};

export default GridView;
