import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProcessedData } from '@/types/data';
import { useToast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';

interface FileUploaderProps {
  onDataProcessed: (data: ProcessedData[], skipAnimation?: boolean) => void;
  onPreviewStarted: () => void;
  onProcessingStarted: () => void;
  onProcessingProgress: (progress: number) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onDataProcessed, 
  onPreviewStarted, 
  onProcessingStarted,
  onProcessingProgress
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string[]>([]);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [hasHeader, setHasHeader] = useState(true);
  const { toast } = useToast();
  
  const [storedData, setStoredData] = useLocalStorage<ProcessedData[] | null>('class-analytics-data', null);
  const [storedFilename, setStoredFilename] = useLocalStorage<string | null>('class-analytics-filename', null);

  useEffect(() => {
    if (storedData && storedData.length > 0) {
      toast({
        title: "Saved data available",
        description: `Found saved data from "${storedFilename || 'previous session'}". Click "Continue with saved data" to use it.`,
        duration: 6000,
        action: (
          <Button 
            variant="default"
            onClick={() => {
              onDataProcessed(storedData, true);
              toast({
                title: "Data loaded",
                description: `Loaded ${storedData.length} records from saved data.`,
              });
            }}
          >
            Continue with saved data
          </Button>
        ),
      });
    }
  }, [storedData, storedFilename, onDataProcessed, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setLoadingStatus('loading');
      setError('');
      
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const csv = reader.result as string;
          const lines = csv.split('\n').slice(0, 5);
          setPreview(lines);
          setLoadingStatus('success');
        } catch (e) {
          setError('Error reading file: ' + (e instanceof Error ? e.message : String(e)));
          setLoadingStatus('error');
        }
      };
      reader.onerror = () => {
        setError('Error reading file: ' + (reader.error ? reader.error.message : 'Unknown error'));
        setLoadingStatus('error');
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const processFile = () => {
    if (!selectedFile) return;
    
    setProcessingStarted(true);
    onProcessingStarted();
    
    Papa.parse(selectedFile, {
      header: hasHeader,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      step: function(row, parser) {
      },
      complete: function(results) {
        console.info(`Parsed ${results.data.length} rows from CSV`);
        
        if (!results.data.length) {
          setError('The file appears to be empty or invalid');
          setLoadingStatus('error');
          return;
        }
        
        try {
          processData(results.data);
        } catch (e) {
          setError('Error processing data: ' + (e instanceof Error ? e.message : String(e)));
          setLoadingStatus('error');
        }
      },
      error: function(error) {
        setError('Error parsing file: ' + error.message);
        setLoadingStatus('error');
      }
    });
  };

  function cleanClassName(name: string): string {
    if (!name) return 'Unknown';
    
    let cleaned = name
      .replace(/(?:^|\s)(?:Studio|YQ)\s*/gi, '')
      .replace(/\s*(?:, Mumbai|, Bandra|,)$/, '')
      .replace(/\s*\([^)]*\)/g, '')
      .trim();
    
    if (cleaned) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    return cleaned || 'Unknown';
  }

  const processData = (rawData: any[]) => {
    const processedData: ProcessedData[] = [];
    const totalRows = rawData.length;
    
    let structure = {
      class: '',
      day: '',
      time: '',
      location: '',
      teacher: '',
      date: '',
      period: '',
      checked_in: '',
      revenue: '',
      cancelled: ''
    };
    
    const headerRow = rawData[0];
    
    if (hasHeader && headerRow) {
      for (const key in headerRow) {
        const value = String(headerRow[key]).toLowerCase();
        if (value.includes('class') && !value.includes('time')) {
          structure.class = key;
        } else if (value.includes('day')) {
          structure.day = key;
        } else if (value.includes('time')) {
          structure.time = key;
        } else if (value.includes('location') || value.includes('studio')) {
          structure.location = key;
        } else if (value.includes('teacher') || value.includes('instructor')) {
          structure.teacher = key;
        } else if (value.includes('date')) {
          structure.date = key;
        } else if (value.includes('period')) {
          structure.period = key;
        } else if (value.includes('check') || value.includes('attended')) {
          structure.checked_in = key;
        } else if (value.includes('revenue') || value.includes('amount')) {
          structure.revenue = key;
        } else if (value.includes('cancel')) {
          structure.cancelled = key;
        }
      }
    }
    
    const startRow = hasHeader ? 1 : 0;
    
    const uniqueClassDayTimeLocs = new Map();
    
    for (let i = startRow; i < rawData.length; i++) {
      const row = rawData[i];
      
      if (i % 10 === 0) {
        const progress = Math.round((i / totalRows) * 100);
        onProcessingProgress(progress);
      }
      
      if (!row || Object.keys(row).length === 0) continue;
      
      const className = String(row[structure.class] !== undefined ? row[structure.class] : row[0] || '');
      const dayOfWeek = String(row[structure.day] !== undefined ? row[structure.day] : row[1] || '');
      const classTime = String(row[structure.time] !== undefined ? row[structure.time] : row[2] || '');
      const location = String(row[structure.location] !== undefined ? row[structure.location] : row[3] || '');
      const teacherName = String(row[structure.teacher] !== undefined ? row[structure.teacher] : row[4] || '');
      const date = String(row[structure.date] !== undefined ? row[structure.date] : row[5] || '');
      const period = String(row[structure.period] !== undefined ? row[structure.period] : row[6] || '');
      
      const checkedIn = Number(row[structure.checked_in] !== undefined ? row[structure.checked_in] : row[7] || 0);
      const revenue = Number(row[structure.revenue] !== undefined ? row[structure.revenue] : row[8] || 0);
      const cancelled = Number(row[structure.cancelled] !== undefined ? row[structure.cancelled] : row[9] || 0);
      
      const cleanedClass = cleanClassName(className);
      
      const key = `${cleanedClass}-${dayOfWeek}-${classTime}-${location}`;
      
      console.info(`Row ${i}: Key=${key}, CheckedIn=${checkedIn}, Paid=${revenue}, LateCancelled=${cancelled}`);
      
      if (!uniqueClassDayTimeLocs.has(key)) {
        uniqueClassDayTimeLocs.set(key, {
          cleanedClass,
          dayOfWeek,
          classTime,
          location,
          teacherName,
          date,
          period,
          totalCheckins: 0,
          totalRevenue: 0,
          totalCancelled: 0,
          totalOccurrences: 0,
          totalEmpty: 0,
          totalNonEmpty: 0,
          totalTime: 0,
          totalPayout: 0,
          totalTips: 0,
          totalNonPaid: 0,
          datesOccurred: new Set(),
          classAverageIncludingEmpty: 0,
          classAverageExcludingEmpty: 0
        });
      }
      
      const stats = uniqueClassDayTimeLocs.get(key);
      
      stats.totalCheckins += checkedIn;
      stats.totalRevenue += revenue;
      stats.totalCancelled += cancelled;
      stats.totalOccurrences += 1;
      
      if (checkedIn === 0) {
        stats.totalEmpty += 1;
      } else {
        stats.totalNonEmpty += 1;
      }
      
      if (date) {
        stats.datesOccurred.add(date);
      }
      
      if (teacherName && (!stats.teacherName || stats.teacherName === 'Unknown')) {
        stats.teacherName = teacherName;
      }
      
      if (date && (!stats.date || date > stats.date)) {
        stats.date = date;
      }
      
      const timeMatch = classTime.match(/(\d+)\s*min/i);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1], 10);
        stats.totalTime += minutes / 60;
      }
    }
    
    uniqueClassDayTimeLocs.forEach((stats, key) => {
      stats.classAverageIncludingEmpty = stats.totalOccurrences > 0 
        ? (stats.totalCheckins / stats.totalOccurrences).toFixed(1) 
        : 'N/A';
        
      stats.classAverageExcludingEmpty = stats.totalNonEmpty > 0 
        ? (stats.totalCheckins / stats.totalNonEmpty).toFixed(1) 
        : 'N/A';
      
      stats.totalTime = Math.round(stats.totalTime * 10) / 10;
      
      stats.datesOccurred = Array.from(stats.datesOccurred);
      
      processedData.push(stats);
    });
    
    console.info('Generated', processedData.length, 'processed data records');
    
    processedData.sort((a, b) => b.totalCheckins - a.totalCheckins);
    
    setStoredData(processedData);
    setStoredFilename(selectedFile?.name || 'Uploaded file');
    
    onProcessingProgress(100);
    onDataProcessed(processedData);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setLoadingStatus('idle');
    setError('');
    setPreview([]);
    setProcessingStarted(false);
  };

  if (processingStarted) {
    onPreviewStarted();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Class Analytics Data Upload
          </CardTitle>
          <CardDescription>
            Upload your class attendance data in CSV format to analyze trends and metrics
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {storedData && storedData.length > 0 && (
            <Alert className="mb-6 bg-primary/10 border-primary/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Saved data available</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Found saved data with {storedData.length} records from "{storedFilename || 'previous session'}"</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onDataProcessed(storedData, true);
                    toast({
                      title: "Data loaded",
                      description: `Loaded ${storedData.length} records from saved data.`,
                    });
                  }}
                >
                  Use saved data <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        
          {loadingStatus === 'idle' ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors text-center ${
                isDragActive ? 'bg-primary/5 border-primary/50' : 'bg-background border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? 'Drop your file here...'
                      : 'Drag & drop your CSV file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Or click to select a file from your computer
                  </p>
                </div>
                <Button variant="outline" type="button">Browse files</Button>
              </div>
            </div>
          ) : loadingStatus === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-lg">Reading file...</p>
            </div>
          ) : loadingStatus === 'error' ? (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-medium">File loaded successfully: {selectedFile?.name}</p>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="hasHeader" className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="hasHeader"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>File has header row</span>
                </Label>
              </div>
              
              <div className="mt-4 bg-muted/30 border rounded p-4">
                <p className="font-medium mb-2">Preview of first few rows:</p>
                <div className="overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {preview.map((line, i) => (
                      <div 
                        key={i} 
                        className={`py-1 ${i === 0 && hasHeader ? 'font-bold bg-muted/50' : ''}`}
                      >
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {loadingStatus === 'success' ? (
            <>
              <Button variant="outline" onClick={resetUpload}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Upload Different File
              </Button>
              <Button onClick={processFile}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Process File
              </Button>
            </>
          ) : loadingStatus === 'error' ? (
            <Button onClick={resetUpload}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          ) : null}
          
          {storedData && storedData.length > 0 && loadingStatus === 'idle' && (
            <Button 
              variant="default" 
              className="ml-auto" 
              onClick={() => {
                onDataProcessed(storedData, true);
                toast({
                  title: "Data loaded",
                  description: `Loaded ${storedData.length} records from saved data.`,
                });
              }}
            >
              Continue with saved data <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default FileUploader;
