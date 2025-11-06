/**
 * Export data from SQLite database to JSON files
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Temporarily use SQLite
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function exportData() {
  console.log('📤 Exporting data from SQLite database...\n');

  try {
    const exportDir = path.join(__dirname, 'export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Export Users
    console.log('👥 Exporting Users...');
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✅ Exported ${users.length} users\n`);

    // Export Locations
    console.log('📍 Exporting Locations...');
    const locations = await prisma.location.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'locations.json'),
      JSON.stringify(locations, null, 2)
    );
    console.log(`✅ Exported ${locations.length} locations\n`);

    // Export Staff Members
    console.log('👨‍💼 Exporting Staff Members...');
    const staff = await prisma.staffMember.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'staff.json'),
      JSON.stringify(staff, null, 2)
    );
    console.log(`✅ Exported ${staff.length} staff members\n`);

    // Export Services
    console.log('💇 Exporting Services...');
    const services = await prisma.service.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'services.json'),
      JSON.stringify(services, null, 2)
    );
    console.log(`✅ Exported ${services.length} services\n`);

    // Export Products
    console.log('🛍️ Exporting Products...');
    const products = await prisma.product.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'products.json'),
      JSON.stringify(products, null, 2)
    );
    console.log(`✅ Exported ${products.length} products\n`);

    // Export Clients
    console.log('👤 Exporting Clients...');
    const clients = await prisma.client.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'clients.json'),
      JSON.stringify(clients, null, 2)
    );
    console.log(`✅ Exported ${clients.length} clients\n`);

    // Export Staff Locations
    console.log('🔗 Exporting Staff-Location relationships...');
    const staffLocations = await prisma.staffLocation.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'staff-locations.json'),
      JSON.stringify(staffLocations, null, 2)
    );
    console.log(`✅ Exported ${staffLocations.length} relationships\n`);

    // Export Staff Services
    console.log('🔗 Exporting Staff-Service relationships...');
    const staffServices = await prisma.staffService.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'staff-services.json'),
      JSON.stringify(staffServices, null, 2)
    );
    console.log(`✅ Exported ${staffServices.length} relationships\n`);

    // Export Product Locations
    console.log('🔗 Exporting Product-Location relationships...');
    const productLocations = await prisma.productLocation.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'product-locations.json'),
      JSON.stringify(productLocations, null, 2)
    );
    console.log(`✅ Exported ${productLocations.length} relationships\n`);

    // Export Appointments
    console.log('📅 Exporting Appointments...');
    const appointments = await prisma.appointment.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'appointments.json'),
      JSON.stringify(appointments, null, 2)
    );
    console.log(`✅ Exported ${appointments.length} appointments\n`);

    // Export Transactions
    console.log('💰 Exporting Transactions...');
    const transactions = await prisma.transaction.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'transactions.json'),
      JSON.stringify(transactions, null, 2)
    );
    console.log(`✅ Exported ${transactions.length} transactions\n`);

    // Export Appointment Services
    console.log('🔗 Exporting Appointment-Service relationships...');
    const appointmentServices = await prisma.appointmentService.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'appointment-services.json'),
      JSON.stringify(appointmentServices, null, 2)
    );
    console.log(`✅ Exported ${appointmentServices.length} relationships\n`);

    // Export Appointment Products
    console.log('🔗 Exporting Appointment-Product relationships...');
    const appointmentProducts = await prisma.appointmentProduct.findMany();
    fs.writeFileSync(
      path.join(exportDir, 'appointment-products.json'),
      JSON.stringify(appointmentProducts, null, 2)
    );
    console.log(`✅ Exported ${appointmentProducts.length} relationships\n`);

    console.log('✅ All data exported successfully to scripts/export/');

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

