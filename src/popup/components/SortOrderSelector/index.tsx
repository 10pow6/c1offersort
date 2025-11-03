import React from "react";
import type { SortOrder, SortCriteria } from "../../../types";
import "./SortOrderSelector.css";

interface SortOrderSelectorProps {
  sortOrder: SortOrder;
  sortCriteria: SortCriteria;
  onChange: (order: SortOrder) => void;
}

/**
 * Radio button group component for selecting sort order (ascending/descending).
 * Labels dynamically adjust based on sort criteria:
 * - Mileage: "Highest Miles" / "Lowest Miles"
 * - Alphabetical: "A to Z" / "Z to A"
 *
 * @param sortOrder - Currently selected sort order
 * @param sortCriteria - Current sort criteria (affects label text)
 * @param onChange - Callback function when sort order changes
 */
export const SortOrderSelector: React.FC<SortOrderSelectorProps> = ({
  sortOrder,
  sortCriteria,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value as SortOrder);
  };

  const labels = {
    desc: sortCriteria === "mileage" ? "Highest Miles" : "Z to A",
    asc: sortCriteria === "mileage" ? "Lowest Miles" : "A to Z",
  };

  const firstOption = sortCriteria === "mileage" ? "desc" : "asc";
  const secondOption = sortCriteria === "mileage" ? "asc" : "desc";

  return (
    <fieldset className="sort-order-selector">
      <label>
        <input
          type="radio"
          name="sortOrder"
          value={firstOption}
          checked={sortOrder === firstOption}
          onChange={handleChange}
        />
        <span>{firstOption === "desc" ? labels.desc : labels.asc}</span>
      </label>
      <label>
        <input
          type="radio"
          name="sortOrder"
          value={secondOption}
          checked={sortOrder === secondOption}
          onChange={handleChange}
        />
        <span>{secondOption === "desc" ? labels.desc : labels.asc}</span>
      </label>
    </fieldset>
  );
};
