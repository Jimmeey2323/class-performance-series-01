
import React, { useState, useEffect } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatIndianCurrency } from '../MetricsPanel';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ChevronDown, ChevronUp, Save, FileDown, Trash, Plus, X, Bookmark, Settings, Download, Filter, LayoutGrid, BarChart3, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

interface PivotViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

type PivotDimension = 'cleanedClass' | 'teacherName' | 'location' | 'dayOfWeek' | 'period' | 'time' | 'month' | 'quarter' | 'year';
type PivotMetric = 'totalCheckins' | 'totalRevenue' | 'totalOccurrences' | 'classAverageExcludingEmpty' | 'totalCancelled' | 'totalEmpty';

interface PivotConfig {
  id: string;
  name: string;
  rowDimension: PivotDimension;
  colDimension: PivotDimension;
  metric: PivotMetric;
  showTotals: boolean;
  showPercentages: boolean;
  dateGrouping: 'none' | 'month' | 'quarter' | 'year';
  valueDisplay: 'raw' | 'formatted';
  colorIntensity: boolean;
}

// Helper functions for time periods
const getMonthFromDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr.split(',')[0]);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  } catch (e) {
    return 'Unknown';
  }
};

const getQuarterFromDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr.split(',')[0]);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  } catch (e) {
    return 'Unknown';
  }
};

const getYearFromDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr.split(',')[0]);
    return date.getFullYear().toString();
  } catch (e) {
    return 'Unknown';
  }
};

