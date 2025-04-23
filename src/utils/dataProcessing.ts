
import { ProcessedData, RawDataRow } from "@/types/data";

export function getCleanedClass(sessionName: string): string {
  // Check for specific classes first
  if (/barre 57|barre57/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Barre 57 Express" : "Studio Barre 57";
  } else if (/mat/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Mat 57 Express" : "Studio Mat 57";
  } else if (/Trainer|Trainer's/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Trainer's Choice Express" : "Studio Trainer's Choice";
  } else if (/cardio barre|Studio Cardio/i.test(sessionName)) {
      if (/plus/i.test(sessionName)) {
          return "Studio Cardio Barre Plus";
      } else if (/express/i.test(sessionName)) {
          return "Studio Cardio Barre Express";
      } else {
          return "Studio Cardio Barre";
      }
  } else if (/back body/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Back Body Blaze Express" : "Studio Back Body Blaze";
  } else if (/fit/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio FIT Express" : "Studio FIT";
  } else if (/powercycle/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio powerCycle Express" : "Studio powerCycle";
  } else if (/amped/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Amped Up! Express" : "Studio Amped Up!";
  } else if (/sweat/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio SWEAT In 30 Express" : "Studio SWEAT In 30";
  } else if (/foundation/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Foundations Express" : "Studio Foundations";
  } else if (/recovery/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio Recovery Express" : "Studio Recovery";
  } else if (/pre\/post/i.test(sessionName)) {
      return "Studio Pre/Post Natal";
  } else if (/hiit/i.test(sessionName)) {
      return /express/i.test(sessionName) ? "Studio HIIT Express" : "Studio HIIT";
  }

  // Finally check for hosted classes
  if (/hosted|bridal|lrs|x p57|rugby|wework|olympics|birthday|host|raheja|pop|workshop|community|physique|soundrise|outdoor|p57 x|x/i.test(sessionName)) {
      return "Studio Hosted Class";
  }

  // If no match is found, return the original class name to avoid empty data
  return sessionName;
}

export function extractClassTime(dateTimeStr: string): string {
  try {
    // Format: "2023-04-07, 11:30 AM"
    const parts = dateTimeStr.split(', ');
    if (parts.length > 1) {
      return parts[1].trim();
    }
  } catch (error) {
    console.error('Error extracting class time:', error);
  }
  return '';
}

export function getDayOfWeek(dateStr: string): string {
  try {
    // Format: "2023-04-07, 11:30 AM"
    const parts = dateStr.split(', ');
    const datePart = parts[0].trim();
    
    const date = new Date(datePart);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } catch (error) {
    console.error('Error getting day of week:', error);
    return '';
  }
}

