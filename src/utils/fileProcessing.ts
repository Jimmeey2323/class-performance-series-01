
import { ProcessedData } from '@/types/data';

export const exportToCSV = (data: ProcessedData[]): void => {
  if (!data.length) return;
  
  // Get headers from first item
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header as keyof ProcessedData];
      
      // Handle special types
      if (Array.isArray(value)) {
        return `"${value.join(';')}"`;
      }
      
      // Handle strings that may contain commas, quotes, etc.
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csvRows.push(values.join(','));
  }
  
  // Combine rows into a CSV string
  const csvString = csvRows.join('\n');
  
  // Create a download link
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'class_analytics_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
