# Environment Variables Summary for Vercel

## 🎯 WHAT YOU NEED TO DO

Add these 12 environment variables to your Vercel project settings.

---

## 📋 COMPLETE LIST - COPY & PASTE

### 1. NEXTAUTH_SECRET
```
a57b39e1af704dc01865a3962d734836136f039df6e1ff052fc7397fe74095f9
```

### 2. NEXTAUTH_URL ⚠️ IMPORTANT
```
https://your-domain.com
```
**Replace `your-domain.com` with your actual Vercel domain**  
Example: `https://habeshaerp.vercel.app`

### 3. DATABASE_URL
```
postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 4. POSTGRES_URL_NON_POOLING
```
postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### 5. NEXT_PUBLIC_SUPABASE_URL
```
https://tyxthyqrbmgjokfcfqgc.supabase.co
```

### 6. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHRoeXFyYm1nam9rZmNmcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTkwNTYsImV4cCI6MjA3OTIzNTA1Nn0.fO-u2StP_WH7CD2QJDpERZMul5gpUhtCk97m5KBf0tA
```

### 7. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHRoeXFyYm1nam9rZmNmcWdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1OTA1NiwiZXhwIjoyMDc5MjM1MDU2fQ.LihbAxaUyhe7mMLYKbmfzIrRkzbhcDCWIOlSrDgQuh8
```

### 8. USE_MOCK_DATA
```
false
```

### 9. SKIP_DB_CONNECTION
```
false
```

### 10. HOST
```
0.0.0.0
```

### 11. PORT
```
3000
```

### 12. NODE_ENV
```
production
```

---

## 🚀 HOW TO ADD TO VERCEL

1. Go to https://vercel.com/dashboard
2. Click on your **HabeshaERP** project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. For each variable:
   - Click **Add New**
   - Enter **Name** (e.g., NEXTAUTH_SECRET)
   - Enter **Value** (copy from above)
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**
6. Repeat for all 12 variables

---

## ⚠️ CRITICAL STEPS

1. **Update NEXTAUTH_URL**
   - After first deployment, get your Vercel URL
   - Update NEXTAUTH_URL to match
   - Example: `https://habeshaerp.vercel.app`

2. **Set NODE_ENV to production**
   - Not development
   - Must be `production`

3. **Keep secrets private**
   - Never share these values
   - Never commit to Git

---

## ✅ VERIFICATION

After adding all variables:
- [ ] All 12 variables added
- [ ] NEXTAUTH_URL updated to production domain
- [ ] NODE_ENV set to production
- [ ] Deploy to Vercel
- [ ] Application loads
- [ ] Database connected
- [ ] No errors in logs

---

## 📊 QUICK REFERENCE TABLE

| # | Name | Type | Value |
|---|------|------|-------|
| 1 | NEXTAUTH_SECRET | Secret | a57b39e1... |
| 2 | NEXTAUTH_URL | Public | https://your-domain.com |
| 3 | DATABASE_URL | Secret | postgres://... |
| 4 | POSTGRES_URL_NON_POOLING | Secret | postgres://... |
| 5 | NEXT_PUBLIC_SUPABASE_URL | Public | https://tyxthyqrbmgjokfcfqgc.supabase.co |
| 6 | NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | eyJhbGc... |
| 7 | SUPABASE_SERVICE_ROLE_KEY | Secret | eyJhbGc... |
| 8 | USE_MOCK_DATA | Public | false |
| 9 | SKIP_DB_CONNECTION | Public | false |
| 10 | HOST | Public | 0.0.0.0 |
| 11 | PORT | Public | 3000 |
| 12 | NODE_ENV | Public | production |

---

## 🔗 LINKS

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repo](https://github.com/vanityerp-ai/HabeshaERP)
- [Detailed Setup Guide](VERCEL_ENV_SETUP_GUIDE.md)
- [Quick Reference](VERCEL_ENV_QUICK_REFERENCE.md)
- [Final Guide](VERCEL_DEPLOYMENT_FINAL_GUIDE.md)

---

**Status**: ✅ READY FOR VERCEL  
**Total Variables**: 12  
**Date**: 2025-11-23

