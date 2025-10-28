import React from "react";
import type { SortCriteria } from "../../../types";
import "./SortCriteriaSelector.css";

interface SortCriteriaSelectorProps {
  sortCriteria: SortCriteria;
  onChange: (criteria: SortCriteria) => void;
}

/**
 * Radio button group component for selecting sort criteria.
 * Allows users to choose between sorting by mileage value or merchant name.
 * Uses semantic fieldset/legend elements for accessibility.
 *
 * @param sortCriteria - Currently selected sort criteria
 * @param onChange - Callback function when criteria selection changes
 */
export const SortCriteriaSelector: React.FC<SortCriteriaSelectorProps> = ({
  sortCriteria,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value as SortCriteria);
  };

  return (
    <fieldset className="sort-criteria-selector">
      <legend>Sort by:</legend>
      <label>
        <input
          type="radio"
          name="sortCriteria"
          value="mileage"
          checked={sortCriteria === "mileage"}
          onChange={handleChange}
        />
        <span>Mileage Value</span>
      </label>
      <label>
        <input
          type="radio"
          name="sortCriteria"
          value="alphabetical"
          checked={sortCriteria === "alphabetical"}
          onChange={handleChange}
        />
        <span>Merchant Name</span>
      </label>
    </fieldset>
  );
};
