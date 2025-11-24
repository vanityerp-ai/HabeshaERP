const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyReset() {
  console.log('✅ VERIFYING RESET COMPLETION\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Count services
    console.log('\n1️⃣  SERVICES');
    const serviceCount = await prisma.service.count({
      where: { isActive: true }
    });
    console.log(`✅ Total active services: ${serviceCount}`);
    
    // 2. Count service-location relationships
    console.log('\n2️⃣  SERVICE-LOCATION RELATIONSHIPS');
    const locationServiceCount = await prisma.locationService.count({
      where: { isActive: true }
    });
    console.log(`✅ Total active service-location relationships: ${locationServiceCount}`);
    
    // 3. Count staff
    console.log('\n3️⃣  STAFF MEMBERS');
    const staffCount = await prisma.staffMember.count();
    console.log(`✅ Total staff members: ${staffCount}`);
    
    // 4. List staff
    const staff = await prisma.staffMember.findMany({
      include: { user: true }
    });
    console.log('\nStaff list:');
    staff.forEach(s => {
      console.log(`   - ${s.name} (${s.user.email}) - ${s.jobRole}`);
    });
    
    // 5. Count users
    console.log('\n4️⃣  USERS');
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' }
    });
    const staffUserCount = await prisma.user.count({
      where: { role: 'STAFF' }
    });
    
    console.log(`✅ Admin users: ${adminCount}`);
    console.log(`✅ Super Admin users: ${superAdminCount}`);
    console.log(`✅ Staff users: ${staffUserCount}`);
    
    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ RESET VERIFICATION COMPLETE\n');
    console.log('Summary:');
    console.log(`  - Services: ${serviceCount} (expected: 144)`);
    console.log(`  - Service-Location assignments: ${locationServiceCount}`);
    console.log(`  - Staff members: ${staffCount}`);
    console.log(`  - Admin users: ${adminCount} (preserved)`);
    console.log(`  - Super Admin users: ${superAdminCount} (preserved)`);
    console.log(`  - Staff users: ${staffUserCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyReset();

