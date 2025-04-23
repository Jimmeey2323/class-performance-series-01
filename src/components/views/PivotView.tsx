
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import { ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PivotViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

interface PivotDimension {
  key: keyof ProcessedData;
  label: string;
}

interface PivotMetric {
  key: keyof ProcessedData;
  label: string;
  formatter?: (value: any) => string;
}

const PivotView: React.FC<PivotViewProps> = ({ data, trainerAvatars }) => {
  const [rowDimension, setRowDimension] = useState<keyof ProcessedData>('cleanedClass');
  const [colDimension, setColDimension] = useState<keyof ProcessedData>('dayOfWeek');
  const [metric, setMetric] = useState<keyof ProcessedData>('totalCheckins');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const dimensions: PivotDimension[] = [
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'classTime', label: 'Class Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
  ];

  const metrics: PivotMetric[] = [
    { key: 'totalCheckins', label: 'Check-ins' },
    { key: 'totalOccurrences', label: 'Classes' },
    { key: 'totalRevenue', label: 'Revenue', formatter: value => formatIndianCurrency(Number(value)) },
    { key: 'classAverageIncludingEmpty', label: 'Avg. Attendance', formatter: value => (typeof value === 'number' ? value.toFixed(1) : String(value)) },
  ];

  // Get unique values for column dimension
  const columnValues = React.useMemo(() => {
    const uniqueValues = new Set(data.map(item => String(item[colDimension])));
    return Array.from(uniqueValues).sort();
  }, [data, colDimension]);

  // Create pivot table data
  const pivotData = React.useMemo(() => {
    // Group data by row dimension
    const rowGroups = new Map<string, ProcessedData[]>();
    
    data.forEach(item => {
      const rowKey = String(item[rowDimension]);
      if (!rowGroups.has(rowKey)) {
        rowGroups.set(rowKey, []);
      }
      rowGroups.get(rowKey)!.push(item);
    });
    
    // Calculate metrics for each cell
    const result = Array.from(rowGroups.entries()).map(([rowKey, items]) => {
      const row: any = { rowKey };
      
      // Calculate row total
      const rowTotal = items.reduce((sum, item) => {
        let value = item[metric];
        // Convert string to number if needed
        if (typeof value === 'string' && value !== 'N/A') {
          value = parseFloat(value);
        }
        if (typeof value === 'number') {
          return sum + value;
        }
        return sum;
      }, 0);
      
      row.total = rowTotal;
      
      // Calculate metrics for each column
      columnValues.forEach(colKey => {
        const cellItems = items.filter(item => String(item[colDimension]) === colKey);
        
        if (cellItems.length > 0) {
          const cellValue = cellItems.reduce((sum, item) => {
            let value = item[metric];
            // Convert string to number if needed
            if (typeof value === 'string' && value !== 'N/A') {
              value = parseFloat(value);
            }
            if (typeof value === 'number') {
              return sum + value;
            }
            return sum;
          }, 0);
          
          row[colKey] = cellValue;
        } else {
          row[colKey] = null;
        }
      });
      
      return row;
    });
    
    // Sort rows by total
    return result.sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.total - b.total;
      } else {
        return b.total - a.total;
      }
    });
  }, [data, rowDimension, colDimension, metric, columnValues, sortDirection]);

  // Calculate column totals
  const columnTotals = React.useMemo(() => {
    const totals: Record<string, number> = { total: 0 };
    
    columnValues.forEach(colKey => {
      totals[colKey] = pivotData.reduce((sum, row) => sum + (row[colKey] || 0), 0);
    });
    
    totals.total = pivotData.reduce((sum, row) => sum + row.total, 0);
    
    return totals;
  }, [pivotData, columnValues]);

  // Format cell value
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    const selectedMetric = metrics.find(m => m.key === metric);
    if (selectedMetric?.formatter) {
      return selectedMetric.formatter(value);
    }
    
    return String(value);
  };
  
  // Calculate cell background color based on value (heatmap)
  const getCellBackground = (value: any, columnMax: number): string => {
    if (value === null || value === 0 || columnMax === 0) {
      return '';
    }
    
    // Calculate color intensity based on the proportion of the max value
    const intensity = Math.min(0.9, Math.max(0.1, value / columnMax));
    return `bg-primary/[${intensity.toFixed(2)}]`;
  };
  
  // Get column maximums for heatmap coloring
  const columnMaxValues = React.useMemo(() => {
    const maxValues: Record<string, number> = {};
    
    columnValues.forEach(colKey => {
      maxValues[colKey] = Math.max(...pivotData.map(row => row[colKey] || 0));
    });
    
    maxValues.total = Math.max(...pivotData.map(row => row.total));
    
    return maxValues;
  }, [pivotData, columnValues]);
  
  // Get avatar for row dimension
  const getRowAvatar = (rowKey: string) => {
    if (rowDimension === 'teacherName' && trainerAvatars[rowKey]) {
      return (
        <Avatar className="h-6 w-6 mr-2 inline-block">
          <AvatarImage src={trainerAvatars[rowKey]} alt={rowKey} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {rowKey.split(' ').map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      );
    }
    return null;
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="space-y-1 flex-1">
          <Label>Row Dimension</Label>
          <Select value={rowDimension as string} onValueChange={(value) => setRowDimension(value as keyof ProcessedData)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose row dimension" />
            </SelectTrigger>
            <SelectContent>
              {dimensions.map((dim) => (
                <SelectItem key={dim.key as string} value={dim.key as string}>
                  {dim.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1 flex-1">
          <Label>Column Dimension</Label>
          <Select value={colDimension as string} onValueChange={(value) => setColDimension(value as keyof ProcessedData)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose column dimension" />
            </SelectTrigger>
            <SelectContent>
              {dimensions.map((dim) => (
                <SelectItem key={dim.key as string} value={dim.key as string}>
                  {dim.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1 flex-1">
          <Label>Metric</Label>
          <Select value={metric as string} onValueChange={(value) => setMetric(value as keyof ProcessedData)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose metric" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((m) => (
                <SelectItem key={m.key as string} value={m.key as string}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="border-r">
                  <div className="flex items-center justify-between">
                    <span>{dimensions.find(d => d.key === rowDimension)?.label}</span>
                    <button
                      onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </TableHead>
                {columnValues.map((colKey) => (
                  <TableHead key={colKey} className="text-center font-medium">
                    {colKey}
                  </TableHead>
                ))}
                <TableHead className="text-center bg-gray-50 dark:bg-gray-900 font-semibold">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="border-r font-medium">
                    {getRowAvatar(row.rowKey)}
                    {row.rowKey}
                  </TableCell>
                  {columnValues.map((colKey) => (
                    <TableCell 
                      key={colKey} 
                      className={`text-center ${getCellBackground(row[colKey], columnMaxValues[colKey])}`}
                    >
                      {formatCellValue(row[colKey])}
                    </TableCell>
                  ))}
                  <TableCell className={`text-center font-semibold bg-gray-50 dark:bg-gray-900 ${getCellBackground(row.total, columnMaxValues.total)}`}>
                    {formatCellValue(row.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-100 dark:bg-gray-800 font-semibold">
                <TableCell className="border-r">Total</TableCell>
                {columnValues.map((colKey) => (
                  <TableCell key={colKey} className="text-center">
                    {formatCellValue(columnTotals[colKey])}
                  </TableCell>
                ))}
                <TableCell className="text-center bg-gray-200 dark:bg-gray-700">
                  {formatCellValue(columnTotals.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PivotView;
