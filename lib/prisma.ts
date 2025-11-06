import { PrismaClient } from '@prisma/client'

/**
 * Production-Ready Prisma Client Configuration
 *
 * Features:
 * - Connection pooling for production
 * - Proper logging based on environment
 * - Error handling and monitoring
 * - Singleton pattern to prevent connection leaks
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Determine log level based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV
  const logLevel = process.env.LOG_LEVEL?.toLowerCase()

  if (env === 'production') {
    // In production, only log errors and warnings by default
    if (logLevel === 'debug') {
      return ['query', 'error', 'warn'] as const
    }
    return ['error', 'warn'] as const
  }

  // In development, log everything
  return ['query', 'error', 'warn', 'info'] as const
}

// Create Prisma Client with production-ready configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: getLogLevel(),

  // Error formatting for better debugging
  errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',

  // Database connection configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Middleware for query logging and monitoring
prisma.$use(async (params, next) => {
  const before = Date.now()

  try {
    const result = await next(params)
    const after = Date.now()
    const duration = after - before

    // Log slow queries in production (> 1000ms)
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`)
    }

    // Log all queries in development if debug mode is enabled
    if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'DEBUG') {
      console.log(`Query: ${params.model}.${params.action} - ${duration}ms`)
    }

    return result
  } catch (error) {
    const after = Date.now()
    const duration = after - before

    // Log query errors
    console.error(`Query error: ${params.model}.${params.action} failed after ${duration}ms`, error)
    throw error
  }
})

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('Disconnecting Prisma Client...')
  await prisma.$disconnect()
  console.log('Prisma Client disconnected')
}

// Register shutdown handlers
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
  process.on('beforeExit', gracefulShutdown)
}

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Export types for use in the application
export type { PrismaClient } from '@prisma/client'


