
import React, { useState, useEffect } from 'react';
import { ProcessedData, ViewMode, FilterOption, SortOption } from '@/types/data';
import { ViewSwitcherWrapper } from './ViewSwitcherWrapper';
import DataTable from '@/components/DataTable';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCSV } from '@/utils/fileProcessing';
import { 
  Upload, 
  BarChart3, 
  Table, 
  Download, 
  RefreshCw, 
  Grid, 
  Kanban, 
  Clock, 
  PieChart,
  Search,
  FileText,
  FileSpreadsheet,
  FileJson,
  Users,
  Filter,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import CountUp from 'react-countup';
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  data: ProcessedData[];
  loading: boolean;
  progress: number;
  onReset: () => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  onLogout: () => void;
}

// Trainer avatar mapping with updated image URLs
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
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrainerComparison, setShowTrainerComparison] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Apply filters and sorting to data, excluding future dates
  useEffect(() => {
    if (!data.length) return;

    // First, filter out future classes
    const today = new Date();
    let result = data.filter(item => {
      // Check if the class date is in the past or today
      if (item.period) {
        const [month, year] = item.period.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = months.indexOf(month);
        const fullYear = 2000 + parseInt(year); // Assuming years are in format '22' for 2022
        
        const periodDate = new Date(fullYear, monthIndex);
        return periodDate <= today; // Only include past or current periods
      }
      return true; // Include items without period data
    });
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      );
    }
    
    // Apply filters
    if (filters.length > 0) {
      result = result.filter(item => {
        return filters.every(filter => {
          // Special case for period with OR logic
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
    
    // Apply sorting
    if (sortOptions.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortOptions) {
          const valueA = a[sort.field];
          const valueB = b[sort.field];
          
          // Determine if the values are numeric
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
  }, [data, filters, sortOptions, searchQuery]);

  const handleFilterChange = (newFilters: FilterOption[]) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortOptions: SortOption[]) => {
    setSortOptions(newSortOptions);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (format === 'csv' || format === 'excel') {
      exportToCSV(filteredData);
    } else if (format === 'json') {
      // Export as JSON
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "class_data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-12 min-h-[60vh]">
        <h2 className="text-2xl font-semibold">Processing Data</h2>
        <ProgressBar progress={progress} />
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Analyzed 
            <span className="text-primary mx-1">
              <CountUp end={data.length} duration={2} separator="," />
            </span> 
            records so far
          </p>
          <p className="text-sm text-muted-foreground">Please wait while we process your file...</p>
        </div>
      </div>
    );
  }

  // Format currency values without decimals
  const formatCurrency = (value: string) => {
    if (!value) return '₹0';
    return `₹${parseInt(value).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header Section */}
      <div className="flex flex-col justify-between items-center mb-6 relative">
        <div className="absolute right-0 top-0">
          <Button variant="ghost" size="icon" onClick={onLogout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
        
        <div className="flex flex-col items-center w-full animate-fade-in">
          <div className="flex items-center justify-center mb-3 animate-scale-in">
            <img 
              src="https://i.imgur.com/9mOm7gP.png" 
              alt="Logo" 
              className="h-16 w-auto hover:animate-pulse transition-all duration-300 animate-enter" 
            />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 animate-enter bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 text-transparent">
            <span className="h-8 w-8 text-amber-500"><Sparkles className="h-6 w-6 animate-pulse" /></span>
            Class Performance & Analytics
            <span className="h-8 w-8 text-amber-500"><Sparkles className="h-6 w-6 animate-pulse" /></span>
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl animate-fade-in transition-all hover:text-slate-800 dark:hover:text-slate-200">
            Analyze class performance metrics, explore trends, and gain insights to optimize your fitness studio operations
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-3 animate-fade-in transition-opacity duration-500">
            {Object.entries(trainerAvatars).slice(0, 6).map(([name, src]) => (
              <Avatar key={name} className="border-2 border-white hover:scale-110 transition-transform duration-300">
                <AvatarImage src={src} alt={name} className="object-cover" />
                <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
            {filteredData.length} Classes
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Upload New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Data
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
          
          <Button 
            variant={showTrainerComparison ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowTrainerComparison(!showTrainerComparison)}
          >
            <Users className="mr-2 h-4 w-4" />
            Trainer Comparison
          </Button>
          
          <Button
            variant={isFilterOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="ml-auto sm:ml-0"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {filters.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-indigo-100 dark:bg-indigo-900 text-xs">
                {filters.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      {/* Collapsible Filter Section */}
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer"></div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden animate-accordion-down">
          <Card className="border border-indigo-100 dark:border-indigo-900">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-medium">Filter & Search</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFilters([])} disabled={filters.length === 0}>
                    Clear All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search across all fields..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <DataFilters 
                      onFilterChange={handleFilterChange}
                      onSortChange={handleSortChange}
                      data={data}
                      activeFilters={filters.length}
                      compact={true}
                    />
                  </div>
                </div>
                
                {/* Active Filters Display */}
                {filters.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {filters.map((filter, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 flex items-center gap-1"
                      >
                        <span className="font-medium">{filter.field}:</span> 
                        <span>{filter.operator} "{filter.value}"</span>
                        <button 
                          className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          onClick={() => {
                            const newFilters = [...filters];
                            newFilters.splice(index, 1);
                            setFilters(newFilters);
                          }}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Metrics Panel */}
      <MetricsPanel data={filteredData} />
      
      {/* Top & Bottom Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3 border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <TopBottomClasses data={filteredData} />
          </CardContent>
        </Card>
      </div>
      
      {/* Trainer Comparison (Conditionally Shown) */}
      {showTrainerComparison && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <TrainerComparisonView data={filteredData} trainerAvatars={trainerAvatars} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Switcher */}
      <ViewSwitcherWrapper viewMode={viewMode} setViewMode={setViewMode} />

      {/* Main Data Display (Table/Grid/Kanban/etc) */}
      <div className="bg-white dark:bg-gray-950 border border-indigo-100 dark:border-indigo-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {viewMode === 'table' && <DataTable data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'grid' && <GridView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'kanban' && <KanbanView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'timeline' && <TimelineView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'pivot' && <PivotView data={filteredData} trainerAvatars={trainerAvatars} />}
      </div>
      
      {/* Charts Panel */}
      <ChartPanel data={filteredData} />
    </div>
  );
};

export default Dashboard;
