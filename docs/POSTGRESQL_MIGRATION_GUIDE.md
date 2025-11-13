# SQLite to PostgreSQL Migration Guide - Vanity Hub

## Overview

This guide provides step-by-step instructions to migrate your Vanity Hub application from SQLite (development) to PostgreSQL (production) with **100% data preservation**.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed (local or cloud-hosted)
- Access to your current SQLite database (`prisma/dev.db`)
- Git for version control
- Backup of your current SQLite database

## Quick Start (Automated)

```bash
# 1. Backup your current SQLite database
npm run db:backup

# 2. Run the automated migration
npm run db:migrate:to-postgres

# 3. Verify the migration
npm run db:verify-migration

# 4. Test the application
npm run dev
```

## Step-by-Step Manual Migration

### Phase 1: Preparation

#### 1.1 Backup Your SQLite Database

```bash
# Create a backup of your current database
cp prisma/dev.db prisma/dev.db.backup

# Export SQLite data to SQL file
sqlite3 prisma/dev.db .dump > sqlite_backup.sql
```

#### 1.2 Set Up PostgreSQL

**Option A: Using Docker (Recommended)**

```bash
# Start PostgreSQL container
docker run --name vanity-postgres \
  -e POSTGRES_USER=vanity_user \
  -e POSTGRES_PASSWORD=vanity_password \
  -e POSTGRES_DB=vanity_hub \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify connection
psql -h localhost -U vanity_user -d vanity_hub -c "SELECT version();"
```

**Option B: Cloud-Hosted (Recommended for Production)**

- Use AWS RDS, Azure Database, or similar managed service
- Create database and user
- Note the connection string

#### 1.3 Create Environment Configuration

```bash
# Create .env.production.local for testing
cat > .env.production.local << 'EOF'
DATABASE_URL="postgresql://vanity_user:vanity_password@localhost:5432/vanity_hub?schema=public&sslmode=disable"
NODE_ENV=production
EOF
```

### Phase 2: Schema Migration

#### 2.1 Update Prisma Configuration

```bash
# Run the setup script to switch to PostgreSQL
npm run db:setup:prod
```

This will:
- Update `prisma/schema.prisma` to use PostgreSQL provider
- Generate Prisma client for PostgreSQL
- Run migrations to create schema

#### 2.2 Verify Schema Creation

```bash
# Check if all tables were created
psql -h localhost -U vanity_user -d vanity_hub -c "\dt"

# Expected tables: users, clients, staff_members, appointments, services, etc.
```

### Phase 3: Data Migration

#### 3.1 Export Data from SQLite

```bash
# Use the automated export script
npm run db:export:sqlite

# This creates: sqlite_export.json with all data
```

#### 3.2 Import Data to PostgreSQL

```bash
# Use the automated import script
npm run db:import:postgres

# This reads sqlite_export.json and imports to PostgreSQL
```

#### 3.3 Verify Data Integrity

```bash
# Run verification script
npm run db:verify-migration

# Expected output:
# ✅ All tables migrated successfully
# ✅ Row counts match
# ✅ Foreign key relationships intact
# ✅ Data integrity verified
```

### Phase 4: Testing & Validation

#### 4.1 Start Application with PostgreSQL

```bash
# Start development server with PostgreSQL
npm run dev

# Application should start without errors
```

#### 4.2 Test Critical Workflows

- [ ] Login with existing credentials
- [ ] View all clients (should show all migrated clients)
- [ ] View all appointments (should show all migrated appointments)
- [ ] Create new appointment
- [ ] Update appointment status
- [ ] Process payment
- [ ] View services and staff
- [ ] Check inventory/products
- [ ] View reports and analytics

#### 4.3 Verify Data Consistency

```bash
# Check specific data
psql -h localhost -U vanity_user -d vanity_hub << 'EOF'
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as client_count FROM clients;
SELECT COUNT(*) as appointment_count FROM appointments;
SELECT COUNT(*) as service_count FROM services;
SELECT COUNT(*) as staff_count FROM staff_members;
EOF
```

### Phase 5: Production Deployment

#### 5.1 Set Production Environment Variables

In your hosting platform (Vercel, AWS, etc.):

```env
DATABASE_URL="postgresql://user:password@prod-host:5432/vanity_hub?schema=public&sslmode=require"
NODE_ENV=production
```

#### 5.2 Deploy Application

```bash
# Build and deploy
npm run prod:build
npm run prod:deploy
```

#### 5.3 Monitor Production

- Check application logs for errors
- Verify database connections
- Monitor performance metrics
- Set up alerts for database issues

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U vanity_user -d vanity_hub -c "SELECT 1"

# Check Prisma connection
npx prisma db execute --stdin < /dev/null
```

### Data Mismatch

```bash
# Compare row counts
npm run db:verify-migration --verbose

# Export and compare specific tables
npm run db:export:table --table=appointments
```

### Rollback to SQLite

```bash
# Restore from backup
npm run db:restore:sqlite

# This reverts schema and data to SQLite
```

## Rollback Plan

If migration fails or issues arise:

1. **Immediate Rollback**:
   ```bash
   npm run db:rollback:sqlite
   ```

2. **Restore from Backup**:
   ```bash
   cp prisma/dev.db.backup prisma/dev.db
   npm run db:setup:dev
   ```

3. **Manual Rollback**:
   - Switch `DATABASE_URL` back to SQLite
   - Run `npm run db:setup:dev`
   - Restart application

## Performance Optimization

After successful migration, optimize PostgreSQL:

```bash
# Analyze query performance
npm run db:analyze

# Create indexes for common queries
npm run db:optimize-indexes

# Vacuum and analyze database
npm run db:maintenance
```

## Support & Monitoring

- Monitor database connections: `npm run db:monitor`
- Check slow queries: `npm run db:slow-queries`
- View database statistics: `npm run db:stats`

## Next Steps

1. ✅ Complete migration using this guide
2. ✅ Run comprehensive tests
3. ✅ Monitor production for 24-48 hours
4. ✅ Archive SQLite backup after confirmation
5. ✅ Document any custom configurations

---

**Last Updated**: 2025-11-13
**Version**: 1.0
**Status**: Production Ready

