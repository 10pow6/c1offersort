import React from "react";
import "./ErrorMessage.css";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Error message component with optional dismiss functionality.
 * Displays an alert icon and error text with role="alert" for accessibility.
 *
 * @param message - The error message text to display
 * @param onDismiss - Optional callback function when dismiss button is clicked
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="error-message" role="alert">
      <span className="error-message-icon" aria-hidden="true">
        ⚠
      </span>
      <span className="error-message-text">{message}</span>
      {onDismiss && (
        <button
          className="error-message-close"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
