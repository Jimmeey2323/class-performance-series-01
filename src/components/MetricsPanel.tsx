
import React from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Activity, Users, Calendar, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

interface MetricsPanelProps {
  data: ProcessedData[];
}

export const formatIndianCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  // Calculate metrics...
  const totalCheckIns = data.reduce((sum, item) => sum + Number(item.totalCheckins), 0);
  const totalClasses = data.reduce((sum, item) => sum + Number(item.totalOccurrences), 0);
  const totalRevenue = data.reduce((sum, item) => sum + Number(item.totalRevenue), 0);
  const avgAttendance = totalClasses > 0 ? totalCheckIns / totalClasses : 0;

  // Generate sample data for sparklines (last 10 periods)
  const periods = Array.from(new Set(data.map(item => item.period))).sort();
  const last10Periods = periods.slice(-10);
  
  const sparklineData = {
    checkIns: last10Periods.map(period => 
      data.filter(item => item.period === period)
        .reduce((sum, item) => sum + Number(item.totalCheckins), 0)
    ),
    classes: last10Periods.map(period => 
      data.filter(item => item.period === period)
        .reduce((sum, item) => sum + Number(item.totalOccurrences), 0)
    ),
    revenue: last10Periods.map(period => 
      data.filter(item => item.period === period)
        .reduce((sum, item) => sum + Number(item.totalRevenue), 0)
    ),
    attendance: last10Periods.map(period => {
      const periodData = data.filter(item => item.period === period);
      const checkIns = periodData.reduce((sum, item) => sum + Number(item.totalCheckins), 0);
      const classes = periodData.reduce((sum, item) => sum + Number(item.totalOccurrences), 0);
      return classes > 0 ? checkIns / classes : 0;
    })
  };

  const metrics = [
    {
      title: 'Total Check-ins',
      value: totalCheckIns.toLocaleString(),
      icon: Users,
      sparkline: sparklineData.checkIns,
      trend: 5.2,
      gradient: 'from-blue-500 to-indigo-600',
      sparklineColor: '#818cf8'
    },
    {
      title: 'Total Classes',
      value: totalClasses.toLocaleString(),
      icon: Calendar,
      sparkline: sparklineData.classes,
      trend: -2.1,
      gradient: 'from-emerald-500 to-teal-600',
      sparklineColor: '#34d399'
    },
    {
      title: 'Average Attendance',
      value: avgAttendance.toFixed(1),
      icon: Activity,
      sparkline: sparklineData.attendance,
      trend: 3.4,
      gradient: 'from-amber-500 to-orange-600',
      sparklineColor: '#fbbf24'
    },
    {
      title: 'Total Revenue',
      value: formatIndianCurrency(totalRevenue),
      icon: IndianRupee,
      sparkline: sparklineData.revenue,
      trend: 7.8,
      gradient: 'from-purple-500 to-pink-600',
      sparklineColor: '#e879f9'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.gradient} text-white`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <Badge variant={metric.trend > 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
                  {metric.trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(metric.trend)}%
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{metric.title}</h3>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
              <div className="h-16 mt-4">
                <Sparklines data={metric.sparkline} width={200} height={60} margin={5}>
                  <SparklinesLine 
                    style={{ 
                      stroke: metric.sparklineColor, 
                      strokeWidth: 2, 
                      fill: "none" 
                    }} 
                  />
                  <SparklinesSpots 
                    size={3}
                    style={{ 
                      stroke: metric.sparklineColor,
                      strokeWidth: 2,
                      fill: "white"
                    }} 
                  />
                </Sparklines>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default MetricsPanel;
