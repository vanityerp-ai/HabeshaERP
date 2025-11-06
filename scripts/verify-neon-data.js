/**
 * Verify data in Neon PostgreSQL database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying data in Neon PostgreSQL database...\n');

  try {
    // Check Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    console.log('👥 Users:', users.length);
    if (users.length > 0) {
      console.log('   Admin/Staff users:');
      users.slice(0, 5).forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
      if (users.length > 5) {
        console.log(`   ... and ${users.length - 5} more`);
      }
    }
    console.log('');

    // Check Locations
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
    console.log('📍 Locations:', locations.length);
    if (locations.length > 0) {
      locations.slice(0, 5).forEach(loc => {
        console.log(`   - ${loc.name}`);
      });
      if (locations.length > 5) {
        console.log(`   ... and ${locations.length - 5} more`);
      }
    }
    console.log('');

    // Check Staff Members
    const staff = await prisma.staffMember.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
    console.log('👨‍💼 Staff Members:', staff.length);
    if (staff.length > 0) {
      staff.slice(0, 5).forEach(s => {
        console.log(`   - ${s.name}`);
      });
      if (staff.length > 5) {
        console.log(`   ... and ${staff.length - 5} more`);
      }
    }
    console.log('');

    // Check Services
    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
    });
    console.log('💇 Services:', services.length);
    console.log('');

    // Check Products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    console.log('🛍️ Products:', products.length);
    console.log('');

    // Check Clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    console.log('👤 Clients:', clients.length);
    console.log('');

    // Summary
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Locations: ${locations.length}`);
    console.log(`Total Staff: ${staff.length}`);
    console.log(`Total Services: ${services.length}`);
    console.log(`Total Products: ${products.length}`);
    console.log(`Total Clients: ${clients.length}`);
    console.log('='.repeat(50));

    if (users.length === 0 && locations.length === 0 && staff.length === 0) {
      console.log('\n⚠️  Database is empty - data migration needed!');
      return false;
    } else {
      console.log('\n✅ Database contains data!');
      return true;
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyData()
  .then((hasData) => {
    process.exit(hasData ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

