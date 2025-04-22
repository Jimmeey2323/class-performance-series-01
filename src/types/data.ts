
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
  date: string;
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
  totalRevenue: number; // Changed to number for easier formatting
  totalTime: string;
  totalNonPaid: number;
  attendance: number;
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

export type ViewMode = 'table' | 'grid' | 'kanban' | 'timeline' | 'pivot';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'scatter';
  dataKey: keyof ProcessedData;
  labelKey?: keyof ProcessedData;
  title: string;
  showLegend?: boolean;
}

export interface TopBottomClassData {
  cleanedClass: string;
  averageAttendance: number;
  totalOccurrences: number;
  isTopPerformer: boolean;
}

export interface KanbanItem {
  id: string;
  title: string;
  data: ProcessedData;
  avatarUrl?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  content: string;
  data: ProcessedData;
}

export interface PivotData {
  rowField: keyof ProcessedData;
  columnField: keyof ProcessedData;
  valueField: keyof ProcessedData;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max' | 'count-unique';
}

export interface ClassStatsItem {
  key: string;
  dayOfWeek: string;
  classTime: string;
  cleanedClass: string;
  teacherName: string;
  avgAttendance: number;
  totalOccurrences: number;
  totalCheckins: number;
  totalRevenue: number;
}

// For theme toggling
export type Theme = 'light' | 'dark' | 'system';
