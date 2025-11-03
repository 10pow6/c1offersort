import React from "react";
import "./HelpButton.css";

/**
 * Small help/support button with email tooltip
 */
export const HelpButton: React.FC = () => {
  return (
    <div className="help-button">
      ?
      <div className="help-tooltip">
        Questions or support:{" "}
        <span className="help-email">noritheshibadev@gmail.com</span>
      </div>
    </div>
  );
};
