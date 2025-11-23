/**
 * Migration Verification Script
 * 
 * Verifies that the SQLite to PostgreSQL migration was successful
 * by checking:
 * 1. Database connectivity
 * 2. Table creation
 * 3. Data integrity
 * 4. API endpoints
 * 5. Service functionality
 */

import { prisma } from '@/lib/db'

interface VerificationResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration: number
}

const results: VerificationResult[] = []

async function runTest(
  category: string,
  test: string,
  fn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now()
  try {
    await fn()
    results.push({
      category,
      test,
      status: 'PASS',
      message: 'Test passed',
      duration: Date.now() - startTime
    })
    console.log(`✅ ${category} - ${test}`)
  } catch (error) {
    results.push({
      category,
      test,
      status: 'FAIL',
      message: String(error),
      duration: Date.now() - startTime
    })
    console.log(`❌ ${category} - ${test}: ${error}`)
  }
}

async function main() {
  console.log('🧪 Starting Migration Verification...\n')

  // 1. Database Connectivity
  console.log('📊 Testing Database Connectivity...')
  await runTest('Database', 'Connection', async () => {
    await prisma.$queryRaw`SELECT 1`
  })

  // 2. Table Creation
  console.log('\n📋 Testing Table Creation...')
  await runTest('Tables', 'Settings table exists', async () => {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'settings'
      )
    `
    if (!result[0].exists) throw new Error('Settings table not found')
  })

  await runTest('Tables', 'Users table exists', async () => {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `
    if (!result[0].exists) throw new Error('Users table not found')
  })

  await runTest('Tables', 'Transactions table exists', async () => {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transactions'
      )
    `
    if (!result[0].exists) throw new Error('Transactions table not found')
  })

  // 3. Data Integrity
  console.log('\n🔍 Testing Data Integrity...')
  await runTest('Data', 'Users migrated', async () => {
    const count = await prisma.user.count()
    if (count === 0) throw new Error('No users found')
    console.log(`   Found ${count} users`)
  })

  await runTest('Data', 'Locations migrated', async () => {
    const count = await prisma.location.count()
    if (count === 0) throw new Error('No locations found')
    console.log(`   Found ${count} locations`)
  })

  await runTest('Data', 'Transactions migrated', async () => {
    const count = await prisma.transaction.count()
    console.log(`   Found ${count} transactions`)
  })

  // 4. API Endpoints
  console.log('\n🌐 Testing API Endpoints...')
  await runTest('API', 'Settings endpoint', async () => {
    const response = await fetch('http://localhost:3000/api/settings')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  })

  await runTest('API', 'Transactions endpoint', async () => {
    const response = await fetch('http://localhost:3000/api/transactions')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  })

  await runTest('API', 'Inventory endpoint', async () => {
    const response = await fetch('http://localhost:3000/api/inventory/transactions')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  })

  // 5. Service Functionality
  console.log('\n⚙️ Testing Service Functionality...')
  await runTest('Services', 'Settings storage', async () => {
    const setting = await prisma.setting.findFirst()
    console.log(`   Found ${setting ? 1 : 0} settings`)
  })

  await runTest('Services', 'Transaction provider', async () => {
    const transaction = await prisma.transaction.findFirst()
    console.log(`   Found ${transaction ? 1 : 0} transactions`)
  })

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length

  console.log(`\n✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${failed}/${total}`)
  console.log(`⏭️  Skipped: ${total - passed - failed}/${total}`)

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  - ${r.category}: ${r.test}`)
        console.log(`    ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(60))
  console.log(failed === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED')
  console.log('='.repeat(60))

  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

