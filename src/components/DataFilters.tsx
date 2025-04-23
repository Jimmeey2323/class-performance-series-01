import React, { useState, useEffect } from 'react';
import { ProcessedData, FilterOption, SortOption } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  X, 
  Plus, 
  Save, 
  RotateCcw,
  FileDown,
  FileUp,
  Settings,
  Star,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


interface DataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
}

const DataFilters: React.FC<DataFiltersProps> = ({ 
  onFilterChange, 
  onSortChange, 
  data
}) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [newFilterField, setNewFilterField] = useState<keyof ProcessedData>('cleanedClass');
  const [newFilterOperator, setNewFilterOperator] = useState('contains');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [newSortField, setNewSortField] = useState<keyof ProcessedData>('cleanedClass');
  const [newSortDirection, setNewSortDirection] = useState<'asc' | 'desc'>('asc');
  const [savedFilters, setSavedFilters] = useState<{name: string, filters: FilterOption[]}[]>([]);
  const [newFilterSetName, setNewFilterSetName] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['dateFilter']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  useEffect(() => {
    const savedFiltersFromStorage = localStorage.getItem('savedFilters');
    if (savedFiltersFromStorage) {
      try {
        const parsedFilters = JSON.parse(savedFiltersFromStorage);
        setSavedFilters(parsedFilters);
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
  }, []);

  useEffect(() => {
    console.log('Filters changed:', filters);
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  useEffect(() => {
    console.log('Sort options changed:', sortOptions);
    onSortChange(sortOptions);
  }, [sortOptions, onSortChange]);

  const fields: Array<{ key: keyof ProcessedData; label: string }> = [
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'classTime', label: 'Class Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
    { key: 'totalOccurrences', label: 'Total Occurrences' },
    { key: 'totalCheckins', label: 'Total Check-ins' },
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'classAverageIncludingEmpty', label: 'Average Attendance (All)' },
    { key: 'classAverageExcludingEmpty', label: 'Average Attendance (Non-Empty)' },
    { key: 'date', label: 'Date' },
  ];

  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts', label: 'Starts With' },
    { value: 'ends', label: 'Ends With' },
    { value: 'greater', label: 'Greater Than' },
    { value: 'less', label: 'Less Than' },
  ];

  const addFilter = () => {
    if (!newFilterField || !newFilterOperator) return;
    
    if (newFilterField === 'period' && selectedPeriods.length > 0) {
      const nonPeriodFilters = filters.filter(f => f.field !== 'period');
      const periodFilter: FilterOption = {
        field: 'period',
        operator: 'in',
        value: selectedPeriods.join(',')
      };
      const updatedFilters = [...nonPeriodFilters, periodFilter];
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    } 
    else if (newFilterValue) {
      const newFilter: FilterOption = {
        field: newFilterField,
        operator: newFilterOperator,
        value: newFilterValue,
      };
      
      const updatedFilters = [...filters, newFilter];
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
      setNewFilterValue('');
    }
    
    if (!expanded.includes('filters')) {
      setExpanded([...expanded, 'filters']);
    }
  };

  const addDateRangeFilter = () => {
    if (!dateRange.from && !dateRange.to) return;
    
    const dateFilter: FilterOption = {
      field: 'date',
      operator: 'between',
      value: JSON.stringify({
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString()
      })
    };
    
    const nonDateFilters = filters.filter(f => f.field !== 'date' as keyof ProcessedData);
    const updatedFilters = [...nonDateFilters, dateFilter];
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const addSortOption = () => {
    const newSort: SortOption = {
      field: newSortField,
      direction: newSortDirection,
    };
    
    const updatedSortOptions = [...sortOptions, newSort];
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
    
    if (!expanded.includes('sort')) {
      setExpanded([...expanded, 'sort']);
    }
  };

  const removeSortOption = (index: number) => {
    const updatedSortOptions = sortOptions.filter((_, i) => i !== index);
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
  };

  const resetFiltersAndSort = () => {
    setFilters([]);
    setSortOptions([]);
    setSelectedPeriods([]);
    setDateRange({ from: undefined, to: undefined });
    onFilterChange([]);
    onSortChange([]);
  };

  const saveCurrentFilters = () => {
    if (!newFilterSetName || filters.length === 0) return;
    
    const newSavedFilters = [
      ...savedFilters,
      { name: newFilterSetName, filters: [...filters] }
    ];
    
    setSavedFilters(newSavedFilters);
    setNewFilterSetName('');
    
    localStorage.setItem('savedFilters', JSON.stringify(newSavedFilters));
  };

  const loadSavedFilter = (savedFilter: {name: string, filters: FilterOption[]}) => {
    setFilters(savedFilter.filters);
    onFilterChange(savedFilter.filters);
    
    const dateFilter = savedFilter.filters.find(f => f.field === 'date' as keyof ProcessedData);
    if (dateFilter && dateFilter.operator === 'between') {
      try {
        const parsedDates = JSON.parse(dateFilter.value);
        setDateRange({
          from: parsedDates.from ? new Date(parsedDates.from) : undefined,
          to: parsedDates.to ? new Date(parsedDates.to) : undefined
        });
      } catch (e) {
        console.error('Error parsing date filter:', e);
      }
    }
  };

  const getUniqueValues = (field: keyof ProcessedData): string[] => {
    const values = data.map(item => String(item[field] || '')).filter(value => value.trim() !== '');
    return [...new Set(values)].sort();
  };

  const handlePeriodChange = (period: string, checked: boolean) => {
    if (checked) {
      setSelectedPeriods(prev => [...prev, period]);
    } else {
      setSelectedPeriods(prev => prev.filter(p => p !== period));
    }
  };

  const formatDateFilterValue = (value: string): string => {
    try {
      const dateRange = JSON.parse(value);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;
      
      if (fromDate && toDate) {
        return `${format(fromDate, 'PP')} to ${format(toDate, 'PP')}`;
      } else if (fromDate) {
        return `After ${format(fromDate, 'PP')}`;
      } else if (toDate) {
        return `Before ${format(toDate, 'PP')}`;
      }
      return value;
    } catch (e) {
      return value;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-950 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Date Range Filter</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block text-muted-foreground">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !dateRange.from && "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          format(dateRange.from, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) =>
                          setDateRange(prev => ({ ...prev, from: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs mb-1 block text-muted-foreground">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !dateRange.to && "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.to ? (
                          format(dateRange.to, "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) =>
                          setDateRange(prev => ({ ...prev, to: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={addDateRangeFilter}
                disabled={!dateRange.from && !dateRange.to}
                className="flex items-center"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filter
              </Button>
              {filters.some(f => f.field === 'date' as keyof ProcessedData) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    const updatedFilters = filters.filter(f => f.field !== 'date' as keyof ProcessedData);
                    setFilters(updatedFilters);
                    onFilterChange(updatedFilters);
                    setDateRange({ from: undefined, to: undefined });
                  }}
                  className="flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {filters.some(f => f.field === 'date' as keyof ProcessedData) && (
            <div className="mt-3 flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Active filter:</span>
              {filters.filter(f => f.field === 'date' as keyof ProcessedData).map((filter, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                  {formatDateFilterValue(filter.value)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-white dark:bg-gray-950 shadow-sm">
        <CardContent className="pt-6">
          <Accordion 
            type="multiple" 
            className="w-full" 
            value={expanded}
            onValueChange={setExpanded}
          >
            <AccordionItem value="filters" className="border px-4 py-2 rounded-lg mb-4 border-primary/20 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline">
                <div className="flex items-center">
                  <Filter className="mr-2 h-5 w-5 text-primary" />
                  Advanced Filters
                  {filters.filter(f => f.field !== 'date' as keyof ProcessedData).length > 0 && (
                    <Badge variant="default" className="ml-2 bg-primary">
                      {filters.filter(f => f.field !== 'date' as keyof ProcessedData).length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  {filters.filter(f => f.field !== 'date' as keyof ProcessedData).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      {filters.filter(f => f.field !== 'date' as keyof ProcessedData).map((filter, index) => {
                        const fieldLabel = fields.find(f => f.key === filter.field)?.label || filter.field;
                        const operatorLabel = operators.find(o => o.value === filter.operator)?.label || filter.operator;
                        
                        return (
                          <Badge key={index} variant="outline" className="p-2 flex items-center gap-2 bg-white dark:bg-slate-800 border-primary/30">
                            <span className="text-sm font-medium">{fieldLabel}</span>
                            <span className="text-xs text-muted-foreground">{operatorLabel}</span>
                            <span className="font-semibold text-primary">{filter.value}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                              onClick={() => {
                                const filterIndex = filters.findIndex(f => 
                                  f.field === filter.field && 
                                  f.operator === filter.operator && 
                                  f.value === filter.value
                                );
                                if (filterIndex !== -1) {
                                  removeFilter(filterIndex);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                      
                      <div className="flex-1 min-w-[200px] flex justify-end items-center gap-2">
                        <Input
                          placeholder="Save as..."
                          value={newFilterSetName}
                          onChange={(e) => setNewFilterSetName(e.target.value)}
                          className="max-w-[150px] h-8"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={saveCurrentFilters}
                          className="h-8"
                          disabled={!newFilterSetName || filters.length === 0}
                        >
                          <Save className="mr-1 h-3 w-3" />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {savedFilters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Star className="mr-1 h-3 w-3 text-amber-500" />
                        Saved Filters
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {savedFilters.map((savedFilter, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={() => loadSavedFilter(savedFilter)}
                          >
                            {savedFilter.name} ({savedFilter.filters.length})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <Label htmlFor="filter-field" className="text-sm mb-1">Field</Label>
                      <Select 
                        value={newFilterField as string} 
                        onValueChange={(value) => {
                          setNewFilterField(value as keyof ProcessedData);
                          if (value === 'period') {
                            setSelectedPeriods([]);
                          }
                        }}
                      >
                        <SelectTrigger id="filter-field" className="h-9">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.filter(f => f.key !== 'date' as keyof ProcessedData).map((field) => (
                            <SelectItem key={field.key as string} value={field.key as string}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newFilterField !== 'period' && (
                      <>
                        <div>
                          <Label htmlFor="filter-operator" className="text-sm mb-1">Operator</Label>
                          <Select value={newFilterOperator} onValueChange={setNewFilterOperator}>
                            <SelectTrigger id="filter-operator" className="h-9">
                              <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Label htmlFor="filter-value" className="text-sm mb-1">Value</Label>
                          <Select
                            value={newFilterValue}
                            onValueChange={setNewFilterValue}
                          >
                            <SelectTrigger id="filter-value" className="w-full h-9">
                              <SelectValue placeholder="Select or type a value" />
                            </SelectTrigger>
                            <SelectContent>
                              <Input
                                placeholder="Type custom value..."
                                value={newFilterValue}
                                onChange={(e) => setNewFilterValue(e.target.value)}
                                className="mb-2"
                              />
                              {getUniqueValues(newFilterField).slice(0, 10).map((value) => (
                                <SelectItem key={value} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                              {getUniqueValues(newFilterField).length === 0 && (
                                <SelectItem value="no-data-placeholder" disabled>
                                  No values available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {newFilterField === 'period' && (
                      <div className="sm:col-span-3">
                        <Label className="text-sm mb-3 block">Select Periods (Multiple)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                          {getUniqueValues('period').map((period) => (
                            <div key={period} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`period-${period}`} 
                                checked={selectedPeriods.includes(period)}
                                onCheckedChange={(checked) => 
                                  handlePeriodChange(period, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`period-${period}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {period}
                              </label>
                            </div>
                          ))}
                          {getUniqueValues('period').length === 0 && (
                            <div className="text-sm text-muted-foreground">No periods available</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={addFilter} 
                      className="flex items-center h-9"
                      disabled={
                        (newFilterField === 'period' && selectedPeriods.length === 0) || 
                        (newFilterField !== 'period' && !newFilterValue)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Filter
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="sort" className="border px-4 py-2 rounded-lg mb-4 border-primary/20 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline">
                <div className="flex items-center">
                  {newSortDirection === 'asc' ? (
                    <SortAsc className="mr-2 h-5 w-5 text-primary" />
                  ) : (
                    <SortDesc className="mr-2 h-5 w-5 text-primary" />
                  )}
                  Advanced Sorting
                  {sortOptions.length > 0 && (
                    <Badge variant="default" className="ml-2 bg-primary">
                      {sortOptions.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  {sortOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      {sortOptions.map((sort, index) => {
                        const fieldLabel = fields.find(f => f.key === sort.field)?.label || sort.field;
                        
                        return (
                          <Badge key={index} variant="outline" className="p-2 flex items-center gap-2 bg-white dark:bg-slate-800 border-primary/30">
                            <span className="text-sm font-medium">{fieldLabel}</span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              {sort.direction === 'asc' ? (
                                <SortAsc className="h-3 w-3 mr-1" />
                              ) : (
                                <SortDesc className="h-3 w-3 mr-1" />
                              )}
                              {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                              onClick={() => removeSortOption(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <Label htmlFor="sort-field" className="text-sm mb-1">Field</Label>
                      <Select 
                        value={newSortField as string} 
                        onValueChange={(value) => setNewSortField(value as keyof ProcessedData)}
                      >
                        <SelectTrigger id="sort-field" className="h-9">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.key as string} value={field.key as string}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sort-direction" className="text-sm mb-1">Direction</Label>
                      <Select 
                        value={newSortDirection} 
                        onValueChange={(value) => setNewSortDirection(value as 'asc' | 'desc')}
                      >
                        <SelectTrigger id="sort-direction" className="h-9">
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={addSortOption} className="flex items-center h-9">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sort
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="advanced" className="border px-4 py-2 rounded-lg border-primary/20 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline">
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Advanced Options
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center w-full justify-start">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Filters & Sorts
                    </Button>
                    <Button variant="outline" className="flex items-center w-full justify-start">
                      <FileUp className="mr-2 h-4 w-4" />
                      Import Filters & Sorts
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {(filters.length > 0 || sortOptions.length > 0) && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFiltersAndSort}
                className="flex items-center"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataFilters;
