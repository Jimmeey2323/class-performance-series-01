
import React, { useState } from 'react';
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
        
        toast({
          title: 'File processed successfully',
          description: `Processed ${processedData.length} records from the file.`,
          duration: 3000,
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
        duration: 5000,
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
  };
  
  const handleLogout = () => {
    navigate('/auth');
  };
  
  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen">
      {!fileUploaded ? (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-screen p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img 
            src="https://i.imgur.com/9mOm7gP.png" 
            alt="Logo" 
            className="h-20 w-auto mb-6"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          <motion.div 
            className="max-w-2xl mx-auto text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Class Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Upload your class data zip file to analyze and visualize your studio's performance.
            </p>
          </motion.div>
          
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
