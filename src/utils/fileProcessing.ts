
import JSZip from 'jszip';
import Papa from 'papaparse';
import { ProcessedData } from '@/types/data';

// Process a large CSV file
export const processCSV = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        resolve(results.data as string[][]);
      },
      error: (error) => {
        reject(error);
      },
      step: (results, parser) => {
        if (onProgress) {
          const progress = Math.min(100, Math.round((parser.streamer.counter / file.size) * 100));
          onProgress(progress);
        }
      },
      worker: true, // Use a worker thread to avoid UI blocking
    });
  });
};

// Extract and process ZIP files 
export const handleZipFile = async (
  zipFile: File,
  onProgress?: (progress: number) => void
): Promise<string[][] | null> => {
  try {
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(zipFile);
    
    // Look for a CSV file with a specific pattern in the filename
    const targetPattern = 'momence-teachers-payroll-report-aggregate-combined';
    const csvFile =  Object.keys(zipContents.files).find(fileName => 
      fileName.toLowerCase().includes(targetPattern) && 
      fileName.toLowerCase().endsWith('.csv')
    );
    
    if (!csvFile) {
      console.error('No matching CSV file found in the ZIP archive');
      return null;
    }
    
    const csvContent = await zipContents.files[csvFile].async('string');
    const parsedData = Papa.parse(csvContent, { header: false }).data as string[][];
    
    if (onProgress) {
      onProgress(100);
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    return null;
  }
};

// Process raw data into structured format
export const processData = (rawData: string[][]): ProcessedData[] => {
  // Skip header row
  const dataRows = rawData.slice(1);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const processedData: ProcessedData[] = [];
  
  // Group data by period and class type
  console.info(`Processing ${dataRows.length} rows of data...`);
  
  // Process each row in the data
  dataRows.forEach((row, index) => {
    if (row.length < 8) return; // Skip incomplete rows
    
    try {
      // Extract location and class type from the combined field
      const combinedClass = row[0] || '';
      const classParts = combinedClass.split('-');
      
      if (classParts.length < 4) return; // Skip malformed data
      
      const cleanedClass = classParts[1] ? classParts[1].trim() : '';
      const dayOfWeek = classParts[2] ? classParts[2].trim() : '';
      const classTime = classParts[3] ? classParts[3].trim() : '';
      
      // Extract location
      const locationParts = classParts.length > 4 ? classParts[4].split(',') : '';
      const location = locationParts && locationParts.length > 0 
        ? locationParts[0].trim() : '';
      
      // Extract teacher name (which may contain commas)
      const teacherName = classParts.length > 5
        ? classParts.slice(5).join('-').trim()
        : '';
      
      // Extract other fields
      const checkedIn = row[1] ? parseInt(row[1], 10) : 0;
      const paid = row[2] ? parseFloat(row[2]) : 0;
      const lateCancelled = row[3] ? parseInt(row[3], 10) : 0;
      const period = row[4] ? row[4].trim() : '';
      const date = row[5] ? row[5].trim() : '';
      const payout = row[6] ? parseFloat(row[6]) : 0;
      const tips = row[7] ? parseFloat(row[7]) : 0;
      
      // Process date to determine day of week if not provided
      let calculatedDayOfWeek = dayOfWeek;
      if (!daysOfWeek.includes(calculatedDayOfWeek) && date) {
        const dateObj = new Date(date.split(',')[0]);
        if (!isNaN(dateObj.getTime())) {
          calculatedDayOfWeek = daysOfWeek[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
        }
      }
      
      // Create record with processed data
      const record: ProcessedData = {
        cleanedClass,
        dayOfWeek: calculatedDayOfWeek,
        classTime,
        location,
        teacherName,
        totalCheckins: checkedIn,
        totalRevenue: paid,
        totalCancelled: lateCancelled,
        period,
        date,
        totalPayout: payout,
        totalTips: tips,
        totalOccurrences: 1, // Each row represents one class occurrence
        totalEmpty: checkedIn === 0 ? 1 : 0,
        totalNonEmpty: checkedIn > 0 ? 1 : 0,
        totalNonPaid: checkedIn - (paid > 0 ? 1 : 0),
        classAverageIncludingEmpty: checkedIn,
        classAverageExcludingEmpty: checkedIn > 0 ? checkedIn : 'N/A',
        totalTime: classTime.includes('Express') ? 0.5 : 1, // Assuming Express classes are half-hour
      };
      
      processedData.push(record);
      console.info(`Row ${index + 1}: Key=${combinedClass}, CheckedIn=${checkedIn}, Paid=${paid}, LateCancelled=${lateCancelled}`);
    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
    }
  });
  
  console.info(`Generated ${processedData.length} processed data records`);
  console.info(`Processed ${processedData.length} data records`);
  
  return processedData;
};

// Export data to CSV
export const exportToCSV = (data: ProcessedData[]) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const val = row[header as keyof ProcessedData];
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'class_analytics_export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};
