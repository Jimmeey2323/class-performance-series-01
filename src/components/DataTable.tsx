
import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { 
  Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Settings, Eye, EyeOff, Layers, Type, Palette, Bookmark,
  BookmarkX, Filter, MapPin, Calendar, BarChart3, Clock,
  ListFilter, User, ListChecks, IndianRupee, LayoutGrid,
  LayoutList, Kanban, LineChart, Download, Sliders
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trainerAvatars } from './Dashboard';
import { formatIndianCurrency } from './MetricsPanel';
import { motion, AnimatePresence } from 'framer-motion';

interface DataTableProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

// Define column type for better type safety
interface ColumnDefinition {
  key: string;
  label: string;
  numeric: boolean;
  currency: boolean;
  iconComponent?: React.ReactNode;
  visible?: boolean;
}

export function DataTable({ data, trainerAvatars }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    teacherName: true,
    location: true,
    cleanedClass: true,
    dayOfWeek: true,
    period: true,
    date: true,
    classTime: true,
    totalCheckins: true,
    totalRevenue: true,
    totalOccurrences: true,
    classAverageIncludingEmpty: true,
    classAverageExcludingEmpty: true,
    totalCancelled: true
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [viewMode, setViewMode] = useState("default");
  const [groupBy, setGroupBy] = useState("class-day-time-location");
  const [tableView, setTableView] = useState("grouped");
  const [rowHeight, setRowHeight] = useState(35);

  // Group data by selected grouping option
  const groupedData = useMemo(() => {
    const getGroupKey = (item: ProcessedData) => {
      switch(groupBy) {
        case "class-day-time-location-trainer":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}|${item.location}|${item.teacherName}`;
        case "class-day-time-location":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}|${item.location}`;
        case "class-day-time":
          return `${item.cleanedClass}|${item.dayOfWeek}|${item.classTime}`;
        case "class-time":
          return `${item.cleanedClass}|${item.classTime}`;
        case "class-day":
          return `${item.cleanedClass}|${item.dayOfWeek}`;
        case "class-location":
          return `${item.cleanedClass}|${item.location}`;
        case "day-time":
          return `${item.dayOfWeek}|${item.classTime}`;
        case "location":
          return `${item.location}`;
        case "trainer":
          return `${item.teacherName}`;
        case "month": {
          const date = item.date;
          const month = date ? new Date(date.split(',')[0]).toLocaleString('default', { month: 'long', year: 'numeric' }) : "Unknown";
          return month;
        }
        case "none":
        default:
          return `row-${data.indexOf(item)}`;
      }
    };

    if (tableView === "flat" || groupBy === "none") {
      return data.map(item => ({
        ...item,
        key: `flat-${data.indexOf(item)}`,
        isChild: true
      }));
    }
    
    const groups: Record<string, any> = {};
    
    data.forEach(item => {
      const groupKey = getGroupKey(item);
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          teacherName: item.teacherName,
          cleanedClass: item.cleanedClass,
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          location: item.location,
          period: item.period,
          date: item.date,
          children: [],
          totalCheckins: 0,
          totalRevenue: 0,
          totalOccurrences: 0,
          totalCancelled: 0,
          totalEmpty: 0,
          totalNonEmpty: 0,
          totalNonPaid: 0,
          totalPayout: 0,
          totalTips: 0
        };
      }
      
      // Add to children array
      groups[groupKey].children.push(item);
      
      // Update metrics
      groups[groupKey].totalCheckins += Number(item.totalCheckins);
      groups[groupKey].totalRevenue += Number(item.totalRevenue);
      groups[groupKey].totalOccurrences += Number(item.totalOccurrences);
      groups[groupKey].totalCancelled += Number(item.totalCancelled || 0);
      groups[groupKey].totalEmpty += Number(item.totalEmpty || 0);
      groups[groupKey].totalNonEmpty += Number(item.totalNonEmpty || 0);
      groups[groupKey].totalNonPaid += Number(item.totalNonPaid || 0);
      groups[groupKey].totalPayout += Number(item.totalPayout || 0);
      groups[groupKey].totalTips += Number(item.totalTips || 0);
    });
    
    // Calculate averages for each group
    Object.values(groups).forEach((group: any) => {
      group.classAverageIncludingEmpty = group.totalOccurrences > 0 
        ? group.totalCheckins / group.totalOccurrences 
        : 0;
        
      group.classAverageExcludingEmpty = group.totalNonEmpty > 0 
        ? group.totalCheckins / group.totalNonEmpty 
        : 0;
    });
    
    return Object.values(groups);
  }, [data, groupBy, tableView]);
  
  // Define grouping options
  const groupingOptions = [
    { id: "class-day-time-location-trainer", label: "Class + Day + Time + Location + Trainer" },
    { id: "class-day-time-location", label: "Class + Day + Time + Location" },
    { id: "class-day-time", label: "Class + Day + Time" },
    { id: "class-time", label: "Class + Time" },
    { id: "class-day", label: "Class + Day" },
    { id: "class-location", label: "Class + Location" },
    { id: "day-time", label: "Day + Time" },
    { id: "location", label: "Location" },
    { id: "trainer", label: "Trainer" },
    { id: "month", label: "Month" },
    { id: "none", label: "No Grouping" }
  ];
  
  // Define view modes
  const viewModes = [
    { id: "default", label: "Default View" },
    { id: "compact", label: "Compact View" },
    { id: "detailed", label: "Detailed View" },
    { id: "financials", label: "Financial Focus" },
    { id: "attendance", label: "Attendance Focus" },
    { id: "trainer", label: "Trainer Focus" },
    { id: "analytics", label: "Analytics View" },
    { id: "all", label: "All Columns" }
  ];

  // Filter the grouped data based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedData;
    
    const searchLower = searchTerm.toLowerCase();
    
    return groupedData.filter((group: any) => {
      // Search in parent row
      const parentMatch = [
        group.teacherName,
        group.cleanedClass,
        group.dayOfWeek,
        group.location,
        group.classTime,
        group.period,
      ].some(field => field && String(field).toLowerCase().includes(searchLower));
      
      if (parentMatch) return true;
      
      // Search in child rows
      if (group.children) {
        return group.children.some((child: ProcessedData) => 
          Object.values(child).some(val => 
            val && typeof val === 'string' && val.toLowerCase().includes(searchLower)
          )
        );
      }
      
      return false;
    });
  }, [groupedData, searchTerm]);
  
  // Apply sorting
  const sortedGroups = useMemo(() => {
    if (!sortConfig) return filteredGroups;
    
    return [...filteredGroups].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      const isNumeric = !isNaN(Number(aValue)) && !isNaN(Number(bValue));
      
      if (isNumeric) {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredGroups, sortConfig]);

  // Pagination
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedGroups.slice(startIndex, startIndex + pageSize);
  }, [sortedGroups, currentPage, pageSize]);
  
  // Get columns based on view mode
  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [
      { key: "cleanedClass", label: "Class Type", iconComponent: <ListChecks className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "dayOfWeek", label: "Day", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "classTime", label: "Time", iconComponent: <Clock className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "location", label: "Location", iconComponent: <MapPin className="h-4 w-4" />, numeric: false, currency: false, visible: true },
    ];
    
    const attendanceColumns: ColumnDefinition[] = [
      { key: "totalOccurrences", label: "Classes", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalEmpty", label: "Empty", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalNonEmpty", label: "Non-empty", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
      { key: "totalCheckins", label: "Checked In", numeric: true, currency: false, iconComponent: <ListChecks className="h-4 w-4" />, visible: true },
      { key: "classAverageIncludingEmpty", label: "Avg. (All)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true },
      { key: "classAverageExcludingEmpty", label: "Avg. (Non-empty)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true }
    ];
    
    const financialColumns: ColumnDefinition[] = [
      { key: "totalRevenue", label: "Revenue", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true },
      { key: "totalCancelled", label: "Late Cancels", numeric: true, currency: false, iconComponent: <Calendar className="h-4 w-4" />, visible: true },
      { key: "totalPayout", label: "Payout", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true },
      { key: "totalTips", label: "Tips", numeric: true, currency: true, iconComponent: <IndianRupee className="h-4 w-4" />, visible: true }
    ];
    
    const detailedColumns: ColumnDefinition[] = [
      { key: "teacherName", label: "Trainer", iconComponent: <User className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "period", label: "Period", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
      { key: "date", label: "Date", iconComponent: <Calendar className="h-4 w-4" />, numeric: false, currency: false, visible: true },
    ];

    switch(viewMode) {
      case "compact":
        return [...baseColumns.slice(0, 2), 
                { key: "classTime", label: "Time", iconComponent: <Clock className="h-4 w-4" />, numeric: false, currency: false, visible: true },
                { key: "totalOccurrences", label: "Classes", numeric: true, currency: false, iconComponent: <ListFilter className="h-4 w-4" />, visible: true },
                { key: "totalCheckins", label: "Checked In", numeric: true, currency: false, iconComponent: <ListChecks className="h-4 w-4" />, visible: true },
                { key: "classAverageIncludingEmpty", label: "Avg. (All)", numeric: true, currency: false, iconComponent: <BarChart3 className="h-4 w-4" />, visible: true },
                financialColumns[0]];
      case "detailed":
        return [...baseColumns, ...attendanceColumns, ...financialColumns, ...detailedColumns];
      case "financials":
        return [...baseColumns.slice(0, 3), financialColumns[0], financialColumns[2], financialColumns[3]];
      case "attendance":
        return [...baseColumns.slice(0, 3), ...attendanceColumns, financialColumns[1]];
      case "trainer":
        return [detailedColumns[0], ...baseColumns.slice(0, 3), attendanceColumns[3], financialColumns[0]];
      case "analytics":
        return [...baseColumns.slice(0, 3), attendanceColumns[4], attendanceColumns[5], financialColumns[0]];
      case "all":
        return [
          ...detailedColumns,
          ...baseColumns, 
          ...attendanceColumns,
          ...financialColumns
        ];
      default:
        return [...baseColumns, ...attendanceColumns.slice(0, 4), financialColumns[0]];
    }
  };

  const columns = getColumns();
  
  // Filter columns based on visibility settings
  const visibleColumns = columns.filter(col => 
    columnVisibility[col.key] !== false
  );
  
  // Toggle row expansion
  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle sort request
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column headers
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
  // Navigate to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedGroups.length / pageSize);
  
  // Reset column visibility
  const resetColumnVisibility = () => {
    setColumnVisibility({
      teacherName: true,
      location: true,
      cleanedClass: true,
      dayOfWeek: true,
      period: true,
      date: true,
      classTime: true,
      totalCheckins: true,
      totalRevenue: true,
      totalOccurrences: true,
      classAverageIncludingEmpty: true,
      classAverageExcludingEmpty: true,
      totalCancelled: true
    });
  };

  // Export data as CSV
  const exportCSV = () => {
    const headers = Object.keys(data[0] || {}).filter(key => key !== 'children' && key !== 'key');
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header as keyof ProcessedData];
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_data_export.csv');
    link.click();
  };
  
  // Format cell values
  const formatCellValue = (key: string, value: any) => {
    if (value === undefined || value === null) return "-";
    
    const column = columns.find(col => col.key === key);
    if (!column) return String(value);
    
    if (column.currency && typeof value === 'number') {
      return formatIndianCurrency(value);
    }
    
    if (column.numeric) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString();
      }
    }
    
    return String(value);
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search in table..."
            className="pl-9 w-full max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Grouping Options */}
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Group By" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Grouping Options</SelectLabel>
                {groupingOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* View Mode */}
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <SelectValue placeholder="View Mode" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>View Mode</SelectLabel>
                {viewModes.map(mode => (
                  <SelectItem key={mode.id} value={mode.id}>{mode.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* Table View */}
          <Tabs value={tableView} onValueChange={setTableView} className="w-[180px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grouped">Grouped</TabsTrigger>
              <TabsTrigger value="flat">Flat</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Customize Table</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Table Customization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Visible Columns</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetColumnVisibility}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {columns.map(col => (
                    <div key={col.key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`column-${col.key}`} 
                        checked={columnVisibility[col.key] !== false} 
                        onCheckedChange={() => toggleColumnVisibility(col.key)}
                      />
                      <Label htmlFor={`column-${col.key}`} className="flex items-center gap-1.5">
                        {col.iconComponent && (
                          <span className="text-muted-foreground">{col.iconComponent}</span>
                        )}
                        {col.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Row Height: {rowHeight}px</h4>
                  <Slider
                    value={[rowHeight]}
                    min={25}
                    max={50}
                    step={1}
                    onValueChange={values => setRowHeight(values[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Items per page</h4>
                  <RadioGroup value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <div className="flex items-center space-x-4">
                      {[5, 10, 25, 50].map(size => (
                        <div key={size} className="flex items-center space-x-2">
                          <RadioGroupItem value={size.toString()} id={`page-${size}`} />
                          <Label htmlFor={`page-${size}`}>{size}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableView === "grouped" && groupBy !== "none" && (
                  <TableHead className="w-[30px]"></TableHead>
                )}
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      "py-3 px-4",
                      column.numeric ? "text-right" : "text-left"
                    )}
                    onClick={() => requestSort(column.key)}
                  >
                    <div className={cn(
                      "flex items-center gap-1.5 cursor-pointer",
                      column.numeric ? "justify-end" : "justify-start"
                    )}>
                      {!column.numeric && column.iconComponent && (
                        <span className="text-muted-foreground">{column.iconComponent}</span>
                      )}
                      <span>{column.label}</span>
                      {column.numeric && column.iconComponent && (
                        <span className="text-muted-foreground">{column.iconComponent}</span>
                      )}
                      {getSortIndicator(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map((group: any) => (
                  <React.Fragment key={group.key}>
                    {/* Parent row */}
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        expandedRows[group.key] && "bg-muted/30"
                      )}
                      onClick={() => toggleRowExpansion(group.key)}
                      style={{ height: `${rowHeight}px` }}
                    >
                      {tableView === "grouped" && groupBy !== "none" && (
                        <TableCell className="py-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            {expandedRows[group.key] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      
                      {visibleColumns.map(column => {
                        if (column.key === 'teacherName') {
                          return (
                            <TableCell key={column.key} className={cn(
                              "py-2", 
                              column.numeric ? "text-right" : "text-left"
                            )}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={trainerAvatars[group.teacherName]} />
                                  <AvatarFallback>{group.teacherName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {group.teacherName}
                              </div>
                            </TableCell>
                          );
                        }
                        
                        if (column.key === 'cleanedClass' && tableView === 'grouped') {
                          return (
                            <TableCell key={column.key} className={cn(
                              "py-2", 
                              column.numeric ? "text-right" : "text-left"
                            )}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-normal">
                                  {group.children?.length || 0}
                                </Badge>
                                {group.cleanedClass}
                              </div>
                            </TableCell>
                          );
                        }
                        
                        if (column.key === 'classAverageIncludingEmpty' || column.key === 'classAverageExcludingEmpty') {
                          const value = group[column.key];
                          return (
                            <TableCell key={column.key} className={cn(
                              "py-2", 
                              column.numeric ? "text-right" : "text-left"
                            )}>
                              {typeof value === 'number' ? value.toFixed(1) : value}
                            </TableCell>
                          );
                        }
                        
                        return (
                          <TableCell key={column.key} className={cn(
                            "py-2", 
                            column.numeric ? "text-right" : "text-left"
                          )}>
                            {formatCellValue(column.key, group[column.key])}
                          </TableCell>
                        );
                      })}
                    </motion.tr>
                    
                    {/* Child rows */}
                    {group.children && expandedRows[group.key] && (
                      <AnimatePresence>
                        {group.children.map((item: ProcessedData, index: number) => (
                          <motion.tr 
                            key={`${group.key}-child-${index}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-muted/10 text-sm"
                            style={{ height: `${rowHeight}px` }}
                          >
                            {tableView === "grouped" && groupBy !== "none" && (
                              <TableCell></TableCell>
                            )}
                            
                            {visibleColumns.map(column => {
                              if (column.key === 'teacherName') {
                                return (
                                  <TableCell key={`child-${column.key}`} className={cn(
                                    "py-2 pl-10", 
                                    column.numeric ? "text-right" : "text-left"
                                  )}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={trainerAvatars[item.teacherName]} />
                                        <AvatarFallback>{item.teacherName?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      {item.teacherName}
                                    </div>
                                  </TableCell>
                                );
                              }
                              
                              if (column.key === 'cleanedClass') {
                                return (
                                  <TableCell key={`child-${column.key}`} className="py-2 pl-10">
                                    <div className="flex items-center gap-2">
                                      <span>{item.cleanedClass}</span>
                                      <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
                                        {item.date ? new Date(item.date.split(',')[0]).toLocaleDateString() : ""}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                );
                              }
                              
                              return (
                                <TableCell key={`child-${column.key}`} className={cn(
                                  "py-2", 
                                  column.numeric ? "text-right" : "text-left"
                                )}>
                                  {formatCellValue(column.key, item[column.key as keyof ProcessedData])}
                                </TableCell>
                              );
                            })}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-10 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => goToPage(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNumber;
              
              // Show pages around current page
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === currentPage}
                    onClick={() => goToPage(pageNumber)}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => goToPage(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        
        <div className="mt-3 text-sm text-center text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, sortedGroups.length)} to {Math.min(currentPage * pageSize, sortedGroups.length)} of {sortedGroups.length} {tableView === "grouped" ? "groups" : "rows"}
        </div>
      </div>
    </div>
  );
}
