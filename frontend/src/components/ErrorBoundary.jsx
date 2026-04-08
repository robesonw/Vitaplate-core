import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error.message, info.componentStack?.split('\n')[1]);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { title = 'Something went wrong', minimal = false } = this.props;

    if (minimal) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>This section failed to load.</span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="ml-auto underline text-xs"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-md">
          This page ran into a problem. Your data is safe — this is a display error only.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/Dashboard'}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre className="mt-6 text-left text-xs bg-slate-100 p-4 rounded-lg max-w-full overflow-auto text-red-600">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}

// Convenience wrapper for page-level boundaries
export function PageErrorBoundary({ children, title }) {
  return (
    <ErrorBoundary title={title}>
      {children}
    </ErrorBoundary>
  );
}

// Convenience wrapper for card/component-level boundaries (minimal UI)
export function ComponentErrorBoundary({ children }) {
  return (
    <ErrorBoundary minimal>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
