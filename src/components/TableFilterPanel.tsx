
import React, { useState } from 'react';
import { FilterOption, SortOption, ProcessedData } from '@/types/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Plus, X } from 'lucide-react';

interface TableFilterPanelProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
}

const TableFilterPanel: React.FC<TableFilterPanelProps> = ({ onFilterChange, onSortChange, data }) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [newFilter, setNewFilter] = useState<FilterOption>({ field: 'cleanedClass', operator: 'contains', value: '' });
  const [newSort, setNewSort] = useState<SortOption>({ field: 'totalCheckins', direction: 'desc' });

  // Operators based on field type
  const getOperatorsForField = (field: keyof ProcessedData): { value: FilterOption['operator']; label: string }[] => {
    const numericFields = ['totalCheckins', 'totalRevenue', 'totalCancelled', 'totalOccurrences'];
    const dateFields = ['date', 'period'];
    
    if (numericFields.includes(field as string)) {
      return [
        { value: 'greater', label: 'Greater than' },
        { value: 'less', label: 'Less than' },
        { value: 'equals', label: 'Equals' },
      ];
    } else if (dateFields.includes(field as string)) {
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

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Table Filters & Sort
          {filters.length > 0 && (
            <Badge variant="secondary" className="ml-2">{filters.length} filters</Badge>
          )}
          {sortOptions.length > 0 && (
            <Badge variant="outline" className="ml-2">{sortOptions.length} sorts</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Filter Table</h3>
            
            {/* Add new filter controls */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="w-full sm:w-auto">
                <Select value={newFilter.field} onValueChange={(value) => setNewFilter({ ...newFilter, field: value as keyof ProcessedData, operator: getOperatorsForField(value as keyof ProcessedData)[0].value })}>
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

              <div className="w-full sm:w-auto">
                <Select value={newFilter.operator} onValueChange={(value) => setNewFilter({ ...newFilter, operator: value as FilterOption['operator'] })}>
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

              <div className="flex-1">
                <Input 
                  placeholder="Value" 
                  value={newFilter.value} 
                  onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                />
              </div>

              <Button type="button" onClick={addFilter} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Filter
              </Button>
            </div>

            {/* Active filters */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
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
          
          <div>
            <h3 className="text-sm font-medium mb-3">Sort Table</h3>
            
            {/* Add new sort controls */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="w-full sm:w-auto">
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

              <div className="w-full sm:w-auto">
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

              <Button type="button" onClick={addSort} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Sort
              </Button>
            </div>

            {/* Active sort options */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
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
          </div>
        </div>
        
        {/* Clear all button */}
        {(filters.length > 0 || sortOptions.length > 0) && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All Filters & Sorts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableFilterPanel;
