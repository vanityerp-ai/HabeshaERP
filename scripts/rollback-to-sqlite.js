#!/usr/bin/env node

/**
 * Rollback from PostgreSQL to SQLite
 * 
 * Reverts the migration and restores SQLite database
 * 
 * Usage:
 *   node scripts/rollback-to-sqlite.js [--force]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
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

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║   Rollback to SQLite - Vanity Hub                          ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

    const force = process.argv.includes('--force');

    // Confirmation
    if (!force) {
      log('⚠️  This will rollback the migration and restore SQLite', 'yellow');
      const confirm = await question('Are you sure? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        log('Rollback cancelled', 'yellow');
        rl.close();
        return;
      }
    }

    // Step 1: Check backup exists
    logStep('1/4', 'Checking SQLite Backup');
    
    const backupPath = path.join(__dirname, '..', 'prisma', 'dev.db.backup');
    if (!fs.existsSync(backupPath)) {
      logError('SQLite backup not found at ' + backupPath);
      log('Cannot rollback without backup', 'red');
      rl.close();
      process.exit(1);
    }
    logSuccess('SQLite backup found');

    // Step 2: Restore SQLite database
    logStep('2/4', 'Restoring SQLite Database');
    
    const devDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    fs.copyFileSync(backupPath, devDbPath);
    logSuccess('SQLite database restored');

    // Step 3: Revert Prisma schema
    logStep('3/4', 'Reverting Prisma Schema');
    
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    const datasourceRegex = /datasource db \{[\s\S]*?\}/;
    const newDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

    schema = schema.replace(datasourceRegex, newDatasource);
    fs.writeFileSync(schemaPath, schema);
    logSuccess('Prisma schema reverted to SQLite');

    // Step 4: Update environment
    logStep('4/4', 'Updating Environment Configuration');
    
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    const dbUrlRegex = /^DATABASE_URL=.*$/m;
    const newDbUrl = 'DATABASE_URL="file:./prisma/dev.db"';

    if (dbUrlRegex.test(envContent)) {
      envContent = envContent.replace(dbUrlRegex, newDbUrl);
    } else {
      envContent += `\n${newDbUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    logSuccess('Environment configuration updated');

    // Regenerate Prisma client
    log('\nRegenerating Prisma client...', 'yellow');
    execSync('npx prisma generate', { stdio: 'inherit' });

    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║   ✅ Rollback Completed Successfully!                      ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

    log('Next Steps:', 'yellow');
    log('1. Run: npm run dev', 'yellow');
    log('2. Verify SQLite database is working', 'yellow');
    log('3. Check all data is intact', 'yellow');

    rl.close();
  } catch (error) {
    logError(`Rollback failed: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

main();

