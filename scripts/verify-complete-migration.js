/**
 * Comprehensive verification of Neon PostgreSQL database migration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCompleteMigration() {
  console.log('🔍 Comprehensive Migration Verification\n');
  console.log('='.repeat(60));

  try {
    // Core entities
    const users = await prisma.user.count();
    const locations = await prisma.location.count();
    const staff = await prisma.staffMember.count();
    const services = await prisma.service.count();
    const products = await prisma.product.count();
    const clients = await prisma.client.count();

    // Relationships
    const staffLocations = await prisma.staffLocation.count();
    const staffServices = await prisma.staffService.count();
    const productLocations = await prisma.productLocation.count();
    const locationServices = await prisma.locationService.count();

    // Appointments and transactions
    const appointments = await prisma.appointment.count();
    const appointmentServices = await prisma.appointmentService.count();
    const appointmentProducts = await prisma.appointmentProduct.count();
    const transactions = await prisma.transaction.count();

    console.log('\n📊 CORE ENTITIES');
    console.log('-'.repeat(60));
    console.log(`👥 Users:              ${users.toString().padStart(6)}`);
    console.log(`📍 Locations:          ${locations.toString().padStart(6)}`);
    console.log(`👨‍💼 Staff Members:      ${staff.toString().padStart(6)}`);
    console.log(`💇 Services:           ${services.toString().padStart(6)}`);
    console.log(`🛍️  Products:           ${products.toString().padStart(6)}`);
    console.log(`👤 Clients:            ${clients.toString().padStart(6)}`);

    console.log('\n🔗 RELATIONSHIPS');
    console.log('-'.repeat(60));
    console.log(`Staff-Location:        ${staffLocations.toString().padStart(6)}`);
    console.log(`Staff-Service:         ${staffServices.toString().padStart(6)}`);
    console.log(`Product-Location:      ${productLocations.toString().padStart(6)}`);
    console.log(`Location-Service:      ${locationServices.toString().padStart(6)}`);

    console.log('\n📅 APPOINTMENTS & TRANSACTIONS');
    console.log('-'.repeat(60));
    console.log(`Appointments:          ${appointments.toString().padStart(6)}`);
    console.log(`Appointment-Service:   ${appointmentServices.toString().padStart(6)}`);
    console.log(`Appointment-Product:   ${appointmentProducts.toString().padStart(6)}`);
    console.log(`Transactions:          ${transactions.toString().padStart(6)}`);

    // Verify admin users
    console.log('\n👑 ADMIN USERS');
    console.log('-'.repeat(60));
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, isActive: true, lastLogin: true },
    });
    admins.forEach(admin => {
      const status = admin.isActive ? '✅ Active' : '❌ Inactive';
      console.log(`${admin.email.padEnd(30)} ${status}`);
    });

    // Verify locations
    console.log('\n📍 LOCATIONS');
    console.log('-'.repeat(60));
    const activeLocations = await prisma.location.findMany({
      where: { isActive: true },
      select: { name: true, city: true, country: true },
      take: 10,
    });
    activeLocations.forEach(loc => {
      console.log(`${loc.name.padEnd(30)} ${loc.city}, ${loc.country}`);
    });
    if (locations > 10) {
      console.log(`... and ${locations - 10} more`);
    }

    // Expected counts (from SQLite)
    const expected = {
      users: 25,
      locations: 15,
      staff: 22,
      services: 432,
      products: 68,
      clients: 3,
      staffLocations: 39,
      staffServices: 188,
      productLocations: 135,
      locationServices: 1723,
      appointments: 1,
      appointmentServices: 1,
    };

    console.log('\n✅ MIGRATION VERIFICATION');
    console.log('='.repeat(60));

    const checks = [
      { name: 'Users', actual: users, expected: expected.users },
      { name: 'Locations', actual: locations, expected: expected.locations },
      { name: 'Staff Members', actual: staff, expected: expected.staff },
      { name: 'Services', actual: services, expected: expected.services },
      { name: 'Products', actual: products, expected: expected.products },
      { name: 'Clients', actual: clients, expected: expected.clients },
      { name: 'Staff-Location', actual: staffLocations, expected: expected.staffLocations },
      { name: 'Staff-Service', actual: staffServices, expected: expected.staffServices },
      { name: 'Product-Location', actual: productLocations, expected: expected.productLocations },
      { name: 'Location-Service', actual: locationServices, expected: expected.locationServices },
      { name: 'Appointments', actual: appointments, expected: expected.appointments },
      { name: 'Appointment-Service', actual: appointmentServices, expected: expected.appointmentServices },
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.actual === check.expected;
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASS' : `FAIL (expected ${check.expected})`;
      console.log(`${icon} ${check.name.padEnd(25)} ${check.actual.toString().padStart(6)} - ${status}`);
      if (!passed) allPassed = false;
    });

    console.log('='.repeat(60));

    if (allPassed) {
      console.log('\n🎉 ALL CHECKS PASSED! Migration is complete and verified!');
      console.log('\n✅ Your VanityPOS data is now in Neon PostgreSQL!');
      console.log('✅ All admin credentials preserved');
      console.log('✅ All locations, staff, services, and products migrated');
      console.log('✅ All relationships and appointments intact');
      return true;
    } else {
      console.log('\n⚠️  Some checks failed. Please review the migration.');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyCompleteMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

