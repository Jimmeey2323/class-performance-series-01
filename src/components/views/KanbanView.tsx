
import React, { useState, useEffect } from 'react';
import { ProcessedData, KanbanColumn, KanbanItem } from '@/types/data';
import { groupBy } from 'lodash';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import KanbanBoard from './kanban/KanbanBoard';

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Extract the column and item IDs from the active and over IDs
    const activeIdParts = active.id.toString().split(':');
    const overIdParts = over.id.toString().split(':');
    
    // If dropping in a different column
    if (activeIdParts[0] === 'item' && overIdParts[0] === 'column') {
      const itemId = activeIdParts[1];
      const sourceColumnId = activeIdParts[2];
      const destinationColumnId = overIdParts[1];
      
      if (sourceColumnId !== destinationColumnId) {
        // Find the item and move it to the new column
        const newColumns = [...columns];
        const sourceColumnIndex = newColumns.findIndex(col => col.id === sourceColumnId);
        const destColumnIndex = newColumns.findIndex(col => col.id === destinationColumnId);
        
        if (sourceColumnIndex !== -1 && destColumnIndex !== -1) {
          // Find the item in the source column
          const itemIndex = newColumns[sourceColumnIndex].items.findIndex(item => item.id === itemId);
          
          if (itemIndex !== -1) {
            // Remove item from source column
            const [item] = newColumns[sourceColumnIndex].items.splice(itemIndex, 1);
            // Add item to destination column
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
          value={groupByField}
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
