
export interface ClassData {
  'Class name': string;
  'Class date': string;
  'Location': string;
  'Teacher First Name': string;
  'Teacher Last Name': string;
  'Checked in': string;
  'Late cancellations': string;
  'Total Revenue': string;
  'Time (h)': string;
  'Non Paid Customers': string;
}

export interface ProcessedData {
  uniqueID: string;
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  teacherName: string;
  period: string;
  totalOccurrences: number;
  totalCancelled: number;
  totalCheckins: number;
  totalEmpty: number;
  totalNonEmpty: number;
  classAverageIncludingEmpty: string;
  classAverageExcludingEmpty: string;
  totalRevenue: string;
  totalTime: string;
  totalNonPaid: number;
}

export interface FilterOption {
  field: keyof ProcessedData;
  operator: string;
  value: string;
}

export interface SortOption {
  field: keyof ProcessedData;
  direction: 'asc' | 'desc';
}

export interface MetricData {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}
