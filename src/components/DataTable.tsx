
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
import { Search, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: ProcessedData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Filter data based on search query
  const filteredData = data.filter(item => {
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(
      value => value && String(value).toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const pageCount = Math.ceil(filteredData.length / pageSize);
  const startIndex = pageIndex * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Column definitions
  const columns: Array<{ key: keyof ProcessedData; label: string }> = [
    { key: 'cleanedClass', label: 'Class' },
    { key: 'dayOfWeek', label: 'Day' },
    { key: 'classTime', label: 'Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' },
    { key: 'totalOccurrences', label: 'Occurrences' },
    { key: 'totalCheckins', label: 'Check-ins' },
    { key: 'classAverageIncludingEmpty', label: 'Avg. Attendance (All)' },
    { key: 'classAverageExcludingEmpty', label: 'Avg. Attendance (Non-Empty)' },
    { key: 'totalRevenue', label: 'Revenue (₹)' },
  ];

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

  const formatCurrency = (value: string) => {
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const renderCellValue = (row: ProcessedData, key: keyof ProcessedData) => {
    if (key === 'totalRevenue') {
      return formatCurrency(String(row[key]));
    }
    return String(row[key]);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100 dark:bg-slate-800">
              <TableRow>
                <TableHead className="w-10"></TableHead> {/* Expand button column */}
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-semibold text-xs uppercase">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <TableRow 
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors",
                        expandedRows[row.uniqueID] && "bg-slate-50 dark:bg-slate-900/75"
                      )}
                    >
                      <TableCell className="w-10 p-2">
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
                      {columns.map((column) => (
                        <TableCell key={`${rowIndex}-${column.key}`} className="py-3">
                          {renderCellValue(row, column.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Expanded row details */}
                    {expandedRows[row.uniqueID] && (
                      <TableRow className="bg-slate-50 dark:bg-slate-900/30">
                        <TableCell colSpan={columns.length + 1} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Non-Paid Customers</p>
                              <p className="text-xl">{row.totalNonPaid}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Total Empty Classes</p>
                              <p className="text-xl">{row.totalEmpty}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Late Cancellations</p>
                              <p className="text-xl">{row.totalCancelled}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Total Time (Hours)</p>
                              <p className="text-xl">{parseFloat(String(row.totalTime)).toFixed(1)}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-48 text-center">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white dark:bg-gray-950">
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
