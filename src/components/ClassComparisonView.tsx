
import React from 'react';
import { ProcessedData } from '@/types/data';
import ComparisonView from './ComparisonView';

interface ClassComparisonViewProps {
  data: ProcessedData[];
}

const ClassComparisonView: React.FC<ClassComparisonViewProps> = ({ data }) => {
  return (
    <ComparisonView
      data={data}
      title="Class Type Comparison"
      comparisonField="cleanedClass"
      valueField="totalCheckins"
      secondaryValueField="totalRevenue"
      tertiaryValueField="classAverageExcludingEmpty"
      colors={['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']}
    />
  );
};

export default ClassComparisonView;
