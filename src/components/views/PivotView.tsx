
import React, { useState, useMemo } from 'react';
import { ProcessedData, PivotData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, RotateCcw, BarChart, Table } from 'lucide-react';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PivotViewProps {
  data: ProcessedData[];
}

const PivotView: React.FC<PivotViewProps> = ({ data }) => {
  const [pivotConfig, setPivotConfig] = useState<PivotData>({
    rowField: 'cleanedClass',
    columnField: 'dayOfWeek',
    valueField: 'totalCheckins',
    aggregation: 'sum'
  });
  
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  
  const fields: Array<{ key: keyof ProcessedData; label: string }> = [
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
  ];
  
  const valueFields: Array<{ key: keyof ProcessedData; label: string }> = [
    { key: 'totalCheckins', label: 'Total Check-ins' },
    { key: 'totalOccurrences', label: 'Total Occurrences' },
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'totalCancelled', label: 'Total Cancellations' },
    { key: 'totalEmpty', label: 'Empty Classes' },
    { key: 'classAverageIncludingEmpty', label: 'Average Attendance (All)' },
    { key: 'totalTime', label: 'Total Hours' },
    { key: 'totalNonPaid', label: 'Non-Paid Customers' },
  ];
  
  const aggregations = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
  ];
  
  // Color scale for the chart
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
  ];
  
  // Generate pivot table data
  const pivotData = useMemo(() => {
    if (!data.length) return { rows: [], columns: [], values: {} };
    
    // Get unique values for row and column fields
    const uniqueRows = Array.from(new Set(data.map(item => String(item[pivotConfig.rowField])))).sort();
    const uniqueColumns = Array.from(new Set(data.map(item => String(item[pivotConfig.columnField])))).sort();
    
    // Initialize values object
    const values: Record<string, Record<string, number>> = {};
    uniqueRows.forEach(row => {
      values[row] = {};
      uniqueColumns.forEach(col => {
        values[row][col] = 0;
      });
    });
    
    // Calculate values based on aggregation method
    data.forEach(item => {
      const rowKey = String(item[pivotConfig.rowField]);
      const colKey = String(item[pivotConfig.columnField]);
      
      let value = 0;
      // Handle numeric conversion for different value fields
      if (pivotConfig.valueField === 'totalRevenue' || pivotConfig.valueField === 'totalTime') {
        value = parseFloat(String(item[pivotConfig.valueField]) || '0');
      } else if (
        pivotConfig.valueField === 'classAverageIncludingEmpty' || 
        pivotConfig.valueField === 'classAverageExcludingEmpty'
      ) {
        const strValue = String(item[pivotConfig.valueField]);
        value = strValue === 'N/A' ? 0 : parseFloat(strValue);
      } else {
        value = Number(item[pivotConfig.valueField]);
      }
      
      // Apply aggregation
      if (pivotConfig.aggregation === 'sum') {
        values[rowKey][colKey] = (values[rowKey][colKey] || 0) + value;
      } else if (pivotConfig.aggregation === 'count') {
        values[rowKey][colKey] = (values[rowKey][colKey] || 0) + 1;
      } else if (pivotConfig.aggregation === 'min') {
        if (!values[rowKey][colKey] || value < values[rowKey][colKey]) {
          values[rowKey][colKey] = value;
        }
      } else if (pivotConfig.aggregation === 'max') {
        if (!values[rowKey][colKey] || value > values[rowKey][colKey]) {
          values[rowKey][colKey] = value;
        }
      }
      // For average, we'll calculate the sum and count first, then compute average later
      else if (pivotConfig.aggregation === 'average') {
        // Initialize with [sum, count] if not already present
        if (!values[rowKey][colKey]) {
          values[rowKey][colKey] = 0;
        }
        values[rowKey][colKey] = (values[rowKey][colKey] || 0) + value;
      }
    });
    
    // If aggregation is average, compute the average for each cell
    if (pivotConfig.aggregation === 'average') {
      // Count items in each cell for averaging
      const counts: Record<string, Record<string, number>> = {};
      uniqueRows.forEach(row => {
        counts[row] = {};
        uniqueColumns.forEach(col => {
          counts[row][col] = 0;
        });
      });
      
      data.forEach(item => {
        const rowKey = String(item[pivotConfig.rowField]);
        const colKey = String(item[pivotConfig.columnField]);
        counts[rowKey][colKey] = (counts[rowKey][colKey] || 0) + 1;
      });
      
      // Calculate averages
      uniqueRows.forEach(row => {
        uniqueColumns.forEach(col => {
          if (counts[row][col] > 0) {
            values[row][col] = values[row][col] / counts[row][col];
          }
        });
      });
    }
    
    // Prepare chart data
    const chartData = uniqueRows.map(row => {
      const rowData: Record<string, any> = { name: row };
      uniqueColumns.forEach(col => {
        rowData[col] = values[row][col];
      });
      return rowData;
    });
    
    return { 
      rows: uniqueRows, 
      columns: uniqueColumns, 
      values,
      chartData
    };
  }, [data, pivotConfig]);
  
  // Format cell value based on the value field
  const formatCellValue = (value: number) => {
    if (pivotConfig.valueField === 'totalRevenue') {
      return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (
      pivotConfig.valueField === 'classAverageIncludingEmpty' || 
      pivotConfig.valueField === 'classAverageExcludingEmpty'
    ) {
      return value.toFixed(1);
    } else if (pivotConfig.valueField === 'totalTime') {
      return value.toFixed(1);
    }
    return value.toLocaleString();
  };
  
  const handleReset = () => {
    setPivotConfig({
      rowField: 'cleanedClass',
      columnField: 'dayOfWeek',
      valueField: 'totalCheckins',
      aggregation: 'sum'
    });
  };
  
  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-4 pb-0">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <CardTitle className="text-lg font-semibold">
            Interactive Pivot Table
          </CardTitle>
          
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'table' | 'chart')}
            className="w-[200px]"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="table" className="flex items-center gap-1">
                <Table className="h-4 w-4" />
                Table
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                Chart
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label htmlFor="rowField">Row Field</Label>
            <Select 
              value={pivotConfig.rowField as string} 
              onValueChange={(value) => setPivotConfig({...pivotConfig, rowField: value as keyof ProcessedData})}
            >
              <SelectTrigger id="rowField">
                <SelectValue placeholder="Select row field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={`row-${field.key}`} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="columnField">Column Field</Label>
            <Select 
              value={pivotConfig.columnField as string} 
              onValueChange={(value) => setPivotConfig({...pivotConfig, columnField: value as keyof ProcessedData})}
            >
              <SelectTrigger id="columnField">
                <SelectValue placeholder="Select column field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={`col-${field.key}`} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="valueField">Value Field</Label>
            <Select 
              value={pivotConfig.valueField as string} 
              onValueChange={(value) => setPivotConfig({...pivotConfig, valueField: value as keyof ProcessedData})}
            >
              <SelectTrigger id="valueField">
                <SelectValue placeholder="Select value field" />
              </SelectTrigger>
              <SelectContent>
                {valueFields.map(field => (
                  <SelectItem key={`val-${field.key}`} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="aggregation">Aggregation</Label>
            <Select 
              value={pivotConfig.aggregation} 
              onValueChange={(value) => setPivotConfig({...pivotConfig, aggregation: value as PivotData['aggregation']})}
            >
              <SelectTrigger id="aggregation">
                <SelectValue placeholder="Select aggregation" />
              </SelectTrigger>
              <SelectContent>
                {aggregations.map(agg => (
                  <SelectItem key={agg.value} value={agg.value}>
                    {agg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        <TabsContent value="table" className="mt-0">
          <div className="rounded-md border overflow-x-auto">
            {pivotData.rows.length > 0 && pivotData.columns.length > 0 ? (
              <UITable>
                <TableHeader>
                  <TableRow className="bg-slate-100 dark:bg-slate-800">
                    <TableHead className="font-semibold">
                      {fields.find(f => f.key === pivotConfig.rowField)?.label || pivotConfig.rowField}
                    </TableHead>
                    {pivotData.columns.map((column, colIndex) => (
                      <TableHead key={colIndex} className="font-semibold text-center">
                        {column}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivotData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">{row}</TableCell>
                      {pivotData.columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className="text-center">
                          {pivotData.values[row][column] ? formatCellValue(pivotData.values[row][column]) : '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {formatCellValue(
                          pivotData.columns.reduce(
                            (sum, column) => sum + (pivotData.values[row][column] || 0), 
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    {pivotData.columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className="text-center font-medium">
                        {formatCellValue(
                          pivotData.rows.reduce(
                            (sum, row) => sum + (pivotData.values[row][column] || 0),
                            0
                          )
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      {formatCellValue(
                        pivotData.rows.reduce(
                          (rowSum, row) => rowSum + pivotData.columns.reduce(
                            (colSum, column) => colSum + (pivotData.values[row][column] || 0),
                            0
                          ),
                          0
                        )
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </UITable>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No data available for the selected configuration
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="chart" className="mt-0">
          <div className="h-[500px] w-full">
            {pivotData.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={pivotData.chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => {
                      if (pivotConfig.valueField === 'totalRevenue') {
                        return [`₹${Number(value).toLocaleString('en-IN')}`, ''];
                      }
                      return [value, ''];
                    }}
                  />
                  <Legend />
                  {pivotData.columns.map((column, index) => (
                    <Bar 
                      key={index} 
                      dataKey={column} 
                      fill={COLORS[index % COLORS.length]} 
                      name={column} 
                    />
                  ))}
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available for the selected configuration
              </div>
            )}
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default PivotView;
