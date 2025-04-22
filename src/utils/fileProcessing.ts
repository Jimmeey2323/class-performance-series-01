
import JSZip from 'jszip';
import Papa from 'papaparse';
import { ClassData, ProcessedData } from '@/types/data';

export const processZipFile = async (
  zipFile: File,
  onProgress: (progress: number) => void
): Promise<ProcessedData[]> => {
  try {
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(zipFile);
    
    // Find the CSV file with the specific name
    const csvFiles = Object.keys(zipContents.files).filter(
      filename => filename.endsWith(".csv") && filename.includes("momence-teachers-payroll-report-aggregate-combined")
    );
    
    if (csvFiles.length === 0) {
      throw new Error("No matching CSV file found in the ZIP archive");
    }
    
    // Get the first matching CSV file
    const csvFile = csvFiles[0];
    const csvContent = await zipContents.files[csvFile].async("string");
    
    // Parse CSV data
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log("Raw CSV data loaded:", results.data.length, "rows");
            const rawData = results.data as ClassData[];
            
            // Start processing the data
            const cleanedData = processRawData(rawData, onProgress);
            resolve(cleanedData);
          } catch (error) {
            console.error("Error processing CSV data:", error);
            reject(error);
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error processing ZIP file:", error);
    throw error;
  }
};

// Helper function to clean class names
const cleanClassName = (className: string): string => {
  // Remove trailing numbers and clean up the string
  return className
    .replace(/\s+\d+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Process the raw CSV data into the format needed for the application
const processRawData = (
  data: ClassData[],
  onProgress: (progress: number) => void
): ProcessedData[] => {
  const totalRows = data.length;
  let processedRows = 0;
  const processedData: ProcessedData[] = [];
  
  // Group data by class name, day, time, etc.
  const groupedData: Record<string, ClassData[]> = {};
  
  // First pass - group data
  data.forEach((row, index) => {
    // Skip rows with missing essential data
    if (!row.class_name || !row.day_of_week || !row.class_time) {
      processedRows++;
      onProgress(Math.round((processedRows / totalRows) * 100));
      return;
    }
    
    // Create a unique key for grouping
    const cleanedClassName = cleanClassName(row.class_name);
    const key = `${row.day_of_week}-${row.class_time}-${cleanedClassName}-${row.teacher_name}`;
    
    if (!groupedData[key]) {
      groupedData[key] = [];
    }
    
    groupedData[key].push(row);
    
    processedRows++;
    if (index % 10 === 0) { // Update progress every 10 rows for performance
      onProgress(Math.round((processedRows / totalRows) * 50)); // First pass is 0-50%
    }
  });
  
  // Reset counter for second pass
  processedRows = 0;
  
  // Second pass - aggregate data for each group
  Object.keys(groupedData).forEach((key, index) => {
    const group = groupedData[key];
    const firstItem = group[0];
    
    // Parse date information for period sorting
    const periodMatch = firstItem.period?.match(/([A-Za-z]{3})-(\d{2})/);
    const period = periodMatch ? firstItem.period : 'Unknown';
    
    // Skip empty or invalid groups
    if (!firstItem.class_name || !firstItem.day_of_week || !firstItem.class_time) {
      processedRows++;
      onProgress(50 + Math.round((processedRows / Object.keys(groupedData).length) * 50));
      return;
    }
    
    // Calculate aggregates
    const totalCheckins = group.reduce((sum, item) => sum + (item.total_check_ins || 0), 0);
    const totalOccurrences = group.reduce((sum, item) => sum + (item.occurrences || 0), 0);
    const totalTime = group.reduce((sum, item) => sum + (parseFloat(item.total_time) || 0), 0);
    const totalRevenue = group.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const totalCancelled = group.reduce((sum, item) => sum + (item.cancelled || 0), 0);
    const totalEmpty = group.reduce((sum, item) => sum + (item.is_empty || 0), 0);
    const totalNonPaid = group.reduce((sum, item) => sum + (item.total_non_paid || 0), 0);
    
    // Calculate weighted average (account for occurrences)
    let weightedSum = 0;
    let weightedCount = 0;
    
    group.forEach(item => {
      if (item.occurrences && item.average_excluding_empty) {
        weightedSum += item.occurrences * item.average_excluding_empty;
        weightedCount += item.occurrences;
      }
    });
    
    const classAverageExcludingEmpty = weightedCount > 0 
      ? (weightedSum / weightedCount).toFixed(2) 
      : "0";
    
    // Push the aggregated data
    processedData.push({
      id: key,
      period: period,
      cleanedClass: cleanClassName(firstItem.class_name),
      rawClassName: firstItem.class_name,
      dayOfWeek: firstItem.day_of_week,
      classTime: firstItem.class_time,
      teacherName: firstItem.teacher_name,
      totalCheckins: totalCheckins,
      totalOccurrences: totalOccurrences,
      totalTime: totalTime,
      totalRevenue: totalRevenue,
      totalCancelled: totalCancelled,
      totalEmpty: totalEmpty,
      totalNonPaid: totalNonPaid,
      classAverageExcludingEmpty: classAverageExcludingEmpty,
      occurrencesList: group.map(item => item.occurrences || 0)
    });
    
    processedRows++;
    if (index % 5 === 0) { // Update progress every 5 groups for performance
      onProgress(50 + Math.round((processedRows / Object.keys(groupedData).length) * 50)); // Second pass is 50-100%
    }
  });
  
  onProgress(100); // Ensure progress reaches 100% at the end
  
  return processedData;
};

// Helper function to export data as CSV
export const exportToCSV = (data: any[]) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }
  
  const csvData = Papa.unparse(data);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', 'class_analytics_export.csv');
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
