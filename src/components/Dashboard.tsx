
import React, { useState, useEffect } from 'react';
import { ProcessedData, ViewMode, FilterOption, SortOption } from '@/types/data';
import ViewSwitcherWrapper from './ViewSwitcherWrapper';
import { DataTable } from '@/components/DataTable';
import DataFilters from '@/components/DataFilters';
import MetricsPanel from '@/components/MetricsPanel';
import ChartPanel from '@/components/ChartPanel';
import TopBottomClasses from '@/components/TopBottomClasses';
import GridView from '@/components/views/GridView';
import KanbanView from '@/components/views/KanbanView';
import TimelineView from '@/components/views/TimelineView';
import PivotView from '@/components/views/PivotView';
import SearchBar from '@/components/SearchBar';
import TrainerComparisonView from '@/components/TrainerComparisonView';
import LocationComparisonView from '@/components/LocationComparisonView';
import ClassComparisonView from '@/components/ClassComparisonView';
import DayTimeComparisonView from '@/components/DayTimeComparisonView';
import TableFilterPanel from './TableFilterPanel';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { exportToCSV } from '@/utils/fileProcessing';
import { DateRange } from './DateRangePicker';
import { 
  Upload, 
  BarChart, 
  Download, 
  RefreshCw, 
  Search,
  FileText,
  FileSpreadsheet,
  FileJson,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Calendar
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import CustomizeAppearanceDialog from './CustomizeAppearanceDialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  data: ProcessedData[];
  loading: boolean;
  progress: number;
  onReset: () => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onLogout: () => void;
}

