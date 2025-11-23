# Vercel Environment Variables Setup Guide

## 🚀 ENVIRONMENT VARIABLES FOR VERCEL

Copy and paste these environment variables into your Vercel project settings.

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

### 1. **NextAuth Configuration**

```
NEXTAUTH_SECRET=a57b39e1af704dc01865a3962d734836136f039df6e1ff052fc7397fe74095f9
```

```
NEXTAUTH_URL=https://your-domain.com
```
⚠️ **IMPORTANT**: Replace `your-domain.com` with your actual production domain (e.g., `habeshaerp.vercel.app`)

---

### 2. **Database Configuration - PostgreSQL (Supabase)**

```
DATABASE_URL=postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

```
POSTGRES_URL_NON_POOLING=postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

---

### 3. **Supabase Configuration**

```
NEXT_PUBLIC_SUPABASE_URL=https://tyxthyqrbmgjokfcfqgc.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHRoeXFyYm1nam9rZmNmcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTkwNTYsImV4cCI6MjA3OTIzNTA1Nn0.fO-u2StP_WH7CD2QJDpERZMul5gpUhtCk97m5KBf0tA
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHRoeXFyYm1nam9rZmNmcWdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1OTA1NiwiZXhwIjoyMDc5MjM1MDU2fQ.LihbAxaUyhe7mMLYKbmfzIrRkzbhcDCWIOlSrDgQuh8
```

---

### 4. **Application Configuration**

```
USE_MOCK_DATA=false
```

```
SKIP_DB_CONNECTION=false
```

```
HOST=0.0.0.0
```

```
PORT=3000
```

```
NODE_ENV=production
```
⚠️ **IMPORTANT**: Set to `production` for Vercel (not `development`)

---

## 📝 STEP-BY-STEP SETUP INSTRUCTIONS

### Step 1: Go to Vercel Project Settings
1. Visit https://vercel.com/dashboard
2. Select your project: `HabeshaERP`
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Each Variable
For each variable above:
1. Click **Add New**
2. Enter the **Name** (e.g., `NEXTAUTH_SECRET`)
3. Enter the **Value** (copy from above)
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**

### Step 3: Update NEXTAUTH_URL
1. After deployment, get your Vercel URL
2. Update `NEXTAUTH_URL` to your production domain
3. Example: `https://habeshaerp.vercel.app`

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Select **Redeploy**
4. Confirm redeploy

---

## 🔐 SECURITY NOTES

⚠️ **IMPORTANT SECURITY CONSIDERATIONS**:

1. **Never commit `.env` to Git** - Already in `.gitignore`
2. **Keep secrets private** - Don't share these values
3. **Rotate secrets regularly** - Consider rotating keys periodically
4. **Use strong NEXTAUTH_SECRET** - Current one is strong
5. **Monitor database access** - Check Supabase logs
6. **Enable SSL/TLS** - Already configured (sslmode=require)

---

## ✅ VERIFICATION CHECKLIST

After setting up environment variables:

- [ ] All 10 variables added to Vercel
- [ ] NEXTAUTH_URL updated to production domain
- [ ] NODE_ENV set to `production`
- [ ] Database connection tested
- [ ] Application deployed successfully
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] No errors in logs

---

## 🚀 DEPLOYMENT COMMAND

After setting environment variables:

```bash
# Deploy to Vercel
vercel deploy --prod
```

Or use Vercel CLI:
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 📊 ENVIRONMENT VARIABLES SUMMARY

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| NEXTAUTH_SECRET | Secret | ✅ | Authentication secret |
| NEXTAUTH_URL | Public | ✅ | Update for production |
| DATABASE_URL | Secret | ✅ | Connection pooling (port 6543) |
| POSTGRES_URL_NON_POOLING | Secret | ✅ | For migrations (port 5432) |
| NEXT_PUBLIC_SUPABASE_URL | Public | ✅ | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | ✅ | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Secret | ✅ | Supabase service role |
| USE_MOCK_DATA | Public | ✅ | Set to false |
| SKIP_DB_CONNECTION | Public | ✅ | Set to false |
| HOST | Public | ✅ | Set to 0.0.0.0 |
| PORT | Public | ✅ | Set to 3000 |
| NODE_ENV | Public | ✅ | Set to production |

---

## 🔗 USEFUL LINKS

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## 📞 TROUBLESHOOTING

### Issue: "Can't reach database server"
**Solution**: Verify DATABASE_URL is correct and Supabase is running

### Issue: "NEXTAUTH_SECRET is not set"
**Solution**: Add NEXTAUTH_SECRET to Vercel environment variables

### Issue: "Invalid NEXTAUTH_URL"
**Solution**: Update NEXTAUTH_URL to match your production domain

### Issue: "Database connection timeout"
**Solution**: Check Supabase connection pooling settings

---

## ✅ READY FOR DEPLOYMENT

All environment variables are configured and ready for Vercel deployment!

**Next Steps**:
1. Add variables to Vercel
2. Update NEXTAUTH_URL
3. Deploy to production
4. Monitor application

---

**Date**: 2025-11-23  
**Status**: ✅ READY FOR VERCEL DEPLOYMENT

