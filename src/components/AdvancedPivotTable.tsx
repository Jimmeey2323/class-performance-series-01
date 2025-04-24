
import React, { useState, useEffect } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import { ArrowUp, ArrowDown, Filter, Download, Settings, Save, ChevronDown, ChevronUp, Table2, Palette } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

interface AdvancedPivotTableProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

type PivotDimensionKey = keyof ProcessedData | 'period-month' | 'period-quarter' | 'period-year';

interface PivotDimension {
  key: PivotDimensionKey;
  label: string;
}

interface PivotMetric {
  key: keyof ProcessedData;
  label: string;
  formatter?: (value: any) => string;
}

interface PivotTableStyle {
  cellPadding: string;
  headerBgColor: string;
  rowAlternateColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontSize: string;
  showBorders: boolean;
  cellBorderColor: string;
  heatmapEnabled: boolean;
  heatmapColors: {
    min: string;
    mid: string;
    max: string;
  };
}

interface SavedPivotTable {
  name: string;
  rowDimension: PivotDimensionKey;
  colDimension: PivotDimensionKey;
  metric: keyof ProcessedData;
  style: PivotTableStyle;
}

const defaultStyle: PivotTableStyle = {
  cellPadding: "px-4 py-2",
  headerBgColor: "bg-slate-100 dark:bg-slate-800",
  rowAlternateColor: "even:bg-slate-50 dark:even:bg-slate-900",
  textAlign: "center",
  fontSize: "text-sm",
  showBorders: true,
  cellBorderColor: "border-slate-200 dark:border-slate-700",
  heatmapEnabled: true,
  heatmapColors: {
    min: "#e5f7ff",
    mid: "#60a5fa",
    max: "#1d4ed8"
  }
};

// Helper function to extract month, quarter, year from period string
const extractPeriodComponents = (period: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = period.split('-')[0];
  const yearStr = period.split('-')[1];
  const year = yearStr ? `20${yearStr}` : 'Unknown';
  
  const monthIndex = months.indexOf(monthStr);
  const month = monthIndex !== -1 ? monthIndex + 1 : 0;
  const quarter = Math.ceil(month / 3);
  
  return {
    month: `${monthStr} ${year}`,
    quarter: `Q${quarter} ${year}`,
    year
  };
};

// Process the period dimension for special time-based groupings
const getPeriodValue = (item: ProcessedData, dimension: PivotDimensionKey): string => {
  if (!dimension.toString().startsWith('period-')) {
    return String(item[dimension as keyof ProcessedData] || 'Unknown');
  }
  
  const period = item.period || 'Unknown';
  const components = extractPeriodComponents(period);
  
  switch (dimension) {
    case 'period-month':
      return components.month;
    case 'period-quarter':
      return components.quarter;
    case 'period-year':
      return components.year;
    default:
      return period;
  }
};

