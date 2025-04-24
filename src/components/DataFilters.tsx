import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData, FilterOption, SortOption } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ArrowUpDown, Filter, Calendar } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
  activeFilters: number;
}

type FilterOperator = 'contains' | 'equals' | 'starts' | 'ends' | 'greater' | 'less' | 'between' | 'in';

interface FilterOptionWithId extends FilterOption {
  id: string;
}

const getTimeRangeFilter = (range: string) => {
  const now = new Date();
  const filters: FilterOption[] = [];
  
  switch (range) {
    case 'last-week':
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filters.push({
        field: 'period',
        operator: 'greater',
        value: lastWeek.toISOString()
      });
      break;
    case 'last-month':
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filters.push({
        field: 'period',
        operator: 'greater',
        value: lastMonth.toISOString()
      });
      break;
    case 'last-quarter':
      const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filters.push({
        field: 'period',
        operator: 'greater',
        value: lastQuarter.toISOString()
      });
      break;
    case 'custom':
      // Custom date range will be handled by the date picker
      break;
  }
  
  return filters;
};

const DataFilters: React.FC<DataFiltersProps> = ({
  onFilterChange,
  onSortChange,
  data,
  activeFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptionWithId[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [activeTab, setActiveTab] = useState('filters');
  const [date, setDate] = useState<Date | undefined>(undefined);

  const uniqueOptions = useMemo(() => {
    const options = {
      cleanedClass: new Set<string>(),
      location: new Set<string>(),
      teacherName: new Set<string>(),
      dayOfWeek: new Set<string>(),
      period: new Set<string>(),
    };

    data.forEach(item => {
      if (item.cleanedClass) options.cleanedClass.add(item.cleanedClass);
      if (item.location) options.location.add(item.location);
      if (item.teacherName) options.teacherName.add(item.teacherName);
      if (item.dayOfWeek) options.dayOfWeek.add(item.dayOfWeek);
      if (item.period) options.period.add(item.period);
    });

    return {
      cleanedClass: Array.from(options.cleanedClass).sort(),
      location: Array.from(options.location).sort(),
      teacherName: Array.from(options.teacherName).sort(),
      dayOfWeek: Array.from(options.dayOfWeek).sort((a, b) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days.indexOf(a) - days.indexOf(b);
      }),
      period: Array.from(options.period).sort((a, b) => {
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return months.indexOf(monthA) - months.indexOf(monthB);
      }),
    };
  }, [data]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  useEffect(() => {
    onSortChange(sortOptions);
  }, [sortOptions, onSortChange]);

  const getOperatorOptions = (field: keyof ProcessedData) => {
    const numericFields = [
      'totalCheckins', 'totalOccurrences', 'totalRevenue', 'totalCancelled',
      'totalEmpty', 'totalNonEmpty', 'totalNonPaid', 'classAverageIncludingEmpty', 
      'classAverageExcludingEmpty', 'totalTime'
    ];
    
    const isNumeric = numericFields.includes(field);
    
    if (field === 'period') {
      return [
        { value: 'in', label: 'Is one of' },
        { value: 'equals', label: 'Equals' },
      ];
    }
    
    return isNumeric
      ? [
          { value: 'equals', label: '=' },
          { value: 'greater', label: '&gt;' },
          { value: 'less', label: '&lt;' },
          { value: 'between', label: 'Between' },
        ]
      : [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'starts', label: 'Starts with' },
          { value: 'ends', label: 'Ends with' },
        ];
  };

  const getFilterFields = () => [
    { value: 'cleanedClass', label: 'Class Type' },
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'classTime', label: 'Class Time' },
    { value: 'location', label: 'Location' },
    { value: 'teacherName', label: 'Instructor' },
    { value: 'period', label: 'Period' },
    { value: 'totalCheckins', label: 'Total Check-ins' },
    { value: 'totalOccurrences', label: 'Occurrences' },
    { value: 'totalRevenue', label: 'Revenue' },
    { value: 'classAverageIncludingEmpty', label: 'Avg. Attendance (All)' },
    { value: 'classAverageExcludingEmpty', label: 'Avg. Attendance (Non-Empty)' },
    { value: 'totalCancelled', label: 'Cancellations' },
  ];

  const handleAddFilter = () => {
    const newFilter: FilterOptionWithId = {
      id: `filter-${Date.now()}`,
      field: 'cleanedClass',
      operator: 'contains',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  const handleUpdateFilter = (id: string, key: keyof FilterOption, value: string) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, [key]: value } : filter
    ));
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const handleAddSort = () => {
    const newSort: SortOption = {
      field: 'totalCheckins',
      direction: 'desc',
    };
    setSortOptions([...sortOptions, newSort]);
  };

  const handleUpdateSort = (index: number, key: keyof SortOption, value: string) => {
    const updatedSortOptions = [...sortOptions];
    updatedSortOptions[index] = { 
      ...updatedSortOptions[index], 
      [key]: key === 'field' ? value : value as 'asc' | 'desc' 
    };
    setSortOptions(updatedSortOptions);
  };

  const handleRemoveSort = (index: number) => {
    setSortOptions(sortOptions.filter((_, i) => i !== index));
  };

  const renderFilterValue = (filter: FilterOptionWithId) => {
    if (
      filter.field === 'cleanedClass' ||
      filter.field === 'location' ||
      filter.field === 'teacherName' ||
      filter.field === 'dayOfWeek'
    ) {
      const options = uniqueOptions[filter.field as keyof typeof uniqueOptions] || [];
      
      return (
        <Select
          value={filter.value}
          onValueChange={(value) => handleUpdateFilter(filter.id, 'value', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${filter.field}`} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (filter.field === 'period' && filter.operator === 'in') {
      const selectedPeriods = filter.value ? filter.value.split(',') : [];
      
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedPeriods.map(period => (
              <Badge 
                key={period} 
                variant="secondary" 
                className="flex items-center gap-1"
                onClick={() => {
                  const newSelected = selectedPeriods.filter(p => p !== period);
                  handleUpdateFilter(filter.id, 'value', newSelected.join(','));
                }}
              >
                {period}
                <Trash2 className="h-3 w-3 ml-1 cursor-pointer" />
              </Badge>
            ))}
            {selectedPeriods.length === 0 && (
              <div className="text-sm text-muted-foreground">No periods selected</div>
            )}
          </div>
          
          <Select
            onValueChange={(value) => {
              if (!selectedPeriods.includes(value)) {
                const newSelected = [...selectedPeriods, value];
                handleUpdateFilter(filter.id, 'value', newSelected.join(','));
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add period" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {uniqueOptions.period.map((period) => (
                <SelectItem 
                  key={period} 
                  value={period}
                  disabled={selectedPeriods.includes(period)}
                >
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (filter.field === 'date') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                if (newDate) {
                  handleUpdateFilter(filter.id, 'value', format(newDate, 'yyyy-MM-dd'));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Input
        type={
          [
            'totalCheckins', 
            'totalOccurrences', 
            'totalRevenue', 
            'totalCancelled',
            'totalEmpty', 
            'totalNonEmpty', 
            'classAverageIncludingEmpty', 
            'classAverageExcludingEmpty'
          ].includes(filter.field) ? 'number' : 'text'
        }
        value={filter.value}
        onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
        placeholder="Enter value..."
        className="w-full"
      />
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="filters" className="text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters {activeFilters > 0 && <Badge className="ml-2">{activeFilters}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sorting" className="text-sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sorting {sortOptions.length > 0 && <Badge className="ml-2">{sortOptions.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Filter Criteria</h3>
            <Button size="sm" onClick={handleAddFilter} className="gap-1">
              <Plus className="h-4 w-4" /> Add Filter
            </Button>
          </div>
          
          {filters.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground border border-dashed rounded-md">
              Add filters to narrow down your data
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter) => (
                <div 
                  key={filter.id} 
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_auto] gap-2 items-end border-b pb-4"
                >
                  <div className="space-y-1">
                    <Label>Field</Label>
                    <Select
                      value={filter.field}
                      onValueChange={(value) => {
                        const newOperator = getOperatorOptions(value as keyof ProcessedData)[0].value;
                        handleUpdateFilter(filter.id, 'field', value);
                        handleUpdateFilter(filter.id, 'operator', newOperator);
                        handleUpdateFilter(filter.id, 'value', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilterFields().map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Operator</Label>
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => handleUpdateFilter(filter.id, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorOptions(filter.field as keyof ProcessedData).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Value</Label>
                    {renderFilterValue(filter)}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-md">
            <h4 className="font-medium mb-2">Predefined Filters</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  const now = new Date();
                  const currentMonth = now.toLocaleString('default', { month: 'short' });
                  const currentYear = now.getFullYear().toString().slice(-2);
                  const period = `${currentMonth}-${currentYear}`;
                  
                  const existingPeriodFilter = filters.find(f => f.field === 'period');
                  
                  if (existingPeriodFilter) {
                    handleUpdateFilter(existingPeriodFilter.id, 'operator', 'equals');
                    handleUpdateFilter(existingPeriodFilter.id, 'value', period);
                  } else {
                    setFilters([
                      ...filters, 
                      {
                        id: `filter-${Date.now()}`,
                        field: 'period',
                        operator: 'equals',
                        value: period
                      }
                    ]);
                  }
                }}
              >
                Current Month
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  const existingClassFilter = filters.find(f => f.field === 'totalCheckins');
                  
                  if (existingClassFilter) {
                    handleUpdateFilter(existingClassFilter.id, 'operator', 'greater');
                    handleUpdateFilter(existingClassFilter.id, 'value', '0');
                  } else {
                    setFilters([
                      ...filters, 
                      {
                        id: `filter-${Date.now()}`,
                        field: 'totalCheckins',
                        operator: 'greater',
                        value: '0'
                      }
                    ]);
                  }
                }}
              >
                Non-Empty Classes
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  const existingRevenueFilter = filters.find(f => f.field === 'totalRevenue');
                  
                  if (existingRevenueFilter) {
                    handleUpdateFilter(existingRevenueFilter.id, 'operator', 'greater');
                    handleUpdateFilter(existingRevenueFilter.id, 'value', '10000');
                  } else {
                    setFilters([
                      ...filters, 
                      {
                        id: `filter-${Date.now()}`,
                        field: 'totalRevenue',
                        operator: 'greater',
                        value: '10000'
                      }
                    ]);
                  }
                }}
              >
                High Revenue (&gt;10K)
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  const existingAvgFilter = filters.find(f => f.field === 'classAverageIncludingEmpty');
                  
                  if (existingAvgFilter) {
                    handleUpdateFilter(existingAvgFilter.id, 'operator', 'greater');
                    handleUpdateFilter(existingAvgFilter.id, 'value', '5');
                  } else {
                    setFilters([
                      ...filters, 
                      {
                        id: `filter-${Date.now()}`,
                        field: 'classAverageIncludingEmpty',
                        operator: 'greater',
                        value: '5'
                      }
                    ]);
                  }
                }}
              >
                High Attendance (&gt;5)
              </Button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-md">
            <h4 className="font-medium mb-2">Time Period</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setFilters(getTimeRangeFilter('last-week'))}
              >
                Last Week
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setFilters(getTimeRangeFilter('last-month'))}
              >
                Last Month
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setFilters(getTimeRangeFilter('last-quarter'))}
              >
                Last Quarter
              </Button>
              <DateRangePicker 
                onChange={(range) => {
                  if (range.from && range.to) {
                    setFilters([
                      {
                        field: 'period',
                        operator: 'between',
                        value: `${range.from.toISOString()},${range.to.toISOString()}`
                      }
                    ]);
                  }
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sorting" className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Sort Options</h3>
            <Button size="sm" onClick={handleAddSort} className="gap-1">
              <Plus className="h-4 w-4" /> Add Sort
            </Button>
          </div>
          
          {sortOptions.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground border border-dashed rounded-md">
              Add sorting to organize your data
            </div>
          ) : (
            <div className="space-y-4">
              {sortOptions.map((sort, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-end border-b pb-4"
                >
                  <div className="space-y-1">
                    <Label>Field</Label>
                    <Select
                      value={sort.field}
                      onValueChange={(value) => handleUpdateSort(index, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilterFields().map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Direction</Label>
                    <Select
                      value={sort.direction}
                      onValueChange={(value) => handleUpdateSort(index, 'direction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSort(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-md">
            <h4 className="font-medium mb-2">Common Sort Patterns</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSortOptions([
                  { field: 'totalCheckins', direction: 'desc' }
                ])}
              >
                Most Popular Classes
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSortOptions([
                  { field: 'classAverageIncludingEmpty', direction: 'desc' }
                ])}
              >
                Best Attendance
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSortOptions([
                  { field: 'totalRevenue', direction: 'desc' }
                ])}
              >
                Highest Revenue
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataFilters;
