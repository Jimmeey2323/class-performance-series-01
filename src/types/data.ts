
export interface ProcessedData {
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  teacherName: string;
  teacherEmail?: string; // Added this field
  date: string;
  period: string;
  totalCheckins: number;
  totalRevenue: number;
  totalCancelled: number;
  totalOccurrences: number;
  totalEmpty: number;
  totalNonEmpty: number;
  totalTime: number;
  totalPayout: number;
  totalTips: number;
  totalNonPaid: number;
  datesOccurred: string[];
  classAverageIncludingEmpty: string | number;
  classAverageExcludingEmpty: string | number;
  uniqueID: string; // Added this field to fix KanbanView errors
}

export interface RawDataRow {
  [key: string]: any;
  'Teacher First Name'?: string;
  'Teacher Last Name'?: string;
  'Teacher Email'?: string;
  'Class name'?: string;
  'Class date'?: string;
  'Location'?: string;
  'Time (h)'?: string;
  'Checked in'?: string | number;
  'Late cancellations'?: string | number;
  'Total Revenue'?: string | number;
  'Checked In Comps'?: string | number;
  'Comps'?: string | number;
  'Non Paid Customers'?: string | number;
}

export type ViewMode = 'table' | 'grid' | 'kanban' | 'timeline' | 'pivot';

export interface FilterOption {
  field: keyof ProcessedData;
  operator: 'contains' | 'equals' | 'starts' | 'ends' | 'greater' | 'less' | 'after' | 'before' | 'on' | 'in';
  value: string;
}

export interface SortOption {
  field: keyof ProcessedData;
  direction: 'asc' | 'desc';
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'donut';
  metric: keyof ProcessedData;
  dimension: keyof ProcessedData;
  title: string;
  color: string;
}

export interface KanbanCardProps {
  data: ProcessedData;
  isActive: boolean;
}

// Add Theme type for theme-provider
export type Theme = 'dark' | 'light' | 'system';
