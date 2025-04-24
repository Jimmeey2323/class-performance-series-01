
import React, { useState } from 'react';
import { FilterOption, SortOption, ProcessedData } from '@/types/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Plus, X, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

interface TableFilterPanelProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
}

const TableFilterPanel: React.FC<TableFilterPanelProps> = ({ onFilterChange, onSortChange, data }) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'sort'>('filter');
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [newFilter, setNewFilter] = useState<FilterOption>({ field: 'cleanedClass', operator: 'contains', value: '' });
  const [newSort, setNewSort] = useState<SortOption>({ field: 'totalCheckins', direction: 'desc' });
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState<{name: string, filters: FilterOption[]}[]>([]);
  const [applyToAllViews, setApplyToAllViews] = useState(true);

  // Extract unique options for selects
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

  const trainers = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueTrainers = new Set(data.map(row => row.teacherName).filter(Boolean));
    return Array.from(uniqueTrainers).sort();
  }, [data]);

  const addFilter = () => {
    if (newFilter.value) {
      const updatedFilters = [...filters, { ...newFilter }];
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
      setNewFilter({ ...newFilter, value: '' }); // Reset value but keep field and operator
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
    onFilterChange([]);
    onSortChange([]);
  };

  const saveCurrentFilter = () => {
    if (filterName && filters.length > 0) {
      setSavedFilters([...savedFilters, { name: filterName, filters: [...filters] }]);
      setFilterName('');
    }
  };

  const applySavedFilter = (savedFilter: {name: string, filters: FilterOption[]}) => {
    setFilters(savedFilter.filters);
    onFilterChange(savedFilter.filters);
  };

  const deleteSavedFilter = (index: number) => {
    const updatedSavedFilters = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updatedSavedFilters);
  };

  // Operators based on field type
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
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Table Filters & Sorting
          {filters.length > 0 && (
            <Badge variant="secondary" className="ml-2">{filters.length} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'filter' | 'sort')} className="w-[200px]">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="filter">Filter</TabsTrigger>
              <TabsTrigger value="sort">Sort</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="apply-all" 
                checked={applyToAllViews} 
                onCheckedChange={setApplyToAllViews}
              />
              <Label htmlFor="apply-all" className="text-sm">Apply to all views</Label>
            </div>
          </div>
        </div>

        <TabsContent value="filter" className="space-y-4 mt-0">
          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newFilters = [{ field: 'totalCheckins', operator: 'greater', value: '0' }];
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
            >
              Non-Empty Classes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newFilters = [{ field: 'totalCancelled', operator: 'greater', value: '0' }];
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
            >
              Has Cancellations
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newFilters = [{ field: 'totalRevenue', operator: 'greater', value: '10000' }];
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
            >
              High Revenue (>₹10,000)
            </Button>
            {locations.slice(0, 2).map(location => (
              <Button 
                key={location}
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newFilters = [{ field: 'location', operator: 'equals', value: location }];
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
              >
                {location}
              </Button>
            ))}
          </div>
          
          {/* Add new filter controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <Select value={newFilter.field} onValueChange={(value) => setNewFilter({ ...newFilter, field: value as keyof ProcessedData, operator: getOperatorsForField(value)[0].value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(field => (
                    <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={newFilter.operator} onValueChange={(value) => setNewFilter({ ...newFilter, operator: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {getOperatorsForField(newFilter.field).map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input 
                placeholder="Value" 
                value={newFilter.value} 
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              />
            </div>

            <div>
              <Button 
                type="button" 
                onClick={addFilter} 
                variant="default" 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Filter
              </Button>
            </div>
          </div>

          {/* Active filters */}
          {filters.length > 0 && (
            <div className="space-y-2 mt-2">
              <div className="text-sm font-medium">Active Filters</div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter, index) => {
                  const field = fields.find(f => f.value === filter.field);
                  const operator = getOperatorsForField(filter.field).find(op => op.value === filter.operator);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 bg-muted/50 border rounded-md py-1 px-2 text-sm"
                    >
                      <Badge variant="secondary" className="font-normal">
                        {field?.label || filter.field}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {operator?.label || filter.operator}
                      </Badge>
                      <span className="text-sm">{filter.value}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => removeFilter(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Save filter */}
          {filters.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Input 
                placeholder="Filter name" 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="max-w-xs"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={saveCurrentFilter}
                disabled={!filterName}
              >
                <Save className="h-4 w-4 mr-1" /> Save Filter
              </Button>
            </div>
          )}
          
          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Saved Filters</div>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((saved, index) => (
                  <div 
                    key={index}
                    className="flex items-center bg-primary/10 border border-primary/20 rounded-md py-1 px-2"
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-sm p-0"
                      onClick={() => applySavedFilter(saved)}
                    >
                      {saved.name} ({saved.filters.length})
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1" 
                      onClick={() => deleteSavedFilter(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {filters.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sort" className="space-y-4 mt-0">
          {/* Add new sort controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Select value={newSort.field} onValueChange={(value) => setNewSort({ ...newSort, field: value as keyof ProcessedData })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {sortableFields.map(field => (
                    <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={newSort.direction} onValueChange={(value) => setNewSort({ ...newSort, direction: value as 'asc' | 'desc' })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button 
                type="button" 
                onClick={addSort} 
                variant="default" 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Sort
              </Button>
            </div>
          </div>

          {/* Quick sorts */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newSortOptions = [{ field: 'totalCheckins', direction: 'desc' }];
                setSortOptions(newSortOptions);
                onSortChange(newSortOptions);
              }}
            >
              Most Check-ins
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newSortOptions = [{ field: 'totalRevenue', direction: 'desc' }];
                setSortOptions(newSortOptions);
                onSortChange(newSortOptions);
              }}
            >
              Highest Revenue
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newSortOptions = [{ field: 'classAverageIncludingEmpty', direction: 'desc' }];
                setSortOptions(newSortOptions);
                onSortChange(newSortOptions);
              }}
            >
              Highest Average
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newSortOptions = [{ field: 'totalOccurrences', direction: 'desc' }];
                setSortOptions(newSortOptions);
                onSortChange(newSortOptions);
              }}
            >
              Most Classes
            </Button>
          </div>

          {/* Active sort options */}
          {sortOptions.length > 0 && (
            <div className="space-y-2 mt-2">
              <div className="text-sm font-medium">Active Sort</div>
              <div className="flex flex-col gap-2">
                {sortOptions.map((sort, index) => {
                  const field = sortableFields.find(f => f.value === sort.field);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between gap-2 bg-muted/50 border rounded-md py-1.5 px-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{field?.label || sort.field}</span>
                        <Badge variant="outline" className="font-normal">
                          {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSort(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {sortOptions.length > 0 && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSortOptions([]);
                  onSortChange([]);
                }}
              >
                Clear All Sorts
              </Button>
            </div>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default TableFilterPanel;
