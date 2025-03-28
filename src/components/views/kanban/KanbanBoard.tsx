
import React from 'react';
import { KanbanItem } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';

interface KanbanBoardProps {
  id: string;
  title: string;
  items: KanbanItem[];
  count: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ id, title, items, count }) => {
  const { setNodeRef } = useDroppable({
    id: `column:${id}`,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full" ref={setNodeRef}>
        <CardHeader className="p-4 pb-2 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <Badge variant="secondary">{count}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-y-auto max-h-[calc(100vh-250px)]">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map(item => (
                <KanbanCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
              No classes in this group
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanBoard;
