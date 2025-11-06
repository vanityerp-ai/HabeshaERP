import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Production Security Middleware
 * 
 * This middleware adds security headers and enforces security policies
 * for production deployments.
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Only apply security headers in production
  if (process.env.NODE_ENV === 'production') {
    // Security Headers
    
    // Prevent clickjacking attacks
    response.headers.set('X-Frame-Options', 'DENY')
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Permissions Policy (formerly Feature Policy)
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )
    
    // Content Security Policy
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://hebbkx1anhila5yf.public.blob.vercel-storage.com https://images.unsplash.com;
      font-src 'self' data:;
      connect-src 'self' https://vercel.live;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
    
    response.headers.set('Content-Security-Policy', cspHeader)
    
    // Strict Transport Security (HSTS)
    // Force HTTPS for 1 year, including subdomains
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    
    // Remove X-Powered-By header (already done in next.config.mjs)
    response.headers.delete('X-Powered-By')
  }

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    const origin = request.headers.get('origin')
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      )
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

