
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
  Users
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
  const [activeTab, setActiveTab] = useState('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showTrainerComparison, setShowTrainerComparison] = useState(false);

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

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (format === 'csv') {
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
    } else if (format === 'excel') {
      // CSV format that Excel can open
      exportToCSV(filteredData);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setShowSearchDialog(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between items-center mb-6 relative">
        <div className="absolute right-0 top-0">
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
        
        <div className="flex flex-col items-center w-full animate-fade-in">
          <div className="flex items-center justify-center mb-3 animate-scale-in">
            <img src="https://i.imgur.com/9mOm7gP.png" alt="Logo" className="h-16 w-auto hover:animate-pulse transition-all" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 animate-enter">
            <span className="h-8 w-8 text-amber-500 animate-pulse">✨</span>
            Class Performance & Analytics
            <span className="h-8 w-8 text-amber-500 animate-pulse">✨</span>
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            {filteredData.length} Classes
          </span>
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
          
          <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Advanced Search
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Advanced Search</DialogTitle>
              </DialogHeader>
              <SearchBar onSearch={handleSearchChange} data={data} />
              <div className="flex justify-end mt-4">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Close</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant={showTrainerComparison ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowTrainerComparison(!showTrainerComparison)}
          >
            <Users className="mr-2 h-4 w-4" />
            Trainer Comparison
          </Button>
        </div>
      </div>

      <MetricsPanel data={filteredData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <TopBottomClasses data={filteredData} />
          </CardContent>
        </Card>
      </div>
      
      {showTrainerComparison && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-6">
              <TrainerComparisonView data={filteredData} trainerAvatars={trainerAvatars} />
            </CardContent>
          </Card>
        </div>
      )}
      
      <DataFilters 
        onFilterChange={handleFilterChange} 
        onSortChange={handleSortChange}
        data={data}
        activeFilters={filters.length}
      />

      <ViewSwitcherWrapper viewMode={viewMode} setViewMode={setViewMode} />

      <div className="bg-white dark:bg-gray-950 border rounded-lg shadow-sm">
        {viewMode === 'table' && <DataTable data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'grid' && <GridView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'kanban' && <KanbanView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'timeline' && <TimelineView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'pivot' && <PivotView data={filteredData} trainerAvatars={trainerAvatars} />}
      </div>
      
      <ChartPanel data={filteredData} />
    </div>
  );
};

export default Dashboard;
