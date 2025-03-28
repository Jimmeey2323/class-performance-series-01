
import React, { useState, useEffect } from 'react';
import { ProcessedData, KanbanColumn, KanbanItem } from '@/types/data';
import KanbanBoard from './kanban/KanbanBoard';
import { groupBy } from 'lodash';

interface KanbanViewProps {
  data: ProcessedData[];
  trainerAvatars?: Record<string, string>;
}

const KanbanView: React.FC<KanbanViewProps> = ({ data, trainerAvatars = {} }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [groupByField, setGroupByField] = useState<keyof ProcessedData>('dayOfWeek');
  
  useEffect(() => {
    // Group data by the selected field
    const groupedData = groupBy(data, groupByField);
    
    // Convert to KanbanColumn format
    const kanbanColumns: KanbanColumn[] = Object.keys(groupedData).map(key => {
      const items: KanbanItem[] = groupedData[key].map(item => ({
        id: item.uniqueID,
        title: item.cleanedClass,
        data: item,
        avatarUrl: trainerAvatars[item.teacherName]
      }));
      
      return {
        id: key,
        title: key,
        items
      };
    });
    
    // Sort columns by title
    const sortedColumns = kanbanColumns.sort((a, b) => {
      // Special sorting for days of week
      if (groupByField === 'dayOfWeek') {
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return daysOrder.indexOf(a.title) - daysOrder.indexOf(b.title);
      }
      
      return a.title.localeCompare(b.title);
    });
    
    setColumns(sortedColumns);
  }, [data, groupByField, trainerAvatars]);
  
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-end">
        <select 
          className="border rounded p-2 text-sm"
          value={groupByField}
          onChange={(e) => setGroupByField(e.target.value as keyof ProcessedData)}
        >
          <option value="dayOfWeek">Group by Day</option>
          <option value="teacherName">Group by Teacher</option>
          <option value="location">Group by Location</option>
          <option value="period">Group by Period</option>
        </select>
      </div>
      
      <KanbanBoard columns={columns} setColumns={setColumns} />
    </div>
  );
};

export default KanbanView;
