
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatIndianCurrency } from './MetricsPanel';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ComparisonViewProps {
  data: ProcessedData[];
  title: string;
  comparisonField: keyof ProcessedData;
  valueField: keyof ProcessedData;
  secondaryValueField?: keyof ProcessedData;
  tertiaryValueField?: keyof ProcessedData;
  groupBy?: keyof ProcessedData;
  colors?: string[];
  limit?: number;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  data,
  title,
  comparisonField,
  valueField,
  secondaryValueField,
  tertiaryValueField,
  groupBy,
  colors = ['#8884d8', '#82ca9d', '#ffc658'],
  limit = 10,
}) => {
  const [period, setPeriod] = useState<string>('all');
  const [chartType, setChartType] = useState<'value' | 'comparison'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Get unique periods
  const periods = React.useMemo(() => {
    const uniquePeriods = Array.from(new Set(data.map(item => item.period))).filter(Boolean);
    return ['all', ...uniquePeriods.sort()];
  }, [data]);

  // Filter data by period
  const filteredData = React.useMemo(() => {
    if (period === 'all') {
      return data;
    }
    return data.filter(item => item.period === period);
  }, [data, period]);
  
  // Process data for comparison
  const comparisonData = React.useMemo(() => {
    if (filteredData.length === 0) return [];
    
    const groupedData: Record<string, any> = {};
    
    filteredData.forEach(item => {
      const key = String(item[comparisonField] || 'Unknown');
      const value = Number(item[valueField] || 0);
      const secondaryValue = secondaryValueField ? Number(item[secondaryValueField] || 0) : 0;
      const tertiaryValue = tertiaryValueField ? Number(item[tertiaryValueField] || 0) : 0;
      const groupKey = groupBy ? String(item[groupBy] || 'Unknown') : 'all';
      
      if (!groupedData[key]) {
        groupedData[key] = {
          name: key,
          value: 0,
          secondaryValue: 0,
          tertiaryValue: 0,
          count: 0,
          groups: {},
        };
      }
      
      groupedData[key].value += value;
      groupedData[key].secondaryValue += secondaryValue;
      groupedData[key].tertiaryValue += tertiaryValue;
      groupedData[key].count += 1;
      
      // Group data if needed
      if (!groupedData[key].groups[groupKey]) {
        groupedData[key].groups[groupKey] = {
          value: 0,
          secondaryValue: 0,
          tertiaryValue: 0,
          count: 0
        };
      }
      
      groupedData[key].groups[groupKey].value += value;
      groupedData[key].groups[groupKey].secondaryValue += secondaryValue;
      groupedData[key].groups[groupKey].tertiaryValue += tertiaryValue;
      groupedData[key].groups[groupKey].count += 1;
    });
    
    // Calculate averages if needed
    Object.values(groupedData).forEach((item: any) => {
      if (valueField.includes('Average')) {
        item.value = item.count > 0 ? item.value / item.count : 0;
      }
      
      if (secondaryValueField && secondaryValueField.includes('Average')) {
        item.secondaryValue = item.count > 0 ? item.secondaryValue / item.count : 0;
      }
      
      if (tertiaryValueField && tertiaryValueField.includes('Average')) {
        item.tertiaryValue = item.count > 0 ? item.tertiaryValue / item.count : 0;
      }
      
      // Process group averages
      Object.keys(item.groups).forEach(groupKey => {
        const group = item.groups[groupKey];
        if (valueField.includes('Average')) {
          group.value = group.count > 0 ? group.value / group.count : 0;
        }
        
        if (secondaryValueField && secondaryValueField.includes('Average')) {
          group.secondaryValue = group.count > 0 ? group.secondaryValue / group.count : 0;
        }
        
        if (tertiaryValueField && tertiaryValueField.includes('Average')) {
          group.tertiaryValue = group.count > 0 ? group.tertiaryValue / group.count : 0;
        }
      });
    });
    
    // Convert to array and sort
    let result = Object.values(groupedData);
    
    result = result.sort((a: any, b: any) => {
      return sortDirection === 'desc' 
        ? b.value - a.value 
        : a.value - b.value;
    });
    
    // Limit number of results
    return result.slice(0, limit);
  }, [filteredData, comparisonField, valueField, secondaryValueField, tertiaryValueField, groupBy, limit, sortDirection]);

  // Format value for display
  const formatValue = (value: number, field: keyof ProcessedData): string => {
    if (field === 'totalRevenue' || field === 'totalPayout' || field === 'totalTips') {
      return formatIndianCurrency(value);
    } else if (field.includes('Average')) {
      return value.toFixed(1);
    } else {
      return value.toLocaleString();
    }
  };

  // Get value label
  const getValueLabel = (field: keyof ProcessedData): string => {
    switch (field) {
      case 'totalCheckins':
        return 'Check-ins';
      case 'totalRevenue':
        return 'Revenue';
      case 'totalCancelled':
        return 'Cancellations';
      case 'totalOccurrences':
        return 'Classes';
      case 'classAverageIncludingEmpty':
        return 'Avg. Attendance';
      case 'classAverageExcludingEmpty':
        return 'Avg. (Non-empty)';
      case 'totalPayout':
        return 'Payout';
      case 'totalTips':
        return 'Tips';
      default:
        return String(field);
    }
  };

  // Get field color
  const getFieldColor = (field: keyof ProcessedData): string => {
    switch (field) {
      case 'totalCheckins':
        return '#8884d8'; // purple
      case 'totalRevenue':
        return '#82ca9d'; // green
      case 'totalCancelled':
        return '#ff8042'; // orange
      case 'totalOccurrences':
        return '#8dd1e1'; // light blue
      case 'classAverageIncludingEmpty':
      case 'classAverageExcludingEmpty':
        return '#a4de6c'; // light green
      case 'totalPayout':
        return '#d0ed57'; // yellow green
      case 'totalTips':
        return '#ffc658'; // yellow
      default:
        return '#8884d8'; // default purple
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-950">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.slice(1).map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'value' | 'comparison')} className="w-[240px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="value">{getValueLabel(valueField)}</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
          >
            {sortDirection === 'desc' ? 'Highest First' : 'Lowest First'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <div className="h-[400px] w-full">
          {comparisonData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No data available for the selected period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    const field = chartType === 'value' ? valueField : secondaryValueField || valueField;
                    if (field === 'totalRevenue' || field === 'totalPayout' || field === 'totalTips') {
                      return `₹${value.toLocaleString('en-IN')}`;
                    }
                    return value.toString();
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    switch (name) {
                      case getValueLabel(valueField):
                        return [formatValue(value, valueField), name];
                      case getValueLabel(secondaryValueField || 'totalCheckins'):
                        return [formatValue(value, secondaryValueField || 'totalCheckins'), name];
                      case getValueLabel(tertiaryValueField || 'totalCancelled'):
                        return [formatValue(value, tertiaryValueField || 'totalCancelled'), name];
                      default:
                        return [value, name];
                    }
                  }}
                />
                <Legend />
                {chartType === 'value' ? (
                  <Bar 
                    dataKey="value" 
                    name={getValueLabel(valueField)} 
                    fill={getFieldColor(valueField)}
                  >
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                ) : (
                  <>
                    <Bar 
                      dataKey="value" 
                      name={getValueLabel(valueField)} 
                      fill={getFieldColor(valueField)}
                    />
                    {secondaryValueField && (
                      <Bar 
                        dataKey="secondaryValue" 
                        name={getValueLabel(secondaryValueField)} 
                        fill={getFieldColor(secondaryValueField)}
                      />
                    )}
                    {tertiaryValueField && (
                      <Bar 
                        dataKey="tertiaryValue" 
                        name={getValueLabel(tertiaryValueField)} 
                        fill={getFieldColor(tertiaryValueField)}
                      />
                    )}
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonView;
