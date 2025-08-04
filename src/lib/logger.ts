type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential sensitive information
      return data.replace(/password|token|key|secret/gi, '[REDACTED]');
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof key === 'string' && /password|token|key|secret|auth/i.test(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }
    return data;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context.component}:${context.action}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`;
  }

  debug(message: string, context?: LogContext, data?: unknown): void {
    if (this.shouldLog('debug')) {
      const sanitizedData = data ? this.sanitizeData(data) : undefined;
      console.log(this.formatMessage('debug', message, context), sanitizedData);
    }
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    if (this.shouldLog('info')) {
      const sanitizedData = data ? this.sanitizeData(data) : undefined;
      console.info(this.formatMessage('info', message, context), sanitizedData);
    }
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    if (this.shouldLog('warn')) {
      const sanitizedData = data ? this.sanitizeData(data) : undefined;
      console.warn(this.formatMessage('warn', message, context), sanitizedData);
    }
  }

  error(message: string, context?: LogContext, error?: Error | unknown): void {
    if (this.shouldLog('error')) {
      const errorInfo = error instanceof Error 
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
      const sanitizedError = this.sanitizeData(errorInfo);
      console.error(this.formatMessage('error', message, context), sanitizedError);
    }
  }
}

export const logger = new Logger();