const AdvancedPivotTable: React.FC<AdvancedPivotTableProps> = ({ data, trainerAvatars }) => {
  const [rowDimension, setRowDimension] = useState<PivotDimensionKey>('cleanedClass');
  const [colDimension, setColDimension] = useState<PivotDimensionKey>('dayOfWeek');
  const [metric, setMetric] = useState<keyof ProcessedData>('totalCheckins');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tableStyle, setTableStyle] = useState<PivotTableStyle>(defaultStyle);
  const [savedTables, setSavedTables] = useState<SavedPivotTable[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const { toast } = useToast();
  
  const dimensions: PivotDimension[] = [
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'classTime', label: 'Class Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
    { key: 'period-month', label: 'Month' },
    { key: 'period-quarter', label: 'Quarter' },
    { key: 'period-year', label: 'Year' },
  ];

  const metrics: PivotMetric[] = [
    { key: 'totalCheckins', label: 'Check-ins' },
    { key: 'totalOccurrences', label: 'Classes' },
    { key: 'totalRevenue', label: 'Revenue', formatter: value => formatIndianCurrency(Number(value)) },
    { key: 'classAverageIncludingEmpty', label: 'Avg. Attendance', formatter: value => (typeof value === 'number' ? value.toFixed(1) : String(value)) },
  ];

  // Load saved tables from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('savedPivotTables');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedTables(parsed);
      } catch (error) {
        console.error('Failed to load saved pivot tables:', error);
      }
    }
  }, []);

  // Get unique values for column dimension
  const columnValues = React.useMemo(() => {
    const uniqueValues = new Set(data.map(item => getPeriodValue(item, colDimension)));
    return Array.from(uniqueValues).sort();
  }, [data, colDimension]);

  // Create pivot table data
  const pivotData = React.useMemo(() => {
    // Group data by row dimension
    const rowGroups = new Map<string, ProcessedData[]>();
    
    data.forEach(item => {
      const rowKey = getPeriodValue(item, rowDimension);
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
        const cellItems = items.filter(item => getPeriodValue(item, colDimension) === colKey);
        
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
    if (value === null || value === 0 || columnMax === 0 || !tableStyle.heatmapEnabled) {
      return '';
    }
    
    // Calculate color intensity based on the proportion of the max value
    const intensity = Math.min(0.9, Math.max(0.1, value / columnMax));
    return `bg-[${tableStyle.heatmapColors.min}] bg-opacity-[${intensity.toFixed(2)}]`;
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

  // Export the table data to CSV
  const exportToCSV = () => {
    // Create header row
    const headerRow = [`${dimensions.find(d => d.key === rowDimension)?.label || 'Row'}`];
    columnValues.forEach(colKey => {
      headerRow.push(colKey);
    });
    headerRow.push('Total');
    
    // Create data rows
    const dataRows = pivotData.map(row => {
      const dataRow: string[] = [row.rowKey];
      columnValues.forEach(colKey => {
        dataRow.push(formatCellValue(row[colKey]));
      });
      dataRow.push(formatCellValue(row.total));
      return dataRow;
    });
    
    // Add totals row
    const totalsRow = ['Total'];
    columnValues.forEach(colKey => {
      totalsRow.push(formatCellValue(columnTotals[colKey]));
    });
    totalsRow.push(formatCellValue(columnTotals.total));
    
    // Combine all rows
    const allRows = [headerRow, ...dataRows, totalsRow];
    
    // Convert to CSV format
    const csvContent = allRows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pivot-table-${rowDimension}-${colDimension}-${metric}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveCurrentTable = () => {
    if (!newTableName.trim()) {
      toast({
        title: "Table name required",
        description: "Please enter a name for this pivot table",
        variant: "destructive",
      });
      return;
    }
    
    const newTable: SavedPivotTable = {
      name: newTableName,
      rowDimension,
      colDimension,
      metric,
      style: { ...tableStyle },
    };
    
    const updatedSavedTables = [...savedTables, newTable];
    setSavedTables(updatedSavedTables);
    localStorage.setItem('savedPivotTables', JSON.stringify(updatedSavedTables));
    
    setNewTableName('');
    
    toast({
      title: "Table saved",
      description: `Pivot table "${newTableName}" saved successfully`,
    });
  };

  const loadSavedTable = (savedTable: SavedPivotTable) => {
    setRowDimension(savedTable.rowDimension);
    setColDimension(savedTable.colDimension);
    setMetric(savedTable.metric);
    setTableStyle(savedTable.style);
    
    toast({
      title: "Table loaded",
      description: `Pivot table "${savedTable.name}" loaded successfully`,
    });
  };

  const deleteSavedTable = (index: number) => {
    const updatedSavedTables = savedTables.filter((_, i) => i !== index);
    setSavedTables(updatedSavedTables);
    localStorage.setItem('savedPivotTables', JSON.stringify(updatedSavedTables));
    
    toast({
      title: "Table deleted",
      description: "Pivot table deleted successfully",
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Advanced Pivot Table</h2>
          
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Save className="h-4 w-4 mr-2" />
                  Save/Load
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save or Load Pivot Table</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 my-4">
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Enter pivot table name" 
                      value={newTableName} 
                      onChange={(e) => setNewTableName(e.target.value)}
                    />
                    <Button onClick={saveCurrentTable}>Save Current</Button>
                  </div>
                  
                  {savedTables.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No saved pivot tables. Save your current configuration to reuse it later.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {savedTables.map((table, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="font-medium">{table.name}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => loadSavedTable(table)}>
                              Load
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteSavedTable(index)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Palette className="h-4 w-4 mr-2" />
                  Style
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Table Styling</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Text Alignment</Label>
                      <Select 
                        value={tableStyle.textAlign} 
                        onValueChange={(value: 'left' | 'center' | 'right') => 
                          setTableStyle({...tableStyle, textAlign: value})
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Font Size</Label>
                      <Select 
                        value={tableStyle.fontSize} 
                        onValueChange={(value) => 
                          setTableStyle({...tableStyle, fontSize: value})
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-xs">Small</SelectItem>
                          <SelectItem value="text-sm">Medium</SelectItem>
                          <SelectItem value="text-base">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Show Borders</Label>
                      <Switch 
                        checked={tableStyle.showBorders}
                        onCheckedChange={(checked) => 
                          setTableStyle({...tableStyle, showBorders: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Heatmap Colors</Label>
                      <Switch 
                        checked={tableStyle.heatmapEnabled}
                        onCheckedChange={(checked) => 
                          setTableStyle({...tableStyle, heatmapEnabled: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <Label>Row Dimension</Label>
            <Select value={String(rowDimension)} onValueChange={(value) => setRowDimension(value as PivotDimensionKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose row dimension" />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map((dim) => (
                  <SelectItem key={String(dim.key)} value={String(dim.key)}>
                    {dim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label>Column Dimension</Label>
            <Select value={String(colDimension)} onValueChange={(value) => setColDimension(value as PivotDimensionKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose column dimension" />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map((dim) => (
                  <SelectItem key={String(dim.key)} value={String(dim.key)}>
                    {dim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
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
      </div>
      
      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          <Table className={tableStyle.showBorders ? "border-collapse border" : ""}>
            <TableHeader className={tableStyle.headerBgColor}>
              <TableRow>
                <TableHead className={`${tableStyle.showBorders ? "border" : "border-r"} ${tableStyle.cellPadding} ${tableStyle.cellBorderColor}`}>
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
                  <TableHead 
                    key={colKey} 
                    className={`${tableStyle.cellPadding} ${tableStyle.fontSize} text-${tableStyle.textAlign} font-medium ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : ""}`}
                  >
                    {colKey}
                  </TableHead>
                ))}
                <TableHead 
                  className={`text-${tableStyle.textAlign} bg-gray-50 dark:bg-gray-900 font-semibold ${tableStyle.cellPadding} ${tableStyle.fontSize} ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : ""}`}
                >
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={tableStyle.rowAlternateColor}>
                  <TableCell 
                    className={`${tableStyle.cellPadding} ${tableStyle.fontSize} ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : "border-r"} font-medium text-${tableStyle.textAlign}`}
                  >
                    {getRowAvatar(row.rowKey)}
                    {row.rowKey}
                  </TableCell>
                  {columnValues.map((colKey) => (
                    <TableCell 
                      key={colKey} 
                      className={`${tableStyle.cellPadding} ${tableStyle.fontSize} text-${tableStyle.textAlign} ${getCellBackground(row[colKey], columnMaxValues[colKey])} ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : ""}`}
                    >
                      {formatCellValue(row[colKey])}
                    </TableCell>
                  ))}
                  <TableCell 
                    className={`${tableStyle.cellPadding} ${tableStyle.fontSize} text-${tableStyle.textAlign} font-semibold bg-gray-50 dark:bg-gray-900 ${getCellBackground(row.total, columnMaxValues.total)} ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : ""}`}
                  >
                    {formatCellValue(row.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-100 dark:bg-gray-800 font-semibold">
                <TableCell 
                  className={`${tableStyle.cellPadding} ${tableStyle.fontSize} ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : "border-r"}`}
                >
                  Total
                </TableCell>
                {columnValues.map((colKey) => (
                  <TableCell 
                    key={colKey} 
                    className={`${tableStyle.cellPadding} ${tableStyle.fontSize} text-${tableStyle.textAlign} ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : ""}`}
                  >
                    {formatCellValue(columnTotals[colKey])}
                  </TableCell>
                ))}
                <TableCell 
                  className={`${tableStyle.cellPadding} ${tableStyle.fontSize} text-${tableStyle.textAlign} bg-gray-200 dark:bg-gray-700 ${tableStyle.showBorders ? `border ${tableStyle.cellBorderColor}` : ""}`}
                >
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

export default AdvancedPivotTable;
