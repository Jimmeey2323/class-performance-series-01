
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Grid2X2, BarChart3, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PivotViewProps {
  data: ProcessedData[];
  trainerAvatars?: Record<string, string>;
}

type AggregationMethod = 'sum' | 'average' | 'count' | 'countUnique' | 'min' | 'max';

const PivotView: React.FC<PivotViewProps> = ({ data, trainerAvatars = {} }) => {
  const [rowField, setRowField] = useState<keyof ProcessedData>('dayOfWeek');
  const [columnField, setColumnField] = useState<keyof ProcessedData>('cleanedClass');
  const [valueField, setValueField] = useState<keyof ProcessedData>('totalCheckins');
  const [aggregationMethod, setAggregationMethod] = useState<AggregationMethod>('sum');

  // Define numeric fields and display fields
  const numericFields = [
    { key: 'totalOccurrences', label: 'Total Occurrences' },
    { key: 'totalCheckins', label: 'Total Check-ins' },
    { key: 'totalCancelled', label: 'Total Cancelled' },
    { key: 'totalEmpty', label: 'Total Empty' },
    { key: 'totalNonEmpty', label: 'Total Non-Empty' },
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'totalTime', label: 'Total Time (Hours)' },
    { key: 'totalNonPaid', label: 'Total Non-Paid' },
    { key: 'classAverageIncludingEmpty', label: 'Class Average (All)' },
    { key: 'classAverageExcludingEmpty', label: 'Class Average (Non-Empty)' },
  ];

  const displayFields = [
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'classTime', label: 'Class Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
  ];

  // Generate pivot table data
  const pivotData = useMemo(() => {
    // Get unique values for row and column fields
    const rowValues = Array.from(new Set(data.map(item => String(item[rowField]))))
      .sort((a, b) => {
        // Special sorting for days of week
        if (rowField === 'dayOfWeek') {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          return days.indexOf(a) - days.indexOf(b);
        }
        return a.localeCompare(b);
      });
    
    const columnValues = Array.from(new Set(data.map(item => String(item[columnField]))))
      .sort();
    
    // Initialize pivot table with zeros
    const pivotTable: Record<string, Record<string, number>> = {};
    
    rowValues.forEach(rowValue => {
      pivotTable[rowValue] = {};
      columnValues.forEach(colValue => {
        pivotTable[rowValue][colValue] = 0;
      });
    });
    
    // For countUnique aggregation, we need to track unique values
    const uniqueValues: Record<string, Record<string, Set<string>>> = {};
    
    if (aggregationMethod === 'countUnique') {
      rowValues.forEach(rowValue => {
        uniqueValues[rowValue] = {};
        columnValues.forEach(colValue => {
          uniqueValues[rowValue][colValue] = new Set();
        });
      });
    }
    
    // Aggregate data into the pivot table
    data.forEach(item => {
      const rowValue = String(item[rowField]);
      const colValue = String(item[columnField]);
      const value = parseFloat(String(item[valueField])) || 0;
      
      // Skip if row or column value doesn't exist (shouldn't happen, but just in case)
      if (!pivotTable[rowValue] || pivotTable[rowValue][colValue] === undefined) return;
      
      // Apply aggregation
      switch (aggregationMethod) {
        case 'sum':
          pivotTable[rowValue][colValue] += value;
          break;
        case 'average': {
          // For average, store count and total, we'll compute average later
          if (!pivotTable[rowValue][`${colValue}_count`]) {
            pivotTable[rowValue][`${colValue}_count`] = 0;
            pivotTable[rowValue][`${colValue}_total`] = 0;
          }
          
          pivotTable[rowValue][`${colValue}_count`] += 1;
          pivotTable[rowValue][`${colValue}_total`] += value;
          
          // Calculate the average
          pivotTable[rowValue][colValue] = pivotTable[rowValue][`${colValue}_total`] / 
                                            pivotTable[rowValue][`${colValue}_count`];
          break;
        }
        case 'count':
          pivotTable[rowValue][colValue] += 1;
          break;
        case 'countUnique':
          // Add the value to the set of unique values
          uniqueValues[rowValue][colValue].add(String(item.uniqueID));
          // Update the count in the pivot table
          pivotTable[rowValue][colValue] = uniqueValues[rowValue][colValue].size;
          break;
        case 'min':
          if (pivotTable[rowValue][colValue] === 0 || value < pivotTable[rowValue][colValue]) {
            pivotTable[rowValue][colValue] = value;
          }
          break;
        case 'max':
          if (value > pivotTable[rowValue][colValue]) {
            pivotTable[rowValue][colValue] = value;
          }
          break;
      }
    });
    
    // Clean up temporary fields used for average calculation
    if (aggregationMethod === 'average') {
      rowValues.forEach(rowValue => {
        columnValues.forEach(colValue => {
          delete pivotTable[rowValue][`${colValue}_count`];
          delete pivotTable[rowValue][`${colValue}_total`];
        });
      });
    }
    
    // Calculate row and column totals
    const totals: Record<string, number> = {};
    
    // Calculate row totals
    rowValues.forEach(rowValue => {
      totals[`row_${rowValue}`] = columnValues.reduce((sum, colValue) => {
        return sum + (pivotTable[rowValue][colValue] || 0);
      }, 0);
    });
    
    // Calculate column totals
    columnValues.forEach(colValue => {
      totals[`col_${colValue}`] = rowValues.reduce((sum, rowValue) => {
        return sum + (pivotTable[rowValue][colValue] || 0);
      }, 0);
    });
    
    // Calculate grand total
    totals.grand = rowValues.reduce((sum, rowValue) => {
      return sum + (totals[`row_${rowValue}`] || 0);
    }, 0);
    
    return {
      rowValues,
      columnValues,
      pivotTable,
      totals
    };
  }, [data, rowField, columnField, valueField, aggregationMethod]);
  
  // Format value for display
  const formatValue = (value: number) => {
    if (valueField === 'totalRevenue') {
      return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    // For percentages or ratios, show 1 decimal
    if (aggregationMethod === 'average') {
      return value.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    
    // For counts and integers, no decimals
    return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  
  // Get cell background color based on value
  const getCellColor = (value: number, columnValue: string) => {
    // Skip coloring for 0 values
    if (value === 0) return '';
    
    // Get column maximum
    const columnMax = pivotData.rowValues.reduce((max, rowValue) => {
      const cellValue = pivotData.pivotTable[rowValue][columnValue];
      return cellValue > max ? cellValue : max;
    }, 0);
    
    // Skip coloring if max is 0
    if (columnMax === 0) return '';
    
    // Calculate intensity based on ratio to max
    const ratio = value / columnMax;
    
    // For revenue, use a green color scale
    if (valueField === 'totalRevenue') {
      return `bg-green-${Math.round(ratio * 500)}/20`;
    }
    
    // Default blue color scale
    return `bg-indigo-${Math.round(ratio * 500)}/20`;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="mb-6 border-indigo-100 dark:border-indigo-900">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 text-white pb-4">
          <CardTitle className="flex items-center gap-2">
            <Grid2X2 className="h-5 w-5" />
            Pivot Table Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="row-field">Row Field</Label>
              <Select 
                value={rowField as string} 
                onValueChange={(value) => setRowField(value as keyof ProcessedData)}
              >
                <SelectTrigger id="row-field">
                  <SelectValue placeholder="Select row field" />
                </SelectTrigger>
                <SelectContent>
                  {displayFields.map(field => (
                    <SelectItem key={field.key as string} value={field.key as string}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="column-field">Column Field</Label>
              <Select 
                value={columnField as string} 
                onValueChange={(value) => setColumnField(value as keyof ProcessedData)}
              >
                <SelectTrigger id="column-field">
                  <SelectValue placeholder="Select column field" />
                </SelectTrigger>
                <SelectContent>
                  {displayFields.map(field => (
                    <SelectItem key={field.key as string} value={field.key as string}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value-field">Value Field</Label>
              <Select 
                value={valueField as string} 
                onValueChange={(value) => setValueField(value as keyof ProcessedData)}
              >
                <SelectTrigger id="value-field">
                  <SelectValue placeholder="Select value field" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map(field => (
                    <SelectItem key={field.key as string} value={field.key as string}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="aggregation">Aggregation Method</Label>
              <Select 
                value={aggregationMethod} 
                onValueChange={(value) => setAggregationMethod(value as AggregationMethod)}
              >
                <SelectTrigger id="aggregation">
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="countUnique">Count Unique</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                Visualize
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="overflow-auto rounded-lg border border-indigo-100 dark:border-indigo-900 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader className="bg-indigo-50 dark:bg-indigo-900/30">
            <TableRow>
              <TableHead className="text-indigo-700 dark:text-indigo-300 font-bold">
                {`${displayFields.find(f => f.key === rowField)?.label} / ${displayFields.find(f => f.key === columnField)?.label}`}
              </TableHead>
              {pivotData.columnValues.map(colValue => (
                <TableHead 
                  key={colValue} 
                  className="text-indigo-700 dark:text-indigo-300 font-semibold px-3 py-2 text-right"
                >
                  {colValue}
                </TableHead>
              ))}
              <TableHead className="text-indigo-700 dark:text-indigo-300 font-bold px-3 py-2 text-right">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pivotData.rowValues.map(rowValue => (
              <TableRow key={rowValue} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20">
                <TableCell className="font-semibold bg-indigo-50/70 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                  {rowValue}
                </TableCell>
                {pivotData.columnValues.map(colValue => {
                  const value = pivotData.pivotTable[rowValue][colValue];
                  const bgColor = getCellColor(value, colValue);
                  
                  return (
                    <TableCell 
                      key={colValue} 
                      className={`text-right ${bgColor} ${value === 0 ? 'text-gray-400' : 'font-medium'}`}
                    >
                      {formatValue(value)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-bold bg-indigo-50/30 dark:bg-indigo-900/10">
                  {formatValue(pivotData.totals[`row_${rowValue}`] || 0)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-indigo-50 dark:bg-indigo-900/30 font-bold">
              <TableCell className="text-indigo-700 dark:text-indigo-300">
                Total
              </TableCell>
              {pivotData.columnValues.map(colValue => (
                <TableCell key={colValue} className="text-right text-indigo-700 dark:text-indigo-300">
                  {formatValue(pivotData.totals[`col_${colValue}`] || 0)}
                </TableCell>
              ))}
              <TableCell className="text-right text-indigo-700 dark:text-indigo-300">
                {formatValue(pivotData.totals.grand || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PivotView;
