
import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CalendarDays, 
  Clock, 
  MapPin,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';
import { formatIndianCurrency } from './MetricsPanel';
import { trainerAvatars } from './Dashboard';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

export interface GroupedClassData {
  id: string;
  classNames: string[];
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  teacherName: string;
  totalClasses: number;
  totalCheckins: number;
  totalRevenue: number;
  avgAttendance: number;
  totalNonPaid: number;
  totalCancelled: number;
  childRows: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [includeTrainerInGrouping, setIncludeTrainerInGrouping] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<GroupedClassData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Group data for top/bottom classes
  const groupedData = useMemo<GroupedClassData[]>(() => {
    if (!data.length) return [];

    const groups: Record<string, GroupedClassData> = {};

    data.forEach(item => {
      // Skip classes that contain "Hosted" or "Recovery" in their name
      if (
        item.cleanedClass.includes('Hosted') || 
        item.cleanedClass.includes('Recovery')
      ) {
        return;
      }

      // Create a unique key for grouping
      let groupKey = `${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.location}`;
      if (includeTrainerInGrouping) {
        groupKey += `-${item.teacherName}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          classNames: [item.cleanedClass],
          cleanedClass: item.cleanedClass,
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          location: item.location,
          teacherName: includeTrainerInGrouping ? item.teacherName : 'Multiple',
          totalClasses: 0,
          totalCheckins: 0,
          totalRevenue: 0,
          avgAttendance: 0,
          totalNonPaid: 0,
          totalCancelled: 0,
          childRows: []
        };
      }

      // Add this row as a child
      groups[groupKey].childRows.push(item);

      // Update aggregates
      groups[groupKey].totalClasses += item.totalOccurrences;
      groups[groupKey].totalCheckins += item.totalCheckins;
      
      // Handle revenue which can be string or number
      const revenue = typeof item.totalRevenue === 'number' ? 
        item.totalRevenue : 
        parseFloat(String(item.totalRevenue || 0));
      groups[groupKey].totalRevenue += revenue;
      
      groups[groupKey].totalNonPaid += item.totalNonPaid;
      groups[groupKey].totalCancelled += item.totalCancelled;

      // Ensure the teacher name shows "Multiple" if there are different teachers
      if (!includeTrainerInGrouping && !groups[groupKey].classNames.includes(item.cleanedClass)) {
        groups[groupKey].classNames.push(item.cleanedClass);
        // If we have 2+ different teachers for the same class, mark as "Multiple"
        if (groups[groupKey].teacherName !== item.teacherName && groups[groupKey].teacherName !== 'Multiple') {
          groups[groupKey].teacherName = 'Multiple';
        }
      }
    });

    // Calculate averages and filter groups with less than 2 classes
    Object.values(groups).forEach(group => {
      group.avgAttendance = group.totalClasses > 0 ? group.totalCheckins / group.totalClasses : 0;
    });

    // Filter out groups with fewer than 2 classes
    return Object.values(groups).filter(group => group.totalClasses >= 2);
  }, [data, includeTrainerInGrouping]);

  // Sort and get top/bottom classes based on different metrics
  const topBottomClasses = useMemo(() => {
    if (!groupedData.length) return { top: [], bottom: [] };

    const sortBy = (key: keyof GroupedClassData, desc = true) => {
      return [...groupedData].sort((a, b) => {
        return desc 
          ? Number(b[key]) - Number(a[key]) 
          : Number(a[key]) - Number(b[key]);
      }).slice(0, 5);
    };

    return {
      attendance: {
        top: sortBy('avgAttendance', true),
        bottom: sortBy('avgAttendance', false)
      },
      revenue: {
        top: sortBy('totalRevenue', true),
        bottom: sortBy('totalRevenue', false)
      },
      frequency: {
        top: sortBy('totalClasses', true),
        bottom: sortBy('totalClasses', false)
      }
    };
  }, [groupedData]);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId) 
        : [...prev, rowId]
    );
  };

  const showClassDetails = (classData: GroupedClassData) => {
    setSelectedClass(classData);
    setDialogOpen(true);
  };

  const renderClassItem = (classItem: GroupedClassData, index: number, type: 'top' | 'bottom') => {
    const isExpanded = expandedRows.includes(classItem.id);
    const avatarUrl = trainerAvatars[classItem.teacherName];
    const initials = classItem.teacherName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <motion.div 
        key={classItem.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group"
      >
        <div 
          className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
            ${type === 'top' 
              ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              : 'hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }
            ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}
          `}
          onClick={() => toggleRowExpansion(classItem.id)}
        >
          <div 
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
              ${type === 'top' 
                ? 'bg-emerald-400 dark:bg-emerald-600' 
                : 'bg-amber-400 dark:bg-amber-600'
              }
            `}
          />
          
          <div className="flex-none">
            {isExpanded ? 
              <ChevronDown className="h-5 w-5 text-gray-400" /> : 
              <ChevronRight className="h-5 w-5 text-gray-400" />
            }
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base truncate">
                {classItem.cleanedClass}
              </span>
              <Badge variant="outline" className="ml-1">
                {classItem.totalClasses} classes
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{classItem.dayOfWeek}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{classItem.classTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{classItem.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-none flex items-center gap-1">
            {classItem.teacherName !== 'Multiple' ? (
              <div className="flex items-center gap-2 mr-2">
                <Avatar className="h-6 w-6">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={classItem.teacherName} />
                  ) : (
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm">{classItem.teacherName}</span>
              </div>
            ) : (
              <Badge variant="outline" className="mr-2">Multiple Trainers</Badge>
            )}
            
            {activeTab === 'attendance' && (
              <div className="text-lg font-semibold">
                {classItem.avgAttendance.toFixed(1)}
              </div>
            )}
            
            {activeTab === 'revenue' && (
              <div className="text-lg font-semibold">
                {formatIndianCurrency(classItem.totalRevenue)}
              </div>
            )}
            
            {activeTab === 'frequency' && (
              <div className="text-lg font-semibold">
                {classItem.totalClasses}
              </div>
            )}
            
            <button 
              className="p-1.5 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                showClassDetails(classItem);
              }}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Child rows */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-10 pr-4 py-2 space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                {classItem.childRows.length > 0 ? (
                  classItem.childRows.map((childRow, childIndex) => (
                    <div key={`${childRow.uniqueID}-${childIndex}`} className="flex items-center justify-between py-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 px-2 rounded text-sm">
                      <div className="flex items-center gap-3">
                        <span>{childRow.period}</span>
                        <span className="text-muted-foreground">
                          {childRow.totalOccurrences} occurrences
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-medium">{childRow.totalCheckins}</span> check-ins
                        </div>
                        <div>
                          <span className="font-medium">{formatIndianCurrency(Number(childRow.totalRevenue))}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted-foreground">No detail records available</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Class Rankings</h2>
          <p className="text-muted-foreground">Top & bottom performing classes by various metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="include-trainer"
            checked={includeTrainerInGrouping}
            onCheckedChange={setIncludeTrainerInGrouping}
          />
          <Label htmlFor="include-trainer" className="cursor-pointer">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    Group by trainer
                    <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>When enabled, classes are grouped by both class type AND instructor.</p>
                  <p>When disabled, classes of the same type but different instructors are grouped together.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="attendance" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="frequency" className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Frequency</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-emerald-200 dark:border-emerald-800/50 overflow-hidden">
            <CardHeader className="bg-emerald-50 dark:bg-emerald-900/20 pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
                Top 5 Classes
              </CardTitle>
              <CardDescription>
                {activeTab === 'attendance' && 'Highest average attendance'}
                {activeTab === 'revenue' && 'Highest revenue generation'}
                {activeTab === 'frequency' && 'Most frequently held classes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {topBottomClasses[activeTab as keyof typeof topBottomClasses]?.top.length > 0 ? (
                topBottomClasses[activeTab as keyof typeof topBottomClasses].top.map((classItem, index) => 
                  renderClassItem(classItem, index, 'top')
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-amber-800/50 overflow-hidden">
            <CardHeader className="bg-amber-50 dark:bg-amber-900/20 pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <TrendingDown className="h-5 w-5" />
                Bottom 5 Classes
              </CardTitle>
              <CardDescription>
                {activeTab === 'attendance' && 'Lowest average attendance'}
                {activeTab === 'revenue' && 'Lowest revenue generation'}
                {activeTab === 'frequency' && 'Least frequently held classes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {topBottomClasses[activeTab as keyof typeof topBottomClasses]?.bottom.length > 0 ? (
                topBottomClasses[activeTab as keyof typeof topBottomClasses].bottom.map((classItem, index) => 
                  renderClassItem(classItem, index, 'bottom')
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
      
      {/* Class Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Class Details</DialogTitle>
            <DialogDescription>
              Detailed analytics for {selectedClass?.cleanedClass} on {selectedClass?.dayOfWeek} at {selectedClass?.classTime}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Classes</h3>
                    <p className="text-2xl font-bold">{selectedClass.totalClasses}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 dark:bg-green-900/20 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground">Avg Attendance</h3>
                    <p className="text-2xl font-bold">{selectedClass.avgAttendance.toFixed(1)}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                    <p className="text-2xl font-bold">{formatIndianCurrency(selectedClass.totalRevenue)}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 dark:bg-red-900/20 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground">Cancellations</h3>
                    <p className="text-2xl font-bold">{selectedClass.totalCancelled}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b font-medium">
                  Period Breakdown
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Period</th>
                        <th className="px-3 py-2 text-center">Classes</th>
                        <th className="px-3 py-2 text-center">Check-ins</th>
                        <th className="px-3 py-2 text-center">Avg</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.childRows.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm">
                          <td className="px-3 py-2 text-left">{row.period}</td>
                          <td className="px-3 py-2 text-center">{row.totalOccurrences}</td>
                          <td className="px-3 py-2 text-center">{row.totalCheckins}</td>
                          <td className="px-3 py-2 text-center">
                            {(row.totalCheckins / (row.totalOccurrences || 1)).toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatIndianCurrency(Number(row.totalRevenue))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopBottomClasses;
