
import React, { useState, useEffect } from 'react';
import { ProcessedData, FilterOption, SortOption } from '@/types/data';
import DataTable from '@/components/DataTable';
import DataFilters from '@/components/DataFilters';
import MetricsPanel from '@/components/MetricsPanel';
import ChartPanel from '@/components/ChartPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCSV } from '@/utils/fileProcessing';
import { Upload, BarChart3, Table, Download, RefreshCw } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';

interface DashboardProps {
  data: ProcessedData[];
  loading: boolean;
  progress: number;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  loading, 
  progress, 
  onReset 
}) => {
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [activeTab, setActiveTab] = useState('data');

  // Apply filters and sorting to data
  useEffect(() => {
    if (!data.length) return;

    let result = [...data];
    
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
  }, [data, filters, sortOptions]);

  const handleFilterChange = (newFilters: FilterOption[]) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortOptions: SortOption[]) => {
    setSortOptions(newSortOptions);
  };

  const handleExport = () => {
    exportToCSV(filteredData);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Data Analysis Dashboard</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Upload New File
          </Button>
          <Button variant="default" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <MetricsPanel data={filteredData} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px] mb-6">
          <TabsTrigger value="data" className="flex items-center">
            <Table className="mr-2 h-4 w-4" />
            Data Table
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="space-y-4">
          <DataFilters 
            onFilterChange={handleFilterChange} 
            onSortChange={handleSortChange}
            data={data}
          />
          <DataTable data={filteredData} />
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <ChartPanel data={filteredData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
