/**
 * Import data from JSON files to Neon PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  console.log('📥 Importing data to Neon PostgreSQL...\n');

  try {
    const exportDir = path.join(__dirname, 'export');

    // Import Users
    console.log('👥 Importing Users...');
    const users = JSON.parse(fs.readFileSync(path.join(exportDir, 'users.json'), 'utf8'));
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`✅ Imported ${users.length} users\n`);

    // Import Locations
    console.log('📍 Importing Locations...');
    const locations = JSON.parse(fs.readFileSync(path.join(exportDir, 'locations.json'), 'utf8'));
    for (const location of locations) {
      await prisma.location.upsert({
        where: { id: location.id },
        update: location,
        create: location,
      });
    }
    console.log(`✅ Imported ${locations.length} locations\n`);

    // Import Staff Members
    console.log('👨‍💼 Importing Staff Members...');
    const staff = JSON.parse(fs.readFileSync(path.join(exportDir, 'staff.json'), 'utf8'));
    for (const member of staff) {
      await prisma.staffMember.upsert({
        where: { id: member.id },
        update: member,
        create: member,
      });
    }
    console.log(`✅ Imported ${staff.length} staff members\n`);

    // Import Services
    console.log('💇 Importing Services...');
    const services = JSON.parse(fs.readFileSync(path.join(exportDir, 'services.json'), 'utf8'));
    let serviceCount = 0;
    for (const service of services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
      serviceCount++;
      if (serviceCount % 50 === 0) {
        console.log(`   Progress: ${serviceCount}/${services.length}`);
      }
    }
    console.log(`✅ Imported ${services.length} services\n`);

    // Import Products
    console.log('🛍️ Importing Products...');
    const products = JSON.parse(fs.readFileSync(path.join(exportDir, 'products.json'), 'utf8'));
    for (const product of products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product,
      });
    }
    console.log(`✅ Imported ${products.length} products\n`);

    // Import Clients
    console.log('👤 Importing Clients...');
    const clients = JSON.parse(fs.readFileSync(path.join(exportDir, 'clients.json'), 'utf8'));
    for (const client of clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: client,
        create: client,
      });
    }
    console.log(`✅ Imported ${clients.length} clients\n`);

    // Import Staff Locations
    console.log('🔗 Importing Staff-Location relationships...');
    const staffLocations = JSON.parse(fs.readFileSync(path.join(exportDir, 'staff-locations.json'), 'utf8'));
    for (const sl of staffLocations) {
      await prisma.staffLocation.upsert({
        where: { id: sl.id },
        update: sl,
        create: sl,
      });
    }
    console.log(`✅ Imported ${staffLocations.length} relationships\n`);

    // Import Staff Services
    console.log('🔗 Importing Staff-Service relationships...');
    const staffServices = JSON.parse(fs.readFileSync(path.join(exportDir, 'staff-services.json'), 'utf8'));
    for (const ss of staffServices) {
      await prisma.staffService.upsert({
        where: { id: ss.id },
        update: ss,
        create: ss,
      });
    }
    console.log(`✅ Imported ${staffServices.length} relationships\n`);

    // Import Product Locations
    console.log('🔗 Importing Product-Location relationships...');
    const productLocations = JSON.parse(fs.readFileSync(path.join(exportDir, 'product-locations.json'), 'utf8'));
    for (const pl of productLocations) {
      await prisma.productLocation.upsert({
        where: { id: pl.id },
        update: pl,
        create: pl,
      });
    }
    console.log(`✅ Imported ${productLocations.length} relationships\n`);

    // Import Appointments
    console.log('📅 Importing Appointments...');
    const appointments = JSON.parse(fs.readFileSync(path.join(exportDir, 'appointments.json'), 'utf8'));
    for (const appointment of appointments) {
      await prisma.appointment.upsert({
        where: { id: appointment.id },
        update: appointment,
        create: appointment,
      });
    }
    console.log(`✅ Imported ${appointments.length} appointments\n`);

    // Import Transactions
    console.log('💰 Importing Transactions...');
    const transactions = JSON.parse(fs.readFileSync(path.join(exportDir, 'transactions.json'), 'utf8'));
    for (const transaction of transactions) {
      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction,
      });
    }
    console.log(`✅ Imported ${transactions.length} transactions\n`);

    // Import Appointment Services
    console.log('🔗 Importing Appointment-Service relationships...');
    const appointmentServices = JSON.parse(fs.readFileSync(path.join(exportDir, 'appointment-services.json'), 'utf8'));
    for (const as of appointmentServices) {
      await prisma.appointmentService.upsert({
        where: { id: as.id },
        update: as,
        create: as,
      });
    }
    console.log(`✅ Imported ${appointmentServices.length} relationships\n`);

    // Import Appointment Products
    console.log('🔗 Importing Appointment-Product relationships...');
    const appointmentProducts = JSON.parse(fs.readFileSync(path.join(exportDir, 'appointment-products.json'), 'utf8'));
    for (const ap of appointmentProducts) {
      await prisma.appointmentProduct.upsert({
        where: { id: ap.id },
        update: ap,
        create: ap,
      });
    }
    console.log(`✅ Imported ${appointmentProducts.length} relationships\n`);

    console.log('✅ All data imported successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

