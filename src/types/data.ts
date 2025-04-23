
export interface RawDataRow {
  'Teacher First Name': string;
  'Teacher Last Name': string;
  'Teacher Email': string;
  'Total time (h)': string;
  'Class name': string;
  'Class date': string;
  'Location': string;
  'Payrate': string;
  'Time (h)': string;
  'Employee Code': string;
  'Payrate Code': string;
  'Customer Name': string;
  'Customer Email': string;
  'Sale Date': string;
  'Checked in': string;
  'Comp': string;
  'Late Cancelled': string;
  'Payment Method': string;
  'Payment Method Name': string;
  'Paid': string;
  'Teacher Payout': string;
}

export interface ProcessedData {
  teacherName: string;
  teacherEmail: string;
  totalTime: number;
  classTime: string;
  location: string;
  cleanedClass: string;
  date: string;
  dayOfWeek: string;
  period: string; // e.g., "Mar-22"
  totalCheckins: number;
  totalOccurrences: number;
  totalRevenue: number | string;
  totalCancelled: number;
  totalEmpty: number;
  totalNonEmpty: number;
  totalNonPaid: number;
  classAverageIncludingEmpty: number | string;
  classAverageExcludingEmpty: number | string;
  uniqueID: string; // For tracking purposes
}

export type ViewMode = 'table' | 'grid' | 'kanban' | 'timeline' | 'pivot';

export interface FilterOption {
  field: keyof ProcessedData;
  operator: string; // 'contains' | 'equals' | 'starts' | 'ends' | 'greater' | 'less'
  value: string;
}

export interface SortOption {
  field: keyof ProcessedData;
  direction: 'asc' | 'desc';
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'donut';
  primaryMetric: keyof ProcessedData;
  groupBy: keyof ProcessedData;
}

export interface MetricData {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
}
