import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (this.state.hasError) {
      if (import.meta.env.PROD) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">An unexpected error occurred. Please reload the page or try again later.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded bg-primary text-primary-foreground">Reload</button>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Frontend Error</h1>
          <p className="text-muted-foreground max-w-xl">A runtime error was caught by ErrorBoundary. Inspect details below. Fix the cause and click Reset.</p>
          <pre className="w-full max-w-2xl bg-muted p-4 rounded text-left overflow-auto text-xs">
            {this.state.error?.message}\n\n{this.state.error?.stack}\n\n{this.state.info?.componentStack}
          </pre>
          <div className="flex gap-2">
            <button onClick={this.handleReset} className="px-3 py-2 rounded bg-secondary">Reset</button>
            <button onClick={() => window.location.reload()} className="px-3 py-2 rounded bg-primary text-primary-foreground">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
