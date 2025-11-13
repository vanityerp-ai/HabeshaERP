#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates backups of both SQLite and PostgreSQL databases
 * 
 * Usage:
 *   node scripts/backup-database.js [--type sqlite|postgres|both]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function main() {
  try {
    const backupType = process.argv[2] || '--type';
    const type = process.argv[3] || 'both';

    log('\n💾 Creating Database Backup...', 'blue');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');

    // Create backups directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup SQLite
    if (type === 'sqlite' || type === 'both') {
      const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const backupPath = path.join(backupDir, `dev.db.${timestamp}.backup`);
        fs.copyFileSync(dbPath, backupPath);
        log(`✅ SQLite backup: ${backupPath}`, 'green');
      }
    }

    // Backup PostgreSQL (if available)
    if (type === 'postgres' || type === 'both') {
      try {
        const backupPath = path.join(backupDir, `postgres.${timestamp}.sql`);
        const cmd = `pg_dump ${process.env.DATABASE_URL} > "${backupPath}"`;
        execSync(cmd, { shell: true });
        log(`✅ PostgreSQL backup: ${backupPath}`, 'green');
      } catch (error) {
        log(`⚠️  PostgreSQL backup skipped: ${error.message}`, 'yellow');
      }
    }

    log('\n✅ Backup completed!', 'green');

  } catch (error) {
    log(`❌ Backup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();

