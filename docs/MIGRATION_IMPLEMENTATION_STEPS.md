# Step-by-Step PostgreSQL Migration Implementation

## Phase 1: Pre-Migration Setup (30 minutes)

### Step 1.1: Backup Your Current Database

```bash
# Create a backup of your SQLite database
cp prisma/dev.db prisma/dev.db.backup

# Export to SQL for additional safety
sqlite3 prisma/dev.db .dump > sqlite_backup.sql

# Verify backup exists
ls -lh prisma/dev.db.backup sqlite_backup.sql
```

### Step 1.2: Set Up PostgreSQL

**Option A: Docker (Recommended for Testing)**

```bash
# Pull PostgreSQL image
docker pull postgres:15-alpine

# Start PostgreSQL container
docker run --name vanity-postgres \
  -e POSTGRES_USER=vanity_user \
  -e POSTGRES_PASSWORD=vanity_password \
  -e POSTGRES_DB=vanity_hub \
  -p 5432:5432 \
  -d postgres:15-alpine

# Wait for container to start
sleep 5

# Test connection
docker exec vanity-postgres psql -U vanity_user -d vanity_hub -c "SELECT version();"
```

**Option B: Cloud Database (Recommended for Production)**

- AWS RDS: Create PostgreSQL 15+ instance
- Azure Database: Create PostgreSQL server
- DigitalOcean: Create Managed Database
- Note the connection string

### Step 1.3: Create Environment File

```bash
# Create .env.local for testing
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://vanity_user:vanity_password@localhost:5432/vanity_hub?schema=public&sslmode=disable"
NODE_ENV=development
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
EOF

# For production, create .env.production.local
cat > .env.production.local << 'EOF'
DATABASE_URL="postgresql://user:password@your-host:5432/vanity_hub?schema=public&sslmode=require"
NODE_ENV=production
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
EOF
```

## Phase 2: Schema Migration (15 minutes)

### Step 2.1: Update Prisma Schema

```bash
# Run the automated setup script
npm run db:setup:prod

# This will:
# 1. Update prisma/schema.prisma to use PostgreSQL
# 2. Generate Prisma client
# 3. Run migrations to create schema
```

### Step 2.2: Verify Schema Creation

```bash
# Connect to PostgreSQL and verify tables
psql -h localhost -U vanity_user -d vanity_hub << 'EOF'
-- List all tables
\dt

-- Check specific table structure
\d users
\d appointments
\d clients

-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
EOF
```

Expected output: 20+ tables created

## Phase 3: Data Migration (30 minutes)

### Step 3.1: Export Data from SQLite

```bash
# Export all data to JSON
npm run db:export:sqlite

# This creates: sqlite_export.json
# Verify file was created
ls -lh sqlite_export.json
```

### Step 3.2: Import Data to PostgreSQL

```bash
# Import data from JSON to PostgreSQL
npm run db:import:postgres

# Watch for any errors or warnings
# Expected: All tables imported successfully
```

### Step 3.3: Verify Data Integrity

```bash
# Run comprehensive verification
npm run db:verify-migration

# Expected output:
# ✅ users: SQLite=X, PostgreSQL=X
# ✅ clients: SQLite=X, PostgreSQL=X
# ✅ appointments: SQLite=X, PostgreSQL=X
# ... (all tables match)
# ✅ Migration Verification PASSED
```

## Phase 4: Application Testing (45 minutes)

### Step 4.1: Start Application

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Application should start without errors
# Check console for any database-related errors
```

### Step 4.2: Test Critical Workflows

**Test 1: Authentication**
```
1. Open http://localhost:3000
2. Login with existing credentials
3. Verify user profile loads
4. Check user role is correct
```

**Test 2: View Clients**
```
1. Navigate to Clients page
2. Verify all clients display
3. Search for a client
4. View client details
5. Verify all information is present
```

**Test 3: View Appointments**
```
1. Navigate to Appointments/Calendar
2. Verify all appointments display
3. Check appointment dates and times
4. View appointment details
5. Verify services and staff assigned
```

**Test 4: Create Appointment**
```
1. Click "New Appointment"
2. Select client (should show all migrated clients)
3. Select staff member
4. Select service
5. Choose date and time
6. Save appointment
7. Verify it appears in calendar
```

**Test 5: Update Appointment Status**
```
1. Click on an appointment
2. Change status (pending → confirmed → arrived → service-started → completed)
3. Verify status updates without errors
4. Check status history is preserved
```

**Test 6: Process Payment**
```
1. Open completed appointment
2. Click "Process Payment"
3. Enter payment details
4. Confirm payment
5. Verify payment status saved
6. Check transaction recorded
```

### Step 4.3: Verify Data Consistency

```bash
# Check row counts in PostgreSQL
psql -h localhost -U vanity_user -d vanity_hub << 'EOF'
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'staff_members', COUNT(*) FROM staff_members
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
ORDER BY table_name;
EOF
```

## Phase 5: Performance Optimization (15 minutes)

### Step 5.1: Analyze Query Performance

```bash
# Enable query logging
psql -h localhost -U vanity_user -d vanity_hub << 'EOF'
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
EOF
```

### Step 5.2: Create Indexes

```bash
# PostgreSQL automatically creates indexes from Prisma schema
# Verify indexes were created
psql -h localhost -U vanity_user -d vanity_hub << 'EOF'
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
```

## Phase 6: Production Deployment (30 minutes)

### Step 6.1: Set Production Environment Variables

In your hosting platform (Vercel, AWS, etc.):

```env
DATABASE_URL="postgresql://user:password@prod-host:5432/vanity_hub?schema=public&sslmode=require"
NODE_ENV=production
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### Step 6.2: Build and Deploy

```bash
# Build application
npm run build

# Deploy to production
npm run prod:deploy

# Or manually deploy to your platform
```

### Step 6.3: Verify Production

```bash
# Check application is running
curl https://your-domain.com

# Check logs for errors
# Monitor database connections
# Verify all features working
```

## Phase 7: Rollback Plan (If Needed)

### If Migration Fails

```bash
# Rollback to SQLite
npm run db:rollback:sqlite

# This will:
# 1. Restore SQLite database from backup
# 2. Revert Prisma schema
# 3. Update environment variables
# 4. Regenerate Prisma client

# Restart application
npm run dev
```

### If Production Issues Arise

```bash
# Immediate actions:
# 1. Switch DATABASE_URL back to SQLite
# 2. Restart application
# 3. Investigate issue
# 4. Fix and retry migration

# Or restore from backup:
cp prisma/dev.db.backup prisma/dev.db
npm run db:setup:dev
npm run dev
```

## Troubleshooting

### Connection Refused

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Or check local PostgreSQL
psql -h localhost -U vanity_user -d vanity_hub -c "SELECT 1"

# If not running, start it:
docker start vanity-postgres
```

### Data Mismatch

```bash
# Re-run verification
npm run db:verify-migration --verbose

# Check specific table
psql -h localhost -U vanity_user -d vanity_hub -c "SELECT COUNT(*) FROM appointments"
```

### Application Won't Start

```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Check Prisma client generated
ls -la node_modules/.prisma/client

# Regenerate if needed
npm run db:generate

# Check for errors
npm run dev 2>&1 | head -50
```

## Success Criteria

✅ All data migrated (row counts match)
✅ All relationships intact (no orphaned records)
✅ Application starts without errors
✅ All critical workflows tested
✅ Performance acceptable
✅ Production deployed successfully

---

**Estimated Total Time**: 2-3 hours
**Difficulty Level**: Intermediate
**Risk Level**: Low (with backups)

