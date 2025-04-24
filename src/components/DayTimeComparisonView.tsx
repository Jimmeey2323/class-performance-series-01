
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatIndianCurrency } from './MetricsPanel';

interface DayTimeComparisonViewProps {
  data: ProcessedData[];
}

const DayTimeComparisonView: React.FC<DayTimeComparisonViewProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'days' | 'timeSlots'>('days');

  // Process data for day of week comparison
  const dayOfWeekData = React.useMemo(() => {
    if (!data.length) return [];
    
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    const dayStats: Record<string, {
      totalCheckins: number;
      totalRevenue: number;
      totalClasses: number;
      averageAttendance: number;
    }> = {};
    
    // Initialize with all days
    days.forEach(day => {
      dayStats[day] = {
        totalCheckins: 0,
        totalRevenue: 0,
        totalClasses: 0,
        averageAttendance: 0
      };
    });
    
    // Aggregate data
    data.forEach(item => {
      const day = item.dayOfWeek;
      if (day && dayStats[day]) {
        dayStats[day].totalCheckins += Number(item.totalCheckins) || 0;
        dayStats[day].totalRevenue += Number(item.totalRevenue) || 0;
        dayStats[day].totalClasses += Number(item.totalOccurrences) || 0;
      }
    });
    
    // Calculate averages and prepare for chart
    return days
      .filter(day => dayStats[day].totalClasses > 0)
      .map(day => ({
        name: day,
        checkins: dayStats[day].totalCheckins,
        revenue: dayStats[day].totalRevenue,
        classes: dayStats[day].totalClasses,
        averageAttendance: dayStats[day].totalClasses > 0 
          ? Math.round((dayStats[day].totalCheckins / dayStats[day].totalClasses) * 10) / 10
          : 0
      }));
  }, [data]);
  
  // Process data for time slots
  const timeSlotData = React.useMemo(() => {
    if (!data.length) return [];
    
    // Define time slots (4-hour blocks)
    const timeSlots = [
      { start: 6, end: 10, label: '6 AM - 10 AM' },
      { start: 10, end: 14, label: '10 AM - 2 PM' },
      { start: 14, end: 18, label: '2 PM - 6 PM' },
      { start: 18, end: 22, label: '6 PM - 10 PM' },
      { start: 22, end: 6, label: '10 PM - 6 AM' }
    ];
    
    // Initialize stats for each time slot
    const slotStats = timeSlots.map(slot => ({
      name: slot.label,
      checkins: 0,
      revenue: 0,
      classes: 0,
      averageAttendance: 0
    }));
    
    // Helper to categorize a time into a slot index
    const getSlotIndex = (timeStr: string): number => {
      try {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        // Find matching time slot
        for (let i = 0; i < timeSlots.length; i++) {
          const slot = timeSlots[i];
          if (slot.start <= hours && hours < slot.end) return i;
          
          // Handle overnight slot (10 PM - 6 AM)
          if (slot.start > slot.end && (hours >= slot.start || hours < slot.end)) return i;
        }
        
        return 4; // Default to overnight slot if no match
      } catch (e) {
        return 4; // Default fallback
      }
    };
    
    // Aggregate data
    data.forEach(item => {
      const timeStr = item.classTime;
      if (timeStr) {
        const slotIndex = getSlotIndex(timeStr);
        slotStats[slotIndex].checkins += Number(item.totalCheckins) || 0;
        slotStats[slotIndex].revenue += Number(item.totalRevenue) || 0;
        slotStats[slotIndex].classes += Number(item.totalOccurrences) || 0;
      }
    });
    
    // Calculate averages
    slotStats.forEach(slot => {
      slot.averageAttendance = slot.classes > 0 
        ? Math.round((slot.checkins / slot.classes) * 10) / 10
        : 0;
    });
    
    // Return non-empty slots
    return slotStats.filter(slot => slot.classes > 0);
  }, [data]);
  
  // Colors for the chart
  const dayColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316'];
  const timeColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];
  
  return (
    <div>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-2">
        <CardTitle className="text-xl font-bold">Day & Time Comparison</CardTitle>
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'days' | 'timeSlots')}>
          <TabsList>
            <TabsTrigger value="days">Days of Week</TabsTrigger>
            <TabsTrigger value="timeSlots">Time Slots</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <div className="h-[400px]">
          {activeView === 'days' ? (
            dayOfWeekData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') {
                        return [formatIndianCurrency(Number(value)), 'Revenue'];
                      }
                      if (name === 'averageAttendance') {
                        return [`${value} per class`, 'Avg. Attendance'];
                      }
                      return [value, name === 'checkins' ? 'Check-ins' : 'Classes'];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="checkins" name="Check-ins" fill="#8884d8">
                    {dayOfWeekData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={dayColors[index % dayColors.length]} />
                    ))}
                  </Bar>
                  <Bar yAxisId="left" dataKey="classes" name="Classes" fill="#82ca9d" />
                  <Bar yAxisId="right" dataKey="averageAttendance" name="Avg. Attendance" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No day of week data available.</p>
              </div>
            )
          ) : (
            timeSlotData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSlotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') {
                        return [formatIndianCurrency(Number(value)), 'Revenue'];
                      }
                      if (name === 'averageAttendance') {
                        return [`${value} per class`, 'Avg. Attendance'];
                      }
                      return [value, name === 'checkins' ? 'Check-ins' : 'Classes'];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="checkins" name="Check-ins" fill="#8884d8">
                    {timeSlotData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={timeColors[index % timeColors.length]} />
                    ))}
                  </Bar>
                  <Bar yAxisId="left" dataKey="classes" name="Classes" fill="#82ca9d" />
                  <Bar yAxisId="right" dataKey="averageAttendance" name="Avg. Attendance" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No time slot data available.</p>
              </div>
            )
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default DayTimeComparisonView;
