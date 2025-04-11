import JSZip from 'jszip';
import Papa from 'papaparse';
import { ClassData, ProcessedData } from '@/types/data';

export const processZipFile = async (file: File, onProgress: (progress: number) => void): Promise<ProcessedData[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        try {
          const zip = new JSZip();
          const contents = await zip.loadAsync(event.target.result);
          
          const csvFiles: Promise<string>[] = [];
          const totalFiles = Object.keys(contents.files).length;
          let processedFiles = 0;
          
          Object.keys(contents.files).forEach((filename) => {
            if (filename.includes('aggregate-combined')) {
              csvFiles.push(
                contents.files[filename].async('string').then(content => {
                  processedFiles++;
                  onProgress(Math.round((processedFiles / totalFiles) * 100));
                  return content;
                })
              );
            } else {
              processedFiles++;
              onProgress(Math.round((processedFiles / totalFiles) * 100));
            }
          });
          
          const csvContents = await Promise.all(csvFiles);
          const consolidatedData = consolidateCSVData(csvContents);
          resolve(consolidatedData);
        } catch (error) {
          console.error('Error processing ZIP:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      reject(error);
    }
  });
};

const getMonthYear = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
};

const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { weekday: 'long' });
};

const getTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getCleanedClassName = (className: string): string => {
  className = className.toLowerCase();
  
  if (className.includes('amped')) {
    return 'Studio Amped Up!';
  } else if (
    className.includes('hosted') || 
    className.includes('bridal shower class!') || 
    className.includes('sign up link') || 
    className.includes('hc')
  ) {
    return 'Studio Hosted Class';
  } else if (className.includes('please see pop up @ kitab mahal')) {
    return 'Outdoor Class';
  } else if (className.includes('n/a')) {
    return 'Invalid';
  } else if (className.includes('express') && className.includes('back')) {
    return 'Studio Back Body Blaze Express';
  } else if (!className.includes('express') && className.includes('back')) {
    return 'Studio Back Body Blaze';
  } else if (!className.includes('express') && className.includes('barre 57')) {
    return 'Studio Barre 57';
  } else if (className.includes('express') && className.includes('barre 57')) {
    return 'Studio Barre 57 Express';
  } else if (!className.includes('express') && className.includes('cardio')) {
    return 'Studio Cardio Barre';
  } else if (className.includes('express') && className.includes('cardio')) {
    return 'Studio Cardio Barre Express';
  } else if (!className.includes('express') && className.includes('mat')) {
    return 'Studio Mat 57';
  } else if (className.includes('express') && className.includes('mat')) {
    return 'Studio Mat 57 Express';
  } else if (!className.includes('express') && className.includes('hiit')) {
    return 'Studio HIIT';
  } else if (className.includes('express') && className.includes('hiit')) {
    return 'Studio HIIT Express';
  } else if (!className.includes('express') && className.includes('foundation')) {
    return 'Studio Foundations';
  } else if (className.includes('express') && className.includes('foundation')) {
    return 'Studio Foundations Express';
  } else if (!className.includes('express') && className.includes('fit')) {
    return 'Studio FIT';
  } else if (className.includes('express') && className.includes('fit')) {
    return 'Studio FIT Express';
  } else if (!className.includes('express') && className.includes('trainer')) {
    return 'Studio Trainers Choice';
  } else if (className.includes('express') && className.includes('trainer')) {
    return 'Studio Trainers Choice Express';
  } else if (className.includes('sweat')) {
    return 'Studio Sweat in 30';
  } else if (className.includes('recovery')) {
    return 'Studio Recovery';
  } else if (
    className.includes('p57 x') || 
    className.includes('physique 57 x') || 
    className.includes('x physique 57') || 
    className.includes('birthday') || 
    className.includes('sundowner') || 
    className.includes('bridal')
  ) {
    return 'Studio Hosted Class';
  } else if (className.includes('powercycle') && className.includes('express')) {
    return 'Studio powerCycle Express';
  } else if (className.includes('powercycle')) {
    return 'Studio powerCycle';
  } else if (
    className.includes('studio pre/post natal class') ||
    className.includes('olympics finale') ||
    className.includes('pop up class at raheja vivarea') ||
    className.includes('bangalore rugby club x physique 57')
  ) {
    return 'Others';
  } else if (className.includes('flex 30 single class')) {
    return 'Flex 30 Single Class';
  } else if (className.includes('studio 1 month unlimited')) {
    return 'Studio 1 Month Unlimited';
  } else if (className.includes('studio 8 class package')) {
    return 'Studio 8 Class Package';
  } else if (className.includes('studio single class')) {
    return 'Studio Single Class';
  } else if (className.includes('studio 12 class package')) {
    return 'Studio 12 Class Package';
  } else if (className.includes('studio 4 class package')) {
    return 'Studio 4 Class Package';
  } else if (className.includes('studio open barre class')) {
    return 'Studio Open Barre Class';
  } else if (className.includes('studio 2 week unlimited')) {
    return 'Studio 2 Week Unlimited';
  } else if (className.includes('studio complimentary class')) {
    return 'Studio Complimentary Class';
  } else if (className.includes('studio free influencer class')) {
    return 'Studio Free Influencer Class';
  } else if (className.includes('studio newcomers 2 week unlimited')) {
    return 'Studio Newcomers 2 Week Unlimited';
  } else if (className.includes('studio annual unlimited')) {
    return 'Studio Annual Unlimited';
  } else if (className.includes('outdoor complimentary class')) {
    return 'Outdoor Complimentary Class';
  } else if (className.includes('studio community barre')) {
    return 'Studio Community Barre';
  } else if (className.includes('sunrise class')) {
    return 'SUNRISE CLASS';
  } else if (className.includes('virtual private apt')) {
    return 'Virtual Private Apt';
  } else if (className.includes('studio private apt')) {
    return 'Studio Private Apt';
  } else if (className.includes('open barre complimentary class')) {
    return 'OPEN BARRE CLASS';
  } else if (className.includes('ff class test')) {
    return 'FF CLASS TEST';
  } else if (className.includes('open barre class')) {
    return 'OPEN BARRE CLASS';
  }
  
  return 'Uncategorized';
};

