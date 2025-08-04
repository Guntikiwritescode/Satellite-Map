import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorBoundary?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Use our logger instead of console.error
    logger.error('Error boundary caught an error', {
      component: 'ErrorBoundary',
      action: 'componentDidCatch'
    }, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      }
    });

    // Set a user-friendly error message
    this.setState({
      errorBoundary: this.getUserFriendlyErrorMessage(error)
    });
  }

  private getUserFriendlyErrorMessage(error: Error): string {
    // Don't expose sensitive error details to users
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'A resource failed to load. Please refresh the page.';
    }
    
    if (error.message.includes('Network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return ERROR_MESSAGES.PERMISSION_DENIED;
    }
    
    // Default to generic error message to avoid exposing implementation details
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorBoundary: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use the sanitized error message instead of raw error details
      const displayMessage = this.state.errorBoundary || ERROR_MESSAGES.UNKNOWN_ERROR;

      return (
        <Card className="glass-panel p-8 m-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-destructive/20 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {displayMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                If this problem persists, please try refreshing the page or contact support.
              </p>
            </div>
            <Button onClick={this.handleReset} variant="outline" className="cosmic-border">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;