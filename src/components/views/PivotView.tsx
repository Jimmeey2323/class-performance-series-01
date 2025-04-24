
import React from 'react';
import { ProcessedData } from '@/types/data';
import PivotTable from '@/components/PivotTable';

interface PivotViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const PivotView: React.FC<PivotViewProps> = ({ data }) => {
  return (
    <div className="p-6">
      <PivotTable data={data} />
    </div>
  );
};

export default PivotView;
