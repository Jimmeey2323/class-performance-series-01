
import React, { useMemo } from "react";
import { ProcessedData } from "@/types/data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatIndianCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface TopBottomClassesProps {
  data: ProcessedData[];
  includeTrainers: boolean;
  trainerAvatars: Record<string, string>;
}

interface GroupedClass {
  key: string;
  samples: ProcessedData[];
  avgAttendance: number;
  totalRevenue: number;
}

const groupClasses = (
  data: ProcessedData[],
  includeTrainers: boolean
): GroupedClass[] => {
  const map = new Map<string, GroupedClass>();

  data.forEach((row) => {
    const key = [
      row.cleanedClass,
      row.dayOfWeek,
      row.classTime,
      includeTrainers ? row.teacherName : "", // group on teacher if toggled
    ].join("|");

    if (!map.has(key)) {
      map.set(key, {
        key,
        samples: [],
        avgAttendance: 0,
        totalRevenue: 0,
      });
    }
    map.get(key)?.samples.push(row);
  });

  // Calculate averages and total revenue for each group
  map.forEach((cls) => {
    const attendanceArr = cls.samples.map((s) => Number(s.classAverageIncludingEmpty) || 0);
    const revenueArr = cls.samples.map((s) => Number(s.totalRevenue) || 0);
    cls.avgAttendance =
      attendanceArr.length > 0
        ? attendanceArr.reduce((a, b) => a + b, 0) / attendanceArr.length
        : 0;
    cls.totalRevenue = revenueArr.reduce((a, b) => a + b, 0);
  });

  return Array.from(map.values());
};

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({
  data,
  includeTrainers,
  trainerAvatars,
}) => {
  const grouped = useMemo(
    () => groupClasses(data, includeTrainers),
    [data, includeTrainers]
  );

  // Top 3 and bottom 3 classes by attendance (excluding those with too few records)
  const filtered = grouped.filter((g) => g.samples.length > 2);
  const sorted = [...filtered].sort(
    (a, b) => b.avgAttendance - a.avgAttendance
  );

  const top = sorted.slice(0, 3);
  const bottom = sorted.slice(-3).reverse();

  const displayKey = (g: GroupedClass) => {
    const parts = g.key.split("|");
    return (
      <div>
        <div>
          <span className="font-semibold">{parts[0]}</span>{" "}
          <span className="text-xs text-gray-500">({parts[1]}, {parts[2]})</span>
        </div>
        {includeTrainers && parts[3] && (
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <Avatar className="h-4 w-4">
              {trainerAvatars[parts[3]] ? (
                <AvatarImage src={trainerAvatars[parts[3]]} />
              ) : (
                <AvatarFallback>{parts[3]?.slice(0, 2)}</AvatarFallback>
              )}
            </Avatar>
            {parts[3]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b text-lg font-bold text-green-700 dark:text-green-300">Top Classes</div>
          <ul>
            {top.map((g, idx) => (
              <li key={g.key} className="flex items-center justify-between p-4 border-b last:border-b-0">
                {displayKey(g)}
                <div>
                  <span className="block font-semibold">{g.avgAttendance.toFixed(1)}</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {formatIndianCurrency(g.totalRevenue)}
                  </span>
                </div>
              </li>
            ))}
            {top.length === 0 && <li className="p-4 text-sm text-gray-400">No classes</li>}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b text-lg font-bold text-red-700 dark:text-red-300">Bottom Classes</div>
          <ul>
            {bottom.map((g, idx) => (
              <li key={g.key} className="flex items-center justify-between p-4 border-b last:border-b-0">
                {displayKey(g)}
                <div>
                  <span className="block font-semibold">{g.avgAttendance.toFixed(1)}</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {formatIndianCurrency(g.totalRevenue)}
                  </span>
                </div>
              </li>
            ))}
            {bottom.length === 0 && <li className="p-4 text-sm text-gray-400">No classes</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopBottomClasses;
