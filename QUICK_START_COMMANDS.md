# Quick Start - Migration Commands

## Phase 1: ✅ COMPLETE
Environment and configuration already updated.

## Phase 2: Database Schema Migration

### Command 1: Generate Prisma Client
```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client in XXms
```

### Command 2: Create Initial Migration
```bash
npx prisma migrate dev --name initial_postgresql_migration
```

**Expected Output:**
```
✔ Your database is now in sync with your schema.
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client in XXms
✔ Created migration folder(s), and migration_lock.toml. Please commit these files.
```

### Command 3: Verify Schema (Optional)
```bash
npx prisma studio
```

Opens browser at `http://localhost:5555` to view database schema.

---

## Phase 3: Data Migration

### Command 4: Run Migration Script
```bash
npx ts-node scripts/migrate-sqlite-to-postgresql.ts
```

**Expected Output:**
```
🚀 Starting SQLite to PostgreSQL migration...
⏰ Timestamp: 2024-XX-XX...
📡 Verifying PostgreSQL connection...
✅ PostgreSQL connection successful
👥 Migrating Users...
✅ Found X users
📍 Migrating Locations...
✅ Found X locations
...
✅ Migration completed successfully!
📊 Total records migrated: XXXX
📄 Migration report saved to: migration-report.json
```

### Command 5: Check Migration Report
```bash
cat migration-report.json
```

Verify all tables migrated successfully with no errors.

---

## Phase 4: Code Refactoring (Manual)

Will be executed after Phase 3 completes.

---

## Phase 5: Testing & Validation (Manual)

Will be executed after Phase 4 completes.

---

## Troubleshooting Commands

### Check Database Connection
```bash
npx prisma db execute --stdin < /dev/null
```

### Reset Database (If Needed)
```bash
npx prisma migrate reset
```

### View Migration History
```bash
npx prisma migrate status
```

### Rollback Last Migration
```bash
npx prisma migrate resolve --rolled-back initial_postgresql_migration
```

---

## Environment Verification

### Verify Environment Variables
```bash
echo "DATABASE_URL: $DATABASE_URL"
echo "POSTGRES_URL_NON_POOLING: $POSTGRES_URL_NON_POOLING"
```

### Test PostgreSQL Connection
```bash
psql "$DATABASE_URL"
```

---

## Backup Commands

### Backup SQLite Database
```bash
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Backup PostgreSQL Database
```bash
pg_dump "$POSTGRES_URL_NON_POOLING" > backup.sql
```

---

## Monitoring Commands

### Check Database Size
```bash
npx prisma db execute --stdin <<EOF
SELECT pg_size_pretty(pg_database_size(current_database()));
EOF
```

### Count Records by Table
```bash
npx prisma db execute --stdin <<EOF
SELECT schemaname, tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
EOF
```

---

## Summary

**Phase 2 (5 min):**
```bash
npx prisma generate
npx prisma migrate dev --name initial_postgresql_migration
```

**Phase 3 (10-30 min):**
```bash
npx ts-node scripts/migrate-sqlite-to-postgresql.ts
```

**Then:** Proceed to Phase 4 (Code Refactoring)

