const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'prisma', 'prisma', 'dev.db'), { readonly: true });

console.log('📋 SQLite Database Schema\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

console.log(`Found ${tables.length} tables:\n`);

tables.forEach(table => {
  console.log(`\n📊 Table: ${table.name}`);
  console.log('='.repeat(50));
  
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  columns.forEach(col => {
    const nullable = col.notnull === 0 ? 'NULL' : 'NOT NULL';
    const pk = col.pk === 1 ? ' PRIMARY KEY' : '';
    const def = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
    console.log(`  ${col.name.padEnd(20)} ${col.type.padEnd(15)} ${nullable}${pk}${def}`);
  });
  
  // Show sample data
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`\n  Total rows: ${count.count}`);
});

db.close();

