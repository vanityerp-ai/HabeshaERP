# SQLite to PostgreSQL (Supabase) Migration Plan

## Executive Summary
Comprehensive migration from SQLite to PostgreSQL with zero downtime and no data loss. Database becomes the single source of truth for all data.

## Current State Analysis

### Database Setup
- **Current**: SQLite (`file:./prisma/dev.db`)
- **Target**: PostgreSQL via Supabase
- **Prisma**: Already configured but pointing to SQLite

### Data Storage Issues Identified
1. **localStorage as Data Source** (CRITICAL):
   - `lib/settings-storage.ts` - Settings, locations, roles, users
   - `lib/staff-storage.ts` - Staff data (deprecated but still used)
   - `lib/transaction-provider.tsx` - Transactions stored in localStorage
   - `lib/inventory-transaction-service.ts` - Inventory transactions
   - `lib/membership-provider.tsx` - Membership data
   - `lib/cart-provider.tsx` - Cart data
   - `lib/order-management-service.ts` - Orders and notifications

2. **Dual Database Setup**:
   - `lib/db.ts` - PostgreSQL client (pg pool) - NOT CURRENTLY USED
   - Prisma schema - SQLite provider

## Migration Strategy

### Phase 1: Environment & Configuration (Step 1-2)
1. Update `.env` with Supabase PostgreSQL credentials
2. Update `prisma/schema.prisma` to use PostgreSQL provider
3. Generate new Prisma client

### Phase 2: Database Schema Migration (Step 3-4)
1. Run Prisma migrations to create PostgreSQL schema
2. Verify all tables and indexes created successfully

### Phase 3: Data Migration (Step 5-7)
1. Export all SQLite data
2. Transform data to PostgreSQL format
3. Import data with integrity checks

### Phase 4: Code Refactoring (Step 8-12)
1. Migrate localStorage usage to database
2. Update all services to use Prisma/database
3. Remove localStorage as data source
4. Update transaction provider
5. Update inventory service

### Phase 5: Testing & Validation (Step 13-15)
1. Verify all data migrated correctly
2. Test multi-user scenarios
3. Test all critical features

## Critical Success Criteria
✅ Zero data loss
✅ Zero breaking changes
✅ All users see synchronized data
✅ Database is single source of truth
✅ All features work: POS, Client Portal, Accounting, Inventory, Appointments

## Environment Variables Required
```
DATABASE_URL="postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.tyxthyqrbmgjokfcfqgc:nMraMBe5JOLKcYvX@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
SUPABASE_URL="https://tyxthyqrbmgjokfcfqgc.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Next Steps
1. Review and approve this migration plan
2. Execute Phase 1: Environment setup
3. Execute Phase 2: Schema migration
4. Execute Phase 3: Data migration
5. Execute Phase 4: Code refactoring
6. Execute Phase 5: Testing & validation

