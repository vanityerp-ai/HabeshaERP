# PostgreSQL Migration - Quick Reference

## One-Command Migration (Automated)

```bash
# Run the complete automated migration
npm run db:migrate:to-postgres

# Follow the prompts to enter your PostgreSQL URL
# The script will handle everything automatically
```

## Manual Step-by-Step Commands

### 1. Backup
```bash
npm run db:backup
```

### 2. Setup PostgreSQL
```bash
# Docker
docker run --name vanity-postgres \
  -e POSTGRES_USER=vanity_user \
  -e POSTGRES_PASSWORD=vanity_password \
  -e POSTGRES_DB=vanity_hub \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 3. Configure Environment
```bash
# Create .env.local with PostgreSQL URL
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://vanity_user:vanity_password@localhost:5432/vanity_hub?schema=public&sslmode=disable"
EOF
```

### 4. Migrate Schema
```bash
npm run db:setup:prod
```

### 5. Export Data
```bash
npm run db:export:sqlite
```

### 6. Import Data
```bash
npm run db:import:postgres
```

### 7. Verify
```bash
npm run db:verify-migration
```

### 8. Test
```bash
npm run dev
# Test all workflows in browser
```

## Rollback Commands

```bash
# Rollback to SQLite
npm run db:rollback:sqlite

# Restore from backup
cp prisma/dev.db.backup prisma/dev.db
npm run db:setup:dev
npm run dev
```

## Verification Commands

```bash
# Verify migration
npm run db:verify-migration --verbose

# Check PostgreSQL connection
psql -h localhost -U vanity_user -d vanity_hub -c "SELECT COUNT(*) FROM users"

# Check row counts
psql -h localhost -U vanity_user -d vanity_hub << 'EOF'
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments;
EOF
```

## Environment Variables

### Development (SQLite)
```env
DATABASE_URL="file:./prisma/dev.db"
```

### Development (PostgreSQL)
```env
DATABASE_URL="postgresql://vanity_user:vanity_password@localhost:5432/vanity_hub?schema=public&sslmode=disable"
```

### Production (PostgreSQL)
```env
DATABASE_URL="postgresql://user:password@host:5432/vanity_hub?schema=public&sslmode=require"
```

## Docker Commands

```bash
# Start PostgreSQL
docker run --name vanity-postgres \
  -e POSTGRES_USER=vanity_user \
  -e POSTGRES_PASSWORD=vanity_password \
  -e POSTGRES_DB=vanity_hub \
  -p 5432:5432 \
  -d postgres:15-alpine

# Stop PostgreSQL
docker stop vanity-postgres

# Start existing container
docker start vanity-postgres

# View logs
docker logs vanity-postgres

# Connect to database
docker exec -it vanity-postgres psql -U vanity_user -d vanity_hub

# Remove container
docker rm vanity-postgres
```

## Troubleshooting Quick Fixes

### Connection Refused
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start if not running
docker start vanity-postgres
```

### Data Mismatch
```bash
# Re-verify migration
npm run db:verify-migration --verbose

# Check specific counts
psql -h localhost -U vanity_user -d vanity_hub -c "SELECT COUNT(*) FROM appointments"
```

### Application Won't Start
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Regenerate Prisma client
npm run db:generate

# Check for errors
npm run dev 2>&1 | head -20
```

### Need to Rollback
```bash
# Quick rollback
npm run db:rollback:sqlite

# Or manual rollback
cp prisma/dev.db.backup prisma/dev.db
npm run db:setup:dev
npm run dev
```

## Testing Checklist

- [ ] Login works
- [ ] All clients display
- [ ] All appointments display
- [ ] Create appointment works
- [ ] Update appointment status works
- [ ] Process payment works
- [ ] All services display
- [ ] All staff display
- [ ] Calendar view works
- [ ] Summary view works

## Important Files

- `docs/POSTGRESQL_MIGRATION_GUIDE.md` - Comprehensive guide
- `docs/MIGRATION_IMPLEMENTATION_STEPS.md` - Step-by-step instructions
- `docs/MIGRATION_TESTING_CHECKLIST.md` - Testing checklist
- `scripts/migrate-to-postgres.js` - Automated migration script
- `scripts/verify-migration.js` - Verification script
- `scripts/rollback-to-sqlite.js` - Rollback script

## Support

If you encounter issues:

1. Check the comprehensive guide: `docs/POSTGRESQL_MIGRATION_GUIDE.md`
2. Review step-by-step instructions: `docs/MIGRATION_IMPLEMENTATION_STEPS.md`
3. Run verification: `npm run db:verify-migration --verbose`
4. Check logs: `npm run dev 2>&1 | grep -i error`
5. Rollback if needed: `npm run db:rollback:sqlite`

---

**Last Updated**: 2025-11-13
**Version**: 1.0

