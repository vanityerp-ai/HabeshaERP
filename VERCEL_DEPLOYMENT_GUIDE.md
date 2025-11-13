# 🚀 Vercel Deployment Guide for VanityPOS

## ❌ Current Issue

Your Vercel deployment is failing because it's trying to use SQLite (`file:./prisma/dev.db`), which **does not work in serverless environments** like Vercel.

**Error:** `GET /api/locations 500 (Internal Server Error)`

**Root Cause:** SQLite requires a persistent file system, but Vercel uses ephemeral serverless functions.

---

## ✅ Solution: Use PostgreSQL Database

You need to set up a PostgreSQL database for production. Here are your options:

---

## 🎯 Option 1: Vercel Postgres (Recommended - Easiest)

### **Step 1: Create Vercel Postgres Database**

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **HabeshaERP**
3. Click on the **"Storage"** tab
4. Click **"Create Database"**
5. Select **"Postgres"**
6. Choose a region (select one close to your users)
7. Click **"Create"**

### **Step 2: Vercel Auto-Configuration**

Vercel will automatically create these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` ← **Use this one for Prisma**
- `POSTGRES_URL_NON_POOLING`

### **Step 3: Update Environment Variables**

1. Go to **Settings → Environment Variables**
2. Add/Update these variables:

```
DATABASE_URL = ${POSTGRES_PRISMA_URL}
NEXTAUTH_URL = https://habesha-erp.vercel.app
NEXTAUTH_SECRET = ev6UE8RD0KcC3IYwxb0+cl5LRFa/1pSmBKGBzuAnY/w=
```

### **Step 4: Run Database Migrations**

On your local machine, set the production database URL and run migrations:

```powershell
# Set the production database URL (get this from Vercel)
$env:DATABASE_URL = "postgresql://..."

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed the database (optional)
npx prisma db seed
```

### **Step 5: Redeploy**

1. Go to **Deployments** tab in Vercel
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete
4. Test your app at: https://habesha-erp.vercel.app

---

## 🎯 Option 2: Neon (Free PostgreSQL)

### **Step 1: Create Neon Account**

1. Go to: https://neon.tech
2. Sign up for free (no credit card required)
3. Click **"Create Project"**
4. Choose a region close to your users
5. Copy the connection string

### **Step 2: Add to Vercel**

1. Go to Vercel → Settings → Environment Variables
2. Add:

```
DATABASE_URL = postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_URL = https://habesha-erp.vercel.app
NEXTAUTH_SECRET = ev6UE8RD0KcC3IYwxb0+cl5LRFa/1pSmBKGBzuAnY/w=
```

### **Step 3: Run Migrations**

```powershell
# Set the Neon database URL
$env:DATABASE_URL = "postgresql://..."

# Run the setup script
.\scripts\setup-production-db.ps1
```

---

## 🎯 Option 3: Supabase (Free PostgreSQL)

### **Step 1: Create Supabase Account**

1. Go to: https://supabase.com
2. Sign up for free
3. Click **"New Project"**
4. Set a strong database password
5. Choose a region

### **Step 2: Get Connection String**

1. Go to **Project Settings → Database**
2. Copy the **"Connection string"** (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password

### **Step 3: Add to Vercel**

```
DATABASE_URL = postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?schema=public&sslmode=require
NEXTAUTH_URL = https://habesha-erp.vercel.app
NEXTAUTH_SECRET = ev6UE8RD0KcC3IYwxb0+cl5LRFa/1pSmBKGBzuAnY/w=
```

---

## 📋 Complete Setup Checklist

- [ ] Choose a PostgreSQL provider (Vercel Postgres, Neon, or Supabase)
- [ ] Create the database
- [ ] Copy the connection string
- [ ] Add environment variables to Vercel
- [ ] Run database migrations locally
- [ ] Seed the database with initial data
- [ ] Redeploy the Vercel application
- [ ] Test login functionality
- [ ] Verify all features work

---

## 🔧 Running Database Migrations

### **Windows (PowerShell):**
```powershell
# Set production database URL
$env:DATABASE_URL = "postgresql://..."

# Run setup script
.\scripts\setup-production-db.ps1
```

### **Mac/Linux (Bash):**
```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run setup script
chmod +x scripts/setup-production-db.sh
./scripts/setup-production-db.sh
```

---

## 🎉 After Deployment

1. **Test Login:**
   - Go to: https://habesha-erp.vercel.app
   - Try logging in with your credentials

2. **Verify Features:**
   - Check POS functionality
   - Test appointment booking
   - Verify inventory management
   - Test SALES role permissions

3. **Monitor Logs:**
   - Go to Vercel → Deployments → Click on deployment → Functions
   - Check for any errors

---

## 🆘 Troubleshooting

### **Issue: Still getting 500 errors**
- Check Vercel logs for detailed error messages
- Verify DATABASE_URL is set correctly
- Ensure migrations were run successfully

### **Issue: Can't connect to database**
- Check if database is running
- Verify connection string format
- Ensure SSL mode is enabled (`?sslmode=require`)

### **Issue: Missing tables**
- Run `npx prisma migrate deploy` again
- Check if migrations folder exists

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test database connection locally
4. Check Prisma schema matches database

---

**Next Step:** Choose a database provider and follow the steps above! 🚀

