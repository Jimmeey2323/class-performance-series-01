
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatIndianCurrency } from './MetricsPanel';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Download, Edit, Settings, ArrowDown, ArrowUp } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface PivotTableProps {
  data: ProcessedData[];
}

interface PivotConfig {
  id: string;
  name: string;
  rowField: keyof ProcessedData;
  colField: keyof ProcessedData;
  valueField: keyof ProcessedData;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupRowsBy?: 'none' | 'month' | 'quarter' | 'year' | 'day';
  groupColsBy?: 'none' | 'month' | 'quarter' | 'year' | 'day';
  showTotals: boolean;
  showAverage: boolean;
  sortOrder: 'asc' | 'desc' | 'none';
  sortBy: 'row' | 'value';
}

const DEFAULT_CONFIG: PivotConfig = {
  id: 'default',
  name: 'Default View',
  rowField: 'cleanedClass',
  colField: 'dayOfWeek',
  valueField: 'totalCheckins',
  aggregation: 'sum',
  groupRowsBy: 'none',
  groupColsBy: 'none',
  showTotals: true,
  showAverage: false,
  sortOrder: 'desc',
  sortBy: 'value'
};

// Helper function to group values by period
const groupByPeriod = (value: string, groupBy: string): string => {
  if (!value || groupBy === 'none') return value;
  
  if (groupBy === 'month') {
    // For period like 'Jan-23', just return as is
    return value;
  } else if (groupBy === 'quarter') {
    // For period like 'Jan-23', convert to 'Q1 2023'
    if (value.includes('-')) {
      const [month, year] = value.split('-');
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
      const quarter = Math.floor(monthIndex / 3) + 1;
      return `Q${quarter} 20${year}`;
    }
    return value;
  } else if (groupBy === 'year') {
    // For period like 'Jan-23', extract year
    if (value.includes('-')) {
      const [_, year] = value.split('-');
      return `20${year}`;
    }
    return value;
  } else if (groupBy === 'day') {
    // For dayOfWeek, group by weekday/weekend
    if (['Saturday', 'Sunday'].includes(value)) {
      return 'Weekend';
    } else {
      return 'Weekday';
    }
  }
  
  return value;
};

// Format value for display based on field type
const formatValue = (value: number, field: keyof ProcessedData): string => {
  if (field === 'totalRevenue') {
    return formatIndianCurrency(value);
  } else if (field === 'classAverageIncludingEmpty' || field === 'classAverageExcludingEmpty') {
    return value.toFixed(1);
  } else {
    return value.toLocaleString();
  }
};

// Get cell color based on value and range
const getCellColor = (value: number, max: number): string => {
  if (value === 0) return '';
  
  const intensity = Math.min(Math.max(value / max, 0.1), 1);
  
  // Use a color scale from light to dark
  return `rgba(79, 70, 229, ${intensity * 0.2}) dark:bg-indigo-900/20`;
};

