
import React from 'react';
import { ProcessedData } from '@/types/data';
import ComparisonView from './ComparisonView';

interface DayTimeComparisonViewProps {
  data: ProcessedData[];
}

const DayTimeComparisonView: React.FC<DayTimeComparisonViewProps> = ({ data }) => {
  return (
    <ComparisonView
      data={data}
      title="Day & Time Comparison"
      comparisonField="dayOfWeek"
      valueField="classAverageIncludingEmpty"
      secondaryValueField="totalCheckins"
      tertiaryValueField="totalOccurrences"
      groupBy="classTime"
      colors={['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a']}
      limit={7}
    />
  );
};

export default DayTimeComparisonView;