const PivotView: React.FC<PivotViewProps> = ({ data, trainerAvatars }) => {
  // Default pivot configuration
  const defaultPivotConfig: PivotConfig = {
    id: 'default',
    name: 'Default View',
    rowDimension: 'cleanedClass',
    colDimension: 'dayOfWeek',
    metric: 'totalCheckins',
    showTotals: true,
    showPercentages: false,
    dateGrouping: 'none',
    valueDisplay: 'raw',
    colorIntensity: true,
  };

  // Load saved configurations from localStorage
  const [savedConfigs, setSavedConfigs] = useLocalStorage<PivotConfig[]>('class-analytics-pivot-configs', [defaultPivotConfig]);
  
  const [activeConfig, setActiveConfig] = useState<PivotConfig>(defaultPivotConfig);
  const [newConfigName, setNewConfigName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [minimumValue, setMinimumValue] = useState<number | null>(null);
  
  const [filterMode, setFilterMode] = useState<'off' | 'exclude' | 'include'>('off');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({});
  const [filterField, setFilterField] = useState<PivotDimension>('cleanedClass');

  // Set active config on load
  useEffect(() => {
    if (savedConfigs.length > 0) {
      setActiveConfig(savedConfigs[0]);
    }
  }, [savedConfigs]);

  // Enhanced dimension options including time periods
  const dimensionOptions = [
    { value: 'cleanedClass', label: 'Class Type' },
    { value: 'teacherName', label: 'Instructor' },
    { value: 'location', label: 'Location' },
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'period', label: 'Period' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
    { value: 'time', label: 'Time' },
  ];

  const metricOptions = [
    { value: 'totalCheckins', label: 'Check-ins' },
    { value: 'totalRevenue', label: 'Revenue' },
    { value: 'totalOccurrences', label: 'Classes' },
    { value: 'classAverageExcludingEmpty', label: 'Avg. Attendance' },
    { value: 'totalCancelled', label: 'Cancellations' },
    { value: 'totalEmpty', label: 'Empty Classes' },
  ];

  // Get dimension value based on current date grouping setting
  const getDimensionValue = (item: ProcessedData, dimension: PivotDimension): string => {
    if (dimension === 'month') {
      return getMonthFromDate(item.date || '');
    } else if (dimension === 'quarter') {
      return getQuarterFromDate(item.date || '');
    } else if (dimension === 'year') {
      return getYearFromDate(item.date || '');
    } else if (dimension === 'time') {
      return item.classTime || 'Unknown';
    } else {
      return String(item[dimension] || 'Unknown');
    }
  };

  // Format cell values based on the metric
  const formatCellValue = (value: number, metric: PivotMetric): string => {
    if (activeConfig.valueDisplay === 'raw') {
      return value.toString();
    }
    
    if (metric === 'totalRevenue') {
      return formatIndianCurrency(value);
    } else if (metric === 'classAverageExcludingEmpty' || metric === 'classAverageIncludingEmpty') {
      return value.toFixed(1);
    } else {
      return value.toLocaleString();
    }
  };

  // Process data for pivot table
  const pivotData = React.useMemo(() => {
    const rows = new Map<string, Map<string, number>>();
    const rowTotals = new Map<string, number>();
    const colTotals = new Map<string, number>();
    const colValues = new Set<string>();
    let grandTotal = 0;
    
    // Apply date grouping if needed
    let processedData = [...data];
    
    // Apply filters
    if (filterMode !== 'off' && Object.keys(selectedFilters).length > 0) {
      processedData = processedData.filter(item => {
        const value = getDimensionValue(item, filterField);
        if (filterMode === 'include') {
          return selectedFilters[value];
        } else if (filterMode === 'exclude') {
          return !selectedFilters[value];
        }
        return true;
      });
    }

    // Aggregate data
    processedData.forEach(item => {
      const rowValue = getDimensionValue(item, activeConfig.rowDimension);
      const colValue = getDimensionValue(item, activeConfig.colDimension);
      
      // Add column value to set of all column values
      colValues.add(colValue);
      
      // Get the metric value
      let value: number;
      if (typeof item[activeConfig.metric] === 'string') {
        value = parseFloat(String(item[activeConfig.metric]));
        if (isNaN(value)) value = 0;
      } else {
        value = Number(item[activeConfig.metric] || 0);
      }

      // Initialize row if needed
      if (!rows.has(rowValue)) {
        rows.set(rowValue, new Map<string, number>());
      }
      
      // Initialize cell if needed
      const row = rows.get(rowValue)!;
      if (!row.has(colValue)) {
        row.set(colValue, 0);
      }
      
      // Update cell value
      row.set(colValue, row.get(colValue)! + value);
      
      // Update row total
      if (!rowTotals.has(rowValue)) {
        rowTotals.set(rowValue, 0);
      }
      rowTotals.set(rowValue, rowTotals.get(rowValue)! + value);
      
      // Update column total
      if (!colTotals.has(colValue)) {
        colTotals.set(colValue, 0);
      }
      colTotals.set(colValue, colTotals.get(colValue)! + value);
      
      // Update grand total
      grandTotal += value;
    });
    
    // Sort columns alphabetically (except for days of week)
    let sortedCols = Array.from(colValues);
    if (activeConfig.colDimension === 'dayOfWeek') {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      sortedCols = sortedCols.sort((a, b) => {
        const indexA = days.indexOf(a);
        const indexB = days.indexOf(b);
        return indexA - indexB;
      });
    } else {
      sortedCols.sort();
    }
    
    // Convert to sorted array of rows for rendering
    let rowEntries = Array.from(rows.entries());
    
    // Apply sort if specified
    if (sortColumn) {
      if (sortColumn === 'row') {
        rowEntries.sort(([rowA], [rowB]) => {
          const valueA = rowTotals.get(rowA) || 0;
          const valueB = rowTotals.get(rowB) || 0;
          return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
        });
      } else if (sortColumn === 'total') {
        rowEntries.sort(([rowA], [rowB]) => {
          const valueA = rowTotals.get(rowA) || 0;
          const valueB = rowTotals.get(rowB) || 0;
          return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
        });
      } else {
        rowEntries.sort(([rowA, cellsA], [rowB, cellsB]) => {
          const valueA = cellsA.get(sortColumn) || 0;
          const valueB = cellsB.get(sortColumn) || 0;
          return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
        });
      }
    }

    // Filter by minimum value if specified
    if (minimumValue !== null) {
      rowEntries = rowEntries.filter(([rowKey, cells]) => {
        return rowTotals.get(rowKey)! >= minimumValue;
      });
    }

    // Find max values for color intensity
    const maxValue = Math.max(...Array.from(rowTotals.values()));
    const maxColValue = Math.max(...Array.from(colTotals.values()));
    
    return {
      rows: rowEntries,
      columns: sortedCols,
      rowTotals,
      colTotals,
      grandTotal,
      maxValue,
      maxColValue
    };
  }, [data, activeConfig, sortColumn, sortDirection, minimumValue, filterMode, selectedFilters, filterField]);

  // Save current configuration
  const saveCurrentConfig = () => {
    if (!newConfigName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this configuration",
        variant: "destructive"
      });
      return;
    }
    
    const newConfig = {
      ...activeConfig,
      id: `config-${Date.now()}`,
      name: newConfigName.trim()
    };
    
    setSavedConfigs([...savedConfigs, newConfig]);
    setActiveConfig(newConfig);
    setNewConfigName('');
    setShowSaveDialog(false);
    
    toast({
      title: "Configuration saved",
      description: `"${newConfigName.trim()}" has been saved to your pivot views`
    });
  };

  // Delete a saved configuration
  const deleteConfig = (id: string) => {
    const newConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(newConfigs);
    
    // If current config was deleted, switch to default
    if (activeConfig.id === id) {
      setActiveConfig(newConfigs.length > 0 ? newConfigs[0] : defaultPivotConfig);
    }
    
    toast({
      title: "Configuration deleted",
      description: "The pivot view configuration has been removed"
    });
  };

  // Export pivot data as CSV
  const exportPivotData = () => {
    const headers = ['Row', ...pivotData.columns, 'Total'];
    const rows = pivotData.rows.map(([rowKey, cells]) => {
      return [
        rowKey,
        ...pivotData.columns.map(col => cells.get(col) || 0),
        pivotData.rowTotals.get(rowKey) || 0
      ];
    });
    
    // Add totals row
    const totalsRow = [
      'Total',
      ...pivotData.columns.map(col => pivotData.colTotals.get(col) || 0),
      pivotData.grandTotal
    ];
    
    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      totalsRow.join(',')
    ].join('\n');
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pivot-${activeConfig.rowDimension}-${activeConfig.colDimension}-${activeConfig.metric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "Pivot table data has been exported to CSV"
    });
  };

  // Get unique values for filtering
  const getFilterValues = React.useMemo(() => {
    const values = new Set<string>();
    
    data.forEach(item => {
      const value = getDimensionValue(item, filterField);
      values.add(value);
    });
    
    return Array.from(values).sort();
  }, [data, filterField]);
  
  // Initialize filter selections
  useEffect(() => {
    const initialSelections: Record<string, boolean> = {};
    getFilterValues.forEach(value => {
      initialSelections[value] = false;
    });
    setSelectedFilters(initialSelections);
  }, [filterField, getFilterValues]);

  // Toggle all filters
  const toggleAllFilters = (checked: boolean) => {
    const newSelections = { ...selectedFilters };
    Object.keys(newSelections).forEach(key => {
      newSelections[key] = checked;
    });
    setSelectedFilters(newSelections);
  };

  // Count selected filters
  const selectedFilterCount = Object.values(selectedFilters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Pivot Table Analysis</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved configurations dropdown */}
          <Select value={activeConfig.id} onValueChange={(value) => {
            const selected = savedConfigs.find(c => c.id === value);
            if (selected) setActiveConfig(selected);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {savedConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center">
                    <span>{config.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Save configuration button */}
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Pivot View Configuration</DialogTitle>
                <DialogDescription>
                  Save your current pivot table settings for easy access later
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="configName">Configuration Name</Label>
                  <Input
                    id="configName"
                    placeholder="e.g., Revenue by Class and Instructor"
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Current Settings</Label>
                  <ul className="mt-2 text-sm space-y-1">
                    <li><Badge variant="outline" className="mr-2">Rows</Badge> {dimensionOptions.find(d => d.value === activeConfig.rowDimension)?.label}</li>
                    <li><Badge variant="outline" className="mr-2">Columns</Badge> {dimensionOptions.find(d => d.value === activeConfig.colDimension)?.label}</li>
                    <li><Badge variant="outline" className="mr-2">Metric</Badge> {metricOptions.find(m => m.value === activeConfig.metric)?.label}</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                <Button onClick={saveCurrentConfig}>Save Configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit mode toggle */}
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? "Exit Settings" : "Edit Settings"}
          </Button>

          {/* Export button */}
          <Button variant="outline" size="sm" onClick={exportPivotData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Filter button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={filterMode !== 'off' ? "default" : "outline"} size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {filterMode !== 'off' && selectedFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedFilterCount}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filter Pivot Data</DialogTitle>
                <DialogDescription>
                  Include or exclude specific values from your pivot table
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label>Filter Mode</Label>
                    <Select value={filterMode} onValueChange={(value) => setFilterMode(value as 'off' | 'include' | 'exclude')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select filter mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">No Filtering</SelectItem>
                        <SelectItem value="include">Include Only</SelectItem>
                        <SelectItem value="exclude">Exclude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 flex-1">
                    <Label>Filter Field</Label>
                    <Select value={filterField} onValueChange={(value) => setFilterField(value as PivotDimension)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {dimensionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {filterMode !== 'off' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Filter Values</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleAllFilters(true)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleAllFilters(false)}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-64 border rounded-md p-4">
                      <div className="space-y-2">
                        {getFilterValues.map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`filter-${value}`} 
                              checked={selectedFilters[value] || false}
                              onCheckedChange={(checked) => {
                                setSelectedFilters({
                                  ...selectedFilters,
                                  [value]: checked === true
                                });
                              }}
                            />
                            <Label htmlFor={`filter-${value}`}>{value}</Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="minValue">Minimum Value</Label>
                  <div className="flex gap-2">
                    <Input
                      id="minValue"
                      type="number"
                      placeholder="No minimum"
                      value={minimumValue === null ? '' : minimumValue}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        setMinimumValue(value);
                      }}
                    />
                    {minimumValue !== null && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setMinimumValue(null)}
                        title="Clear minimum value"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setFilterMode('off');
                  setMinimumValue(null);
                  toggleAllFilters(false);
                }}>
                  Reset Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Edit configuration panel */}
      {editMode && (
        <Card className="mb-4 animate-fade-in bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rowDimension">Row Dimension</Label>
                <Select 
                  id="rowDimension" 
                  value={activeConfig.rowDimension} 
                  onValueChange={(value) => setActiveConfig({
                    ...activeConfig,
                    rowDimension: value as PivotDimension
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select row dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="colDimension">Column Dimension</Label>
                <Select 
                  id="colDimension" 
                  value={activeConfig.colDimension} 
                  onValueChange={(value) => setActiveConfig({
                    ...activeConfig,
                    colDimension: value as PivotDimension
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metric">Metric</Label>
                <Select 
                  id="metric" 
                  value={activeConfig.metric} 
                  onValueChange={(value) => setActiveConfig({
                    ...activeConfig,
                    metric: value as PivotMetric
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valueDisplay">Value Display</Label>
                <Select 
                  id="valueDisplay" 
                  value={activeConfig.valueDisplay} 
                  onValueChange={(value) => setActiveConfig({
                    ...activeConfig,
                    valueDisplay: value as 'raw' | 'formatted'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value display" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw Numbers</SelectItem>
                    <SelectItem value="formatted">Formatted (Currency, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showTotals" 
                    checked={activeConfig.showTotals}
                    onCheckedChange={(checked) => setActiveConfig({
                      ...activeConfig,
                      showTotals: checked === true
                    })}
                  />
                  <Label htmlFor="showTotals">Show Totals</Label>
                </div>
              </div>
              
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="colorIntensity" 
                    checked={activeConfig.colorIntensity}
                    onCheckedChange={(checked) => setActiveConfig({
                      ...activeConfig,
                      colorIntensity: checked === true
                    })}
                  />
                  <Label htmlFor="colorIntensity">Use Color Intensity</Label>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Saved Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {savedConfigs.map((config) => (
                  <div 
                    key={config.id} 
                    className={`flex justify-between items-center p-2 border rounded-md ${
                      activeConfig.id === config.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <Bookmark className="h-4 w-4 mr-2 text-primary" />
                      <span className="truncate">{config.name}</span>
                    </div>
                    <div className="flex">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setActiveConfig(config)} 
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Saved Configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{config.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteConfig(config.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center justify-center h-[40px]">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Current Configuration</DialogTitle>
                      <DialogDescription>
                        Enter a name for your custom pivot table configuration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="newConfigName">Configuration Name</Label>
                      <Input
                        id="newConfigName"
                        className="mt-2"
                        value={newConfigName}
                        onChange={(e) => setNewConfigName(e.target.value)}
                        placeholder="E.g., Revenue by Class Type and Day"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={saveCurrentConfig}>Save Configuration</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pivot table */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 px-4 text-left border-b border-r font-medium">
                <div className="flex items-center gap-1">
                  <span>
                    {dimensionOptions.find(d => d.value === activeConfig.rowDimension)?.label || activeConfig.rowDimension}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-6 w-6 p-0 ${sortColumn === 'row' ? 'text-primary' : 'text-muted-foreground'}`}
                    onClick={() => {
                      if (sortColumn === 'row') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortColumn('row');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    {sortColumn === 'row' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </th>
              {pivotData.columns.map((col) => (
                <th key={col} className="p-2 px-4 text-center border-b border-r font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <span>{col}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 w-6 p-0 ${sortColumn === col ? 'text-primary' : 'text-muted-foreground'}`}
                      onClick={() => {
                        if (sortColumn === col) {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn(col);
                          setSortDirection('desc');
                        }
                      }}
                    >
                      {sortColumn === col ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </th>
              ))}
              {activeConfig.showTotals && (
                <th className="p-2 px-4 text-center border-b font-medium bg-muted/80">
                  <div className="flex items-center justify-center gap-1">
                    <span>Total</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 w-6 p-0 ${sortColumn === 'total' ? 'text-primary' : 'text-muted-foreground'}`}
                      onClick={() => {
                        if (sortColumn === 'total') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('total');
                          setSortDirection('desc');
                        }
                      }}
                    >
                      {sortColumn === 'total' ? (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pivotData.rows.map(([rowKey, cells], rowIndex) => (
              <tr 
                key={rowKey} 
                className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-muted/20 dark:bg-gray-900/50'}
              >
                <td className="p-2 px-4 border-r font-medium">{rowKey}</td>
                {pivotData.columns.map((col) => {
                  const value = cells.get(col) || 0;
                  const intensity = activeConfig.colorIntensity && pivotData.maxValue > 0 
                    ? Math.max(0.1, value / pivotData.maxValue) 
                    : 0;
                  const bgColor = activeConfig.metric === 'totalRevenue'
                    ? `rgba(16, 185, 129, ${intensity * 0.4})`
                    : activeConfig.metric === 'totalCheckins'
                      ? `rgba(139, 92, 246, ${intensity * 0.4})`
                      : activeConfig.metric === 'totalCancelled'
                        ? `rgba(245, 158, 11, ${intensity * 0.4})`
                        : `rgba(59, 130, 246, ${intensity * 0.4})`;
                  
                  return (
                    <td 
                      key={col}
                      className="p-2 px-4 text-center border-r"
                      style={{ backgroundColor: activeConfig.colorIntensity ? bgColor : undefined }}
                    >
                      {formatCellValue(value, activeConfig.metric)}
                      {activeConfig.showPercentages && pivotData.grandTotal > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ({((value / pivotData.grandTotal) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </td>
                  );
                })}
                {activeConfig.showTotals && (
                  <td 
                    className="p-2 px-4 text-center font-medium bg-muted/30 dark:bg-gray-900/70"
                  >
                    {formatCellValue(pivotData.rowTotals.get(rowKey) || 0, activeConfig.metric)}
                    {activeConfig.showPercentages && pivotData.grandTotal > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ({(((pivotData.rowTotals.get(rowKey) || 0) / pivotData.grandTotal) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {activeConfig.showTotals && (
              <tr className="bg-muted/70 dark:bg-gray-800/70 font-medium border-t-2">
                <td className="p-2 px-4 border-r">Total</td>
                {pivotData.columns.map((col) => {
                  const value = pivotData.colTotals.get(col) || 0;
                  
                  return (
                    <td key={col} className="p-2 px-4 text-center border-r">
                      {formatCellValue(value, activeConfig.metric)}
                      {activeConfig.showPercentages && pivotData.grandTotal > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ({((value / pivotData.grandTotal) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </td>
                  );
                })}
                {activeConfig.showTotals && (
                  <td className="p-2 px-4 text-center bg-muted/80 dark:bg-gray-800">
                    {formatCellValue(pivotData.grandTotal, activeConfig.metric)}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PivotView;
