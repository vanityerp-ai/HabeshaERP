const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixServiceLocations() {
  console.log('🔧 FIXING SERVICE-LOCATION RELATIONSHIPS\n');
  console.log('='.repeat(50));
  
  try {
    // 1. Get all active services
    console.log('\n1️⃣  FETCHING SERVICES');
    const services = await prisma.service.findMany({
      where: { isActive: true }
    });
    console.log(`✅ Found ${services.length} active services`);
    
    // 2. Get all active locations
    console.log('\n2️⃣  FETCHING LOCATIONS');
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    });
    console.log(`✅ Found ${locations.length} active locations:`);
    locations.forEach(loc => console.log(`   - ${loc.name}`));
    
    // 3. Assign services to locations
    console.log('\n3️⃣  ASSIGNING SERVICES TO LOCATIONS');
    let assignmentCount = 0;

    for (const service of services) {
      for (const location of locations) {
        try {
          await prisma.locationService.upsert({
            where: {
              locationId_serviceId: {
                locationId: location.id,
                serviceId: service.id
              }
            },
            update: { isActive: true },
            create: {
              locationId: location.id,
              serviceId: service.id,
              price: service.price,
              isActive: true
            }
          });
          assignmentCount++;
        } catch (error) {
          console.error(`Error assigning ${service.name} to ${location.name}:`, error.message);
        }
      }
    }

    console.log(`✅ Processed ${assignmentCount} service-location assignments`);
    
    // 4. Verify
    console.log('\n4️⃣  VERIFICATION');
    const totalAssignments = await prisma.locationService.count({
      where: { isActive: true }
    });
    console.log(`✅ Total active service-location relationships: ${totalAssignments}`);
    
    // 5. Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ FIX COMPLETE\n');
    console.log('Services are now assigned to all locations!');
    console.log('The "Failed to fetch services" error should be resolved.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixServiceLocations();