const PivotTable: React.FC<PivotTableProps> = ({ data }) => {
  const [savedConfigs, setSavedConfigs] = useLocalStorage<PivotConfig[]>('pivot-table-configs', [DEFAULT_CONFIG]);
  const [activeConfigId, setActiveConfigId] = useState<string>(savedConfigs[0]?.id || 'default');
  const [newConfigName, setNewConfigName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Find active config
  const activeConfig = savedConfigs.find(config => config.id === activeConfigId) || DEFAULT_CONFIG;
  
  // Current editable config
  const [currentConfig, setCurrentConfig] = useState<PivotConfig>({...activeConfig});

  // Update config when active config changes
  React.useEffect(() => {
    setCurrentConfig({...activeConfig});
  }, [activeConfig]);
  
  // Available fields for pivot
  const rowFields = [
    { value: 'cleanedClass', label: 'Class Type' },
    { value: 'teacherName', label: 'Instructor' },
    { value: 'location', label: 'Location' },
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'period', label: 'Period' }
  ];
  
  const colFields = [
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'period', label: 'Period' },
    { value: 'location', label: 'Location' },
    { value: 'teacherName', label: 'Instructor' },
    { value: 'cleanedClass', label: 'Class Type' }
  ];
  
  const valueFields = [
    { value: 'totalCheckins', label: 'Check-ins' },
    { value: 'totalRevenue', label: 'Revenue' },
    { value: 'totalOccurrences', label: 'Classes' },
    { value: 'totalCancelled', label: 'Cancellations' },
    { value: 'classAverageIncludingEmpty', label: 'Avg. Attendance (All)' },
    { value: 'classAverageExcludingEmpty', label: 'Avg. Attendance (Non-empty)' }
  ];
  
  const aggregationOptions = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];
  
  const groupingOptions = [
    { value: 'none', label: 'No Grouping' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
    { value: 'day', label: 'Weekday/Weekend' }
  ];
  
  // Generate pivot table data
  const pivotData = useMemo(() => {
    if (!data || data.length === 0) return { rows: [], cols: [], data: {}, totals: {}, maxValue: 0 };
    
    const config = isEditMode ? currentConfig : activeConfig;
    const { rowField, colField, valueField, aggregation, groupRowsBy, groupColsBy, sortBy, sortOrder } = config;
    
    // Step 1: Group the data by row and column dimensions
    const groupedData: Record<string, Record<string, number[]>> = {};
    const rowValues = new Set<string>();
    const colValues = new Set<string>();
    
    // Preprocess data
    data.forEach(item => {
      const rowValue = String(item[rowField] || 'Unknown');
      const colValue = String(item[colField] || 'Unknown');
      const value = Number(item[valueField] || 0);
      
      // Apply grouping if specified
      const groupedRowValue = groupByPeriod(rowValue, groupRowsBy || 'none');
      const groupedColValue = groupByPeriod(colValue, groupColsBy || 'none');
      
      rowValues.add(groupedRowValue);
      colValues.add(groupedColValue);
      
      if (!groupedData[groupedRowValue]) {
        groupedData[groupedRowValue] = {};
      }
      
      if (!groupedData[groupedRowValue][groupedColValue]) {
        groupedData[groupedRowValue][groupedColValue] = [];
      }
      
      groupedData[groupedRowValue][groupedColValue].push(value);
    });
    
    // Step 2: Apply aggregation function to each cell
    const aggregatedData: Record<string, Record<string, number>> = {};
    let maxValue = 0;
    
    Object.entries(groupedData).forEach(([row, columns]) => {
      aggregatedData[row] = {};
      
      Object.entries(columns).forEach(([col, values]) => {
        let aggregatedValue: number;
        
        switch (aggregation) {
          case 'sum':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'count':
            aggregatedValue = values.length;
            break;
          case 'min':
            aggregatedValue = Math.min(...values);
            break;
          case 'max':
            aggregatedValue = Math.max(...values);
            break;
          default:
            aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        }
        
        aggregatedData[row][col] = aggregatedValue;
        
        if (aggregatedValue > maxValue) {
          maxValue = aggregatedValue;
        }
      });
    });
    
    // Step 3: Calculate row and column totals
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    
    // Array of all row and column values
    let rows = Array.from(rowValues);
    let cols = Array.from(colValues);
    
    // Sort columns by day of week if it's the column field
    if (colField === 'dayOfWeek' && !groupColsBy) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      cols = cols.sort((a, b) => days.indexOf(a) - days.indexOf(b));
    }
    
    // Calculate row totals
    rows.forEach(row => {
      let total = 0;
      let count = 0;
      
      cols.forEach(col => {
        if (aggregatedData[row] && aggregatedData[row][col] !== undefined) {
          total += aggregatedData[row][col];
          count++;
        }
      });
      
      rowTotals[row] = aggregation === 'avg' && count > 0 ? total / count : total;
    });
    
    // Calculate column totals
    cols.forEach(col => {
      let total = 0;
      let count = 0;
      
      rows.forEach(row => {
        if (aggregatedData[row] && aggregatedData[row][col] !== undefined) {
          total += aggregatedData[row][col];
          count++;
        }
      });
      
      colTotals[col] = aggregation === 'avg' && count > 0 ? total / count : total;
    });
    
    // Step 4: Sort rows based on sort options
    if (sortOrder !== 'none') {
      if (sortBy === 'row') {
        // Sort alphabetically by row name
        rows = rows.sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
      } else {
        // Sort by row totals
        rows = rows.sort((a, b) => {
          const aTotal = rowTotals[a] || 0;
          const bTotal = rowTotals[b] || 0;
          return sortOrder === 'asc' ? aTotal - bTotal : bTotal - aTotal;
        });
      }
    }
    
    return {
      rows,
      cols,
      data: aggregatedData,
      rowTotals,
      colTotals,
      maxValue
    };
  }, [data, activeConfig, currentConfig, isEditMode]);

  // Handle save config
  const handleSaveConfig = () => {
    if (!newConfigName) return;
    
    const newConfig = {
      ...currentConfig,
      id: `config-${Date.now()}`,
      name: newConfigName
    };
    
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    setActiveConfigId(newConfig.id);
    setNewConfigName('');
    setShowDialog(false);
  };
  
  // Handle update config
  const handleUpdateConfig = () => {
    const updatedConfigs = savedConfigs.map(config => 
      config.id === activeConfigId ? currentConfig : config
    );
    
    setSavedConfigs(updatedConfigs);
    setIsEditMode(false);
  };

  // Handle delete config
  const handleDeleteConfig = (id: string) => {
    if (savedConfigs.length <= 1) return;
    
    const updatedConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(updatedConfigs);
    
    if (activeConfigId === id) {
      setActiveConfigId(updatedConfigs[0].id);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const { rows, cols, data, rowTotals, colTotals } = pivotData;
    const config = isEditMode ? currentConfig : activeConfig;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Headers
    csvContent += `${config.rowField} / ${config.colField},${cols.join(',')},Total\n`;
    
    // Rows
    rows.forEach(row => {
      csvContent += `${row},`;
      
      cols.forEach(col => {
        const value = data[row] && data[row][col] !== undefined ? data[row][col] : '';
        csvContent += `${value},`;
      });
      
      csvContent += `${rowTotals[row]}\n`;
    });
    
    // Totals row
    csvContent += 'Total,';
    cols.forEach(col => {
      csvContent += `${colTotals[col]},`;
    });
    
    // Calculate grand total
    const grandTotal = Object.values(rowTotals).reduce((sum, val) => sum + val, 0);
    csvContent += `${grandTotal}\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pivot-table-${config.name.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Pivot Table</h3>
          <Badge variant="outline" className="font-normal">
            {activeConfig.name}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isEditMode ? (
            <>
              <Button onClick={handleUpdateConfig} size="sm" variant="default">
                Save Changes
              </Button>
              <Button onClick={() => setIsEditMode(false)} size="sm" variant="outline">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Views
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {savedConfigs.map((config) => (
                    <DropdownMenuItem 
                      key={config.id}
                      className="flex justify-between"
                      onSelect={() => setActiveConfigId(config.id)}
                    >
                      <span className={cn(activeConfigId === config.id ? 'font-medium' : '')}>
                        {config.name}
                      </span>
                      {savedConfigs.length > 1 && activeConfigId !== config.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(config.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setShowDialog(true)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Current View
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsEditMode(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Customize Current View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={() => exportToCSV()} size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <Button onClick={() => setIsEditMode(true)} size="sm" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditMode ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rowField">Row Dimension</Label>
                  <Select 
                    value={currentConfig.rowField as string}
                    onValueChange={(value) => setCurrentConfig({...currentConfig, rowField: value as keyof ProcessedData})}
                  >
                    <SelectTrigger id="rowField">
                      <SelectValue placeholder="Select row field" />
                    </SelectTrigger>
                    <SelectContent>
                      {rowFields.map(field => (
                        <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groupRowsBy">Group Rows By</Label>
                  <Select 
                    value={currentConfig.groupRowsBy || 'none'}
                    onValueChange={(value) => setCurrentConfig({
                      ...currentConfig, 
                      groupRowsBy: value as 'none' | 'month' | 'quarter' | 'year' | 'day'
                    })}
                  >
                    <SelectTrigger id="groupRowsBy">
                      <SelectValue placeholder="Select grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupingOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="colField">Column Dimension</Label>
                  <Select 
                    value={currentConfig.colField as string}
                    onValueChange={(value) => setCurrentConfig({...currentConfig, colField: value as keyof ProcessedData})}
                  >
                    <SelectTrigger id="colField">
                      <SelectValue placeholder="Select column field" />
                    </SelectTrigger>
                    <SelectContent>
                      {colFields.map(field => (
                        <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groupColsBy">Group Columns By</Label>
                  <Select 
                    value={currentConfig.groupColsBy || 'none'}
                    onValueChange={(value) => setCurrentConfig({
                      ...currentConfig, 
                      groupColsBy: value as 'none' | 'month' | 'quarter' | 'year' | 'day'
                    })}
                  >
                    <SelectTrigger id="groupColsBy">
                      <SelectValue placeholder="Select grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupingOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valueField">Value Field</Label>
                  <Select 
                    value={currentConfig.valueField as string}
                    onValueChange={(value) => setCurrentConfig({...currentConfig, valueField: value as keyof ProcessedData})}
                  >
                    <SelectTrigger id="valueField">
                      <SelectValue placeholder="Select value field" />
                    </SelectTrigger>
                    <SelectContent>
                      {valueFields.map(field => (
                        <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aggregation">Aggregation</Label>
                  <Select 
                    value={currentConfig.aggregation}
                    onValueChange={(value) => setCurrentConfig({
                      ...currentConfig, 
                      aggregation: value as 'sum' | 'avg' | 'count' | 'min' | 'max'
                    })}
                  >
                    <SelectTrigger id="aggregation">
                      <SelectValue placeholder="Select aggregation" />
                    </SelectTrigger>
                    <SelectContent>
                      {aggregationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Sort By</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select 
                      value={currentConfig.sortBy}
                      onValueChange={(value) => setCurrentConfig({
                        ...currentConfig, 
                        sortBy: value as 'row' | 'value'
                      })}
                    >
                      <SelectTrigger id="sortBy">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="row">Row Label</SelectItem>
                        <SelectItem value="value">Row Total</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={currentConfig.sortOrder}
                      onValueChange={(value) => setCurrentConfig({
                        ...currentConfig, 
                        sortOrder: value as 'asc' | 'desc' | 'none'
                      })}
                    >
                      <SelectTrigger id="sortOrder">
                        <SelectValue placeholder="Sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="showTotals"
                      checked={currentConfig.showTotals}
                      onCheckedChange={(checked) => setCurrentConfig({...currentConfig, showTotals: checked})}
                    />
                    <Label htmlFor="showTotals">Show Totals</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="showAverage"
                      checked={currentConfig.showAverage}
                      onCheckedChange={(checked) => setCurrentConfig({...currentConfig, showAverage: checked})}
                    />
                    <Label htmlFor="showAverage">Show Averages</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Pivot Table View</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="viewName">View Name</Label>
                <Input
                  id="viewName"
                  placeholder="Enter view name"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig} disabled={!newConfigName}>Save View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pivot Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium border-r">
                  {isEditMode ? currentConfig.rowField : activeConfig.rowField} / {isEditMode ? currentConfig.colField : activeConfig.colField}
                </TableHead>
                {pivotData.cols.map((col) => (
                  <TableHead key={col} className="text-center min-w-[100px]">
                    {col}
                  </TableHead>
                ))}
                {(isEditMode ? currentConfig.showTotals : activeConfig.showTotals) && (
                  <TableHead className="text-center font-medium bg-muted/50 min-w-[100px]">Total</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.rows.map((row) => (
                <TableRow key={row}>
                  <TableCell className="font-medium border-r">{row}</TableCell>
                  {pivotData.cols.map((col) => (
                    <TableCell 
                      key={`${row}-${col}`}
                      className={`text-center ${getCellColor(
                        pivotData.data[row]?.[col] || 0, 
                        pivotData.maxValue
                      )}`}
                    >
                      {pivotData.data[row]?.[col] !== undefined
                        ? formatValue(pivotData.data[row][col], (isEditMode ? currentConfig.valueField : activeConfig.valueField))
                        : '-'}
                    </TableCell>
                  ))}
                  {(isEditMode ? currentConfig.showTotals : activeConfig.showTotals) && (
                    <TableCell className="text-center font-medium bg-muted/50">
                      {formatValue(pivotData.rowTotals[row] || 0, (isEditMode ? currentConfig.valueField : activeConfig.valueField))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              
              {/* Totals row */}
              {(isEditMode ? currentConfig.showTotals : activeConfig.showTotals) && (
                <TableRow>
                  <TableCell className="font-medium border-r bg-muted/50">Total</TableCell>
                  {pivotData.cols.map((col) => (
                    <TableCell 
                      key={`total-${col}`}
                      className="text-center font-medium bg-muted/50"
                    >
                      {formatValue(pivotData.colTotals[col] || 0, (isEditMode ? currentConfig.valueField : activeConfig.valueField))}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-medium bg-muted/70">
                    {formatValue(
                      Object.values(pivotData.rowTotals).reduce((sum, val) => sum + val, 0),
                      (isEditMode ? currentConfig.valueField : activeConfig.valueField)
                    )}
                  </TableCell>
                </TableRow>
              )}
              
              {/* Averages row */}
              {(isEditMode ? currentConfig.showAverage : activeConfig.showAverage) && pivotData.rows.length > 0 && (
                <TableRow>
                  <TableCell className="font-medium border-r bg-muted/30">Average</TableCell>
                  {pivotData.cols.map((col) => {
                    const values = pivotData.rows
                      .filter(row => pivotData.data[row]?.[col] !== undefined)
                      .map(row => pivotData.data[row][col]);
                      
                    const avg = values.length > 0 
                      ? values.reduce((sum, val) => sum + val, 0) / values.length 
                      : 0;
                      
                    return (
                      <TableCell 
                        key={`avg-${col}`}
                        className="text-center bg-muted/30"
                      >
                        {formatValue(avg, (isEditMode ? currentConfig.valueField : activeConfig.valueField))}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-medium bg-muted/50">
                    {formatValue(
                      Object.values(pivotData.rowTotals).reduce((sum, val) => sum + val, 0) / Math.max(1, pivotData.rows.length),
                      (isEditMode ? currentConfig.valueField : activeConfig.valueField)
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PivotTable;
