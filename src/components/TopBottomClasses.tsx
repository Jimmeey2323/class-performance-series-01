
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [metric, setMetric] = useState<keyof ProcessedData>('totalCheckins');
  const [viewMode, setViewMode] = useState<'top' | 'bottom'>('top');
  const [limit, setLimit] = useState<number>(5);
  
  const metrics = [
    { key: 'totalCheckins', label: 'Check-ins' },
    { key: 'totalRevenue', label: 'Revenue' },
    { key: 'classAverageIncludingEmpty', label: 'Average Attendance' },
    { key: 'totalOccurrences', label: 'Occurrences' }
  ];
  
  const filteredData = useMemo(() => {
    return [...data]
      .filter(item => {
        // Filter out items with invalid or zero values for the selected metric
        if (typeof item[metric] === 'string') {
          return item[metric] !== 'N/A' && parseFloat(String(item[metric])) > 0;
        }
        return Number(item[metric]) > 0;
      })
      .sort((a, b) => {
        let valueA = typeof a[metric] === 'string' ? parseFloat(String(a[metric])) : Number(a[metric]);
        let valueB = typeof b[metric] === 'string' ? parseFloat(String(b[metric])) : Number(b[metric]);
        
        if (viewMode === 'top') {
          return valueB - valueA;
        } else {
          return valueA - valueB;
        }
      })
      .slice(0, limit);
  }, [data, metric, viewMode, limit]);

  const formatMetricValue = (value: any, metricKey: keyof ProcessedData): string => {
    if (metricKey === 'totalRevenue') {
      return formatIndianCurrency(parseFloat(String(value)));
    }
    if (metricKey === 'classAverageIncludingEmpty' || metricKey === 'classAverageExcludingEmpty') {
      return parseFloat(String(value)).toFixed(1);
    }
    return String(value);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {viewMode === 'top' ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          {viewMode === 'top' ? 'Top' : 'Bottom'} Performing Classes
        </h3>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'top' | 'bottom')}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="top" className="text-sm">
                Top Classes
              </TabsTrigger>
              <TabsTrigger value="bottom" className="text-sm">
                Bottom Classes
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Select value={metric as string} onValueChange={(value) => setMetric(value as keyof ProcessedData)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((m) => (
                  <SelectItem key={m.key as string} value={m.key as string}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="15">Top 15</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Rank</TableHead>
              <TableHead>Class Type</TableHead>
              <TableHead>Day & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead className="text-right">Classes</TableHead>
              <TableHead className="text-right">Check-ins</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Avg. Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center font-semibold">
                    <Badge 
                      variant="outline" 
                      className={`
                        px-2 py-0.5 
                        ${viewMode === 'top' && index < 3 ? 'bg-green-50 text-green-600 border-green-200' : ''} 
                        ${viewMode === 'bottom' && index < 3 ? 'bg-red-50 text-red-600 border-red-200' : ''}
                      `}
                    >
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.cleanedClass}</TableCell>
                  <TableCell>{item.dayOfWeek} {item.classTime}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.teacherName}</TableCell>
                  <TableCell className="text-right">{item.totalOccurrences}</TableCell>
                  <TableCell className="text-right">{item.totalCheckins}</TableCell>
                  <TableCell className="text-right">{formatIndianCurrency(Number(item.totalRevenue))}</TableCell>
                  <TableCell className="text-right">
                    {typeof item.classAverageIncludingEmpty === 'number' 
                      ? item.classAverageIncludingEmpty.toFixed(1) 
                      : item.classAverageIncludingEmpty}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  No data available for the selected metric
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopBottomClasses;
