/**
 * Sorting controls component
 * Encapsulates sorting UI and logic
 */

import React from 'react';
import { SortCriteriaSelector } from '../../components/SortCriteriaSelector';
import { SortOrderSelector } from '../../components/SortOrderSelector';
import { SortButton } from '../../components/SortButton';
import { StatusMessage } from '../../components/StatusMessage';
import type { SortCriteria, SortOrder, SortResult } from '@/types';

interface ProgressUpdate {
  type: "pagination" | "sorting";
  offersLoaded?: number;
  pagesLoaded?: number;
  totalOffers?: number;
}

interface SortingControlsProps {
  criteria: SortCriteria;
  order: SortOrder;
  isLoading: boolean;
  isDisabled: boolean;
  lastResult: SortResult | null;
  progressUpdate: ProgressUpdate | null;
  onCriteriaChange: (criteria: SortCriteria) => void;
  onOrderChange: (order: SortOrder) => void;
  onSort: () => void;
}

export const SortingControls: React.FC<SortingControlsProps> = ({
  criteria,
  order,
  isLoading,
  isDisabled,
  lastResult,
  progressUpdate,
  onCriteriaChange,
  onOrderChange,
  onSort,
}) => {
  return (
    <section className="sorting-section">
      <h2>Sort Offers</h2>
      <div className="controls-grid">
        <SortCriteriaSelector sortCriteria={criteria} onChange={onCriteriaChange} disabled={isLoading} />
        <SortOrderSelector
          sortCriteria={criteria}
          sortOrder={order}
          onChange={onOrderChange}
          disabled={isLoading}
        />
      </div>
      <SortButton onClick={onSort} isLoading={isLoading} disabled={isDisabled} />
      {(lastResult || progressUpdate) && (
        <StatusMessage
          result={lastResult}
          progress={progressUpdate}
          isLoading={isLoading}
        />
      )}
    </section>
  );
};
