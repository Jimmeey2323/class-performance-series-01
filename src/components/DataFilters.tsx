
import React, { useState } from 'react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, SortAsc, SortDesc, X, Plus, Save, RotateCcw } from 'lucide-react';

interface DataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
}

const DataFilters: React.FC<DataFiltersProps> = ({ onFilterChange, onSortChange, data }) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [newFilterField, setNewFilterField] = useState<keyof ProcessedData>('cleanedClass');
  const [newFilterOperator, setNewFilterOperator] = useState('contains');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [newSortField, setNewSortField] = useState<keyof ProcessedData>('cleanedClass');
  const [newSortDirection, setNewSortDirection] = useState<'asc' | 'desc'>('asc');

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
    if (!newFilterValue) return;
    
    const newFilter: FilterOption = {
      field: newFilterField,
      operator: newFilterOperator,
      value: newFilterValue,
    };
    
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
    setNewFilterValue('');
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
  };

  const removeSortOption = (index: number) => {
    const updatedSortOptions = sortOptions.filter((_, i) => i !== index);
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
  };

  const resetFiltersAndSort = () => {
    setFilters([]);
    setSortOptions([]);
    onFilterChange([]);
    onSortChange([]);
  };

  // Function to get unique values for a field
  const getUniqueValues = (field: keyof ProcessedData): string[] => {
    const values = data.map(item => String(item[field]));
    return [...new Set(values)].sort();
  };

  return (
    <Card className="bg-white dark:bg-gray-950">
      <CardContent className="pt-6">
        <Accordion type="multiple" className="w-full" defaultValue={["filters", "sort"]}>
          <AccordionItem value="filters">
            <AccordionTrigger className="text-lg font-medium">
              <div className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filters
                {filters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* Current filters */}
                {filters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {filters.map((filter, index) => {
                      const fieldLabel = fields.find(f => f.key === filter.field)?.label || filter.field;
                      const operatorLabel = operators.find(o => o.value === filter.operator)?.label || filter.operator;
                      
                      return (
                        <Badge key={index} variant="outline" className="p-2 flex items-center gap-2">
                          <span>{fieldLabel}</span>
                          <span className="text-muted-foreground">{operatorLabel}</span>
                          <span className="font-semibold">{filter.value}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeFilter(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                {/* Add new filter */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div>
                    <Label htmlFor="filter-field">Field</Label>
                    <Select 
                      value={newFilterField as string} 
                      onValueChange={(value) => setNewFilterField(value as keyof ProcessedData)}
                    >
                      <SelectTrigger id="filter-field">
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
                    <Label htmlFor="filter-operator">Operator</Label>
                    <Select value={newFilterOperator} onValueChange={setNewFilterOperator}>
                      <SelectTrigger id="filter-operator">
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
                    <Label htmlFor="filter-value">Value</Label>
                    <Select
                      value={newFilterValue}
                      onValueChange={setNewFilterValue}
                    >
                      <SelectTrigger id="filter-value" className="w-full">
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
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={addFilter} className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Filter
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="sort">
            <AccordionTrigger className="text-lg font-medium">
              <div className="flex items-center">
                {newSortDirection === 'asc' ? (
                  <SortAsc className="mr-2 h-5 w-5" />
                ) : (
                  <SortDesc className="mr-2 h-5 w-5" />
                )}
                Sort Options
                {sortOptions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sortOptions.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* Current sort options */}
                {sortOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sortOptions.map((sort, index) => {
                      const fieldLabel = fields.find(f => f.key === sort.field)?.label || sort.field;
                      
                      return (
                        <Badge key={index} variant="outline" className="p-2 flex items-center gap-2">
                          <span>{fieldLabel}</span>
                          <span className="text-muted-foreground">
                            {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeSortOption(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                {/* Add new sort option */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <Label htmlFor="sort-field">Field</Label>
                    <Select 
                      value={newSortField as string} 
                      onValueChange={(value) => setNewSortField(value as keyof ProcessedData)}
                    >
                      <SelectTrigger id="sort-field">
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
                    <Label htmlFor="sort-direction">Direction</Label>
                    <Select 
                      value={newSortDirection} 
                      onValueChange={(value) => setNewSortDirection(value as 'asc' | 'desc')}
                    >
                      <SelectTrigger id="sort-direction">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={addSortOption} className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Sort
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
  );
};

export default DataFilters;
