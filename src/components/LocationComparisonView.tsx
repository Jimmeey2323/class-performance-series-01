
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
      tertiaryValueField="classAverageIncludingEmpty"
      colors={['#4f46e5', '#8b5cf6', '#a855f7', '#d946ef']}
    />
  );
};

export default LocationComparisonView;
