/**
 * Enhanced error boundary for individual features.
 * Provides isolated error handling without crashing the entire popup.
 */

import React, { Component, ReactNode } from 'react';
import './FeatureErrorBoundary.css';

interface Props {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(
      `[FeatureErrorBoundary] Error in ${this.props.feature}:`,
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="feature-error-boundary">
          <div className="feature-error-boundary__content">
            <div className="feature-error-boundary__icon">⚠️</div>
            <h3 className="feature-error-boundary__title">
              {this.props.feature} Error
            </h3>
            <p className="feature-error-boundary__message">
              {this.state.error?.message || 'Something went wrong'}
            </p>
            <button
              className="feature-error-boundary__button"
              onClick={this.handleReset}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
