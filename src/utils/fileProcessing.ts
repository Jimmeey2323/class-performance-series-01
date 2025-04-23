
import { ProcessedData, RawDataRow } from "@/types/data";
import { processRawData } from "./dataProcessing";

export async function processZipFile(file: File): Promise<ProcessedData[]> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting zip file processing...');
      // Load JSZip dynamically to reduce initial bundle size
      const JSZip = (await import('jszip')).default;
      const Papa = (await import('papaparse')).default;
      
      const zip = new JSZip();
      
      // Read the zip file
      const zipContent = await zip.loadAsync(file);
      
      let foundFile = null;
      let fileName = '';
      
      // Search for the target CSV file in the zip
      const targetFileName = "momence-teachers-payroll-report-aggregate-combined";
      
      console.log('Looking for files matching pattern:', targetFileName);
      
      // Look through all files in the zip
      const filePromises = Object.keys(zipContent.files).map(async (filename) => {
        console.log('Found file in zip:', filename);
        if (filename.toLowerCase().includes(targetFileName.toLowerCase()) && filename.endsWith('.csv')) {
          fileName = filename;
          const fileData = await zipContent.files[filename].async("string");
          return fileData;
        }
        return null;
      });
      
      const results = await Promise.all(filePromises);
      foundFile = results.find(result => result !== null);
      
      if (!foundFile) {
        console.error('No matching file found in zip. Available files:', Object.keys(zipContent.files));
        throw new Error(`Could not find the target file "${targetFileName}" in the uploaded ZIP.`);
      }
      
      console.log(`Found matching file: ${fileName}, parsing CSV data...`);
      
      // Parse CSV content
      Papa.parse(foundFile, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          console.log('CSV parsing complete. Row count:', results.data?.length);
          console.log('CSV headers:', results.meta?.fields);
          
          // Check if we have valid data
          if (results.data && Array.isArray(results.data) && results.data.length > 0) {
            console.log('Sample row:', results.data[0]);
            
            // Log field names to help debugging
            if (results.data[0]) {
              console.log('Available fields in first row:', Object.keys(results.data[0]));
            }
            
            try {
              const processedData = processRawData(results.data as RawDataRow[]);
              console.log(`Processed ${processedData.length} data records`);
              resolve(processedData);
            } catch (error) {
              console.error('Error in processRawData:', error);
              reject(error);
            }
          } else {
            reject(new Error('CSV file is empty or invalid.'));
          }
        },
        error: function(error) {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error processing zip file:', error);
      reject(error);
    }
  });
}

export function exportToCSV(data: ProcessedData[]): void {
  try {
    const Papa = require('papaparse');
    
    // Convert the data to a CSV string
    const csv = Papa.unparse(data);
    
    // Create a blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `class_data_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting CSV:', error);
  }
}