const consolidateCSVData = (csvContents: string[]): ProcessedData[] => {
    const consolidatedData: ProcessedData[] = [];
    const uniqueData: Record<string, any> = {};
    
    csvContents.forEach(content => {
        const parsedData = Papa.parse(content, { header: true }).data as ClassData[];
        
        parsedData.forEach(row => {
            if (!row['Class name']) return;
            
            const className = row['Class name'];
            const classDate = row['Class date'];
            const location = row['Location'];
            const teacherFirstName = row['Teacher First Name'];
            const teacherLastName = row['Teacher Last Name'];
            const checkedIn = parseInt(row['Checked in']) || 0;
            const lateCancelled = parseInt(row['Late cancellations']) || 0;
            const totalRevenue = parseFloat(row['Total Revenue']) || 0;
            const totalTime = parseFloat(row['Time (h)']) || 0;
            const totalNonPaid = parseInt(row['Non Paid Customers']) || 0;
            
            const dayOfWeek = getDayOfWeek(classDate);
            const classTime = getTime(classDate);
            const period = getMonthYear(classDate);
            const cleanedClass = getCleanedClassName(className);
            
            const uniqueID = `${cleanedClass}-${dayOfWeek}-${classTime}`;
            
            if (!uniqueData[uniqueID]) {
                uniqueData[uniqueID] = {
                    cleanedClass,
                    dayOfWeek,
                    classTime,
                    location,
                    teacherName: `${teacherFirstName} ${teacherLastName}`,
                    period,
                    classDate, // Add classDate to the uniqueData object
                    totalOccurrences: 0,
                    totalCancelled: 0,
                    totalCheckins: 0,
                    totalEmpty: 0,
                    totalLateCancelled: 0,
                    totalRevenue: 0,
                    totalTime: 0,
                    totalNonPaid: 0
                };
            }
            
            uniqueData[uniqueID].totalOccurrences++;
            uniqueData[uniqueID].totalCancelled += lateCancelled;
            uniqueData[uniqueID].totalCheckins += checkedIn;
            uniqueData[uniqueID].totalEmpty += checkedIn === 0 ? 1 : 0;
            uniqueData[uniqueID].totalLateCancelled += lateCancelled;
            uniqueData[uniqueID].totalRevenue += totalRevenue;
            uniqueData[uniqueID].totalTime += totalTime;
            uniqueData[uniqueID].totalNonPaid += totalNonPaid;
        });
    });
    
    for (const uniqueID in uniqueData) {
        const data = uniqueData[uniqueID];
        const totalNonEmpty = data.totalOccurrences - data.totalEmpty;
        const classAverageIncludingEmpty = (data.totalCheckins / data.totalOccurrences).toFixed(1);
        const classAverageExcludingEmpty = totalNonEmpty > 0 ? (data.totalCheckins / totalNonEmpty).toFixed(1) : 'N/A';
        
        consolidatedData.push({
            uniqueID,
            cleanedClass: data.cleanedClass,
            dayOfWeek: data.dayOfWeek,
            classTime: data.classTime,
            location: data.location,
            teacherName: data.teacherName,
            period: data.period,
            totalOccurrences: data.totalOccurrences,
            totalCancelled: data.totalCancelled,
            totalCheckins: data.totalCheckins,
            totalEmpty: data.totalEmpty,
            totalNonEmpty: totalNonEmpty,
            classAverageIncludingEmpty: classAverageIncludingEmpty,
            classAverageExcludingEmpty: classAverageExcludingEmpty,
            totalRevenue: data.totalRevenue.toFixed(2),
            totalTime: data.totalTime.toFixed(2),
            totalNonPaid: data.totalNonPaid,
            date: new Date(data.classDate).toISOString(), // Use actual class date from uniqueData
            attendance: data.totalCheckins // Add the required 'attendance' property
        });
    }
    
    return consolidatedData;
};

export const exportToCSV = (data: ProcessedData[]): void => {
  let csvContent = 'Unique ID,Cleaned Class,Day of the Week,Class Time,Location,Trainer Name,Period,Total Occurrences,Total Cancelled,Total Checkins,Total Empty,Total Non-Empty,Class Average (Including Empty),Class Average (Excluding Empty),Total Revenue,Total Time,Total Non-Paid,Date\n';
  
  data.forEach(row => {
    csvContent += `${row.uniqueID},${row.cleanedClass},${row.dayOfWeek},${row.classTime},${row.location},${row.teacherName},${row.period},${row.totalOccurrences},${row.totalCancelled},${row.totalCheckins},${row.totalEmpty},${row.totalNonEmpty},${row.classAverageIncludingEmpty},${row.classAverageExcludingEmpty},${row.totalRevenue},${row.totalTime},${row.totalNonPaid},${row.date}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'consolidated_data.csv';
  a.click();
  URL.revokeObjectURL(url);
};
