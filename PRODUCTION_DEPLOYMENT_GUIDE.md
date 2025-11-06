# VanityPOS - Production Deployment Guide

This comprehensive guide will walk you through deploying VanityPOS to production.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Security Configuration](#security-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Deployment Checklist

Before deploying to production, run the production readiness check:

```bash
npm run prod:check
```

This will verify:
- ✅ Environment configuration files
- ✅ Security modules
- ✅ Database configuration
- ✅ Error handling
- ✅ Build configuration
- ✅ Required dependencies
- ✅ Health check endpoints
- ✅ Documentation

**All critical checks must pass before proceeding.**

---

## 🌍 Environment Setup

### 1. Create Production Environment File

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

### 2. Configure Required Environment Variables

Edit `.env.production` and set the following **REQUIRED** variables:

#### Database (PostgreSQL Required)
```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public&sslmode=require"
```

**Recommended Managed PostgreSQL Services:**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL with additional features
- [Railway](https://railway.app) - Simple PostgreSQL hosting
- [AWS RDS](https://aws.amazon.com/rds/) - Enterprise-grade PostgreSQL

#### Authentication
```env
NEXTAUTH_SECRET="your-super-secure-secret-minimum-32-characters"
NEXTAUTH_URL="https://your-production-domain.com"
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

#### Redis Cache (Required for Production)
```env
REDIS_URL="rediss://username:password@host:port"
REDIS_TLS_ENABLED=true
```

**Recommended Redis Services:**
- [Upstash](https://upstash.com) - Serverless Redis
- [Redis Cloud](https://redis.com/cloud/) - Managed Redis
- [Railway](https://railway.app) - Simple Redis hosting

### 3. Configure Optional Services

#### Email Service
```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@your-domain.com"
```

#### Error Tracking (Sentry)
```env
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

#### File Storage (Vercel Blob)
```env
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

---

## 🗄️ Database Configuration

### 1. Set Up PostgreSQL Database

Create a new PostgreSQL database using your chosen provider.

### 2. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Deploy migrations to production
npx prisma migrate deploy
```

### 3. Seed Initial Data (Optional)

```bash
npm run db:seed
```

### 4. Verify Database Connection

Test the database connection:

```bash
npx prisma db pull
```

---

## 🔒 Security Configuration

### 1. SSL/TLS Configuration

Ensure all services use SSL/TLS:
- ✅ Database connection uses `sslmode=require`
- ✅ Redis connection uses `rediss://` protocol
- ✅ Application served over HTTPS
- ✅ Email service uses TLS

### 2. Security Headers

Security headers are automatically configured in `middleware.ts`:
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security (HSTS)
- ✅ Content-Security-Policy (CSP)
- ✅ Referrer-Policy

### 3. Rate Limiting

Rate limiting is enabled by default in production:
- 100 requests per minute per IP
- Configurable via environment variables

### 4. Password Policy

Production password requirements:
- Minimum 12 characters
- Uppercase, lowercase, numbers, and symbols required
- Common passwords blocked
- Sequential characters blocked

---

## 🚀 Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.production`
3. Set environment to "Production"

#### 4. Deploy

```bash
# Production deployment
npm run prod:deploy

# Or manually
vercel --prod
```

### Option 2: Deploy to Other Platforms

#### Docker Deployment

```bash
# Build Docker image
docker build -t vanitypos:latest .

# Run container
docker run -p 3000:3000 --env-file .env.production vanitypos:latest
```

#### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## ✅ Post-Deployment Verification

### 1. Health Check

Verify the application is running:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": "up",
    "api": "up"
  }
}
```

### 2. Test Critical Functionality

- [ ] User login/authentication
- [ ] Database operations (create, read, update, delete)
- [ ] File uploads (if applicable)
- [ ] Email notifications (if configured)
- [ ] Payment processing (if configured)

### 3. Performance Testing

- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database query times < 100ms

### 4. Security Testing

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Authentication required for protected routes

---

## 📊 Monitoring & Maintenance

### 1. Set Up Monitoring

#### Application Monitoring
- Use Vercel Analytics (built-in)
- Configure Sentry for error tracking
- Set up uptime monitoring (e.g., UptimeRobot)

#### Database Monitoring
- Monitor connection pool usage
- Track slow queries
- Set up automated backups

### 2. Regular Maintenance Tasks

#### Daily
- [ ] Check error logs
- [ ] Monitor application performance
- [ ] Review security alerts

#### Weekly
- [ ] Review database performance
- [ ] Check disk space usage
- [ ] Update dependencies (security patches)

#### Monthly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Backup restoration test

### 3. Backup Strategy

#### Database Backups
- Automated daily backups
- Retain backups for 30 days
- Test restoration monthly

#### File Storage Backups
- Automated backups of uploaded files
- Versioning enabled

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem:** Cannot connect to database

**Solutions:**
- Verify DATABASE_URL is correct
- Check SSL/TLS configuration
- Ensure database is accessible from deployment platform
- Check firewall rules

#### 2. Build Failures

**Problem:** Build fails during deployment

**Solutions:**
```bash
# Run production readiness check
npm run prod:check

# Check TypeScript errors
npm run type-check

# Test build locally
npm run build
```

#### 3. Authentication Issues

**Problem:** Users cannot log in

**Solutions:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches production domain
- Ensure cookies are enabled
- Check session configuration

#### 4. Performance Issues

**Problem:** Slow page loads

**Solutions:**
- Enable Redis caching
- Optimize database queries
- Enable CDN for static assets
- Review bundle size

### Getting Help

- 📧 Email: support@vanityhub.com
- 📚 Documentation: [docs/](./docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

## 📝 Additional Resources

- [Production Readiness Checklist](./docs/PRODUCTION_READINESS_CHECKLIST.md)
- [Security Implementation Guide](./docs/SECURITY_IMPLEMENTATION.md)
- [Database Migration Guide](./docs/DATABASE_MIGRATION_GUIDE.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Error Handling Guide](./docs/ERROR_HANDLING_GUIDE.md)

---

## 🎉 Congratulations!

Your VanityPOS application is now running in production! 

Remember to:
- Monitor application health regularly
- Keep dependencies updated
- Review security logs
- Maintain regular backups
- Test disaster recovery procedures

For ongoing support and updates, refer to the documentation and community resources.

