# VanityPOS - Quick Start Production Deployment

## 🚀 Your Application is Production Ready!

All production readiness checks have passed. Follow these steps to deploy to production.

---

## ✅ Pre-Flight Checklist

Run the automated production readiness check:

```bash
npm run prod:check
```

Expected output: **✓ All critical checks passed! Application is ready for production.**

---

## 📦 Option 1: Deploy to Vercel (Recommended - 5 Minutes)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Set Up Environment Variables

In your Vercel Dashboard (https://vercel.com):

1. Go to your project → Settings → Environment Variables
2. Add these **REQUIRED** variables for Production:

```env
# Database (PostgreSQL Required)
DATABASE_URL=postgresql://user:password@host:port/database?schema=public&sslmode=require

# Authentication (REQUIRED)
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-production-domain.com

# Redis Cache (Highly Recommended)
REDIS_URL=rediss://username:password@host:port
REDIS_TLS_ENABLED=true

# Node Environment
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Deploy

```bash
# Deploy to production
vercel --prod

# Or use the npm script
npm run prod:deploy
```

### Step 5: Verify Deployment

After deployment, test the health endpoint:

```bash
curl https://your-domain.vercel.app/api/health
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

---

## 🐳 Option 2: Deploy with Docker

### Step 1: Build Docker Image

```bash
docker build -t vanitypos:latest .
```

### Step 2: Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e REDIS_URL="rediss://..." \
  -e NODE_ENV="production" \
  vanitypos:latest
```

Or use environment file:

```bash
docker run -p 3000:3000 --env-file .env.production vanitypos:latest
```

---

## 🔧 Option 3: Manual Deployment

### Step 1: Set Up Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit and fill in all required values
nano .env.production
```

### Step 2: Install Dependencies

```bash
npm install --production
```

### Step 3: Build Application

```bash
npm run build
```

### Step 4: Run Database Migrations

```bash
npx prisma migrate deploy
```

### Step 5: Start Production Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

---

## 🗄️ Database Setup

### Recommended PostgreSQL Providers

1. **Neon** (https://neon.tech) - Serverless PostgreSQL
   - Free tier available
   - Automatic scaling
   - Built-in connection pooling

2. **Supabase** (https://supabase.com) - PostgreSQL with extras
   - Free tier available
   - Real-time subscriptions
   - Built-in authentication

3. **Railway** (https://railway.app) - Simple PostgreSQL hosting
   - $5/month
   - Easy setup
   - Automatic backups

4. **AWS RDS** - Enterprise-grade PostgreSQL
   - Highly scalable
   - Advanced features
   - Higher cost

### Database Migration

After setting up your PostgreSQL database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npm run db:seed
```

---

## 💾 Redis Cache Setup

### Recommended Redis Providers

1. **Upstash** (https://upstash.com) - Serverless Redis
   - Free tier: 10,000 commands/day
   - Global edge caching
   - REST API

2. **Redis Cloud** (https://redis.com/cloud/)
   - Free tier: 30MB
   - Managed service
   - High availability

3. **Railway** (https://railway.app)
   - $5/month
   - Simple setup
   - Automatic backups

### Redis Configuration

Add to your environment variables:

```env
REDIS_URL=rediss://default:password@host:port
REDIS_TLS_ENABLED=true
CACHE_ENABLED=true
CACHE_TTL=300
```

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] `NEXTAUTH_SECRET` is set to a strong random value
- [ ] Database connection uses SSL (`sslmode=require`)
- [ ] Redis connection uses TLS (`rediss://`)
- [ ] All API keys are stored in environment variables
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Security headers are enabled (automatic via middleware)
- [ ] Rate limiting is configured
- [ ] CORS is properly configured for your domain

---

## 📊 Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

### 2. Test Authentication

1. Navigate to `https://your-domain.com/login`
2. Log in with admin credentials
3. Verify dashboard loads correctly

### 3. Test Database Operations

1. Create a new client
2. Create a new appointment
3. Process a transaction
4. Verify data persists

### 4. Check Performance

- Page load time < 3 seconds
- API response time < 500ms
- No console errors in browser

### 5. Verify Security Headers

```bash
curl -I https://your-domain.com
```

Look for:
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`

---

## 📈 Monitoring Setup

### 1. Error Tracking (Sentry)

Add to environment variables:

```env
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### 2. Uptime Monitoring

Set up monitoring with:
- **UptimeRobot** (https://uptimerobot.com) - Free
- **Pingdom** (https://pingdom.com) - Paid
- **Better Uptime** (https://betteruptime.com) - Free tier

Monitor endpoint: `https://your-domain.com/api/health`

### 3. Analytics

Vercel Analytics is automatically enabled for Vercel deployments.

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Run production readiness check
npm run prod:check

# Check for TypeScript errors
npm run type-check

# Try building locally
npm run build
```

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Ensure database allows connections from your deployment platform
- Check SSL/TLS settings
- Verify firewall rules

### Authentication Not Working

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure cookies are enabled
- Check browser console for errors

### Performance Issues

- Enable Redis caching
- Check database query performance
- Review bundle size
- Enable CDN for static assets

---

## 📚 Additional Resources

- **Full Deployment Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Production Readiness Summary**: `PRODUCTION_READINESS_SUMMARY.md`
- **Environment Variables**: `.env.production.example`
- **Production Checklist**: `docs/PRODUCTION_READINESS_CHECKLIST.md`

---

## 🎉 You're Ready to Go Live!

Your VanityPOS application is production-ready. Choose your deployment method above and follow the steps.

**Need Help?**
- Check the troubleshooting section above
- Review the full deployment guide
- Check application logs for errors

**Good luck with your launch! 🚀**

