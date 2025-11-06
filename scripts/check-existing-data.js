/**
 * Script to check existing data in the database
 * This will help verify what data needs to be preserved during migration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingData() {
  console.log('🔍 Checking existing database data...\n');

  try {
    // Check Users (Admin credentials)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    console.log('👥 Users:', users.length);
    if (users.length > 0) {
      console.log('   Admin/Staff users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Active: ${user.isActive}`);
      });
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
      locations.forEach(loc => {
        console.log(`   - ${loc.name} (Active: ${loc.isActive})`);
      });
    }
    console.log('');

    // Check Staff Members
    const staff = await prisma.staffMember.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
      },
    });
    console.log('👨‍💼 Staff Members:', staff.length);
    if (staff.length > 0) {
      staff.forEach(s => {
        console.log(`   - ${s.name} (${s.phone || 'No phone'}) - Status: ${s.status}`);
      });
    }
    console.log('');

    // Check Services
    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        isActive: true,
      },
    });
    console.log('💇 Services:', services.length);
    if (services.length > 0) {
      console.log('   Sample services:');
      services.slice(0, 5).forEach(s => {
        console.log(`   - ${s.name} (${s.category}) - $${s.price}`);
      });
      if (services.length > 5) {
        console.log(`   ... and ${services.length - 5} more`);
      }
    }
    console.log('');

    // Check Products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        isActive: true,
      },
    });
    console.log('🛍️ Products:', products.length);
    if (products.length > 0) {
      console.log('   Sample products:');
      products.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name} (${p.category}) - $${p.price}`);
      });
      if (products.length > 5) {
        console.log(`   ... and ${products.length - 5} more`);
      }
    }
    console.log('');

    // Check Clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    console.log('👤 Clients:', clients.length);
    if (clients.length > 0) {
      console.log('   Sample clients:');
      clients.slice(0, 5).forEach(c => {
        console.log(`   - ${c.name} (${c.user?.email || c.phone || 'No contact'})`);
      });
      if (clients.length > 5) {
        console.log(`   ... and ${clients.length - 5} more`);
      }
    }
    console.log('');

    // Check Appointments
    const appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        status: true,
        date: true,
      },
    });
    console.log('📅 Appointments:', appointments.length);
    console.log('');

    // Check Transactions
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        amount: true,
        type: true,
      },
    });
    console.log('💰 Transactions:', transactions.length);
    if (transactions.length > 0) {
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
    }
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
    console.log(`Total Appointments: ${appointments.length}`);
    console.log(`Total Transactions: ${transactions.length}`);
    console.log('='.repeat(50));

    // Check if there's critical data
    const hasCriticalData = users.length > 0 || locations.length > 0 || staff.length > 0 || 
                           services.length > 0 || products.length > 0 || clients.length > 0;

    if (hasCriticalData) {
      console.log('\n⚠️  IMPORTANT: Database contains critical data that must be preserved!');
      console.log('   Make sure to migrate this data to the Neon database.');
    } else {
      console.log('\n✅ Database is empty or contains minimal data.');
      console.log('   Safe to start fresh with Neon database.');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData()
  .then(() => {
    console.log('\n✅ Data check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Data check failed:', error);
    process.exit(1);
  });

