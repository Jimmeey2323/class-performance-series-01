
import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedData } from '@/types/data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DataFilters from '@/components/DataFilters';
import DataTable from '@/components/DataTable';
import MetricsPanel from '@/components/MetricsPanel';
import TopBottomClasses from '@/components/TopBottomClasses';
import TrainerComparisonView from '@/components/TrainerComparisonView';
import { Button } from '@/components/ui/button';
import { Info, Settings } from "lucide-react";
import GridView from './views/GridView';
import TimelineView from './views/TimelineView';
import KanbanView from './views/KanbanView';
import { FilterProvider, useFilter } from '@/contexts/FilterContext';
import { useToast } from './ui/use-toast';

// Make this a centralized map of instructor avatars
export const trainerAvatars: Record<string, string> = {
  "Instructor A": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Instructor B": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Instructor C": "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "John Smith": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Jane Doe": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Robert Johnson": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Sarah Williams": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Michael Brown": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Lisa Davis": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
};

// Inner dashboard component that has access to the filter context
const DashboardContent: React.FC<{data: ProcessedData[]}> = ({ data }) => {
  const { toast } = useToast();
  const { filters, setFilters, sortOptions, setSortOptions, filteredData } = useFilter();
  const [includeTrainers, setIncludeTrainers] = useState(false);
  
  useEffect(() => {
    // Log the data for debugging
    console.log('All data:', data.length);
    console.log('Filtered data:', filteredData.length);
  }, [data, filteredData]);
  
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, [setFilters]);
  
  const handleSortChange = useCallback((newSortOptions) => {
    setSortOptions(newSortOptions);
  }, [setSortOptions]);

  const toggleTrainerGrouping = () => {
    setIncludeTrainers(!includeTrainers);
    toast({
      title: includeTrainers ? "Trainers ungrouped" : "Grouping by trainers",
      description: includeTrainers 
        ? "Classes are now grouped only by type, day and time." 
        : "Classes are now grouped by type, day, time AND trainer.",
      variant: "default"
    });
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Class Performance Dashboard</h1>
      
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-semibold">
            Showing data for {filteredData.length} of {data.length} classes
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant={includeTrainers ? "default" : "outline"} 
              className="flex items-center gap-2"
              onClick={toggleTrainerGrouping}
            >
              <Settings className="h-4 w-4" />
              {includeTrainers ? 'Grouped by Trainers' : 'Group by Trainers'}
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
      
        <DataFilters 
          onFilterChange={handleFilterChange} 
          onSortChange={handleSortChange} 
          data={data} 
          activeFilters={filters.length}
        />
      </div>
      
      <MetricsPanel data={filteredData} />
      
      <TopBottomClasses 
        data={filteredData} 
        includeTrainers={includeTrainers}
        trainerAvatars={trainerAvatars}
      />
      
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 my-6">
        <TrainerComparisonView 
          data={filteredData} 
          trainerAvatars={trainerAvatars}
        />
      </div>
      
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid grid-cols-4 md:w-fit">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="table" className="m-0">
            <DataTable data={filteredData} trainerAvatars={trainerAvatars} />
          </TabsContent>
          
          <TabsContent value="grid" className="m-0">
            <GridView data={filteredData} trainerAvatars={trainerAvatars} />
          </TabsContent>
          
          <TabsContent value="timeline" className="m-0">
            <TimelineView data={filteredData} />
          </TabsContent>
          
          <TabsContent value="kanban" className="m-0">
            <KanbanView data={filteredData} trainerAvatars={trainerAvatars} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Wrapper component that provides the filter context
const Dashboard: React.FC<{data: ProcessedData[]}> = ({ data }) => {
  return (
    <FilterProvider initialData={data}>
      <DashboardContent data={data} />
    </FilterProvider>
  );
};

export default Dashboard;
