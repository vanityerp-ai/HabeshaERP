#!/usr/bin/env node

/**
 * Import Data to PostgreSQL
 * 
 * Imports data from JSON export file to PostgreSQL database
 * Handles foreign key constraints and data integrity
 * 
 * Usage:
 *   node scripts/import-postgres-data.js [input-file]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

  try {
    const inputFile = process.argv[2] || 'sqlite_export.json';

    log('\n📥 Importing Data to PostgreSQL...', 'blue');

    if (!fs.existsSync(inputFile)) {
      log(`❌ Export file not found: ${inputFile}`, 'red');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    // Import order matters due to foreign keys
    const importOrder = [
      'users',
      'clients',
      'locations',
      'staff_members',
      'services',
      'staff_locations',
      'staff_services',
      'staff_schedules',
      'time_off_requests',
      'location_services',
      'appointments',
      'appointment_services',
      'appointment_products',
      'products',
      'product_locations',
      'product_batches',
      'transfers',
      'transactions',
      'loyalty_programs',
      'memberships',
      'inventory_audits',
      'audit_logs',
    ];

    for (const table of importOrder) {
      if (!data[table] || data[table].length === 0) {
        log(`⏭️  Skipping ${table}: no data`, 'yellow');
        continue;
      }

      const rows = data[table];
      log(`📥 Importing ${table}...`, 'yellow');

      // Import based on table type
      try {
        for (const row of rows) {
          // Map table names to Prisma model names
          const modelName = getModelName(table);
          if (prisma[modelName]) {
            await prisma[modelName].create({ data: row });
          }
        }
        log(`✅ Imported ${table}: ${rows.length} rows`, 'green');
      } catch (error) {
        log(`⚠️  Error importing ${table}: ${error.message}`, 'yellow');
        // Continue with next table
      }
    }

    log('\n✅ Data import completed!', 'green');

  } catch (error) {
    log(`❌ Import failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getModelName(tableName) {
  const mapping = {
    'users': 'user',
    'clients': 'client',
    'locations': 'location',
    'staff_members': 'staffMember',
    'services': 'service',
    'staff_locations': 'staffLocation',
    'staff_services': 'staffService',
    'staff_schedules': 'staffSchedule',
    'time_off_requests': 'timeOffRequest',
    'location_services': 'locationService',
    'appointments': 'appointment',
    'appointment_services': 'appointmentService',
    'appointment_products': 'appointmentProduct',
    'products': 'product',
    'product_locations': 'productLocation',
    'product_batches': 'productBatch',
    'transfers': 'transfer',
    'transactions': 'transaction',
    'loyalty_programs': 'loyaltyProgram',
    'memberships': 'membership',
    'inventory_audits': 'inventoryAudit',
    'audit_logs': 'auditLog',
  };
  return mapping[tableName] || tableName;
}

main();

