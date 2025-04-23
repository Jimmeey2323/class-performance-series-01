
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
      <Card className="h-full bg-white dark:bg-gray-900 border-indigo-100 dark:border-indigo-900 shadow-md overflow-hidden" ref={setNodeRef}>
        <CardHeader className="p-4 pb-2 border-b bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">{count}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-y-auto max-h-[calc(100vh-250px)] bg-gradient-to-b from-indigo-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map(item => (
                <KanbanCard key={item.id} item={item.data} trainerAvatars={{}} />
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
