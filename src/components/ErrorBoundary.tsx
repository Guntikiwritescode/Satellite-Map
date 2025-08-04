import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    errorStack: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred',
      errorStack: error.stack,
    };
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
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: undefined });
  };

  private getErrorType = (errorMessage: string): { title: string; description: string; suggestion: string } => {
    // Enhanced error classification with security-focused messages
    if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
      return {
        title: 'Loading Error',
        description: 'A resource failed to load.',
        suggestion: 'Please refresh the page and try again.'
      };
    }

    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Network')) {
      return {
        title: 'Network Error',
        description: ERROR_MESSAGES.NETWORK_ERROR,
        suggestion: 'Check your internet connection and try again.'
      };
    }
    
    if (errorMessage.includes('satellite') || errorMessage.includes('TLE')) {
      return {
        title: 'Satellite Data Error',
        description: 'There was a problem processing satellite information.',
        suggestion: 'The data might be temporarily unavailable. Please try again.'
      };
    }
    
    if (errorMessage.includes('WebGL') || errorMessage.includes('three')) {
      return {
        title: 'Graphics Error',
        description: 'There was a problem with the 3D visualization.',
        suggestion: 'Try refreshing the page or use a different browser.'
      };
    }

    if (errorMessage.includes('Permission') || errorMessage.includes('Unauthorized')) {
      return {
        title: 'Permission Error',
        description: ERROR_MESSAGES.PERMISSION_DENIED,
        suggestion: 'Please check your permissions and try again.'
      };
    }
    
    return {
      title: 'Application Error',
      description: ERROR_MESSAGES.UNKNOWN_ERROR,
      suggestion: 'Please try refreshing the page or contact support if the problem persists.'
    };
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.errorMessage);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">{errorType.title}</CardTitle>
              </div>
              <CardDescription>
                {errorType.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {errorType.suggestion}
              </p>
              
              {import.meta.env.DEV && this.state.errorStack && (
                <details className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.errorStack}</pre>
                </details>
              )}
              
              <div className="flex space-x-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;