export const trainerAvatars: Record<string, string> = {
  "Siddhartha Kusuma": "https://i.imgur.com/XE0p6mW.jpg",
  "Shruti Suresh": "https://i.imgur.com/dBuz7oK.jpg",
  "Poojitha Bhaskar": "https://i.imgur.com/dvPLVXg.jpg",
  "Pushyank Nahar": "https://i.imgur.com/aHAJw6U.jpg",
  "Shruti Kulkarni": "https://i.imgur.com/CW2ZOUy.jpg",
  "Karan Bhatia": "https://i.imgur.com/y6d1H2z.jpg",
  "Pranjali Jain": "https://i.imgur.com/Hx8hTAk.jpg",
  "Anisha Shah": "https://i.imgur.com/7GM2oPn.jpg",
  "Saniya Jaiswal": "https://i.imgur.com/EP32RoZ.jpg",
  "Vivaran Dhasmana": "https://i.imgur.com/HGrGuq9.jpg",
  "Kajol Kanchan": "https://i.imgur.com/v9x0pFa.jpg"
};

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  loading, 
  progress, 
  onReset,
  viewMode,
  setViewMode,
  onLogout
}) => {
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [dateFilter, setDateFilter] = useState<DateRange>({ from: undefined, to: undefined });
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [activeComparisonTab, setActiveComparisonTab] = useState('trainer');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tableFilters, setTableFilters] = useState<FilterOption[]>([]);
  const [tableSortOptions, setTableSortOptions] = useState<SortOption[]>([]);

  useEffect(() => {
    if (!data.length) return;

    // First apply date range filter
    let result = data;

    if (dateFilter.from || dateFilter.to) {
      result = result.filter(item => {
        if (!item.date) return true;
        
        const itemDate = new Date(item.date.split(',')[0]);
        
        if (dateFilter.from && itemDate < dateFilter.from) return false;
        if (dateFilter.to && itemDate > dateFilter.to) return false;
        
        return true;
      });
    }
    
    // Then apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Then apply filters
    if (filters.length > 0) {
      result = result.filter(item => {
        return filters.every(filter => {
          if (filter.field === 'period' && filter.operator === 'in') {
            const selectedPeriods = filter.value.split(',');
            return selectedPeriods.some(period => item.period === period);
          }
          
          const fieldValue = String(item[filter.field]);
          
          switch (filter.operator) {
            case 'contains':
              return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
            case 'equals':
              return fieldValue.toLowerCase() === filter.value.toLowerCase();
            case 'starts':
              return fieldValue.toLowerCase().startsWith(filter.value.toLowerCase());
            case 'ends':
              return fieldValue.toLowerCase().endsWith(filter.value.toLowerCase());
            case 'greater':
              return Number(fieldValue) > Number(filter.value);
            case 'less':
              return Number(fieldValue) < Number(filter.value);
            default:
              return true;
          }
        });
      });
    }

    // Then apply sort
    if (sortOptions.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortOptions) {
          const valueA = a[sort.field];
          const valueB = b[sort.field];
          
          const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
          
          let comparison = 0;
          if (isNumeric) {
            comparison = Number(valueA) - Number(valueB);
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        
        return 0;
      });
    }
    
    // Apply table-specific filters if in table view
    if (viewMode === 'table' && tableFilters.length > 0) {
      result = result.filter(item => {
        return tableFilters.every(filter => {
          const fieldValue = String(item[filter.field]);
          
          switch (filter.operator) {
            case 'contains':
              return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
            case 'equals':
              return fieldValue.toLowerCase() === filter.value.toLowerCase();
            case 'starts':
              return fieldValue.toLowerCase().startsWith(filter.value.toLowerCase());
            case 'ends':
              return fieldValue.toLowerCase().endsWith(filter.value.toLowerCase());
            case 'greater':
              return Number(fieldValue) > Number(filter.value);
            case 'less':
              return Number(fieldValue) < Number(filter.value);
            default:
              return true;
          }
        });
      });
    }
    
    // Apply table-specific sort options if in table view
    if (viewMode === 'table' && tableSortOptions.length > 0) {
      result.sort((a, b) => {
        for (const sort of tableSortOptions) {
          const valueA = a[sort.field];
          const valueB = b[sort.field];
          
          const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
          
          let comparison = 0;
          if (isNumeric) {
            comparison = Number(valueA) - Number(valueB);
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        
        return 0;
      });
    }
    
    setFilteredData(result);
  }, [data, filters, sortOptions, searchQuery, viewMode, tableFilters, tableSortOptions, dateFilter]);

  const handleFilterChange = (newFilters: FilterOption[]) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortOptions: SortOption[]) => {
    setSortOptions(newSortOptions);
  };

  const handleTableFilterChange = (newFilters: FilterOption[]) => {
    setTableFilters(newFilters);
  };

  const handleTableSortChange = (newSortOptions: SortOption[]) => {
    setTableSortOptions(newSortOptions);
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (format === 'csv') {
      exportToCSV(filteredData);
    } else if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "class_data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else if (format === 'excel') {
      exportToCSV(filteredData);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  }; 
  
  const clearFilters = () => {
    setFilters([]);
    setSearchQuery('');
    setDateFilter({ from: undefined, to: undefined });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-12 min-h-[60vh]">
        <h2 className="text-2xl font-semibold">Processing Data</h2>
        <ProgressBar progress={progress} />
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Analyzed 
            <span className="text-primary mx-1">
              <CountUp 
                end={data.length} 
              />
            </span> 
            records so far
          </p>
          <p className="text-sm text-muted-foreground">Please wait while we process your file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <motion.img 
              src="https://i.imgur.com/9mOm7gP.png" 
              alt="Logo" 
              className="h-10 w-auto mr-3"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Class Analytics Dashboard
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredData.length} Classes | {filters.length} Active Filters
                {dateFilter.from && (
                  <> | <Calendar className="inline h-3 w-3 mx-1" /> 
                    {dateFilter.from.toLocaleDateString()} - {dateFilter.to ? dateFilter.to.toLocaleDateString() : 'present'}
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            
            <CustomizeAppearanceDialog />
            
            <Button variant="outline" size="sm" onClick={onReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Upload New
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export for Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Collapsible
          open={!isFilterCollapsed}
          onOpenChange={(open) => setIsFilterCollapsed(!open)}
          className="w-full bg-white dark:bg-gray-900 shadow-sm rounded-lg border mb-6"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 max-w-xl">
                <SearchBar onSearch={handleSearchChange} data={data} />
              </div>
              {(filters.length > 0 || dateFilter.from || dateFilter.to) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="gap-1.5 hidden sm:flex"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={activeComparisonTab} onValueChange={setActiveComparisonTab} className="hidden sm:flex">
                <TabsList>
                  <TabsTrigger value="trainer">
                    <Users className="h-4 w-4 mr-2" />
                    Trainer
                  </TabsTrigger>
                  <TabsTrigger value="location">
                    <Users className="h-4 w-4 mr-2" />
                    Location
                  </TabsTrigger>
                  <TabsTrigger value="class">
                    <Users className="h-4 w-4 mr-2" />
                    Class
                  </TabsTrigger>
                  <TabsTrigger value="time">
                    <Users className="h-4 w-4 mr-2" />
                    Time
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced Filters</span>
                  {isFilterCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          
          <CollapsibleContent>
            <div className="p-4 border-t">
              <DataFilters 
                onFilterChange={handleFilterChange} 
                onSortChange={handleSortChange}
                data={data}
                activeFilters={filters.length}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <MetricsPanel data={filteredData} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-3 animate-card gradient-card">
            <CardContent className="p-6">
              <TopBottomClasses data={filteredData} />
            </CardContent>
          </Card>
        </div>
        
        {/* Comparison Views based on active tab */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card className="animate-card gradient-card">
            <CardContent className="p-6">
              {activeComparisonTab === 'trainer' && <TrainerComparisonView data={filteredData} trainerAvatars={trainerAvatars} />}
              {activeComparisonTab === 'location' && <LocationComparisonView data={filteredData} />}
              {activeComparisonTab === 'class' && <ClassComparisonView data={filteredData} />}
              {activeComparisonTab === 'time' && <DayTimeComparisonView data={filteredData} />}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <ViewSwitcherWrapper viewMode={viewMode} setViewMode={setViewMode} />
          
          {viewMode === 'table' && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Table Filters
              {tableFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tableFilters.length}
                </Badge>
              )}
            </Button>
          )}
        </div>
        
        {viewMode === 'table' && showFilterPanel && (
          <TableFilterPanel 
            onFilterChange={handleTableFilterChange} 
            onSortChange={handleTableSortChange} 
            data={data} 
          />
        )}

        <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-sm mb-6 animate-card">
          {viewMode === 'table' && <DataTable data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'grid' && <GridView data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'kanban' && <KanbanView data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'timeline' && <TimelineView data={filteredData} trainerAvatars={trainerAvatars} />}
          {viewMode === 'pivot' && <PivotView data={filteredData} trainerAvatars={trainerAvatars} />}
        </div>
        
        <ChartPanel data={filteredData} />
      </div>
    </div>
  );
};

export default Dashboard;
