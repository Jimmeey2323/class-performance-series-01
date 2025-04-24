
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '@/components/FileUploader';
import Dashboard from '@/components/Dashboard';
import { ProcessedData, ViewMode } from '@/types/data';
import { handleZipFile, processData } from '@/utils/fileProcessing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Index = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Use localStorage for persistence
  const [persistentData, setPersistentData] = useLocalStorage<ProcessedData[]>('class-data', []);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Check if data exists in localStorage on first load
  useEffect(() => {
    if (!hasInitialized && persistentData.length > 0) {
      setData(persistentData);
      setHasInitialized(true);
    }
  }, [persistentData, hasInitialized]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setProgress(0);
    
    try {
      if (file.name.endsWith('.zip')) {
        const csvData = await handleZipFile(file, (progress) => {
          setProgress(progress);
        });
        
        if (csvData) {
          const processedData = processData(csvData);
          setData(processedData);
          setPersistentData(processedData);
          setProgress(100);
        } else {
          console.error('Failed to process ZIP file');
        }
      } else {
        console.error('Invalid file format. Please upload a ZIP file.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData([]);
    setPersistentData([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {data.length === 0 ? (
        <div className="container mx-auto py-16 px-4">
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <Dashboard 
          data={data} 
          loading={loading} 
          progress={progress} 
          onReset={handleReset}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onLogout={handleReset}
        />
      )}
    </div>
  );
};

export default Index;
