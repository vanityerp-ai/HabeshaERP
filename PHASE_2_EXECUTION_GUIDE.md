# Phase 2: Database Schema Migration - Execution Guide

## Overview
This phase creates the PostgreSQL database schema from Prisma models.

## Prerequisites
✅ Phase 1 completed (environment configured)
✅ Supabase PostgreSQL database accessible
✅ Environment variables set in `.env`

## Step-by-Step Execution

### Step 1: Verify Environment
```bash
# Check that DATABASE_URL is set correctly
echo $DATABASE_URL

# Should output something like:
# postgres://postgres.tyxthyqrbmgjokfcfqgc:...@aws-1-us-east-1.pooler.supabase.com:6543/postgres?...
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

**What happens:**
- Reads `prisma/schema.prisma`
- Generates TypeScript types
- Creates Prisma client for PostgreSQL
- Updates `node_modules/@prisma/client`

**Expected output:**
```
✔ Generated Prisma Client (X.X.X) to ./node_modules/@prisma/client in XXms
```

### Step 3: Create Initial Migration
```bash
npx prisma migrate dev --name initial_postgresql_migration
```

**What happens:**
- Connects to PostgreSQL database
- Creates all tables from Prisma models
- Sets up indexes and constraints
- Generates migration file in `prisma/migrations/`
- Applies migration to database

**Expected output:**
```
✔ Your database is now in sync with your schema.
✔ Generated Prisma Client (X.X.X) to ./node_modules/@prisma/client in XXms

✔ Created migration folder(s), and migration_lock.toml. Please commit these files.
```

### Step 4: Verify Schema Creation
```bash
# Connect to Supabase and verify tables exist
npx prisma studio
```

This opens Prisma Studio where you can:
- View all created tables
- See table structure
- Verify relationships
- Check indexes

### Step 5: Backup SQLite Database
```bash
# Create backup of SQLite database before data migration
cp prisma/dev.db prisma/dev.db.backup
```

## Troubleshooting

### Issue: Connection Timeout
**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase database is running
- Verify firewall allows connections

### Issue: SSL Certificate Error
**Solution:**
- Ensure `sslmode=require` in DATABASE_URL
- Update SSL certificates if needed

### Issue: Table Already Exists
**Solution:**
- Database already has schema
- Skip to Phase 3 (data migration)

## Verification Checklist

- [ ] `npx prisma generate` completed successfully
- [ ] `npx prisma migrate dev` completed successfully
- [ ] Migration file created in `prisma/migrations/`
- [ ] Prisma Studio shows all tables
- [ ] SQLite database backed up
- [ ] No errors in console

## Next Phase

After verification, proceed to Phase 3:
```bash
npx ts-node scripts/migrate-sqlite-to-postgresql.ts
```

## Rollback (If Needed)

If something goes wrong:
```bash
# Reset PostgreSQL database
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Re-create schema
# 3. Run seed (if exists)
```

## Important Notes

⚠️ **Do NOT run this on production without testing first**
⚠️ **Keep SQLite backup for 30 days**
⚠️ **Test thoroughly before deploying**

