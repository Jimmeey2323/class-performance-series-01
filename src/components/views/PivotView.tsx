
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, RotateCcw, Filter, SlidersHorizontal } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface PivotViewProps {
  data: ProcessedData[];
}

type PivotField = keyof ProcessedData;
type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max';

interface PivotConfig {
  rows: PivotField[];
  columns: PivotField[];
  values: PivotField[];
  aggregation: AggregationType;
}

const PivotView: React.FC<PivotViewProps> = ({ data }) => {
  const [config, setConfig] = useState<PivotConfig>({
    rows: ['cleanedClass'],
    columns: ['dayOfWeek'],
    values: ['totalCheckins'],
    aggregation: 'sum'
  });
  
  const [filterField, setFilterField] = useState<PivotField | ''>('');
  const [filterValue, setFilterValue] = useState('');

  const stringFields: PivotField[] = ['uniqueID', 'cleanedClass', 'dayOfWeek', 'classTime', 'location', 'teacherName', 'period'];
  const numericFields: PivotField[] = ['totalOccurrences', 'totalCancelled', 'totalCheckins', 'totalEmpty', 'totalNonEmpty', 'totalRevenue', 'totalTime', 'totalNonPaid'];
  
  // Filter data based on current filter
  const filteredData = useMemo(() => {
    if (!filterField || !filterValue) return data;
    
    return data.filter(item => {
      const fieldValue = String(item[filterField]);
      return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [data, filterField, filterValue]);

  // Generate pivot table data
  const pivotData = useMemo(() => {
    if (filteredData.length === 0) return { rows: [], columns: [], values: {} };
    
    // Get unique values for row and column fields
    const uniqueRows = [...new Set(filteredData.map(item => String(item[config.rows[0]])))]
      .sort((a, b) => a.localeCompare(b));
    
    const uniqueColumns = [...new Set(filteredData.map(item => String(item[config.columns[0]])))]
      .sort((a, b) => a.localeCompare(b));
    
    // Create value matrix
    const values: Record<string, Record<string, number>> = {};
    const totals: Record<string, number> = {};
    const columnTotals: Record<string, number> = {};
    
    // Initialize
    uniqueRows.forEach(row => {
      values[row] = {};
      totals[row] = 0;
      
      uniqueColumns.forEach(col => {
        values[row][col] = 0;
        if (!columnTotals[col]) columnTotals[col] = 0;
      });
    });
    
    // Calculate values
    filteredData.forEach(item => {
      const rowKey = String(item[config.rows[0]]);
      const colKey = String(item[config.columns[0]]);
      
      if (uniqueRows.includes(rowKey) && uniqueColumns.includes(colKey)) {
        const valueField = config.values[0];
        const value = typeof item[valueField] === 'string' 
          ? parseFloat(item[valueField] as string) 
          : Number(item[valueField]);
        
        if (!isNaN(value)) {
          if (config.aggregation === 'sum' || config.aggregation === 'average') {
            values[rowKey][colKey] += value;
            totals[rowKey] += value;
            columnTotals[colKey] += value;
          } else if (config.aggregation === 'count') {
            values[rowKey][colKey] += 1;
            totals[rowKey] += 1;
            columnTotals[colKey] += 1;
          } else if (config.aggregation === 'max') {
            values[rowKey][colKey] = Math.max(values[rowKey][colKey] || 0, value);
            totals[rowKey] = Math.max(totals[rowKey] || 0, value);
            columnTotals[colKey] = Math.max(columnTotals[colKey] || 0, value);
          } else if (config.aggregation === 'min') {
            if (values[rowKey][colKey] === 0) {
              values[rowKey][colKey] = value;
            } else {
              values[rowKey][colKey] = Math.min(values[rowKey][colKey], value);
            }
            
            if (totals[rowKey] === 0) {
              totals[rowKey] = value;
            } else {
              totals[rowKey] = Math.min(totals[rowKey], value);
            }
            
            if (columnTotals[colKey] === 0) {
              columnTotals[colKey] = value;
            } else {
              columnTotals[colKey] = Math.min(columnTotals[colKey], value);
            }
          }
        }
      }
    });
    
    // For average, divide by count
    if (config.aggregation === 'average') {
      const countMatrix: Record<string, Record<string, number>> = {};
      const rowCounts: Record<string, number> = {};
      const colCounts: Record<string, number> = {};
      
      // Initialize
      uniqueRows.forEach(row => {
        countMatrix[row] = {};
        rowCounts[row] = 0;
        
        uniqueColumns.forEach(col => {
          countMatrix[row][col] = 0;
          if (!colCounts[col]) colCounts[col] = 0;
        });
      });
      
      // Count
      filteredData.forEach(item => {
        const rowKey = String(item[config.rows[0]]);
        const colKey = String(item[config.columns[0]]);
        
        if (uniqueRows.includes(rowKey) && uniqueColumns.includes(colKey)) {
          countMatrix[rowKey][colKey] += 1;
          rowCounts[rowKey] += 1;
          colCounts[colKey] += 1;
        }
      });
      
      // Compute averages
      uniqueRows.forEach(row => {
        uniqueColumns.forEach(col => {
          if (countMatrix[row][col] > 0) {
            values[row][col] = values[row][col] / countMatrix[row][col];
          }
        });
        
        if (rowCounts[row] > 0) {
          totals[row] = totals[row] / rowCounts[row];
        }
      });
      
      uniqueColumns.forEach(col => {
        if (colCounts[col] > 0) {
          columnTotals[col] = columnTotals[col] / colCounts[col];
        }
      });
    }
    
    let grandTotal = 0;
    Object.values(totals).forEach(total => {
      grandTotal += total;
    });
    
    return {
      rows: uniqueRows,
      columns: uniqueColumns,
      values,
      rowTotals: totals,
      columnTotals,
      grandTotal
    };
  }, [filteredData, config]);

  // Format a cell value for display
  const formatValue = (value: number) => {
    if (config.values[0] === 'totalRevenue') {
      return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
    
    if (Number.isInteger(value)) {
      return value.toString();
    }
    
    return value.toFixed(1);
  };

  // Download the pivot table as CSV
  const downloadCSV = () => {
    if (pivotData.rows.length === 0) {
      toast({
        title: "No data to export",
        description: "The pivot table is empty",
        variant: "destructive",
      });
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header row
    csvContent += "," + pivotData.columns.join(",") + ",Total\n";
    
    // Data rows
    pivotData.rows.forEach(row => {
      let rowContent = row;
      
      pivotData.columns.forEach(col => {
        rowContent += "," + pivotData.values[row][col];
      });
      
      rowContent += "," + pivotData.rowTotals[row];
      csvContent += rowContent + "\n";
    });
    
    // Column totals
    let totalRow = "Total";
    pivotData.columns.forEach(col => {
      totalRow += "," + pivotData.columnTotals[col];
    });
    totalRow += "," + pivotData.grandTotal;
    csvContent += totalRow;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pivot_table.csv");
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "Pivot table data has been downloaded as CSV",
    });
  };

  // Reset configuration to default
  const resetConfig = () => {
    setConfig({
      rows: ['cleanedClass'],
      columns: ['dayOfWeek'],
      values: ['totalCheckins'],
      aggregation: 'sum'
    });
    setFilterField('');
    setFilterValue('');
    
    toast({
      title: "Configuration reset",
      description: "Pivot table configuration has been reset to default",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>Pivot Table Configuration</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={resetConfig}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button size="sm" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Row Field</label>
              <Select 
                value={config.rows[0]} 
                onValueChange={(value: string) => setConfig({...config, rows: [value as PivotField]})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select row field" />
                </SelectTrigger>
                <SelectContent>
                  {[...stringFields, ...numericFields].map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Column Field</label>
              <Select 
                value={config.columns[0]} 
                onValueChange={(value: string) => setConfig({...config, columns: [value as PivotField]})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column field" />
                </SelectTrigger>
                <SelectContent>
                  {[...stringFields, ...numericFields].map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Value Field</label>
              <Select 
                value={config.values[0]} 
                onValueChange={(value: string) => setConfig({...config, values: [value as PivotField]})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value field" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Aggregation</label>
              <Select 
                value={config.aggregation} 
                onValueChange={(value: string) => setConfig({...config, aggregation: value as AggregationType})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2 flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
              
              <Select 
                value={filterField}
                onValueChange={(value: string) => setFilterField(value as PivotField)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No filter</SelectItem>
                  {[...stringFields, ...numericFields].map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Filter value..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="max-w-xs"
                disabled={!filterField}
              />
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 inline-block mr-1" />
              Showing {filteredData.length} of {data.length} records
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border shadow-sm">
        <CardContent className="p-0 overflow-auto">
          {pivotData.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">{String(config.rows[0])}</TableHead>
                  {pivotData.columns.map(col => (
                    <TableHead key={col} className="text-center">{col}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold bg-muted/50">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pivotData.rows.map(row => (
                  <TableRow key={row}>
                    <TableCell className="font-medium">{row}</TableCell>
                    {pivotData.columns.map(col => (
                      <TableCell key={col} className="text-right">
                        {formatValue(pivotData.values[row][col])}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold bg-muted/30">
                      {formatValue(pivotData.rowTotals[row])}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  {pivotData.columns.map(col => (
                    <TableCell key={col} className="text-right font-semibold">
                      {formatValue(pivotData.columnTotals[col])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold">
                    {formatValue(pivotData.grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No data available for the selected configuration
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PivotView;
