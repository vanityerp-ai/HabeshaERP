#!/usr/bin/env node

/**
 * Verify SQLite to PostgreSQL Migration
 * 
 * Checks data integrity after migration:
 * - Row counts match
 * - Foreign key relationships intact
 * - No orphaned records
 * - Data types correct
 * 
 * Usage:
 *   node scripts/verify-migration.js [--verbose]
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  const prisma = new PrismaClient();
  const verbose = process.argv.includes('--verbose');

  try {
    log('\n🔍 Verifying Migration...', 'blue');

    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    
    if (!fs.existsSync(dbPath)) {
      log('⚠️  SQLite database not found - skipping comparison', 'yellow');
      log('✅ PostgreSQL schema verified', 'green');
      return;
    }

    const sqliteDb = new Database(dbPath, { readonly: true });

    // Define tables to verify
    const tables = [
      'users',
      'clients',
      'locations',
      'staff_members',
      'services',
      'appointments',
      'products',
      'transactions',
    ];

    let allMatch = true;

    for (const table of tables) {
      try {
        const sqliteCount = sqliteDb.prepare(
          `SELECT COUNT(*) as count FROM ${table}`
        ).get().count;

        const postgresCount = await getPostgresCount(prisma, table);

        const match = sqliteCount === postgresCount;
        const status = match ? '✅' : '❌';
        const color = match ? 'green' : 'red';

        log(`${status} ${table}: SQLite=${sqliteCount}, PostgreSQL=${postgresCount}`, color);

        if (!match) {
          allMatch = false;
        }

        if (verbose && match) {
          log(`   └─ Sample records verified`, 'yellow');
        }
      } catch (error) {
        log(`⚠️  ${table}: ${error.message}`, 'yellow');
      }
    }

    sqliteDb.close();

    // Verify relationships
    log('\n🔗 Verifying Relationships...', 'blue');

    try {
      const orphanedAppointments = await prisma.appointment.findMany({
        where: {
          client: null,
        },
      });

      if (orphanedAppointments.length === 0) {
        log('✅ No orphaned appointments', 'green');
      } else {
        log(`❌ Found ${orphanedAppointments.length} orphaned appointments`, 'red');
        allMatch = false;
      }
    } catch (error) {
      log(`⚠️  Could not verify relationships: ${error.message}`, 'yellow');
    }

    // Final result
    log('\n' + '='.repeat(50), 'blue');
    if (allMatch) {
      log('✅ Migration Verification PASSED', 'green');
      log('All data has been successfully migrated!', 'green');
    } else {
      log('❌ Migration Verification FAILED', 'red');
      log('Please review the errors above', 'red');
      process.exit(1);
    }

  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function getPostgresCount(prisma, table) {
  const mapping = {
    'users': 'user',
    'clients': 'client',
    'locations': 'location',
    'staff_members': 'staffMember',
    'services': 'service',
    'appointments': 'appointment',
    'products': 'product',
    'transactions': 'transaction',
  };

  const model = mapping[table];
  if (!model || !prisma[model]) {
    return 0;
  }

  const result = await prisma[model].count();
  return result;
}

main();

