const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testing Database Connection\n');
console.log('='.repeat(60));

console.log('\n1️⃣  Connection String:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`POSTGRES_URL_NON_POOLING: ${process.env.POSTGRES_URL_NON_POOLING ? 'SET' : 'NOT SET'}`);

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('\n2️⃣  Attempting connection...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful!');
    console.log(`Result: ${JSON.stringify(result)}`);
    
    // Count staff
    const staffCount = await prisma.staffMember.count();
    console.log(`\n3️⃣  Staff count: ${staffCount}`);
    
    // Count services
    const serviceCount = await prisma.service.count();
    console.log(`4️⃣  Service count: ${serviceCount}`);
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error(`Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

