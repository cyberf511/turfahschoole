'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const name = this.props.name || 'Unknown';
    console.group(`%c❌ ErrorBoundary [${name}]`, 'color: #ef4444; font-weight: bold; font-size: 14px');
    console.error('Message:', error.message);
    console.error('Error:', error);
    if (error.stack) console.error('Stack:', error.stack);
    if (info.componentStack) console.error('Component Stack:', info.componentStack);
    console.groupEnd();
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return null;
    }
    return this.props.children;
  }
}

export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  options?: Partial<ErrorBoundaryProps>,
) {
  return function Wrapped(props: T) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
