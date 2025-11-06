import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/prisma'

/**
 * Health Check Endpoint
 * 
 * This endpoint is used for:
 * - Monitoring service health
 * - Load balancer health checks
 * - Uptime monitoring
 * - Database connectivity verification
 */

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection()
    
    const responseTime = Date.now() - startTime
    
    if (!dbHealthy) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'down',
            api: 'up',
          },
          responseTime: `${responseTime}ms`,
          environment: process.env.NODE_ENV,
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'up',
          api: 'up',
        },
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '0.1.0',
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'error',
          api: 'up',
        },
        responseTime: `${responseTime}ms`,
        error: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : 'Internal server error',
        environment: process.env.NODE_ENV,
      },
      { status: 503 }
    )
  }
}

// HEAD request for simple health checks
export async function HEAD() {
  try {
    const dbHealthy = await checkDatabaseConnection()
    return new NextResponse(null, { status: dbHealthy ? 200 : 503 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}

