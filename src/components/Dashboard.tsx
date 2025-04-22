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
import ThemeToggle from "@/components/ThemeToggle";

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

  // uniform card style
  const cardClass =
    "glass-morphism border shadow-md rounded-2xl bg-gradient-to-br from-white/80 via-indigo-50/90 to-white/90 dark:from-[#1A1F2C]/90 dark:via-[#232631]/80 dark:to-black/60 border-indigo-100 dark:border-gray-800";

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
    <div className="relative px-2 sm:px-0 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#1A1F2C] dark:to-[#232631]">
      {/* Floating Theme Toggle */}
      <ThemeToggle />
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-2 mt-2 items-center justify-center relative py-6 animate-fade-in">
        {/* Logo Centered & Animated */}
        <img
          src="https://i.imgur.com/9mOm7gP.png"
          alt="Logo"
          className="h-10 w-auto mb-2 animate-float drop-shadow-lg"
          loading="eager"
        />
        <h1
          className="relative text-4xl sm:text-5xl font-black leading-tight text-center bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent tracking-tight animate-fade-in will-change-transform select-none"
        >
          <span className="inline-block animate-pulse">Class Performance & Analytics</span>
        </h1>
        <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300 mt-1">
          Analyze and compare class performance metrics, explore trends, and gain actionable insights.
        </p>
      </div>

      {/* Collapsible Filters/ Search ONLY ONCE - above the dashboard */}
      <div className="max-w-4xl mx-auto rounded-2xl mb-4 shadow-sm glass-morphism bg-white/85 dark:bg-[#182030]/70 border border-indigo-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <span className="font-semibold text-lg text-indigo-800 dark:text-indigo-200">Filter & Search</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <SearchBar onSearch={handleSearchChange} value={searchQuery} />
          <DataFilters
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            data={data}
            activeFilters={filters.length}
          />
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
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

      {/* Metrics Panel */}
      <div className={cardClass + " mb-2"}>
        <MetricsPanel data={filteredData} />
      </div>
      {/* Top & Bottom Classes (DRILLDOWN/TOOLTIP handled inside component) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`lg:col-span-3 ${cardClass}`}>
          <CardContent className="p-6">
            <TopBottomClasses data={filteredData} />
          </CardContent>
        </Card>
      </div>

      {/* Modern Trainer Comparison View */}
      {showTrainerComparison && (
        <div className="grid grid-cols-1 gap-6">
          <Card className={`${cardClass}`}>
            <CardContent className="p-6">
              <TrainerComparisonView data={filteredData} trainerAvatars={trainerAvatars} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Switcher */}
      <ViewSwitcherWrapper viewMode={viewMode} setViewMode={setViewMode} />

      <div className={cardClass + " mt-2"}>
        {viewMode === 'table' && <DataTable data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'grid' && <GridView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'kanban' && <KanbanView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'timeline' && <TimelineView data={filteredData} trainerAvatars={trainerAvatars} />}
        {viewMode === 'pivot' && <PivotView data={filteredData} trainerAvatars={trainerAvatars} />}
      </div>
      <div className={cardClass + " mt-5 mb-6"}>
        <ChartPanel data={filteredData} />
      </div>
    </div>
  );
};

export default Dashboard;
