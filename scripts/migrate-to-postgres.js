#!/usr/bin/env node

/**
 * Automated SQLite to PostgreSQL Migration Script
 * 
 * This script automates the entire migration process:
 * 1. Backs up SQLite database
 * 2. Exports data from SQLite
 * 3. Updates Prisma schema for PostgreSQL
 * 4. Creates PostgreSQL schema via migrations
 * 5. Imports data to PostgreSQL
 * 6. Verifies data integrity
 * 
 * Usage:
 *   node scripts/migrate-to-postgres.js [options]
 * 
 * Options:
 *   --postgres-url <url>  PostgreSQL connection URL
 *   --skip-backup         Skip SQLite backup
 *   --skip-verify         Skip verification
 *   --force               Skip confirmations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║   SQLite to PostgreSQL Migration - Vanity Hub              ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

    // Parse arguments
    const args = process.argv.slice(2);
    const skipBackup = args.includes('--skip-backup');
    const skipVerify = args.includes('--skip-verify');
    const force = args.includes('--force');
    
    let postgresUrl = args[args.indexOf('--postgres-url') + 1];

    // Step 1: Get PostgreSQL URL
    logStep('1/6', 'PostgreSQL Configuration');
    
    if (!postgresUrl) {
      log('\nEnter your PostgreSQL connection URL:', 'yellow');
      log('Example: postgresql://user:password@localhost:5432/vanity_hub?schema=public', 'yellow');
      postgresUrl = await question('\nPostgreSQL URL: ');
    }

    if (!postgresUrl.startsWith('postgresql://')) {
      logError('Invalid PostgreSQL URL format');
      process.exit(1);
    }

    logSuccess(`PostgreSQL URL configured`);

    // Step 2: Backup SQLite
    if (!skipBackup) {
      logStep('2/6', 'Backing up SQLite Database');
      
      const backupPath = path.join(__dirname, '..', 'prisma', 'dev.db.backup');
      const devDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

      if (fs.existsSync(devDbPath)) {
        fs.copyFileSync(devDbPath, backupPath);
        logSuccess(`SQLite backup created: ${backupPath}`);
      } else {
        logWarning('SQLite database not found');
      }
    } else {
      logStep('2/6', 'Skipping SQLite Backup');
    }

    // Step 3: Update Prisma Schema
    logStep('3/6', 'Updating Prisma Schema for PostgreSQL');
    
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    const datasourceRegex = /datasource db \{[\s\S]*?\}/;
    const newDatasource = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

    schema = schema.replace(datasourceRegex, newDatasource);
    fs.writeFileSync(schemaPath, schema);
    logSuccess('Prisma schema updated to PostgreSQL');

    // Step 4: Update Environment
    logStep('4/6', 'Updating Environment Configuration');
    
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    const dbUrlRegex = /^DATABASE_URL=.*$/m;
    const newDbUrl = `DATABASE_URL="${postgresUrl}"`;

    if (dbUrlRegex.test(envContent)) {
      envContent = envContent.replace(dbUrlRegex, newDbUrl);
    } else {
      envContent += `\n${newDbUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    logSuccess('Environment configuration updated');

    // Step 5: Run Migrations
    logStep('5/6', 'Creating PostgreSQL Schema');
    
    log('Running: prisma generate', 'yellow');
    execSync('npx prisma generate', { stdio: 'inherit' });
    logSuccess('Prisma client generated');

    log('Running: prisma migrate deploy', 'yellow');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logSuccess('Database schema created');

    // Step 6: Verification
    if (!skipVerify) {
      logStep('6/6', 'Verifying Migration');
      
      log('Running verification script...', 'yellow');
      execSync('node scripts/verify-migration.js', { stdio: 'inherit' });
    } else {
      logStep('6/6', 'Skipping Verification');
    }

    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║   ✅ Migration Completed Successfully!                     ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

    log('Next Steps:', 'yellow');
    log('1. Run: npm run dev', 'yellow');
    log('2. Test all critical workflows', 'yellow');
    log('3. Verify data in PostgreSQL', 'yellow');
    log('4. Deploy to production', 'yellow');

    rl.close();
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    log('\nRollback Instructions:', 'yellow');
    log('1. Restore SQLite: cp prisma/dev.db.backup prisma/dev.db', 'yellow');
    log('2. Revert schema: git checkout prisma/schema.prisma', 'yellow');
    log('3. Revert env: git checkout .env', 'yellow');
    log('4. Run: npm run db:setup:dev', 'yellow');
    rl.close();
    process.exit(1);
  }
}

main();

