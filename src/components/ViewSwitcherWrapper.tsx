
import React from 'react';
import { ViewMode } from '@/types/data';
import { ViewSwitcher } from './ViewSwitcher';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ViewSwitcherWrapperProps {
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
}

export const ViewSwitcherWrapper: React.FC<ViewSwitcherWrapperProps> = ({ viewMode, setViewMode }) => {
  return (
    <TooltipProvider>
      <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
    </TooltipProvider>
  );
};
