
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanBoard from './KanbanBoard';
import KanbanCard from './KanbanCard';
import { Card, CardContent } from '@/components/ui/card';
import { Grid, List, Rows, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KanbanViewProps {
  data: ProcessedData[];
  trainerAvatars?: Record<string, string>;
}

const KanbanView: React.FC<KanbanViewProps> = ({ data, trainerAvatars = {} }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'dayOfWeek' | 'teacherName' | 'cleanedClass'>('dayOfWeek');
  const [view, setView] = useState<'columns' | 'grid'>('columns');
  const [showEmpty, setShowEmpty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedData = React.useMemo(() => {
    // Filter out empty data if showEmpty is false
    const filteredData = showEmpty 
      ? data 
      : data.filter(item => Number(item.totalCheckins) > 0);

    const groups: Record<string, { id: string; data: ProcessedData }[]> = {};
    
    filteredData.forEach(item => {
      const key = item[groupBy] as string;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push({
        id: `${item.uniqueID}:${key}`,
        data: item
      });
    });
    
    return groups;
  }, [data, groupBy, showEmpty]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event: any) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle dropping item in a different column
      // This would be where you'd update the item's status
      console.log(`Moved item ${active.id} to ${over.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant={view === 'columns' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setView('columns')}
              className="w-9 h-9 p-0"
            >
              <Columns className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'grid' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setView('grid')}
              className="w-9 h-9 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-empty"
              checked={showEmpty}
              onCheckedChange={setShowEmpty}
            />
            <Label htmlFor="show-empty">Show empty classes</Label>
          </div>
        </div>

        <Select 
          value={groupBy} 
          onValueChange={(value: any) => setGroupBy(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dayOfWeek">Group by Day</SelectItem>
            <SelectItem value="teacherName">Group by Trainer</SelectItem>
            <SelectItem value="cleanedClass">Group by Class Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className={`flex gap-4 ${view === 'columns' ? 'flex-row' : 'flex-wrap'}`} style={{ minWidth: view === 'columns' ? Object.keys(groupedData).length * 300 + 'px' : 'auto' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {Object.entries(groupedData).map(([columnId, items]) => (
              <div key={columnId} className={view === 'grid' ? 'w-[300px]' : ''}>
                <KanbanBoard
                  id={columnId}
                  title={columnId}
                  items={items}
                  count={items.length}
                />
              </div>
            ))}

            <DragOverlay>
              {activeId ? (
                <Card className="w-[300px] border border-primary/50 shadow-md">
                  <CardContent className="p-3">
                    {activeId.split(':')[0]}
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>

          {Object.keys(groupedData).length === 0 && (
            <div className="w-full text-center p-8 border rounded-lg text-gray-500">
              No data available to display in Kanban view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanView;
