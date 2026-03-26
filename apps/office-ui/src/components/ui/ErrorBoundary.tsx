"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-8">
          <div className="glass-panel rounded-xl p-8 neo-shadow max-w-md w-full text-center space-y-4">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-accent-warning/10 border border-accent-warning/30">
              <span className="icon text-accent-warning text-3xl">
                error_outline
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-text-muted">
              An unexpected error occurred. Please try again or refresh the
              page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-accent-warning/80 bg-background-dark/50 rounded-lg p-3 overflow-x-auto text-left max-h-32 overflow-y-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-colors"
            >
              <span className="icon text-[18px]">refresh</span>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
