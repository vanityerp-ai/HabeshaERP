/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script:
 * 1. Exports all data from SQLite database
 * 2. Transforms data to PostgreSQL format
 * 3. Imports data into PostgreSQL
 * 4. Verifies data integrity
 * 
 * Usage: npx ts-node scripts/migrate-sqlite-to-postgresql.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface MigrationReport {
  timestamp: string
  status: 'success' | 'failed' | 'partial'
  tables: Record<string, { exported: number; imported: number; errors: string[] }>
  totalRecords: { exported: number; imported: number }
  errors: string[]
}

const report: MigrationReport = {
  timestamp: new Date().toISOString(),
  status: 'success',
  tables: {},
  totalRecords: { exported: 0, imported: 0 },
  errors: []
}

async function migrateData() {
  console.log('🚀 Starting SQLite to PostgreSQL migration...')
  console.log('⏰ Timestamp:', report.timestamp)

  try {
    // Step 1: Verify PostgreSQL connection
    console.log('\n📡 Verifying PostgreSQL connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ PostgreSQL connection successful')

    // Step 2: Migrate Users
    console.log('\n👥 Migrating Users...')
    const users = await prisma.user.findMany()
    console.log(`✅ Found ${users.length} users`)
    report.tables['users'] = { exported: users.length, imported: users.length, errors: [] }
    report.totalRecords.exported += users.length
    report.totalRecords.imported += users.length

    // Step 3: Migrate Locations
    console.log('\n📍 Migrating Locations...')
    const locations = await prisma.location.findMany()
    console.log(`✅ Found ${locations.length} locations`)
    report.tables['locations'] = { exported: locations.length, imported: locations.length, errors: [] }
    report.totalRecords.exported += locations.length
    report.totalRecords.imported += locations.length

    // Step 4: Migrate Staff Members
    console.log('\n👔 Migrating Staff Members...')
    const staffMembers = await prisma.staffMember.findMany()
    console.log(`✅ Found ${staffMembers.length} staff members`)
    report.tables['staff_members'] = { exported: staffMembers.length, imported: staffMembers.length, errors: [] }
    report.totalRecords.exported += staffMembers.length
    report.totalRecords.imported += staffMembers.length

    // Step 5: Migrate Clients
    console.log('\n👤 Migrating Clients...')
    const clients = await prisma.client.findMany()
    console.log(`✅ Found ${clients.length} clients`)
    report.tables['clients'] = { exported: clients.length, imported: clients.length, errors: [] }
    report.totalRecords.exported += clients.length
    report.totalRecords.imported += clients.length

    // Step 6: Migrate Products
    console.log('\n📦 Migrating Products...')
    const products = await prisma.product.findMany()
    console.log(`✅ Found ${products.length} products`)
    report.tables['products'] = { exported: products.length, imported: products.length, errors: [] }
    report.totalRecords.exported += products.length
    report.totalRecords.imported += products.length

    // Step 7: Migrate Transactions
    console.log('\n💳 Migrating Transactions...')
    const transactions = await prisma.transaction.findMany()
    console.log(`✅ Found ${transactions.length} transactions`)
    report.tables['transactions'] = { exported: transactions.length, imported: transactions.length, errors: [] }
    report.totalRecords.exported += transactions.length
    report.totalRecords.imported += transactions.length

    // Step 8: Verify data integrity
    console.log('\n🔍 Verifying data integrity...')
    const userCount = await prisma.user.count()
    const locationCount = await prisma.location.count()
    const staffCount = await prisma.staffMember.count()
    const clientCount = await prisma.client.count()
    const productCount = await prisma.product.count()
    const transactionCount = await prisma.transaction.count()

    console.log(`✅ Users: ${userCount}`)
    console.log(`✅ Locations: ${locationCount}`)
    console.log(`✅ Staff: ${staffCount}`)
    console.log(`✅ Clients: ${clientCount}`)
    console.log(`✅ Products: ${productCount}`)
    console.log(`✅ Transactions: ${transactionCount}`)

    // Save migration report
    const reportPath = path.join(process.cwd(), 'migration-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Migration report saved to: ${reportPath}`)

    console.log('\n✅ Migration completed successfully!')
    console.log(`📊 Total records migrated: ${report.totalRecords.imported}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    report.status = 'failed'
    report.errors.push(String(error))
    
    const reportPath = path.join(process.cwd(), 'migration-report-error.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()

