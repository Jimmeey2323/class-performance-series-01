
import React, { useState, useEffect } from 'react';
import { ViewMode, ProcessedData } from '@/types/data';
import FileUploader from '@/components/FileUploader';
import Dashboard from '@/components/Dashboard';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Index = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('class-analytics-view-mode', 'table');
  
  // Store data in localStorage for persistence between sessions
  const [storedData, setStoredData] = useLocalStorage<ProcessedData[] | null>('class-analytics-data', null);

  // Check for stored data on component mount
  useEffect(() => {
    if (storedData && storedData.length > 0 && !dataLoaded) {
      setData(storedData);
      setDataLoaded(true);
    }
  }, [storedData, dataLoaded]);

  const handleDataProcessed = (processedData: ProcessedData[], skipAnimation: boolean = false) => {
    setData(processedData);
    setStoredData(processedData); // Store data for future sessions
    setLoading(false);
    setDataLoaded(true);
  };

  const handlePreviewStarted = () => {
    setDataLoaded(false);
  };

  const handleProcessingStarted = () => {
    setLoading(true);
    setProgress(0);
  };

  const handleProcessingProgress = (progress: number) => {
    setProgress(progress);
  };

  const handleReset = () => {
    setDataLoaded(false);
    setData([]);
  };

  const handleLogout = () => {
    // Just reset for now
    setDataLoaded(false);
    setData([]);
  };

  return (
    <main>
      {!dataLoaded ? (
        <FileUploader
          onDataProcessed={handleDataProcessed}
          onPreviewStarted={handlePreviewStarted}
          onProcessingStarted={handleProcessingStarted}
          onProcessingProgress={handleProcessingProgress}
        />
      ) : (
        <Dashboard 
          data={data} 
          loading={loading} 
          progress={progress} 
          onReset={handleReset}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onLogout={handleLogout}
        />
      )}
    </main>
  );
};

export default Index;
