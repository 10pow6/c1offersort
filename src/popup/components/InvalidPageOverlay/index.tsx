import React from "react";
import { VALID_URLS } from "../../../utils/constants";
import "./InvalidPageOverlay.css";

/**
 * Full-page overlay component displayed when the extension is opened on a non-Capital One offers page.
 * Shows an error message and provides a button to navigate to the correct page.
 */
export const InvalidPageOverlay: React.FC = () => {
  const handleGoToOffers = () => {
    window.open(VALID_URLS[0], "_blank");
  };

  return (
    <div className="invalid-page-overlay">
      <svg
        viewBox="0 0 24 24"
        width="48"
        height="48"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="overlay-icon"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div className="overlay-title">Invalid Page</div>
      <div className="overlay-message">
        This extension only works on the Capital One Offers page.
      </div>
      <button onClick={handleGoToOffers} className="overlay-button">
        Go to Offers Page
      </button>
    </div>
  );
};
