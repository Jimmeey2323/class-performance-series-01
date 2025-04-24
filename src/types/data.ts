
export interface ProcessedData {
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  teacherName: string;
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
