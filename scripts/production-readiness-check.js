#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * 
 * This script performs comprehensive checks to ensure the application
 * is ready for production deployment.
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

let checksPassed = 0
let checksFailed = 0
let checksWarning = 0

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkPass(message) {
  checksPassed++
  log(`✓ ${message}`, 'green')
}

function checkFail(message) {
  checksFailed++
  log(`✗ ${message}`, 'red')
}

function checkWarn(message) {
  checksWarning++
  log(`⚠ ${message}`, 'yellow')
}

function sectionHeader(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(title, 'cyan')
  log('='.repeat(60), 'cyan')
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath))
}

// Check if environment variable is set
function envVarExists(varName) {
  return process.env[varName] !== undefined && process.env[varName] !== ''
}

// Read package.json
function getPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json')
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'))
}

// Main checks
function runChecks() {
  log('\n🚀 VanityPOS Production Readiness Check', 'blue')
  log('Starting comprehensive production readiness checks...\n', 'blue')

  // 1. Environment Configuration
  sectionHeader('1. Environment Configuration')
  
  if (fileExists('.env.example')) {
    checkPass('.env.example file exists')
  } else {
    checkFail('.env.example file is missing')
  }

  if (fileExists('.env.production.example')) {
    checkPass('.env.production.example file exists')
  } else {
    checkWarn('.env.production.example file is missing')
  }

  if (fileExists('.gitignore')) {
    const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8')
    if (gitignore.includes('.env')) {
      checkPass('.env files are in .gitignore')
    } else {
      checkFail('.env files are NOT in .gitignore - SECURITY RISK!')
    }
  }

  // 2. Security Configuration
  sectionHeader('2. Security Configuration')

  if (fileExists('middleware.ts')) {
    checkPass('Security middleware exists')
  } else {
    checkFail('Security middleware is missing')
  }

  if (fileExists('lib/security/validation.ts')) {
    checkPass('Input validation module exists')
  } else {
    checkFail('Input validation module is missing')
  }

  if (fileExists('lib/security/password.ts')) {
    checkPass('Password security module exists')
  } else {
    checkFail('Password security module is missing')
  }

  if (fileExists('lib/security/rate-limit.ts')) {
    checkPass('Rate limiting module exists')
  } else {
    checkWarn('Rate limiting module is missing')
  }

  // 3. Database Configuration
  sectionHeader('3. Database Configuration')

  if (fileExists('prisma/schema.prisma')) {
    checkPass('Prisma schema exists')
  } else {
    checkFail('Prisma schema is missing')
  }

  if (fileExists('lib/prisma.ts')) {
    checkPass('Prisma client configuration exists')
  } else {
    checkFail('Prisma client configuration is missing')
  }

  // 4. Error Handling
  sectionHeader('4. Error Handling & Logging')

  if (fileExists('lib/error-handling/logger.ts')) {
    checkPass('Logger module exists')
  } else {
    checkFail('Logger module is missing')
  }

  if (fileExists('lib/error-handling/error-reporter.ts')) {
    checkPass('Error reporter module exists')
  } else {
    checkWarn('Error reporter module is missing')
  }

  if (fileExists('components/error-boundary.tsx')) {
    checkPass('Error boundary component exists')
  } else {
    checkFail('Error boundary component is missing')
  }

  // 5. Build Configuration
  sectionHeader('5. Build Configuration')

  if (fileExists('next.config.mjs')) {
    checkPass('Next.js configuration exists')
    
    const config = fs.readFileSync(path.join(__dirname, '..', 'next.config.mjs'), 'utf8')
    if (config.includes('poweredByHeader: false')) {
      checkPass('X-Powered-By header is disabled')
    } else {
      checkWarn('X-Powered-By header should be disabled')
    }

    if (config.includes('reactStrictMode: true')) {
      checkPass('React Strict Mode is enabled')
    } else {
      checkWarn('React Strict Mode should be enabled')
    }
  } else {
    checkFail('Next.js configuration is missing')
  }

  if (fileExists('tsconfig.json')) {
    checkPass('TypeScript configuration exists')
  } else {
    checkFail('TypeScript configuration is missing')
  }

  // 6. Package.json Scripts
  sectionHeader('6. Package Scripts')

  const pkg = getPackageJson()
  
  const requiredScripts = ['build', 'start', 'lint', 'test']
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      checkPass(`Script "${script}" is defined`)
    } else {
      checkWarn(`Script "${script}" is missing`)
    }
  })

  // 7. Dependencies
  sectionHeader('7. Dependencies')

  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    '@prisma/client',
    'next-auth',
    'bcryptjs',
    'zod',
  ]

  criticalDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      checkPass(`Dependency "${dep}" is installed`)
    } else {
      checkFail(`Critical dependency "${dep}" is missing`)
    }
  })

  // 8. Health Check Endpoint
  sectionHeader('8. Health Check & Monitoring')

  if (fileExists('app/api/health/route.ts')) {
    checkPass('Health check endpoint exists')
  } else {
    checkWarn('Health check endpoint is missing')
  }

  // 9. Documentation
  sectionHeader('9. Documentation')

  if (fileExists('README.md')) {
    checkPass('README.md exists')
  } else {
    checkWarn('README.md is missing')
  }

  if (fileExists('docs/PRODUCTION_READINESS_CHECKLIST.md')) {
    checkPass('Production readiness checklist exists')
  } else {
    checkWarn('Production readiness checklist is missing')
  }

  // 10. Deployment Configuration
  sectionHeader('10. Deployment Configuration')

  if (fileExists('vercel.json')) {
    checkPass('Vercel configuration exists')
  } else {
    checkWarn('Vercel configuration is missing (if deploying to Vercel)')
  }

  if (fileExists('.npmrc')) {
    checkPass('.npmrc configuration exists')
  } else {
    checkWarn('.npmrc configuration is missing')
  }

  // Summary
  sectionHeader('Summary')
  
  const total = checksPassed + checksFailed + checksWarning
  log(`\nTotal Checks: ${total}`, 'blue')
  log(`Passed: ${checksPassed}`, 'green')
  log(`Failed: ${checksFailed}`, 'red')
  log(`Warnings: ${checksWarning}`, 'yellow')

  const passRate = ((checksPassed / total) * 100).toFixed(1)
  log(`\nPass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red')

  if (checksFailed === 0) {
    log('\n✓ All critical checks passed! Application is ready for production.', 'green')
    return 0
  } else {
    log(`\n✗ ${checksFailed} critical check(s) failed. Please fix before deploying to production.`, 'red')
    return 1
  }
}

// Run the checks
const exitCode = runChecks()
process.exit(exitCode)

