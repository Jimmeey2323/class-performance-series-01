
import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
  activeFilters?: number;
}

const DataFilters: React.FC<DataFiltersProps> = ({ 
  onFilterChange, 
  onSortChange, 
  data,
  activeFilters = 0 
}) => {
  const { toast } = useToast();
  
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

  // Notify parent components when filters change
  const notifyFilterChange = useCallback((newFilters: FilterOption[]) => {
    console.log('Filters changed:', newFilters);
    onFilterChange(newFilters);
    
    // Show toast feedback
    if (newFilters.length > 0) {
      toast({
        title: "Filters Applied",
        description: `${newFilters.length} filter${newFilters.length === 1 ? '' : 's'} applied to dashboard data.`,
        variant: "default",
      });
    }
  }, [onFilterChange, toast]);

  useEffect(() => {
    notifyFilterChange(filters);
  }, [filters, notifyFilterChange]);

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
    { value: 'in', label: 'In List' },
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
      notifyFilterChange(updatedFilters);
    } 
    else if (newFilterValue || newFilterOperator === 'in') {
      const newFilter: FilterOption = {
        field: newFilterField,
        operator: newFilterOperator,
        value: newFilterValue,
      };
      
      const updatedFilters = [...filters, newFilter];
      setFilters(updatedFilters);
      notifyFilterChange(updatedFilters);
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
    notifyFilterChange(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    notifyFilterChange(updatedFilters);
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
    notifyFilterChange([]);
    onSortChange([]);
    
    toast({
      title: "Filters Reset",
      description: "All filters and sorting options have been cleared.",
      variant: "default",
    });
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
    
    toast({
      title: "Filters Saved",
      description: `Filter set "${newFilterSetName}" saved successfully.`,
      variant: "success",
    });
  };

  const loadSavedFilter = (savedFilter: {name: string, filters: FilterOption[]}) => {
    setFilters(savedFilter.filters);
    notifyFilterChange(savedFilter.filters);
    
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
    
    toast({
      title: "Filters Loaded",
      description: `Filter set "${savedFilter.name}" applied successfully.`,
      variant: "default",
    });
  };

  const getUniqueValues = (field: keyof ProcessedData): string[] => {
    const values = data
      .map(item => String(item[field] || ''))
      .filter(value => value.trim() !== '');
    
    // Ensure we don't return empty strings as values
    const uniqueValues = [...new Set(values)].filter(Boolean).sort();
    
    // If there are no unique values, return an empty array rather than an array with an empty string
    return uniqueValues.length > 0 ? uniqueValues : [];
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
          <Tabs defaultValue="date" className="w-full">
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="date">Date Range</TabsTrigger>
              <TabsTrigger value="quick">Quick Filters</TabsTrigger>
              <TabsTrigger value="current" className="relative">
                Active Filters
                {activeFilters > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">{activeFilters}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="date" className="space-y-4">
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
                        notifyFilterChange(updatedFilters);
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
            </TabsContent>
            
            <TabsContent value="quick">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Quick Instructor Filter</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('teacherName').map((instructor) => (
                      <div key={instructor} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`instructor-${instructor}`} 
                          checked={filters.some(f => 
                            f.field === 'teacherName' && 
                            (f.operator === 'equals' || f.operator === 'in') && 
                            f.value.includes(instructor)
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const existingFilter = filters.find(f => 
                                f.field === 'teacherName' && f.operator === 'in'
                              );
                              
                              if (existingFilter) {
                                const values = existingFilter.value.split(',');
                                if (!values.includes(instructor)) {
                                  const updatedFilter = {
                                    ...existingFilter,
                                    value: [...values, instructor].join(',')
                                  };
                                  const updatedFilters = filters.map(f => 
                                    f === existingFilter ? updatedFilter : f
                                  );
                                  setFilters(updatedFilters);
                                  notifyFilterChange(updatedFilters);
                                }
                              } else {
                                const newFilter: FilterOption = {
                                  field: 'teacherName',
                                  operator: 'in',
                                  value: instructor
                                };
                                const updatedFilters = [...filters, newFilter];
                                setFilters(updatedFilters);
                                notifyFilterChange(updatedFilters);
                              }
                            } else {
                              const existingFilter = filters.find(f => 
                                f.field === 'teacherName' && 
                                (f.operator === 'equals' || f.operator === 'in') && 
                                f.value.includes(instructor)
                              );
                              
                              if (existingFilter) {
                                if (existingFilter.operator === 'equals') {
                                  const updatedFilters = filters.filter(f => f !== existingFilter);
                                  setFilters(updatedFilters);
                                  notifyFilterChange(updatedFilters);
                                } else {
                                  const values = existingFilter.value.split(',');
                                  const updatedValues = values.filter(v => v !== instructor);
                                  
                                  if (updatedValues.length === 0) {
                                    const updatedFilters = filters.filter(f => f !== existingFilter);
                                    setFilters(updatedFilters);
                                    notifyFilterChange(updatedFilters);
                                  } else {
                                    const updatedFilter = {
                                      ...existingFilter,
                                      value: updatedValues.join(',')
                                    };
                                    const updatedFilters = filters.map(f => 
                                      f === existingFilter ? updatedFilter : f
                                    );
                                    setFilters(updatedFilters);
                                    notifyFilterChange(updatedFilters);
                                  }
                                }
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor={`instructor-${instructor}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {instructor}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Quick Class Type Filter</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('cleanedClass').slice(0, 10).map((classType) => (
                      <div key={classType} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`class-${classType}`} 
                          checked={filters.some(f => 
                            f.field === 'cleanedClass' && 
                            (f.operator === 'equals' || f.operator === 'contains') && 
                            (f.value === classType || f.value.includes(classType))
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const newFilter: FilterOption = {
                                field: 'cleanedClass',
                                operator: 'equals',
                                value: classType
                              };
                              const updatedFilters = [...filters, newFilter];
                              setFilters(updatedFilters);
                              notifyFilterChange(updatedFilters);
                            } else {
                              const updatedFilters = filters.filter(f => 
                                !(f.field === 'cleanedClass' && 
                                  (f.operator === 'equals' || f.operator === 'contains') && 
                                  (f.value === classType || f.value.includes(classType)))
                              );
                              setFilters(updatedFilters);
                              notifyFilterChange(updatedFilters);
                            }
                          }}
                        />
                        <label
                          htmlFor={`class-${classType}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {classType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Quick Day Filter</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`day-${day}`} 
                          checked={filters.some(f => 
                            f.field === 'dayOfWeek' && 
                            (f.operator === 'equals' || f.operator === 'in') && 
                            f.value.includes(day)
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const existingFilter = filters.find(f => 
                                f.field === 'dayOfWeek' && f.operator === 'in'
                              );
                              
                              if (existingFilter) {
                                const values = existingFilter.value.split(',');
                                if (!values.includes(day)) {
                                  const updatedFilter = {
                                    ...existingFilter,
                                    value: [...values, day].join(',')
                                  };
                                  const updatedFilters = filters.map(f => 
                                    f === existingFilter ? updatedFilter : f
                                  );
                                  setFilters(updatedFilters);
                                  notifyFilterChange(updatedFilters);
                                }
                              } else {
                                const newFilter: FilterOption = {
                                  field: 'dayOfWeek',
                                  operator: 'in',
                                  value: day
                                };
                                const updatedFilters = [...filters, newFilter];
                                setFilters(updatedFilters);
                                notifyFilterChange(updatedFilters);
                              }
                            } else {
                              const existingFilter = filters.find(f => 
                                f.field === 'dayOfWeek' && 
                                (f.operator === 'equals' || f.operator === 'in') && 
                                f.value.includes(day)
                              );
                              
                              if (existingFilter) {
                                if (existingFilter.operator === 'equals') {
                                  const updatedFilters = filters.filter(f => f !== existingFilter);
                                  setFilters(updatedFilters);
                                  notifyFilterChange(updatedFilters);
                                } else {
                                  const values = existingFilter.value.split(',');
                                  const updatedValues = values.filter(v => v !== day);
                                  
                                  if (updatedValues.length === 0) {
                                    const updatedFilters = filters.filter(f => f !== existingFilter);
                                    setFilters(updatedFilters);
                                    notifyFilterChange(updatedFilters);
                                  } else {
                                    const updatedFilter = {
                                      ...existingFilter,
                                      value: updatedValues.join(',')
                                    };
                                    const updatedFilters = filters.map(f => 
                                      f === existingFilter ? updatedFilter : f
                                    );
                                    setFilters(updatedFilters);
                                    notifyFilterChange(updatedFilters);
                                  }
                                }
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor={`day-${day}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day.slice(0, 3)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="current">
              {filters.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {filters.map((filter, index) => {
                      const fieldLabel = fields.find(f => f.key === filter.field)?.label || filter.field;
                      const operatorLabel = operators.find(o => o.value === filter.operator)?.label || filter.operator;
                      
                      return (
                        <Badge key={index} variant="outline" className="p-2 flex items-center gap-2 bg-white dark:bg-slate-800 border-primary/30">
                          <span className="text-sm font-medium">{fieldLabel}</span>
                          <span className="text-xs text-muted-foreground">{operatorLabel}</span>
                          <span className="font-semibold text-primary">
                            {filter.field === 'date' ? 
                              formatDateFilterValue(filter.value) : 
                              filter.operator === 'in' ? 
                                filter.value.split(',').length + ' items' : 
                                filter.value
                            }
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                            onClick={() => removeFilter(index)}
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
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={resetFiltersAndSort}
                      className="flex items-center"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 space-y-2 text-center">
                  <Filter className="h-10 w-10 text-muted-foreground opacity-30" />
                  <h3 className="text-lg font-medium">No Active Filters</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the Date Range or Quick Filters tab to filter your dashboard data.
                  </p>
                </div>
              )}
              
              {savedFilters.length > 0 && (
                <div className="mt-6">
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
            </TabsContent>
          </Tabs>
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
                          setNewFilterValue(''); // Reset value when changing field
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
                          {getUniqueValues(newFilterField).length > 0 ? (
                            <Select
                              value={newFilterValue}
                              onValueChange={setNewFilterValue}
                            >
                              <SelectTrigger id="filter-value" className="w-full h-9">
                                <SelectValue placeholder="Select a value" />
                              </SelectTrigger>
                              <SelectContent>
                                {getUniqueValues(newFilterField).slice(0, 15).map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                                {getUniqueValues(newFilterField).length > 15 && (
                                  <div className="p-2 text-xs text-center text-muted-foreground">
                                    + {getUniqueValues(newFilterField).length - 15} more options
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input 
                              value={newFilterValue}
                              onChange={(e) => setNewFilterValue(e.target.value)}
                              placeholder="Enter value..."
                              className="h-9"
                            />
                          )}
                        </div>
                      </>
                    )}
                    
                    {newFilterField === 'period' && (
                      <div className="sm:col-span-3">
                        <Label className="text-sm mb-3 block">Select Periods (Multiple)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                          {getUniqueValues('period').length > 0 ? (
                            getUniqueValues('period').map((period) => (
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
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground p-2">No periods available</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={addFilter} 
                      className="flex items-center h-9"
                      disabled={
                        (newFilterField === 'period' && selectedPeriods.length === 0) || 
                        (newFilterField !== 'period' && !newFilterValue && newFilterOperator !== 'in')
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
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataFilters;
