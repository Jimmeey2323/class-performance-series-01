
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '@/components/FileUploader';
import Dashboard from '@/components/Dashboard';
import { ProcessedData, ViewMode } from '@/types/data';
import { processZipFile } from '@/utils/fileProcessing';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const Index = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('classAnalyticsData');
    const savedViewMode = localStorage.getItem('classAnalyticsViewMode');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as ProcessedData[];
        if (parsedData && parsedData.length > 0) {
          setData(parsedData);
          setFileUploaded(true);
          toast({
            title: 'Data loaded from previous session',
            description: `Loaded ${parsedData.length} records.`,
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
    
    if (savedViewMode) {
      setViewMode(savedViewMode as ViewMode);
    }
  }, [toast]);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('classAnalyticsViewMode', viewMode);
  }, [viewMode]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setProgress(10);
    try {
      setProgress(30);
      const processedData = await processZipFile(file);
      setProgress(70);
      if (processedData && processedData.length > 0) {
        setData(processedData);
        setFileUploaded(true);
        setProgress(100);
        
        // Save data to localStorage for persistence
        localStorage.setItem('classAnalyticsData', JSON.stringify(processedData));
        
        toast({
          title: 'File processed successfully',
          description: `Processed ${processedData.length} records from the file.`,
          duration: 3000
        });
      } else {
        throw new Error('No data found or processed');
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error processing file',
        description: error.message || 'There was an error processing your file. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000); // Keep loading for a short period to show progress
    }
  };

  const handleReset = () => {
    setData([]);
    setFileUploaded(false);
    setProgress(0);
    localStorage.removeItem('classAnalyticsData');
    toast({
      title: 'Data cleared',
      description: 'You can now upload a new file.',
      duration: 3000
    });
  };

  const handleLogout = () => {
    navigate('/auth');
  };

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen">
      {!fileUploaded ? (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-screen p-6" 
          initial={{opacity: 0, y: 20}} 
          animate={{opacity: 1, y: 0}} 
          transition={{duration: 0.5}}
        >
          <motion.img 
            src="https://i.imgur.com/9mOm7gP.png" 
            alt="Logo" 
            initial={{rotate: 0}} 
            animate={{rotate: 360}} 
            transition={{duration: 20, repeat: Infinity, ease: "linear"}} 
            className="h-20 w-auto mb-6 object-contain" 
          />
          <FileUploader onFileUpload={handleFileUpload} />
        </motion.div>
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
    </div>
  );
};

export default Index;
