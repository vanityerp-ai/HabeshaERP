const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testServicesAPI() {
  console.log('🔍 SERVICES API DIAGNOSTIC\n');
  console.log('='.repeat(50));
  
  try {
    // 1. Test database connection
    console.log('\n1️⃣  DATABASE CONNECTION');
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    // 2. Check services table
    console.log('\n2️⃣  SERVICES TABLE');
    const serviceCount = await prisma.service.count();
    console.log(`✅ Total services in database: ${serviceCount}`);
    
    // 3. Fetch active services
    console.log('\n3️⃣  ACTIVE SERVICES');
    const activeServices = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        locations: {
          where: { isActive: true },
          include: { location: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`✅ Found ${activeServices.length} active services:`);
    activeServices.forEach(service => {
      console.log(`   - ${service.name} (${service.duration}min, $${service.price})`);
      console.log(`     Category: ${service.category}`);
      console.log(`     Locations: ${service.locations.length}`);
    });
    
    // 4. Check locations
    console.log('\n4️⃣  LOCATIONS');
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    });
    console.log(`✅ Found ${locations.length} active locations:`);
    locations.forEach(loc => {
      console.log(`   - ${loc.name} (${loc.city})`);
    });
    
    // 5. Check service-location relationships
    console.log('\n5️⃣  SERVICE-LOCATION RELATIONSHIPS');
    const serviceLocations = await prisma.locationService.findMany({
      where: { isActive: true },
      include: {
        service: true,
        location: true
      }
    });
    console.log(`✅ Found ${serviceLocations.length} active service-location relationships`);
    
    // 6. Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ DIAGNOSTIC COMPLETE\n');
    
    if (activeServices.length === 0) {
      console.log('⚠️  WARNING: No active services found!');
      console.log('   This could cause the "Failed to fetch services" error.');
      console.log('\n   To fix:');
      console.log('   1. Create services in the database');
      console.log('   2. Make sure services have isActive = true');
      console.log('   3. Assign services to locations');
    } else {
      console.log('✅ Services are available and should load correctly');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testServicesAPI();

