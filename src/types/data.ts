
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

// Only for the interface, we'll use simple column/row/value structure for the actual data
export interface PivotData {
  rowField: keyof ProcessedData;
  columnField: keyof ProcessedData;
  valueField: keyof ProcessedData;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
}
