
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
import { Search } from 'lucide-react';

interface DataTableProps {
  data: ProcessedData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

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
    { key: 'classAverageIncludingEmpty', label: 'Avg. Attendance' },
    { key: 'totalRevenue', label: 'Revenue' }
  ];

  const handlePreviousPage = () => {
    setPageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPageIndex(prev => Math.min(pageCount - 1, prev + 1));
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
            <TableHeader className="bg-gray-50 dark:bg-gray-900">
              <TableRow>
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
                  <TableRow 
                    key={rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column.key}`} className="py-3">
                        {String(row[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
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
                  <PaginationPrevious onClick={handlePreviousPage} disabled={pageIndex === 0} />
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
                      <PaginationLink
                        isActive={pageNumber === pageIndex}
                        onClick={() => setPageIndex(pageNumber)}
                      >
                        {pageNumber + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext onClick={handleNextPage} disabled={pageIndex === pageCount - 1} />
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
