import React from 'react';
import { List, Grid3X3 } from 'lucide-react';
import { Button } from './Button';

export type ViewMode = 'list' | 'grid';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="px-3 py-2"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="px-3 py-2"
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
