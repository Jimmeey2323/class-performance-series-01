
import React, { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import Dashboard from '@/components/Dashboard';
import FileUploader from '@/components/FileUploader';
import { ClassData, ProcessedData, ViewMode } from '@/types/data';
import { processZipFile } from '@/utils/fileProcessing';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<ProcessedData[]>([]);
  const [showUploader, setShowUploader] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

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
        <div className="animate-fade-in mb-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-amber-500" />
            Class Performance & Analytics
            <Sparkles className="h-8 w-8 text-amber-500" />
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Analyze class performance metrics, explore trends, and gain insights to optimize your fitness studio operations
          </p>
        </div>
        
        {showUploader ? (
          <FileUploader onFileUpload={handleFileUpload} />
        ) : (
          <Dashboard 
            data={data} 
            loading={loading} 
            progress={progress} 
            onReset={resetUpload}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
