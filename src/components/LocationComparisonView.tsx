
import React from 'react';
import { ProcessedData } from '@/types/data';
import ComparisonView from './ComparisonView';

interface LocationComparisonViewProps {
  data: ProcessedData[];
}

const LocationComparisonView: React.FC<LocationComparisonViewProps> = ({ data }) => {
  return (
    <ComparisonView
      data={data}
      title="Location Comparison"
      comparisonField="location"
      valueField="totalCheckins"
      secondaryValueField="totalRevenue"
      tertiaryValueField="classAverageExcludingEmpty"
      colors={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']}
    />
  );
};

export default LocationComparisonView;
