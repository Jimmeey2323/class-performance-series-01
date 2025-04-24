import React, { useState, useEffect } from 'react';
import { FilterOption, SortOption, ProcessedData } from '@/types/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { parse } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Plus, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface DataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
  activeFilters: number;
}

const parseClassDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  
  let parsed = parse(dateStr.split(',')[0], "MM/dd/yyyy", new Date());
  
  if (isNaN(parsed.getTime())) {
    parsed = parse(dateStr.split(',')[0], "yyyy-MM-dd", new Date());
    if (isNaN(parsed.getTime())) {
      parsed = parse(dateStr.split(',')[0], "dd/MM/yyyy", new Date());
      if (isNaN(parsed.getTime())) return undefined;
    }
  }
  
  return parsed;
};

const DataFilters: React.FC<DataFiltersProps> = ({ onFilterChange, onSortChange, data, activeFilters }) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'sort'>('filter');
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [newFilter, setNewFilter] = useState<FilterOption>({ field: 'cleanedClass', operator: 'contains', value: '' });
  const [newSort, setNewSort] = useState<SortOption>({ field: 'totalCheckins', direction: 'desc' });
  const [isExpanded, setIsExpanded] = useState(false);

  const classNames = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueClasses = new Set(data.map(row => row.cleanedClass).filter(Boolean));
    return Array.from(uniqueClasses).sort();
  }, [data]);

  const locations = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueLocations = new Set(data.map(row => row.location).filter(Boolean));
    return Array.from(uniqueLocations).sort();
  }, [data]);

  const daysOfWeek = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const availableDays = new Set(data.map(row => row.dayOfWeek).filter(Boolean));
    return days.filter(day => availableDays.has(day));
  }, [data]);

  const periods = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniquePeriods = new Set(data.map(row => row.period).filter(Boolean));
    return Array.from(uniquePeriods).sort();
  }, [data]);
  
  const [filterSettings, setFilterSettings] = useState({
    className: "all",
    location: "all",
    dayOfWeek: "all",
    hasParticipants: false,
    dateRange: { from: undefined, to: undefined } as DateRange,
  });

  const addFilter = () => {
    if (newFilter.value) {
      const updatedFilters = [...filters, { ...newFilter }];
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
      setNewFilter({ ...newFilter, value: '' });
    }
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const addSort = () => {
    const updatedSortOptions = [...sortOptions, { ...newSort }];
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
  };

  const removeSort = (index: number) => {
    const updatedSortOptions = sortOptions.filter((_, i) => i !== index);
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
  };

  const clearAll = () => {
    setFilters([]);
    setSortOptions([]);
    setFilterSettings({
      className: "all",
      location: "all",
      dayOfWeek: "all",
      hasParticipants: false,
      dateRange: { from: undefined, to: undefined },
    });
    onFilterChange([]);
    onSortChange([]);
  };

  const applyFilters = () => {
    const newFilters: FilterOption[] = [];
    
    if (filterSettings.className !== "all") {
      newFilters.push({
        field: "cleanedClass",
        operator: "equals",
        value: filterSettings.className
      });
    }

    if (filterSettings.location !== "all") {
      newFilters.push({
        field: "location",
        operator: "equals",
        value: filterSettings.location
      });
    }

    if (filterSettings.dayOfWeek !== "all") {
      newFilters.push({
        field: "dayOfWeek",
        operator: "equals",
        value: filterSettings.dayOfWeek
      });
    }

    if (filterSettings.hasParticipants) {
      newFilters.push({
        field: "totalCheckins",
        operator: "greater",
        value: "0"
      });
    }

    if (filterSettings.dateRange.from || filterSettings.dateRange.to) {
      const dateFilters = [];
      
      if (filterSettings.dateRange.from) {
        dateFilters.push({
          field: "date",
          operator: "after" as const,
          value: filterSettings.dateRange.from.toISOString().split('T')[0]
        });
      }
      
      if (filterSettings.dateRange.to) {
        dateFilters.push({
          field: "date",
          operator: "before" as const,
          value: filterSettings.dateRange.to.toISOString().split('T')[0]
        });
      }
      
      newFilters.push(...dateFilters);
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getOperatorsForField = (field: string) => {
    const numericFields = ['totalCheckins', 'totalRevenue', 'totalCancelled', 'totalOccurrences'];
    const dateFields = ['date', 'period'];
    
    if (numericFields.includes(field)) {
      return [
        { value: 'greater', label: 'Greater than' },
        { value: 'less', label: 'Less than' },
        { value: 'equals', label: 'Equals' },
      ];
    } else if (dateFields.includes(field)) {
      return [
        { value: 'after', label: 'After' },
        { value: 'before', label: 'Before' },
        { value: 'on', label: 'On' },
      ];
    } else {
      return [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'starts', label: 'Starts with' },
        { value: 'ends', label: 'Ends with' },
        { value: 'in', label: 'In' },
      ];
    }
  };

  const fields = [
    { value: 'cleanedClass', label: 'Class Type' },
    { value: 'teacherName', label: 'Instructor' },
    { value: 'location', label: 'Location' },
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'classTime', label: 'Class Time' },
    { value: 'date', label: 'Class Date' },
    { value: 'period', label: 'Period' },
    { value: 'totalCheckins', label: 'Check-ins' },
    { value: 'totalRevenue', label: 'Revenue' },
    { value: 'totalCancelled', label: 'Cancellations' },
    { value: 'totalOccurrences', label: 'Class Count' },
  ];

  const sortableFields = [
    { value: 'cleanedClass', label: 'Class Type' },
    { value: 'teacherName', label: 'Instructor' },
    { value: 'location', label: 'Location' },
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'classTime', label: 'Class Time' },
    { value: 'date', label: 'Class Date' },
    { value: 'totalCheckins', label: 'Check-ins' },
    { value: 'totalRevenue', label: 'Revenue' },
    { value: 'totalCancelled', label: 'Cancellations' },
    { value: 'totalOccurrences', label: 'Class Count' },
    { value: 'classAverageIncludingEmpty', label: 'Avg. Attendance (All)' },
    { value: 'classAverageExcludingEmpty', label: 'Avg. Attendance (Non-empty)' },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter & Sort Data {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-2">{activeFilters} active</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'filter' | 'sort')}>
            <TabsList className="grid grid-cols-2 w-[200px] mb-4">
              <TabsTrigger value="filter">Filter</TabsTrigger>
              <TabsTrigger value="sort">Sort</TabsTrigger>
            </TabsList>

            {activeTab === 'filter' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Class Type</Label>
                    <Select
                      value={filterSettings.className}
                      onValueChange={(value) => setFilterSettings({ ...filterSettings, className: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classNames.map((className) => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select
                      value={filterSettings.location}
                      onValueChange={(value) => setFilterSettings({ ...filterSettings, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={filterSettings.dayOfWeek}
                      onValueChange={(value) => setFilterSettings({ ...filterSettings, dayOfWeek: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Days</SelectItem>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <DateRangePicker
                      value={filterSettings.dateRange}
                      onChange={(dateRange) =>
                        setFilterSettings({ ...filterSettings, dateRange: dateRange || { from: undefined, to: undefined } })
                      }
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasParticipants"
                    checked={filterSettings.hasParticipants}
                    onCheckedChange={(checked) => 
                      setFilterSettings({ ...filterSettings, hasParticipants: checked === true })
                    }
                  />
                  <Label htmlFor="hasParticipants">Only show classes with participants</Label>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={clearAll}>
                    Clear All
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>

                <div className="mt-6 border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Advanced Filters</h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="w-full sm:w-auto">
                      <Select value={newFilter.field} onValueChange={(value) => setNewFilter({ ...newFilter, field: value as keyof ProcessedData, operator: getOperatorsForField(value)[0].value as FilterOption['operator'] })}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map(field => (
                            <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-auto">
                      <Select value={newFilter.operator} onValueChange={(value) => setNewFilter({ ...newFilter, operator: value as FilterOption['operator'] })}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForField(newFilter.field).map(op => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Input 
                        placeholder="Value" 
                        value={newFilter.value} 
                        onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                      />
                    </div>

                    <Button type="button" onClick={addFilter} size="sm" className="whitespace-nowrap">
                      <Plus className="h-4 w-4 mr-1" /> Add Filter
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {filters.map((filter, index) => {
                        const field = fields.find(f => f.value === filter.field);
                        const operator = getOperatorsForField(filter.field).find(op => op.value === filter.operator);
                        
                        return (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 p-2 border rounded-md bg-muted/20"
                          >
                            <Badge variant="secondary" className="whitespace-nowrap">
                              {field?.label || filter.field}
                            </Badge>
                            <Badge variant="outline" className="whitespace-nowrap">
                              {operator?.label || filter.operator}
                            </Badge>
                            <span className="text-sm truncate flex-1">{filter.value}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => removeFilter(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sort' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium mb-4">Sort Order</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="w-full sm:w-auto">
                    <Select value={newSort.field} onValueChange={(value) => setNewSort({ ...newSort, field: value as keyof ProcessedData })}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortableFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto">
                    <Select value={newSort.direction} onValueChange={(value) => setNewSort({ ...newSort, direction: value as 'asc' | 'desc' })}>
                      <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="button" onClick={addSort} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Sort
                  </Button>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {sortOptions.map((sort, index) => {
                      const field = sortableFields.find(f => f.value === sort.field);
                      
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 p-2 border rounded-md bg-muted/20"
                        >
                          <div className="flex-1 flex items-center gap-2">
                            <Badge variant="secondary" className="whitespace-nowrap">
                              {field?.label || sort.field}
                            </Badge>
                            <Badge variant="outline" className="whitespace-nowrap">
                              {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
                            </Badge>
                            {index === 0 && (
                              <Badge className="bg-primary/20 text-primary border-primary/20">Primary</Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => removeSort(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {sortOptions.length > 0 && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSortOptions([]);
                      onSortChange([]);
                    }}>
                      Clear All Sorts
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};

export default DataFilters;
