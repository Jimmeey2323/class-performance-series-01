
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ChartPanelProps {
  data: ProcessedData[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#8DD1E1', '#A4DE6C', '#D0ED57', '#FFC658', '#FF6B6B'
];

const ChartPanel: React.FC<ChartPanelProps> = ({ data }) => {
  const [chartTab, setChartTab] = useState('attendance');
  const [groupBy, setGroupBy] = useState<keyof ProcessedData>('dayOfWeek');
  
  const groupOptions = [
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'period', label: 'Period' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' }
  ];

  // Grouped data for charts
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    const groupedData: Record<string, any> = {};
    
    data.forEach(item => {
      const key = String(item[groupBy]);
      
      if (!groupedData[key]) {
        groupedData[key] = {
          name: key,
          totalClasses: 0,
          totalAttendance: 0,
          totalRevenue: 0,
          avgAttendance: 0,
          revenuePerClass: 0
        };
      }
      
      groupedData[key].totalClasses += item.totalOccurrences;
      groupedData[key].totalAttendance += item.totalCheckins;
      groupedData[key].totalRevenue += parseFloat(item.totalRevenue);
    });
    
    // Calculate averages
    Object.keys(groupedData).forEach(key => {
      const group = groupedData[key];
      group.avgAttendance = group.totalClasses > 0 
        ? parseFloat((group.totalAttendance / group.totalClasses).toFixed(1))
        : 0;
      group.revenuePerClass = group.totalClasses > 0
        ? parseFloat((group.totalRevenue / group.totalClasses).toFixed(2))
        : 0;
    });
    
    return Object.values(groupedData);
  }, [data, groupBy]);

  // Sort data for better visualization
  const sortedChartData = useMemo(() => {
    if (!chartData.length) return [];
    
    let sortKey = '';
    switch (chartTab) {
      case 'attendance':
        sortKey = 'avgAttendance';
        break;
      case 'classes':
        sortKey = 'totalClasses';
        break;
      case 'revenue':
        sortKey = 'totalRevenue';
        break;
      default:
        sortKey = 'totalClasses';
    }
    
    return [...chartData].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 10);
  }, [chartData, chartTab]);

  // Line chart data by period
  const periodData = useMemo(() => {
    if (!data.length) return [];
    
    const periods: Record<string, any> = {};
    
    data.forEach(item => {
      const period = item.period;
      
      if (!periods[period]) {
        periods[period] = {
          name: period,
          totalCheckins: 0,
          totalClasses: 0,
          totalRevenue: 0
        };
      }
      
      periods[period].totalCheckins += item.totalCheckins;
      periods[period].totalClasses += item.totalOccurrences;
      periods[period].totalRevenue += parseFloat(item.totalRevenue);
    });
    
    // Sort by period (assuming format is 'MMM-YY')
    return Object.values(periods).sort((a, b) => {
      const [monthA, yearA] = a.name.split('-');
      const [monthB, yearB] = b.name.split('-');
      
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <Tabs value={chartTab} onValueChange={setChartTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label htmlFor="group-by" className="whitespace-nowrap">Group By:</Label>
          <Select value={groupBy as string} onValueChange={(value) => setGroupBy(value as keyof ProcessedData)}>
            <SelectTrigger id="group-by" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select grouping" />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((option) => (
                <SelectItem key={option.key as string} value={option.key as string}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>
              {chartTab === 'attendance' && 'Average Attendance'}
              {chartTab === 'classes' && 'Total Classes'}
              {chartTab === 'revenue' && 'Revenue'}
              {` by ${groupOptions.find(o => o.key === groupBy)?.label}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey={
                      chartTab === 'attendance' ? 'avgAttendance' : 
                      chartTab === 'classes' ? 'totalClasses' : 'totalRevenue'
                    }
                    fill="#8884d8"
                  >
                    {sortedChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>
              Distribution by {groupOptions.find(o => o.key === groupBy)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={
                      chartTab === 'attendance' ? 'totalAttendance' : 
                      chartTab === 'classes' ? 'totalClasses' : 'totalRevenue'
                    }
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sortedChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => chartTab === 'revenue' ? `$${value}` : value} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Line Chart - Trends Over Time */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={periodData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalCheckins"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Total Check-ins"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalClasses"
                    stroke="#82ca9d"
                    name="Total Classes"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#ff7300"
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartPanel;
