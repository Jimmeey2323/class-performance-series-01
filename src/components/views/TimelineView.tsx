
import React, { useEffect, useState } from 'react';
import { ProcessedData, TimelineEvent } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays,
  Clock,
  Users, 
  IndianRupee,
  MapPin,
  User
} from 'lucide-react';

interface TimelineViewProps {
  data: ProcessedData[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ data }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  
  useEffect(() => {
    // Convert data items to timeline events
    const timelineEvents: TimelineEvent[] = data.map(item => ({
      id: item.uniqueID,
      title: item.cleanedClass,
      date: item.period,
      content: `${item.dayOfWeek} at ${item.classTime}`,
      data: item
    }));
    
    // Get unique periods for grouping
    const uniquePeriods = Array.from(new Set(data.map(item => item.period))).sort();
    
    setEvents(timelineEvents);
    setPeriods(uniquePeriods);
  }, [data]);
  
  // Group events by period
  const groupedEvents = periods.map(period => ({
    period,
    events: events.filter(event => event.date === period)
  }));
  
  return (
    <div className="p-4">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-muted-foreground/20 z-0" />
        
        {groupedEvents.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-8 relative z-10">
            {/* Period marker */}
            <div className="flex items-center mb-4">
              <div className="w-32 flex-shrink-0 text-right pr-4">
                <Badge variant="outline" className="bg-background">
                  {group.period}
                </Badge>
              </div>
              <div className="h-4 w-4 rounded-full bg-primary flex-shrink-0" />
              <div className="h-0.5 bg-primary flex-grow ml-2" />
            </div>
            
            {/* Events for this period */}
            <div className="space-y-4 ml-32">
              {group.events.length > 0 ? (
                group.events.map((event, eventIndex) => (
                  <Card key={eventIndex} className="relative">
                    <div className="absolute -left-36 top-1/2 -translate-y-1/2 w-28 flex items-center justify-end pr-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{event.data.classTime}</span>
                      </div>
                    </div>
                    
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary/70" />
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge variant="outline" className="ml-2">
                          {event.data.dayOfWeek}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.data.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{event.data.teacherName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>{event.data.totalOccurrences} occurrences</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Check-ins: {event.data.totalCheckins}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Avg: {event.data.classAverageIncludingEmpty}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span>₹{parseFloat(event.data.totalRevenue).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">No classes in this period</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;
