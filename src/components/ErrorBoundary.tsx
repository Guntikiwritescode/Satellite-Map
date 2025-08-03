import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Store error info for debugging
    this.setState({ errorInfo });
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  private handleRetry = () => {
    this.retryCount++;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <Card className="terminal-panel max-w-lg w-full p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="h-16 w-16 text-danger-red mx-auto mb-4 animate-terminal-flicker" />
              <h2 className="text-xl font-display text-danger-red mb-2">
                [ SYSTEM ERROR ]
              </h2>
              <p className="text-terminal-green font-terminal text-sm mb-4">
                {this.state.error?.message || 'An unexpected error occurred in the satellite tracking system.'}
              </p>
              
              {isDevelopment && this.state.error && (
                <details className="text-left bg-card/50 p-3 rounded border border-border/30 mb-4">
                  <summary className="text-xs font-terminal text-neon-cyan cursor-pointer">
                    Debug Information
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>
            
            <div className="flex gap-3 justify-center">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry}
                  className="terminal-button"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  RETRY OPERATION
                </Button>
              )}
              <Button 
                onClick={this.handleReload}
                className="terminal-button"
                variant="default"
              >
                RESTART SYSTEM
              </Button>
            </div>
            
            <p className="text-xs font-terminal text-muted-foreground mt-4">
              ERROR CODE: {this.state.error?.name || 'UNKNOWN'} | 
              RETRY COUNT: {this.retryCount}/{this.maxRetries}
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;