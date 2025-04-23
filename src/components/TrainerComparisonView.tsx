
import React, { useState, useMemo } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface TrainerComparisonViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const TrainerComparisonView: React.FC<TrainerComparisonViewProps> = ({ data, trainerAvatars }) => {
  const [comparisonMetric, setComparisonMetric] = useState<keyof ProcessedData>('totalCheckins');
  const [numTrainers, setNumTrainers] = useState<number>(5);

  const metrics = [
    { key: 'totalCheckins', label: 'Total Check-ins' },
    { key: 'totalOccurrences', label: 'Class Count' },
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'classAverageIncludingEmpty', label: 'Average Attendance' },
    { key: 'totalCancelled', label: 'Cancellations' },
  ];

  const trainerStats = useMemo(() => {
    // Group data by trainer
    const trainerMap = new Map<string, any>();

    data.forEach(item => {
      if (!trainerMap.has(item.teacherName)) {
        trainerMap.set(item.teacherName, {
          name: item.teacherName,
          totalCheckins: 0,
          totalOccurrences: 0,
          totalRevenue: 0,
          totalCancelled: 0,
          totalTime: 0,
          classAverageIncludingEmpty: 0,
          classCount: 0,
          classes: new Set(),
        });
      }

      const trainer = trainerMap.get(item.teacherName);
      trainer.totalCheckins += item.totalCheckins;
      trainer.totalOccurrences += item.totalOccurrences;
      trainer.totalRevenue += Number(item.totalRevenue);
      trainer.totalCancelled += item.totalCancelled;
      trainer.totalTime += item.totalTime;
      trainer.classes.add(item.cleanedClass);
      trainer.classCount += 1;
    });

    // Calculate averages and format data
    return Array.from(trainerMap.values()).map(trainer => {
      const avgAttendance = trainer.totalOccurrences > 0 
        ? trainer.totalCheckins / trainer.totalOccurrences 
        : 0;
        
      return {
        ...trainer,
        classAverageIncludingEmpty: avgAttendance,
        classes: Array.from(trainer.classes),
        classCount: trainer.classCount,
      };
    })
    .sort((a, b) => {
      // Sort based on the selected metric
      if (comparisonMetric === 'classAverageIncludingEmpty') {
        return b.classAverageIncludingEmpty - a.classAverageIncludingEmpty;
      }
      return Number(b[comparisonMetric]) - Number(a[comparisonMetric]);
    })
    .slice(0, numTrainers);
  }, [data, comparisonMetric, numTrainers]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
  ];

  const formatValue = (value: number, metric: keyof ProcessedData): string => {
    if (metric === 'totalRevenue') {
      return formatIndianCurrency(value);
    }
    if (metric === 'classAverageIncludingEmpty') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      let formattedValue = value;
      
      if (comparisonMetric === 'totalRevenue') {
        formattedValue = formatIndianCurrency(value);
      } else if (comparisonMetric === 'classAverageIncludingEmpty') {
        formattedValue = parseFloat(value).toFixed(1);
      }
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-md">
          <p className="font-bold">{label}</p>
          <p className="text-sm">
            <span className="font-medium">{metrics.find(m => m.key === comparisonMetric)?.label}: </span>
            {formattedValue}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-bold">Trainer Comparison</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-56">
              <Select
                value={comparisonMetric as string}
                onValueChange={(value) => setComparisonMetric(value as keyof ProcessedData)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map(metric => (
                    <SelectItem key={metric.key as string} value={metric.key as string}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={String(numTrainers)}
                onValueChange={(value) => setNumTrainers(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Trainers to show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="15">Top 15</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trainerStats}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (comparisonMetric === 'totalRevenue') {
                      return formatIndianCurrency(value);
                    } else if (comparisonMetric === 'classAverageIncludingEmpty') {
                      return value.toFixed(1);
                    }
                    return value;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey={comparisonMetric} 
                  name={metrics.find(m => m.key === comparisonMetric)?.label} 
                >
                  {trainerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {trainerStats.map((trainer, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 border-b">
                      <Avatar className="h-12 w-12 mr-4 border-2 border-primary/30">
                        {trainerAvatars[trainer.name] ? (
                          <AvatarImage src={trainerAvatars[trainer.name]} alt={trainer.name} />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(trainer.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{trainer.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {trainer.classCount} Classes · {trainer.classes.length} Unique Types
                        </p>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Check-ins</p>
                        <p className="font-medium">{trainer.totalCheckins}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Classes</p>
                        <p className="font-medium">{trainer.totalOccurrences}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-medium">{formatIndianCurrency(trainer.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Attendance</p>
                        <p className="font-medium">{trainer.classAverageIncludingEmpty.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainerComparisonView;
