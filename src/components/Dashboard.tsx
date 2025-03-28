
import React, { useState, useEffect } from 'react';
import { ProcessedData, FilterOption, SortOption, ViewMode } from '@/types/data';
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
  Search 
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { ViewSwitcher } from '@/components/ViewSwitcher';

interface DashboardProps {
  data: ProcessedData[];
  loading: boolean;
  progress: number;
  onReset: () => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  loading, 
  progress, 
  onReset,
  viewMode,
  setViewMode
}) => {
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [activeTab, setActiveTab] = useState('data');
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters and sorting to data
  useEffect(() => {
    if (!data.length) return;

    let result = [...data];
    
    // Apply search query first
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

  const handleExport = () => {
    exportToCSV(filteredData);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  }; 

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <h2 className="text-xl font-semibold">Processing Data</h2>
        <ProgressBar progress={progress} />
        <p className="text-sm text-muted-foreground">Please wait while we process your file...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            {filteredData.length} Classes
          </span>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Upload New
          </Button>
          <Button variant="default" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <MetricsPanel data={filteredData} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <TopBottomClasses data={filteredData} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <SearchBar onSearch={handleSearchChange} data={data} />
          </CardContent>
        </Card>
      </div>
      
      <DataFilters 
        onFilterChange={handleFilterChange} 
        onSortChange={handleSortChange}
        data={data}
        activeFilters={filters.length}
      />

      <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
      
      <div className="bg-white dark:bg-gray-950 border rounded-lg shadow-sm">
        {viewMode === 'table' && <DataTable data={filteredData} />}
        {viewMode === 'grid' && <GridView data={filteredData} />}
        {viewMode === 'kanban' && <KanbanView data={filteredData} />}
        {viewMode === 'timeline' && <TimelineView data={filteredData} />}
        {viewMode === 'pivot' && <PivotView data={filteredData} />}
      </div>
      
      <ChartPanel data={filteredData} />
    </div>
  );
};

export default Dashboard;
