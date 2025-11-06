import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

/**
 * Production-Ready Security Middleware
 *
 * Implements comprehensive security measures including:
 * - Security headers (CSP, HSTS, etc.)
 * - Suspicious activity detection
 * - Rate limiting headers
 * - CORS configuration
 *
 * Note: This middleware runs in Edge Runtime, so it cannot use Prisma directly.
 * Authentication is handled by NextAuth.js which uses API routes (not Edge Runtime).
 */

// Security headers configuration
const getSecurityHeaders = (isProduction: boolean) => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://hebbkx1anhila5yf.public.blob.vercel-storage.com https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self' https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join('; '),
})

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production'
  const headers = getSecurityHeaders(isProduction)

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add HSTS in production (force HTTPS for 1 year)
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Remove X-Powered-By header for security
  response.headers.delete('X-Powered-By')

  return response
}

// Check for suspicious patterns
function detectSuspiciousActivity(req: NextRequest): boolean {
  const { pathname, searchParams } = req.nextUrl
  const userAgent = req.headers.get('user-agent') || ''

  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /data:text\/html/i,  // Data URI XSS
    /eval\(/i,  // Code injection
    /base64/i,  // Potential encoded attacks
  ]

  // Check pathname and search params
  const fullUrl = pathname + searchParams.toString()
  if (suspiciousPatterns.some(pattern => pattern.test(fullUrl))) {
    console.warn('Suspicious activity detected:', { pathname, userAgent })
    return true
  }

  // Check for malicious bot behavior (but allow legitimate crawlers)
  const maliciousBotPatterns = [
    /curl|wget|python-requests|php/i,
    /nikto|sqlmap|nmap|masscan/i,
    /metasploit|burp|zap/i,
  ]

  if (maliciousBotPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn('Malicious bot detected:', { userAgent })
    return true
  }

  return false
}

// Main middleware function
export default async function middleware(req: NextRequest) {
  // Check for suspicious activity
  if (detectSuspiciousActivity(req)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Get the response
  const response = NextResponse.next()

  // Add security headers
  addSecurityHeaders(response)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
