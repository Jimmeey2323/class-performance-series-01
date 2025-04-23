
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanItem } from '@/types/data';
import KanbanCard from './KanbanCard';

interface KanbanBoardProps {
  items: KanbanItem[];
  groupBy: string;
  avatars?: Record<string, string>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ items, groupBy, avatars }) => {
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>(items);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setKanbanItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={kanbanItems.map(item => ({ id: item.id }))}
          strategy={verticalListSortingStrategy}
        >
          {kanbanItems.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              groupBy={groupBy}
              avatarUrl={avatars?.[item.content.teacherName]}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
