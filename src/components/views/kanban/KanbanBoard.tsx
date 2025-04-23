
import React, { useState, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanItem, ProcessedData } from '@/types/data';
import KanbanCard from './KanbanCard';

interface KanbanBoardProps {
  data: ProcessedData[];
  groupBy: keyof ProcessedData;
  items: Record<string, KanbanItem[]>;
  setItems: React.Dispatch<React.SetStateAction<Record<string, KanbanItem[]>>>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, groupBy, items, setItems }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeContainer = Object.keys(items).find(key => 
        items[key].some(item => item.id === active.id)
      );
      
      const overContainer = over.data?.current?.sortable?.containerId || 
        Object.keys(items).find(key => items[key].some(item => item.id === over.id));

      if (
        activeContainer &&
        overContainer &&
        activeContainer !== overContainer
      ) {
        setItems(prev => {
          const activeItems = [...prev[activeContainer]];
          const overItems = [...prev[overContainer]];
          
          const activeIndex = activeItems.findIndex(item => item.id === active.id);
          const activeItem = activeItems[activeIndex];
          
          // Remove from original container
          activeItems.splice(activeIndex, 1);
          
          // Add to new container
          overItems.push(activeItem);
          
          return {
            ...prev,
            [activeContainer]: activeItems,
            [overContainer]: overItems
          };
        });
      }
    }
    
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex overflow-x-auto space-x-4 p-4">
        {Object.keys(items).map(columnId => (
          <div
            key={columnId}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg min-w-[280px] max-w-[280px] flex-shrink-0 shadow-sm"
          >
            <div className="p-3 border-b bg-gray-100 dark:bg-gray-800 rounded-t-lg">
              <h3 className="font-medium text-sm">{columnId}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {items[columnId].length} classes
              </div>
            </div>
            
            <div className="p-2 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
              {items[columnId].map(item => (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  data={item.content}
                  isActive={activeId === item.id}
                />
              ))}
              
              {items[columnId].length === 0 && (
                <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-sm text-muted-foreground">
                  No classes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
