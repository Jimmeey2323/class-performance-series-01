
import React, { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import Dashboard from '@/components/Dashboard';
import FileUploader from '@/components/FileUploader';
import { ClassData, ProcessedData } from '@/types/data';
import { processZipFile } from '@/utils/fileProcessing';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<ProcessedData[]>([]);
  const [showUploader, setShowUploader] = useState(true);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setLoading(true);
      setProgress(0);
      setShowUploader(false);
      
      const processedData = await processZipFile(file, (percentage) => {
        setProgress(percentage);
      });
      
      setData(processedData);
      toast({
        title: "Success",
        description: "Data processed successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
      setShowUploader(true);
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setShowUploader(true);
    setData([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-slate-100">
          Data Sculptor UI
        </h1>
        
        {showUploader ? (
          <FileUploader onFileUpload={handleFileUpload} />
        ) : (
          <Dashboard 
            data={data} 
            loading={loading} 
            progress={progress} 
            onReset={resetUpload} 
          />
        )}
      </div>
    </div>
  );
};

export default Index;
