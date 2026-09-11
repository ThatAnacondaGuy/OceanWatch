import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6 text-white font-mono">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-2xl w-full shadow-2xl">
            <h1 className="text-2xl font-black text-red-500 mb-4">OCEANWATCH AI<br/>APPLICATION ERROR</h1>
            <p className="mb-4">The application crashed due to an uncaught React exception.</p>
            <div className="bg-black/50 p-4 rounded overflow-auto border border-red-500/30 text-red-300 text-xs whitespace-pre-wrap">
               {this.state.error?.toString()}
               {'\n\n'}
               {this.state.error?.stack}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
