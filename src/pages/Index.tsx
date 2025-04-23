import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import Dashboard from '@/components/Dashboard';
import FileUploader from '@/components/FileUploader';
import { ClassData, ProcessedData, ViewMode } from '@/types/data';
import { processZipFile } from '@/utils/fileProcessing';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

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
  const [dataLoaded, setDataLoaded] = useState(false);
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

  // Load saved data from localStorage
  useEffect(() => {
    if (authChecked && (user || adminBypass) && !dataLoaded) {
      const savedData = localStorage.getItem('classAnalyticsData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData) as ProcessedData[];
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setData(parsedData);
            setShowUploader(false);
            setDataLoaded(true);
            toast({
              title: "Loaded saved data",
              description: `Loaded ${parsedData.length} classes from your previous session.`,
              variant: "default",
            });
          }
        } catch (error) {
          console.error("Error loading saved data:", error);
          // If there's an error loading the data, we'll just continue with an empty state
        }
      }
    }
  }, [authChecked, user, adminBypass, dataLoaded]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      // Clear existing data before processing new file
      setData([]);
      localStorage.removeItem('classAnalyticsData');
      setDataLoaded(false);
      
      setLoading(true);
      setProgress(0);
      setShowUploader(false);
      
      console.log("Starting to process new file, cleared existing data");
      
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
          return periodDate <= today; // Include items without period data
        }
        return true;
      });
      
      console.log(`Processed ${filteredData.length} items from file`);
      setData(filteredData);
      
      // Save data to localStorage for future sessions
      localStorage.setItem('classAnalyticsData', JSON.stringify(filteredData));
      
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
    localStorage.removeItem('classAnalyticsData');
    setDataLoaded(false);
    
    toast({
      title: "Data cleared",
      description: "All data has been reset.",
      variant: "default",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminBypass');
    localStorage.removeItem('classAnalyticsData');
    setData([]);
    setDataLoaded(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showUploader ? (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="flex flex-col items-center animate-scale-in">
              <motion.img 
                src="https://i.imgur.com/9mOm7gP.png" 
                alt="Logo" 
                className="h-24 w-auto mb-4 hover:scale-110 transition-all duration-300" 
                initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 360, scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeOut",
                  scale: { duration: 0.5 } 
                }}
              />
              <motion.h1 
                className="text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100 text-center bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 text-transparent"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Class Performance & Analytics
              </motion.h1>
              <motion.div 
                className="flex items-center justify-center mb-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Sparkles className="h-6 w-6 text-amber-500 animate-pulse mr-2" />
                <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Analyze class performance metrics, explore trends, and gain insights
                </p>
                <Sparkles className="h-6 w-6 text-amber-500 animate-pulse ml-2" />
              </motion.div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <FileUploader onFileUpload={handleFileUpload} />
          </motion.div>
        </div>
      ) : (
        <Dashboard 
          data={data} 
          loading={loading} 
          progress={progress} 
          onReset={resetUpload}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default Index;