export function getPeriod(dateStr: string): string {
  try {
    // Format: "2023-04-07, 11:30 AM"
    const parts = dateStr.split(', ');
    const datePart = parts[0].trim();
    
    const date = new Date(datePart);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${month}-${year}`;
  } catch (error) {
    console.error('Error getting period:', error);
    return '';
  }
}

export function processRawData(rawData: RawDataRow[]): ProcessedData[] {
  console.log(`Processing ${rawData.length} raw data rows`);
  
  // Create a map to store processed data grouped by key attributes
  const processedDataMap = new Map<string, ProcessedData>();
  const uniqueIds = new Set<string>();

  rawData.forEach((row, index) => {
    try {
      // Extract the necessary data from the row - adapting to the actual field names
      const teacherFirstName = row['Teacher First Name'] || '';
      const teacherLastName = row['Teacher Last Name'] || '';
      const teacherName = `${teacherFirstName} ${teacherLastName}`.trim();
      const teacherEmail = row['Teacher Email'] || '';
      const className = row['Class name'] || '';
      const classDate = row['Class date'] || '';
      const location = row['Location'] || '';
      const totalTime = parseFloat(row['Total time (h)'] || '0');
      const time = parseFloat(row['Time (h)'] || '0');
      
      // Adjust field parsing based on the actual data format
      const checkedIn = row['Checked in'] === 'Yes' ? 1 : 0;
      const lateCancelled = row['Late Cancelled'] === 'Yes' ? 1 : 0;
      const paid = parseFloat(row['Paid'] || '0');
      const comp = row['Comp'] === 'Yes' ? 1 : 0;
      
      // Process class data
      const cleanedClass = getCleanedClass(className) || "Unknown Class";
      const classTime = extractClassTime(classDate);
      const dayOfWeek = getDayOfWeek(classDate);
      const period = getPeriod(classDate);
      
      // Create a unique ID for this class
      const dateOnly = classDate.split(',')[0].trim();
      const uniqueID = `${teacherName}-${cleanedClass}-${dateOnly}-${classTime}-${location}`.replace(/\s+/g, '_');
      
      // Check if we already have an aggregated record for this class
      // Include teacher name in the key to group by instructor as well
      const key = `${cleanedClass}-${dayOfWeek}-${classTime}-${location}-${teacherName}`;
      
      console.log(`Row ${index}: Key=${key}, CheckedIn=${checkedIn}, Paid=${paid}, LateCancelled=${lateCancelled}`);
      
      if (processedDataMap.has(key)) {
        // Update existing record
        const existingRecord = processedDataMap.get(key)!;
        existingRecord.totalCheckins += checkedIn;
        existingRecord.totalCancelled += lateCancelled;
        
        // Convert to number before adding
        const existingRevenue = typeof existingRecord.totalRevenue === 'number' ? 
          existingRecord.totalRevenue : 
          parseFloat(String(existingRecord.totalRevenue || 0));
        
        existingRecord.totalRevenue = existingRevenue + paid;
        existingRecord.totalNonPaid += comp;
        
        // For each unique class occurrence, increment totalOccurrences
        if (!uniqueIds.has(uniqueID)) {
          existingRecord.totalOccurrences += 1;
          uniqueIds.add(uniqueID);
          
          // Update empty/non-empty class counts
          if (checkedIn > 0) {
            existingRecord.totalNonEmpty += 1;
          } else {
            existingRecord.totalEmpty += 1;
          }
        }
      } else {
        // Create new record
        const newRecord: ProcessedData = {
          teacherName,
          teacherEmail,
          totalTime,
          location,
          cleanedClass,
          classTime,
          date: dateOnly,
          dayOfWeek,
          period,
          totalCheckins: checkedIn,
          totalOccurrences: 1,
          totalRevenue: paid,
          totalCancelled: lateCancelled,
          totalEmpty: checkedIn > 0 ? 0 : 1,
          totalNonEmpty: checkedIn > 0 ? 1 : 0,
          totalNonPaid: comp,
          classAverageIncludingEmpty: 0, // Will calculate later
          classAverageExcludingEmpty: 0, // Will calculate later
          uniqueID
        };
        
        processedDataMap.set(key, newRecord);
        uniqueIds.add(uniqueID);
      }
    } catch (error) {
      console.error(`Error processing row ${index}:`, error, 'Row data:', JSON.stringify(row));
    }
  });

  // Convert the map to an array
  const processedData = Array.from(processedDataMap.values());
  
  console.log(`Generated ${processedData.length} processed data records`);
  
  // Calculate averages
  processedData.forEach(record => {
    if (record.totalOccurrences > 0) {
      record.classAverageIncludingEmpty = Number((record.totalCheckins / record.totalOccurrences).toFixed(1));
    } else {
      record.classAverageIncludingEmpty = 'N/A';
    }
    
    if (record.totalNonEmpty > 0) {
      record.classAverageExcludingEmpty = Number((record.totalCheckins / record.totalNonEmpty).toFixed(1));
    } else {
      record.classAverageExcludingEmpty = 'N/A';
    }
    
    // Ensure totalRevenue is a number
    if (typeof record.totalRevenue === 'string') {
      record.totalRevenue = parseFloat(record.totalRevenue) || 0;
    }
  });
  
  return processedData;
}
