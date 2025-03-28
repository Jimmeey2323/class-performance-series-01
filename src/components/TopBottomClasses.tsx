import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [topClassesCount, setTopClassesCount] = useState(5);
  const [bottomClassesCount, setBottomClassesCount] = useState(5);
  const [includeTrainers, setIncludeTrainers] = useState(false);

  // Calculate top classes
  const topClasses = React.useMemo(() => {
    const classStats: { [key: string]: { className: string; totalRevenue: number } } = {};

    data.forEach(item => {
      const classKey = includeTrainers ? `${item.cleanedClass}-${item.teacherName}` : item.cleanedClass;
      if (!classStats[classKey]) {
        classStats[classKey] = { className: classKey, totalRevenue: 0 };
      }
      classStats[classKey].totalRevenue += parseFloat(item.totalRevenue);
    });

    const sortedClasses = Object.values(classStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
    return sortedClasses.slice(0, topClassesCount);
  }, [data, topClassesCount, includeTrainers]);

  // Calculate bottom classes
  const bottomClasses = React.useMemo(() => {
    const classStats: { [key: string]: { className: string; totalRevenue: number } } = {};

    data.forEach(item => {
       const classKey = includeTrainers ? `${item.cleanedClass}-${item.teacherName}` : item.cleanedClass;
      if (!classStats[classKey]) {
        classStats[classKey] = { className: classKey, totalRevenue: 0 };
      }
      classStats[classKey].totalRevenue += parseFloat(item.totalRevenue);
    });

    const sortedClasses = Object.values(classStats).sort((a, b) => a.totalRevenue - b.totalRevenue);
    return sortedClasses.slice(0, bottomClassesCount);
  }, [data, bottomClassesCount, includeTrainers]);

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Top & Bottom Classes
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-auto">
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" forceMount>
            <DropdownMenuItem onClick={() => setTopClassesCount(5)}>
              Top 5 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTopClassesCount(10)}>
              Top 10 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(5)}>
              Bottom 5 Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBottomClassesCount(10)}>
              Bottom 10 Classes
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setIncludeTrainers(!includeTrainers)}>
              {includeTrainers && <Check className="h-4 w-4" />}
              {includeTrainers ? 'Exclude Trainers' : 'Include Trainers'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Top Classes by Revenue</h3>
            <ul className="list-none pl-0">
              {topClasses.map((item, index) => (
                <li key={index} className="py-1 border-b last:border-b-0">
                  {item.className} - ₹{item.totalRevenue.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Bottom Classes by Revenue</h3>
            <ul className="list-none pl-0">
              {bottomClasses.map((item, index) => (
                <li key={index} className="py-1 border-b last:border-b-0">
                  {item.className} - ₹{item.totalRevenue.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default TopBottomClasses;
