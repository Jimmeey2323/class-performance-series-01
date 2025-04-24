
import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { 
  Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Settings, Eye, EyeOff, Layers, Type, Palette, Bookmark,
  BookmarkX, Filter, MapPin, Calendar 
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { trainerAvatars } from './Dashboard';
import { formatIndianCurrency } from './MetricsPanel';
import { motion, AnimatePresence } from 'framer-motion';

interface DataTableProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, trainerAvatars }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    teacherName: true,
    location: true,
    cleanedClass: true,
    period: true,
    date: false,
    dayOfWeek: false,
    totalCheckins: true,
    totalRevenue: true,
    classAverageExcludingEmpty: true,
  });

  // Group data by period and instructor
  const groupedData = useMemo(() => {
    const groups: Record<string, ProcessedData[]> = {};
    
    data.forEach(item => {
      const key = `${item.period}-${item.teacherName}-${item.cleanedClass}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return Object.entries(groups).map(([key, items]) => {
      const totalCheckins = items.reduce((sum, item) => sum + Number(item.totalCheckins), 0);
      const totalRevenue = items.reduce((sum, item) => sum + Number(item.totalRevenue), 0);
      const totalOccurrences = items.length;
      
      // Use the first item as a template for the group row
      const template = items[0];
      
      return {
        key,
        group: true,
        teacherName: template.teacherName,
        cleanedClass: template.cleanedClass,
        period: template.period,
        location: items.map(i => i.location).filter((v, i, a) => a.indexOf(v) === i).join(', '),
        totalCheckins,
        totalRevenue,
        totalOccurrences,
        classAverageExcludingEmpty: totalCheckins / totalOccurrences,
        items
      };
    });
  }, [data]);
  
  // Filter the grouped data based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedData;
    
    return groupedData.filter(group => {
      const searchContent = `${group.teacherName} ${group.cleanedClass} ${group.period} ${group.location}`.toLowerCase();
      return searchContent.includes(searchTerm.toLowerCase());
    });
  }, [groupedData, searchTerm]);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / pageSize);
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
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
  
  // Navigate to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Column mapping for header display
  const columnMapping: Record<string, string> = {
    teacherName: 'Instructor',
    location: 'Location',
    cleanedClass: 'Class',
    period: 'Period',
    date: 'Date',
    dayOfWeek: 'Day',
    totalCheckins: 'Checkins',
    totalRevenue: 'Revenue',
    classAverageExcludingEmpty: 'Avg. Attendance',
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search in table..."
          className="w-full max-w-sm"
          icon={Search}
        />
        
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
              <h4 className="font-medium">Visible Columns</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(columnMapping).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`column-${key}`} 
                      checked={columnVisibility[key]} 
                      onCheckedChange={() => toggleColumnVisibility(key)}
                    />
                    <Label htmlFor={`column-${key}`}>{label}</Label>
                  </div>
                ))}
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
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setColumnVisibility({
                teacherName: true,
                location: true,
                cleanedClass: true,
                period: true,
                date: false,
                dayOfWeek: false,
                totalCheckins: true,
                totalRevenue: true,
                classAverageExcludingEmpty: true,
              })}>
                Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              {columnVisibility.teacherName && (
                <TableHead>Instructor</TableHead>
              )}
              {columnVisibility.cleanedClass && (
                <TableHead>Class</TableHead>
              )}
              {columnVisibility.period && (
                <TableHead>Period</TableHead>
              )}
              {columnVisibility.location && (
                <TableHead>Location</TableHead>
              )}
              {columnVisibility.date && (
                <TableHead>Date</TableHead>
              )}
              {columnVisibility.dayOfWeek && (
                <TableHead>Day</TableHead>
              )}
              {columnVisibility.totalCheckins && (
                <TableHead className="text-right">Check-ins</TableHead>
              )}
              {columnVisibility.totalRevenue && (
                <TableHead className="text-right">Revenue</TableHead>
              )}
              {columnVisibility.classAverageExcludingEmpty && (
                <TableHead className="text-right">Avg. Attendance</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map((group: any) => (
                  <React.Fragment key={group.key}>
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 font-medium",
                        expandedRows[group.key] && "bg-muted/30"
                      )}
                      onClick={() => toggleRowExpansion(group.key)}
                    >
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          {expandedRows[group.key] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      
                      {columnVisibility.teacherName && (
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={trainerAvatars[group.teacherName]} />
                              <AvatarFallback>{group.teacherName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {group.teacherName}
                          </div>
                        </TableCell>
                      )}
                      
                      {columnVisibility.cleanedClass && (
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                              {group.items.length}
                            </Badge>
                            {group.cleanedClass}
                          </div>
                        </TableCell>
                      )}
                      
                      {columnVisibility.period && (
                        <TableCell className="py-2">{group.period}</TableCell>
                      )}
                      
                      {columnVisibility.location && (
                        <TableCell className="py-2">
                          {group.location.split(',').length > 1 ? (
                            <Badge variant="secondary" className="font-normal">
                              {group.location.split(',').length} locations
                            </Badge>
                          ) : (
                            group.location
                          )}
                        </TableCell>
                      )}
                      
                      {columnVisibility.date && (
                        <TableCell className="py-2">Multiple</TableCell>
                      )}
                      
                      {columnVisibility.dayOfWeek && (
                        <TableCell className="py-2">Various</TableCell>
                      )}
                      
                      {columnVisibility.totalCheckins && (
                        <TableCell className="py-2 text-right">
                          {group.totalCheckins}
                        </TableCell>
                      )}
                      
                      {columnVisibility.totalRevenue && (
                        <TableCell className="py-2 text-right">
                          {formatIndianCurrency(group.totalRevenue)}
                        </TableCell>
                      )}
                      
                      {columnVisibility.classAverageExcludingEmpty && (
                        <TableCell className="py-2 text-right">
                          {group.classAverageExcludingEmpty.toFixed(1)}
                        </TableCell>
                      )}
                    </motion.tr>
                    
                    {/* Expanded child rows */}
                    {expandedRows[group.key] && group.items.map((item: ProcessedData) => (
                      <motion.tr 
                        key={item.uniqueID}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-muted/10 text-sm"
                      >
                        <TableCell className="py-2"></TableCell>
                        
                        {columnVisibility.teacherName && (
                          <TableCell className="py-2 pl-10">
                            {item.teacherName}
                          </TableCell>
                        )}
                        
                        {columnVisibility.cleanedClass && (
                          <TableCell className="py-2">
                            {item.cleanedClass}
                          </TableCell>
                        )}
                        
                        {columnVisibility.period && (
                          <TableCell className="py-2">{item.period}</TableCell>
                        )}
                        
                        {columnVisibility.location && (
                          <TableCell className="py-2">{item.location}</TableCell>
                        )}
                        
                        {columnVisibility.date && (
                          <TableCell className="py-2">{item.date}</TableCell>
                        )}
                        
                        {columnVisibility.dayOfWeek && (
                          <TableCell className="py-2">{item.dayOfWeek}</TableCell>
                        )}
                        
                        {columnVisibility.totalCheckins && (
                          <TableCell className="py-2 text-right">
                            {item.totalCheckins}
                          </TableCell>
                        )}
                        
                        {columnVisibility.totalRevenue && (
                          <TableCell className="py-2 text-right">
                            {formatIndianCurrency(Number(item.totalRevenue))}
                          </TableCell>
                        )}
                        
                        {columnVisibility.classAverageExcludingEmpty && (
                          <TableCell className="py-2 text-right">
                            {item.classAverageExcludingEmpty}
                          </TableCell>
                        )}
                      </motion.tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} className="text-center py-10 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
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
          Showing {Math.min((currentPage - 1) * pageSize + 1, filteredGroups.length)} to {Math.min(currentPage * pageSize, filteredGroups.length)} of {filteredGroups.length} groups
        </div>
      </div>
    </div>
  );
};

export { DataTable };
