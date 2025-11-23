# SQLite to PostgreSQL Migration - Implementation Steps

## PHASE 1: ENVIRONMENT SETUP

### Step 1: Update .env File
Replace DATABASE_URL in `.env`:
```
# OLD (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# NEW (PostgreSQL - Supabase)
DATABASE_URL="postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

### Step 2: Update Prisma Schema
Change `prisma/schema.prisma` datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

## PHASE 2: SCHEMA MIGRATION

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Create Initial Migration
```bash
npx prisma migrate dev --name initial_postgresql_migration
```

## PHASE 3: DATA MIGRATION

### Step 5: Export SQLite Data
Create migration script to export all data from SQLite

### Step 6: Transform Data
Convert SQLite data format to PostgreSQL format

### Step 7: Import Data
Load data into PostgreSQL with integrity checks

## PHASE 4: CODE REFACTORING

### Step 8: Migrate Settings Storage
Update `lib/settings-storage.ts` to use Prisma

### Step 9: Migrate Staff Storage
Update `lib/staff-storage.ts` to use Prisma

### Step 10: Migrate Transaction Provider
Update `lib/transaction-provider.tsx` to use database

### Step 11: Migrate Inventory Service
Update `lib/inventory-transaction-service.ts` to use database

### Step 12: Migrate Other Services
Update membership, cart, order services to use database

## PHASE 5: TESTING & VALIDATION

### Step 13: Data Integrity Verification
Verify all data migrated correctly

### Step 14: Multi-User Testing
Test synchronized data across devices

### Step 15: Feature Testing
Test POS, Client Portal, Accounting, Inventory, Appointments

## Rollback Plan
- Keep SQLite database as backup
- Document all changes
- Test rollback procedure before migration

