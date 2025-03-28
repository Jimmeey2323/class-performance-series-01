
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import Dashboard from '@/components/Dashboard';
import FileUploader from '@/components/FileUploader';
import { ClassData, ProcessedData, ViewMode } from '@/types/data';
import { processZipFile } from '@/utils/fileProcessing';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<ProcessedData[]>([]);
  const [showUploader, setShowUploader] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecked(true);

      // Check for admin bypass from localStorage (set during login)
      const adminBypass = localStorage.getItem('adminBypass') === 'true';
      setAdminBypass(adminBypass);
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authChecked && !user && !adminBypass) {
      navigate('/auth');
    }
  }, [authChecked, user, adminBypass, navigate]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setLoading(true);
      setProgress(0);
      setShowUploader(false);
      
      const processedData = await processZipFile(file, (percentage) => {
        setProgress(percentage);
      });
      
      // Filter out future dates before setting data
      const today = new Date();
      const filteredData = processedData.filter(item => {
        // Check if the class date is in the past or today
        if (item.period) {
          const [month, year] = item.period.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = months.indexOf(month);
          const fullYear = 2000 + parseInt(year); // Assuming years are in format '22' for 2022
          
          const periodDate = new Date(fullYear, monthIndex);
          return periodDate <= today;
        }
        return true; // Include items without period data
      });
      
      setData(filteredData);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminBypass');
    navigate('/auth');
  };

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-amber-500" />
              Class Performance & Analytics
              <Sparkles className="h-8 w-8 text-amber-500" />
            </h1>
            <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Analyze class performance metrics, explore trends, and gain insights to optimize your fitness studio operations
            </p>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Sign Out
          </button>
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
