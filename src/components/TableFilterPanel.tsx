
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, ChevronDown, ChevronUp, Calendar, Save } from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { ProcessedData } from '@/types/data';
import { parse, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface TableFilterPanelProps {
  data: ProcessedData[];
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

export interface FilterState {
  className: string;
  location: string;
  dayOfWeek: string;
  teacherName: string;
  classTime: string;
  hasParticipants: boolean;
  dateRange: DateRange;
  searchTerm: string;
}

const defaultFilterState: FilterState = {
  className: "all",
  location: "all",
  dayOfWeek: "all",
  teacherName: "all",
  classTime: "all",
  hasParticipants: false,
  dateRange: { from: undefined, to: undefined },
  searchTerm: "",
};

const TableFilterPanel: React.FC<TableFilterPanelProps> = ({ data, onFilterChange, activeFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>(activeFilters || defaultFilterState);
  const [savedFilters, setSavedFilters] = useState<{name: string, filters: FilterState}[]>([]);
  const [newFilterName, setNewFilterName] = useState('');
  const { toast } = useToast();

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

  const teacherNames = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueTeachers = new Set(data.map(row => row.teacherName).filter(Boolean));
    return Array.from(uniqueTeachers).sort();
  }, [data]);

  const classTimes = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueTimes = new Set(data.map(row => row.classTime).filter(Boolean));
    return Array.from(uniqueTimes).sort();
  }, [data]);

  const daysOfWeek = React.useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const availableDays = new Set(data.map(row => row.dayOfWeek).filter(Boolean));
    return days.filter(day => availableDays.has(day));
  }, [data]);

  // Load saved filters from localStorage
  useEffect(() => {
    const storedFilters = localStorage.getItem('tableFilters');
    if (storedFilters) {
      try {
        const parsedFilters = JSON.parse(storedFilters);
        setSavedFilters(parsedFilters);
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  const applyFilters = () => {
    onFilterChange(filters);
    setIsExpanded(false);
  };

  const resetFilters = () => {
    const newFilters = { ...defaultFilterState };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const saveCurrentFilter = () => {
    if (!newFilterName.trim()) {
      toast({
        title: "Filter name required",
        description: "Please enter a name for this filter set",
        variant: "destructive"
      });
      return;
    }

    const newSavedFilters = [
      ...savedFilters,
      { name: newFilterName, filters: { ...filters } }
    ];
    
    setSavedFilters(newSavedFilters);
    setNewFilterName('');
    
    // Save to localStorage
    localStorage.setItem('tableFilters', JSON.stringify(newSavedFilters));
    
    toast({
      title: "Filter saved",
      description: `Your filter "${newFilterName}" has been saved`
    });
  };

  const loadSavedFilter = (savedFilter: { name: string, filters: FilterState }) => {
    setFilters(savedFilter.filters);
    onFilterChange(savedFilter.filters);
    
    toast({
      title: "Filter loaded",
      description: `Filter "${savedFilter.name}" has been applied`
    });
  };

  const deleteSavedFilter = (indexToDelete: number) => {
    const newSavedFilters = savedFilters.filter((_, index) => index !== indexToDelete);
    setSavedFilters(newSavedFilters);
    localStorage.setItem('tableFilters', JSON.stringify(newSavedFilters));
    
    toast({
      title: "Filter deleted",
      description: "The filter has been removed"
    });
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateRange') {
      return !!(value as DateRange).from || !!(value as DateRange).to;
    }
    if (key === 'hasParticipants') {
      return !!value;
    }
    if (key === 'searchTerm') {
      return !!value;
    }
    return value !== 'all' && value !== '';
  }).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Table Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Saved Filters</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Saved Filters</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 my-4">
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Enter filter name" 
                    value={newFilterName} 
                    onChange={(e) => setNewFilterName(e.target.value)}
                  />
                  <Button onClick={saveCurrentFilter}>Save Current</Button>
                </div>
                
                {savedFilters.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No saved filters. Save your current filter settings to reuse them later.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedFilters.map((filter, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="font-medium">{filter.name}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => loadSavedFilter(filter)}>
                            Load
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteSavedFilter(index)}>
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="grid gap-6">
          <Tabs defaultValue="basic">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Filters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Class Type</Label>
                  <Select
                    value={filters.className}
                    onValueChange={(value) => setFilters({ ...filters, className: value })}
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
                    value={filters.location}
                    onValueChange={(value) => setFilters({ ...filters, location: value })}
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
                    value={filters.dayOfWeek}
                    onValueChange={(value) => setFilters({ ...filters, dayOfWeek: value })}
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
                    value={filters.dateRange}
                    onChange={(dateRange) =>
                      setFilters({ ...filters, dateRange: dateRange || { from: undefined, to: undefined } })
                    }
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Trainer</Label>
                  <Select
                    value={filters.teacherName}
                    onValueChange={(value) => setFilters({ ...filters, teacherName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trainers</SelectItem>
                      {teacherNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Class Time</Label>
                  <Select
                    value={filters.classTime}
                    onValueChange={(value) => setFilters({ ...filters, classTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Times</SelectItem>
                      {classTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Search Term</Label>
                  <Input 
                    placeholder="Search in all fields"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasParticipants"
                  checked={filters.hasParticipants}
                  onCheckedChange={(checked) => 
                    setFilters({ ...filters, hasParticipants: checked === true })
                  }
                />
                <Label htmlFor="hasParticipants">Only show classes with participants</Label>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TableFilterPanel;
