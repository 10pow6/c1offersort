/**
 * View mode controls component
 * Toggle between grid and table view
 */

import React from 'react';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import type { ViewMode } from '@/types';

interface ViewModeControlsProps {
  viewMode: ViewMode;
  isLoading: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

export const ViewModeControls: React.FC<ViewModeControlsProps> = ({
  viewMode,
  isLoading,
  isDisabled,
  onToggle,
}) => {
  return (
    <div className="feature-toggle">
      <div className="toggle-header">
        <span className="toggle-label">Table View</span>
        <ToggleSwitch
          checked={viewMode === "table"}
          onChange={onToggle}
          disabled={isLoading || isDisabled}
        />
      </div>
      <p className="feature-description">
        View offers in a compact table format
      </p>
    </div>
  );
};
