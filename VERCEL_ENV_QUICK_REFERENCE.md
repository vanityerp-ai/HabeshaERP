# Vercel Environment Variables - Quick Reference

## 🚀 COPY & PASTE THESE VARIABLES INTO VERCEL

Go to: **Vercel Dashboard → Project Settings → Environment Variables**

---

## 📋 ALL 12 ENVIRONMENT VARIABLES

### 1️⃣ NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: a57b39e1af704dc01865a3962d734836136f039df6e1ff052fc7397fe74095f9
```

### 2️⃣ NEXTAUTH_URL ⚠️ UPDATE THIS!
```
Name: NEXTAUTH_URL
Value: https://your-domain.com
```
**Replace `your-domain.com` with your Vercel domain (e.g., `habeshaerp.vercel.app`)**

### 3️⃣ DATABASE_URL
```
Name: DATABASE_URL
Value: postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 4️⃣ POSTGRES_URL_NON_POOLING
```
Name: POSTGRES_URL_NON_POOLING
Value: postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### 5️⃣ NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://tyxthyqrbmgjokfcfqgc.supabase.co
```

### 6️⃣ NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHRoeXFyYm1nam9rZmNmcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTkwNTYsImV4cCI6MjA3OTIzNTA1Nn0.fO-u2StP_WH7CD2QJDpERZMul5gpUhtCk97m5KBf0tA
```

### 7️⃣ SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHRoeXFyYm1nam9rZmNmcWdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1OTA1NiwiZXhwIjoyMDc5MjM1MDU2fQ.LihbAxaUyhe7mMLYKbmfzIrRkzbhcDCWIOlSrDgQuh8
```

### 8️⃣ USE_MOCK_DATA
```
Name: USE_MOCK_DATA
Value: false
```

### 9️⃣ SKIP_DB_CONNECTION
```
Name: SKIP_DB_CONNECTION
Value: false
```

### 🔟 HOST
```
Name: HOST
Value: 0.0.0.0
```

### 1️⃣1️⃣ PORT
```
Name: PORT
Value: 3000
```

### 1️⃣2️⃣ NODE_ENV
```
Name: NODE_ENV
Value: production
```

---

## ✅ SETUP STEPS

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select HabeshaERP Project**
   - Click on your project

3. **Go to Settings**
   - Click "Settings" tab

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Click "Add New"
   - Enter Name and Value
   - Select: Production, Preview, Development
   - Click "Save"

5. **Repeat for all 12 variables**
   - Copy each variable from above
   - Paste into Vercel

6. **Update NEXTAUTH_URL**
   - After first deployment, get your Vercel URL
   - Update NEXTAUTH_URL to your domain
   - Example: `https://habeshaerp.vercel.app`

7. **Redeploy**
   - Go to Deployments
   - Click three dots on latest deployment
   - Select "Redeploy"

---

## 🔐 IMPORTANT SECURITY NOTES

⚠️ **NEVER share these values**  
⚠️ **NEVER commit `.env` to Git**  
⚠️ **Keep secrets private**  
⚠️ **Rotate keys periodically**  

---

## 📊 VARIABLE TYPES

| Variable | Type | Public? |
|----------|------|---------|
| NEXTAUTH_SECRET | Secret | ❌ |
| NEXTAUTH_URL | Public | ✅ |
| DATABASE_URL | Secret | ❌ |
| POSTGRES_URL_NON_POOLING | Secret | ❌ |
| NEXT_PUBLIC_SUPABASE_URL | Public | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | Secret | ❌ |
| USE_MOCK_DATA | Public | ✅ |
| SKIP_DB_CONNECTION | Public | ✅ |
| HOST | Public | ✅ |
| PORT | Public | ✅ |
| NODE_ENV | Public | ✅ |

---

## ✨ AFTER DEPLOYMENT

- [ ] Application loads
- [ ] No errors in console
- [ ] Database connected
- [ ] API endpoints work
- [ ] Authentication works
- [ ] Multi-user sync works

---

## 🔗 LINKS

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repo](https://github.com/vanityerp-ai/HabeshaERP)
- [Supabase Console](https://app.supabase.com)

---

**Status**: ✅ READY FOR VERCEL  
**Date**: 2025-11-23

