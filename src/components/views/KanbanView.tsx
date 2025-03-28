
import React, { useEffect, useState } from 'react';
import { ProcessedData, KanbanColumn, KanbanItem } from '@/types/data';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanBoard from './kanban/KanbanBoard';
import KanbanCard from './kanban/KanbanCard';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface KanbanViewProps {
  data: ProcessedData[];
}

// Group criteria options
const groupByOptions = [
  { value: 'dayOfWeek', label: 'Day of Week' },
  { value: 'cleanedClass', label: 'Class Type' },
  { value: 'location', label: 'Location' },
  { value: 'period', label: 'Period' },
  { value: 'teacherName', label: 'Instructor' }
];

const KanbanView: React.FC<KanbanViewProps> = ({ data }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [groupBy, setGroupBy] = useState<keyof ProcessedData>('dayOfWeek');
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Create columns based on the groupBy field
  useEffect(() => {
    if (!data.length) return;
    
    // Group data by the selected field
    const groups: Record<string, ProcessedData[]> = {};
    
    data.forEach(item => {
      const key = String(item[groupBy]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    // Create columns from groups
    const newColumns: KanbanColumn[] = Object.entries(groups).map(([key, items]) => ({
      id: key,
      title: key,
      items: items.map(item => ({
        id: item.uniqueID,
        title: item.cleanedClass,
        data: item
      }))
    }));
    
    setColumns(newColumns);
  }, [data, groupBy]);
  
  // Handle the start of a drag operation
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeColumn = columns.find(col => 
      col.items.some(item => item.id === active.id)
    );
    
    if (!activeColumn) return;
    
    const activeItemData = activeColumn.items.find(item => item.id === active.id);
    if (activeItemData) {
      setActiveItem(activeItemData);
    }
  };
  
  // Handle dropping a card
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // If dropped in a different column, update the data
    const sourceColumnId = columns.find(col => 
      col.items.some(item => item.id === active.id)
    )?.id;
    
    const destinationColumnId = over.id.toString().includes('column:') 
      ? over.id.toString().replace('column:', '')
      : columns.find(col => 
          col.items.some(item => item.id === over.id)
        )?.id;
    
    if (!sourceColumnId || !destinationColumnId) return;
    
    // If columns are different, move the item between columns
    if (sourceColumnId !== destinationColumnId) {
      const newColumns = [...columns];
      
      // Find source and destination column indexes
      const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumnId);
      const destColIndex = newColumns.findIndex(col => col.id === destinationColumnId);
      
      if (sourceColIndex === -1 || destColIndex === -1) return;
      
      // Find the item to move
      const itemIndex = newColumns[sourceColIndex].items.findIndex(
        item => item.id === active.id
      );
      
      if (itemIndex === -1) return;
      
      // Get the item to move
      const itemToMove = newColumns[sourceColIndex].items[itemIndex];
      
      // Remove from source column
      newColumns[sourceColIndex].items.splice(itemIndex, 1);
      
      // Add to destination column
      newColumns[destColIndex].items.push(itemToMove);
      
      setColumns(newColumns);
    }
    // If reordering within the same column
    else {
      const columnIndex = columns.findIndex(col => col.id === sourceColumnId);
      if (columnIndex === -1) return;
      
      const itemIndex = columns[columnIndex].items.findIndex(
        item => item.id === active.id
      );
      
      const overItemIndex = columns[columnIndex].items.findIndex(
        item => item.id === over.id
      );
      
      if (itemIndex === -1 || overItemIndex === -1) return;
      
      // Use arrayMove to handle the reordering logic
      const newColumns = [...columns];
      newColumns[columnIndex].items = arrayMove(
        newColumns[columnIndex].items,
        itemIndex,
        overItemIndex
      );
      
      setColumns(newColumns);
    }
    
    setActiveItem(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="w-full md:w-1/3 space-y-1 mb-4">
        <Label htmlFor="groupBy">Group Classes By</Label>
        <Select 
          value={groupBy as string} 
          onValueChange={(value) => setGroupBy(value as keyof ProcessedData)}
        >
          <SelectTrigger id="groupBy">
            <SelectValue placeholder="Select grouping criterion" />
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {columns.map(column => (
              <SortableContext
                key={column.id}
                items={column.items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanBoard 
                  id={column.id}
                  title={column.title} 
                  items={column.items}
                  count={column.items.length}
                />
              </SortableContext>
            ))}
          </div>
          
          <DragOverlay>
            {activeItem && <KanbanCard item={activeItem} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default KanbanView;
