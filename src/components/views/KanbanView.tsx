
import React, { useState, useEffect } from 'react';
import { ProcessedData, KanbanColumn, KanbanItem } from '@/types/data';
import { groupBy } from 'lodash';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import KanbanBoard from './kanban/KanbanBoard';
import { Kanban } from 'lucide-react';

interface KanbanViewProps {
  data: ProcessedData[];
  trainerAvatars?: Record<string, string>;
}

const KanbanView: React.FC<KanbanViewProps> = ({ data, trainerAvatars = {} }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [groupByField, setGroupByField] = useState<keyof ProcessedData>('dayOfWeek');
  
  useEffect(() => {
    console.log(`KanbanView: Grouping ${data.length} items by ${groupByField}`);
    
    const groupedData = groupBy(data, groupByField);
    
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
    
    const sortedColumns = kanbanColumns.sort((a, b) => {
      if (groupByField === 'dayOfWeek') {
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return daysOrder.indexOf(a.title) - daysOrder.indexOf(b.title);
      }
      
      return a.title.localeCompare(b.title);
    });
    
    setColumns(sortedColumns);
  }, [data, groupByField, trainerAvatars]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeIdParts = active.id.toString().split(':');
    const overIdParts = over.id.toString().split(':');
    
    if (activeIdParts[0] === 'item' && overIdParts[0] === 'column') {
      const itemId = activeIdParts[1];
      const sourceColumnId = activeIdParts[2];
      const destinationColumnId = overIdParts[1];
      
      if (sourceColumnId !== destinationColumnId) {
        const newColumns = [...columns];
        const sourceColumnIndex = newColumns.findIndex(col => col.id === sourceColumnId);
        const destColumnIndex = newColumns.findIndex(col => col.id === destinationColumnId);
        
        if (sourceColumnIndex !== -1 && destColumnIndex !== -1) {
          const itemIndex = newColumns[sourceColumnIndex].items.findIndex(item => item.id === itemId);
          
          if (itemIndex !== -1) {
            const [item] = newColumns[sourceColumnIndex].items.splice(itemIndex, 1);
            newColumns[destColumnIndex].items.push(item);
            
            setColumns(newColumns);
          }
        }
      }
    }
  };
  
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-end">
        <select 
          className="border rounded p-2 text-sm"
          value={groupByField as string}
          onChange={(e) => setGroupByField(e.target.value as keyof ProcessedData)}
        >
          <option value="dayOfWeek">Group by Day</option>
          <option value="teacherName">Group by Teacher</option>
          <option value="location">Group by Location</option>
          <option value="period">Group by Period</option>
        </select>
      </div>
      
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <KanbanBoard 
              key={column.id} 
              id={column.id} 
              title={column.title} 
              items={column.items} 
              count={column.items.length}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanView;
