#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

console.log('🚀 MIGRATING DATA TO NEON DATABASE\n');
console.log('='.repeat(60));

// Create Neon client (using current DATABASE_URL which is Neon)
const neonPrisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('\n1️⃣  Testing Neon connection...');
    await neonPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Neon connection successful');

    // Get counts before migration
    console.log('\n2️⃣  Checking existing data in Neon...');
    const existingServices = await neonPrisma.service.count();
    const existingLocations = await neonPrisma.location.count();
    const existingStaff = await neonPrisma.staffMember.count();

    console.log(`   Services: ${existingServices}`);
    console.log(`   Locations: ${existingLocations}`);
    console.log(`   Staff: ${existingStaff}`);

    // Create locations if they don't exist
    console.log('\n2.5️⃣  CREATING LOCATIONS...');
    const requiredLocations = [
      { id: 'loc1', name: 'D-ring road', address: '123 D-Ring Road', city: 'Doha', state: 'Doha', zipCode: '12345', country: 'Qatar', phone: '(974) 123-4567', email: 'dring@vanityhub.com' },
      { id: 'loc2', name: 'Muaither', address: '456 Muaither St', city: 'Doha', state: 'Doha', zipCode: '23456', country: 'Qatar', phone: '(974) 234-5678', email: 'muaither@vanityhub.com' },
      { id: 'loc3', name: 'Medinat Khalifa', address: '789 Medinat Khalifa Blvd', city: 'Doha', state: 'Doha', zipCode: '34567', country: 'Qatar', phone: '(974) 345-6789', email: 'medinat@vanityhub.com' },
      { id: 'home', name: 'Home service', address: 'Client\'s Location', city: 'Doha', state: 'Doha', zipCode: '', country: 'Qatar', phone: '(974) 456-7890', email: 'homeservice@vanityhub.com' },
      { id: 'online', name: 'Online store', address: 'Virtual Location', city: 'Doha', state: 'Doha', zipCode: '', country: 'Qatar', phone: '(974) 567-8901', email: 'online@vanityhub.com' }
    ];

    let locationsCreated = 0;
    for (const location of requiredLocations) {
      const existing = await neonPrisma.location.findUnique({
        where: { id: location.id }
      });

      if (!existing) {
        await neonPrisma.location.create({
          data: {
            ...location,
            isActive: true
          }
        });
        locationsCreated++;
      }
    }
    console.log(`✅ Created ${locationsCreated} locations`);

    // Import real services data
    console.log('\n3️⃣  IMPORTING SERVICES...');
    const realServicesData = require('../prisma/real-services-data.ts');

    let servicesCreated = 0;
    for (const service of realServicesData.realServiceData) {
      const existing = await neonPrisma.service.findFirst({
        where: { name: service.name }
      });

      if (!existing) {
        await neonPrisma.service.create({
          data: {
            name: service.name,
            description: service.description || null,
            duration: service.duration,
            price: service.price,
            category: service.category,
            showPricesToClients: true,
            isActive: true
          }
        });
        servicesCreated++;
      }
    }
    console.log(`✅ Created ${servicesCreated} services`);

    // Get all locations
    console.log('\n4️⃣  ASSIGNING SERVICES TO LOCATIONS...');
    const locations = await neonPrisma.location.findMany({
      where: { isActive: true }
    });
    console.log(`   Found ${locations.length} locations`);

    // Get all services
    const services = await neonPrisma.service.findMany({
      where: { isActive: true }
    });
    console.log(`   Found ${services.length} services`);

    // Assign services to locations
    let assignmentsCreated = 0;
    for (const service of services) {
      for (const location of locations) {
        const existing = await neonPrisma.locationService.findUnique({
          where: {
            locationId_serviceId: {
              locationId: location.id,
              serviceId: service.id
            }
          }
        });

        if (!existing) {
          await neonPrisma.locationService.create({
            data: {
              locationId: location.id,
              serviceId: service.id,
              price: service.price,
              isActive: true
            }
          });
          assignmentsCreated++;
        }
      }
    }
    console.log(`✅ Created ${assignmentsCreated} service-location assignments`);

    // Verify final counts
    console.log('\n5️⃣  FINAL VERIFICATION...');
    const finalServices = await neonPrisma.service.count();
    const finalAssignments = await neonPrisma.locationService.count();
    const finalStaff = await neonPrisma.staffMember.count();
    
    console.log(`   Services: ${finalServices}`);
    console.log(`   Service-Location Assignments: ${finalAssignments}`);
    console.log(`   Staff Members: ${finalStaff}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ MIGRATION COMPLETE!\n');
    console.log('Summary:');
    console.log(`  - Services: ${finalServices}`);
    console.log(`  - Service-Location Assignments: ${finalAssignments}`);
    console.log(`  - Staff Members: ${finalStaff}`);
    console.log(`  - Locations: ${locations.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await neonPrisma.$disconnect();
  }
}

migrateData();

