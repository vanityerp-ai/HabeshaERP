/**
 * Production Error Reporting Service
 * 
 * This service handles error reporting to external monitoring services
 * like Sentry, LogRocket, or custom error tracking systems.
 */

export interface ErrorReport {
  id: string
  timestamp: Date
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info'
  context?: Record<string, any>
  user?: {
    id?: string
    email?: string
    role?: string
  }
  request?: {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: any
  }
  environment: string
  version: string
}

class ErrorReporter {
  private static instance: ErrorReporter
  private isInitialized = false
  private errorQueue: ErrorReport[] = []
  private maxQueueSize = 100

  private constructor() {
    this.initialize()
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  private initialize() {
    if (this.isInitialized) return

    // Initialize error reporting service (e.g., Sentry)
    if (process.env.SENTRY_DSN && typeof window !== 'undefined') {
      // Client-side Sentry initialization would go here
      // import * as Sentry from '@sentry/nextjs'
      // Sentry.init({ dsn: process.env.SENTRY_DSN })
    }

    this.isInitialized = true
  }

  /**
   * Report an error to monitoring service
   */
  async reportError(error: Error, context?: Record<string, any>): Promise<void> {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      level: 'error',
      context,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    }

    // Add to queue
    this.addToQueue(errorReport)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport)
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToMonitoringService(errorReport)
    }
  }

  /**
   * Report a warning
   */
  async reportWarning(message: string, context?: Record<string, any>): Promise<void> {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message,
      level: 'warning',
      context,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    }

    this.addToQueue(errorReport)

    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning Report:', errorReport)
    }

    if (process.env.NODE_ENV === 'production') {
      await this.sendToMonitoringService(errorReport)
    }
  }

  /**
   * Report info message
   */
  async reportInfo(message: string, context?: Record<string, any>): Promise<void> {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message,
      level: 'info',
      context,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    }

    this.addToQueue(errorReport)

    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.info('Info Report:', errorReport)
    }
  }

  /**
   * Set user context for error reports
   */
  setUserContext(user: { id?: string; email?: string; role?: string }): void {
    // This would set user context in Sentry or other monitoring service
    if (typeof window !== 'undefined' && process.env.SENTRY_DSN) {
      // Sentry.setUser(user)
    }
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    if (typeof window !== 'undefined' && process.env.SENTRY_DSN) {
      // Sentry.setUser(null)
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (typeof window !== 'undefined' && process.env.SENTRY_DSN) {
      // Sentry.addBreadcrumb({ message, category, data })
    }
  }

  /**
   * Get recent errors from queue
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorQueue.slice(-limit)
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = []
  }

  private addToQueue(report: ErrorReport): void {
    this.errorQueue.push(report)
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize)
    }
  }

  private async sendToMonitoringService(report: ErrorReport): Promise<void> {
    try {
      // Send to Sentry
      if (process.env.SENTRY_DSN) {
        // Sentry.captureException would be called here
        console.log('Would send to Sentry:', report.id)
      }

      // Send to custom logging endpoint
      if (process.env.CUSTOM_ERROR_ENDPOINT) {
        await fetch(process.env.CUSTOM_ERROR_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })
      }
    } catch (error) {
      // Fail silently to avoid infinite error loops
      console.error('Failed to send error report:', error)
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance()

// Convenience functions
export const reportError = (error: Error, context?: Record<string, any>) => 
  errorReporter.reportError(error, context)

export const reportWarning = (message: string, context?: Record<string, any>) => 
  errorReporter.reportWarning(message, context)

export const reportInfo = (message: string, context?: Record<string, any>) => 
  errorReporter.reportInfo(message, context)

export const setUserContext = (user: { id?: string; email?: string; role?: string }) => 
  errorReporter.setUserContext(user)

export const clearUserContext = () => 
  errorReporter.clearUserContext()

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => 
  errorReporter.addBreadcrumb(message, category, data)

