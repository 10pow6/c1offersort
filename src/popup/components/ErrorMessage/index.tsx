import "./ErrorMessage.css";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Error message component with optional dismiss functionality.
 * Displays an alert icon and error text with role="alert" for accessibility.
 */
const ErrorMessage = ({ message, onDismiss }: ErrorMessageProps) => {
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
