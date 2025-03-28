
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Type,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DataTableProps {
  data: ProcessedData[];
}

type TableView = 'comfortable' | 'compact';
type TableTheme = 'default' | 'striped' | 'bordered' | 'elegant';

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<keyof ProcessedData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Array<keyof ProcessedData>>([
    'cleanedClass', 'dayOfWeek', 'classTime', 'location', 'teacherName', 'period',
    'totalOccurrences', 'totalCheckins', 'classAverageIncludingEmpty', 'totalRevenue'
  ]);
  const [rowHeight, setRowHeight] = useState(50); // Default row height
  const [fontSize, setFontSize] = useState(14); // Default font size
  const [tableView, setTableView] = useState<TableView>('comfortable');
  const [showIcons, setShowIcons] = useState(true);
  const [tableTheme, setTableTheme] = useState<TableTheme>('default');

  // All possible columns
  const allColumns: Array<{ key: keyof ProcessedData; label: string }> = [
    { key: 'cleanedClass', label: 'Class' },
    { key: 'dayOfWeek', label: 'Day' },
    { key: 'classTime', label: 'Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
    { key: 'totalOccurrences', label: 'Occurrences' },
    { key: 'totalCancelled', label: 'Cancelled' },
    { key: 'totalCheckins', label: 'Check-ins' },
    { key: 'totalEmpty', label: 'Empty Classes' },
    { key: 'totalNonEmpty', label: 'Non-Empty' },
    { key: 'classAverageIncludingEmpty', label: 'Avg. (All)' },
    { key: 'classAverageExcludingEmpty', label: 'Avg. (Non-Empty)' },
    { key: 'totalRevenue', label: 'Revenue (₹)' },
    { key: 'totalTime', label: 'Hours' },
    { key: 'totalNonPaid', label: 'Non-Paid' },
  ];

  // Filter data based on search query
  const filteredData = data.filter(item => {
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(
      value => value && String(value).toLowerCase().includes(query)
    );
  });

  // Sort data based on sort field and direction
  const sortedData = React.useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      // Determine if the values are numeric
      const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
      
      let comparison = 0;
      if (isNumeric) {
        comparison = Number(valueA) - Number(valueB);
      } else {
        comparison = String(valueA).localeCompare(String(valueB));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Calculate pagination
  const pageCount = Math.ceil(sortedData.length / pageSize);
  const startIndex = pageIndex * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Toggle column visibility
  const toggleColumnVisibility = (key: keyof ProcessedData) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(col => col !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  const toggleRowExpand = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handlePreviousPage = () => {
    setPageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPageIndex(prev => Math.min(pageCount - 1, prev + 1));
  };

  const handleSort = (key: keyof ProcessedData) => {
    if (sortField === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: string) => {
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const renderCellValue = (row: ProcessedData, key: keyof ProcessedData) => {
    if (key === 'totalRevenue') {
      return formatCurrency(String(row[key]));
    }
    
    if (key === 'teacherName' && showIcons) {
      // Get initials for the avatar
      const initials = row.teacherName
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      // Generate a color for the avatar
      const hash = row.teacherName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = [
        'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
        'bg-cyan-500', 'bg-sky-500'
      ];
      const avatarColor = colors[hash % colors.length];
      
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className={`text-xs text-white ${avatarColor}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span>{row[key]}</span>
        </div>
      );
    }
    
    return String(row[key]);
  };
  
  // Get the table CSS classes based on theme
  const getTableClasses = () => {
    let baseClasses = "w-full";
    
    if (tableTheme === 'striped') {
      baseClasses += " [&_tr:nth-child(odd)]:bg-slate-50 dark:[&_tr:nth-child(odd)]:bg-slate-900/20";
    } else if (tableTheme === 'bordered') {
      baseClasses += " [&_td]:border [&_th]:border [&_td]:border-slate-200 [&_th]:border-slate-200 dark:[&_td]:border-slate-700 dark:[&_th]:border-slate-700";
    } else if (tableTheme === 'elegant') {
      baseClasses += " [&_thead]:bg-indigo-50 [&_thead_th]:text-indigo-700 dark:[&_thead]:bg-indigo-900/30 dark:[&_thead_th]:text-indigo-300";
    }
    
    return baseClasses;
  };
  
  // Row height style based on the view mode and custom setting
  const getRowStyle = () => {
    const height = tableView === 'compact' ? Math.max(30, rowHeight - 10) : rowHeight;
    return {
      height: `${height}px`,
      fontSize: `${fontSize}px`
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data across all columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Customize Table
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Table Customization</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <Eye className="h-4 w-4" />
                  Column Visibility
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {allColumns.map(column => (
                    <div key={column.key as string} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`column-${column.key}`} 
                        checked={visibleColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumnVisibility(column.key)}
                      />
                      <label
                        htmlFor={`column-${column.key}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Layers className="h-4 w-4" />
                    Row Height
                  </h4>
                  <div className="px-1">
                    <Slider 
                      defaultValue={[rowHeight]} 
                      min={30} 
                      max={80} 
                      step={5}
                      onValueChange={(value) => setRowHeight(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Compact</span>
                      <span>Comfortable</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <h4 className="font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Type className="h-4 w-4" />
                    Font Size
                  </h4>
                  <div className="px-1">
                    <Slider 
                      defaultValue={[fontSize]} 
                      min={10} 
                      max={18} 
                      step={1}
                      onValueChange={(value) => setFontSize(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <h4 className="font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Palette className="h-4 w-4" />
                    Display Options
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Table View</Label>
                      <RadioGroup 
                        defaultValue={tableView}
                        onValueChange={(value) => setTableView(value as TableView)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="comfortable" id="comfortable" />
                          <Label htmlFor="comfortable">Comfortable</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="compact" id="compact" />
                          <Label htmlFor="compact">Compact</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Table Theme</Label>
                      <RadioGroup 
                        defaultValue={tableTheme}
                        onValueChange={(value) => setTableTheme(value as TableTheme)}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="default" id="default" />
                          <Label htmlFor="default">Default</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="striped" id="striped" />
                          <Label htmlFor="striped">Striped</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bordered" id="bordered" />
                          <Label htmlFor="bordered">Bordered</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="elegant" id="elegant" />
                          <Label htmlFor="elegant">Elegant</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-icons" 
                        checked={showIcons}
                        onCheckedChange={(checked) => setShowIcons(checked as boolean)}
                      />
                      <Label htmlFor="show-icons">Show Icons & Avatars</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="default">Apply Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <div className="overflow-x-auto">
          <Table className={getTableClasses()}>
            <TableHeader className={cn(
              "bg-slate-100 dark:bg-slate-800 sticky top-0",
              tableTheme === 'elegant' && "bg-indigo-50 dark:bg-indigo-900/30"
            )}>
              <TableRow>
                <TableHead className="w-14 p-2"></TableHead> {/* Expand button column */}
                {visibleColumns.map((key) => {
                  const column = allColumns.find(col => col.key === key);
                  return column ? (
                    <TableHead 
                      key={column.key as string} 
                      className={cn(
                        "font-semibold text-xs uppercase whitespace-nowrap px-6 py-4 cursor-pointer min-w-[120px]",
                        tableTheme === 'elegant' && "text-indigo-700 dark:text-indigo-300"
                      )}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {sortField === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : null}
                      </div>
                    </TableHead>
                  ) : null;
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <TableRow 
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors",
                        expandedRows[row.uniqueID] && "bg-slate-50 dark:bg-slate-900/75",
                        tableTheme === 'striped' && rowIndex % 2 === 0 && "bg-slate-50/50 dark:bg-slate-900/20"
                      )}
                      style={getRowStyle()}
                    >
                      <TableCell className="w-14 p-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => toggleRowExpand(row.uniqueID)}
                        >
                          {expandedRows[row.uniqueID] ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </TableCell>
                      {visibleColumns.map((key) => (
                        <TableCell 
                          key={`${rowIndex}-${key}`} 
                          className="py-3 px-6 whitespace-nowrap"
                        >
                          {renderCellValue(row, key)}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Expanded row details */}
                    {expandedRows[row.uniqueID] && (
                      <TableRow className="bg-slate-50 dark:bg-slate-900/30">
                        <TableCell colSpan={visibleColumns.length + 1} className="p-6">
                          <div className="space-y-6">
                            <h4 className="text-lg font-medium border-b pb-2">Class Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Class Type</p>
                                <p className="text-base font-semibold">{row.cleanedClass}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Schedule</p>
                                <p className="text-base font-semibold">{row.dayOfWeek} at {row.classTime}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Location</p>
                                <p className="text-base font-semibold">{row.location}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Instructor</p>
                                <p className="text-base font-semibold flex items-center gap-2">
                                  {showIcons && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs text-white bg-indigo-500">
                                        {row.teacherName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  {row.teacherName}
                                </p>
                              </div>
                            </div>
                            
                            <h4 className="text-lg font-medium border-b pb-2 mt-4">Performance Metrics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Total Occurrences</p>
                                <p className="text-xl font-bold">{row.totalOccurrences}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Total Check-ins</p>
                                <p className="text-xl font-bold">{row.totalCheckins}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Avg. Attendance (All)</p>
                                <p className="text-xl font-bold">{row.classAverageIncludingEmpty}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Avg. Attendance (Non-Empty)</p>
                                <p className="text-xl font-bold">{row.classAverageExcludingEmpty}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-xl font-bold">{formatCurrency(String(row.totalRevenue))}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Empty Classes</p>
                                <p className="text-xl font-bold">{row.totalEmpty}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Non-Paid Customers</p>
                                <p className="text-xl font-bold">{row.totalNonPaid}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Total Time (Hours)</p>
                                <p className="text-xl font-bold">{parseFloat(String(row.totalTime)).toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-48 text-center">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white dark:bg-gray-950">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePreviousPage} 
                    disabled={pageIndex === 0}
                    className="w-8 h-8 p-0"
                  >
                    <PaginationPrevious className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                  let pageNumber = pageIndex;
                  if (pageCount <= 5) {
                    pageNumber = i;
                  } else if (pageIndex < 3) {
                    pageNumber = i;
                  } else if (pageIndex > pageCount - 4) {
                    pageNumber = pageCount - 5 + i;
                  } else {
                    pageNumber = pageIndex - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <Button
                        variant={pageNumber === pageIndex ? "default" : "outline"}
                        size="icon"
                        className="w-8 h-8 p-0"
                        onClick={() => setPageIndex(pageNumber)}
                      >
                        {pageNumber + 1}
                      </Button>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleNextPage} 
                    disabled={pageIndex === pageCount - 1}
                    className="w-8 h-8 p-0"
                  >
                    <PaginationNext className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
