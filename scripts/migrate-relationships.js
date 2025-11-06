/**
 * Migrate relationship tables and appointments from SQLite to Neon PostgreSQL
 */

const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// SQLite database
const sqliteDb = new Database(path.join(__dirname, '..', 'prisma', 'prisma', 'dev.db'), { readonly: true });

// Neon PostgreSQL
const prisma = new PrismaClient();

async function migrateRelationships() {
  console.log('🔗 Migrating relationship tables and appointments...\n');

  try {
    // 1. Migrate Staff Locations
    console.log('🔗 Migrating Staff-Location relationships...');
    const staffLocations = sqliteDb.prepare('SELECT * FROM staff_locations').all();
    console.log(`   Found ${staffLocations.length} relationships`);
    
    for (const sl of staffLocations) {
      await prisma.staffLocation.upsert({
        where: { id: sl.id },
        update: {
          staffId: sl.staffId,
          locationId: sl.locationId,
          isActive: Boolean(sl.isActive),
          createdAt: new Date(sl.createdAt),
        },
        create: {
          id: sl.id,
          staffId: sl.staffId,
          locationId: sl.locationId,
          isActive: Boolean(sl.isActive),
          createdAt: new Date(sl.createdAt),
        },
      });
    }
    console.log(`✅ Migrated ${staffLocations.length} staff-location relationships\n`);

    // 2. Migrate Staff Services
    console.log('🔗 Migrating Staff-Service relationships...');
    const staffServices = sqliteDb.prepare('SELECT * FROM staff_services').all();
    console.log(`   Found ${staffServices.length} relationships`);
    
    for (const ss of staffServices) {
      await prisma.staffService.upsert({
        where: { id: ss.id },
        update: {
          staffId: ss.staffId,
          serviceId: ss.serviceId,
          isActive: Boolean(ss.isActive),
          createdAt: new Date(ss.createdAt),
        },
        create: {
          id: ss.id,
          staffId: ss.staffId,
          serviceId: ss.serviceId,
          isActive: Boolean(ss.isActive),
          createdAt: new Date(ss.createdAt),
        },
      });
    }
    console.log(`✅ Migrated ${staffServices.length} staff-service relationships\n`);

    // 3. Migrate Product Locations
    console.log('🔗 Migrating Product-Location relationships...');
    const productLocations = sqliteDb.prepare('SELECT * FROM product_locations').all();
    console.log(`   Found ${productLocations.length} relationships`);
    
    for (const pl of productLocations) {
      await prisma.productLocation.upsert({
        where: { id: pl.id },
        update: {
          productId: pl.productId,
          locationId: pl.locationId,
          stock: pl.stock,
          price: pl.price,
          isActive: Boolean(pl.isActive),
          createdAt: new Date(pl.createdAt),
          updatedAt: new Date(pl.updatedAt),
        },
        create: {
          id: pl.id,
          productId: pl.productId,
          locationId: pl.locationId,
          stock: pl.stock,
          price: pl.price,
          isActive: Boolean(pl.isActive),
          createdAt: new Date(pl.createdAt),
          updatedAt: new Date(pl.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${productLocations.length} product-location relationships\n`);

    // 4. Migrate Location Services
    console.log('🔗 Migrating Location-Service relationships...');
    const locationServices = sqliteDb.prepare('SELECT * FROM location_services').all();
    console.log(`   Found ${locationServices.length} relationships`);
    
    let lsCount = 0;
    for (const ls of locationServices) {
      await prisma.locationService.upsert({
        where: { id: ls.id },
        update: {
          locationId: ls.locationId,
          serviceId: ls.serviceId,
          price: ls.price,
          isActive: Boolean(ls.isActive),
          createdAt: new Date(ls.createdAt),
        },
        create: {
          id: ls.id,
          locationId: ls.locationId,
          serviceId: ls.serviceId,
          price: ls.price,
          isActive: Boolean(ls.isActive),
          createdAt: new Date(ls.createdAt),
        },
      });
      lsCount++;
      if (lsCount % 100 === 0) {
        console.log(`   Progress: ${lsCount}/${locationServices.length}`);
      }
    }
    console.log(`✅ Migrated ${locationServices.length} location-service relationships\n`);

    // 5. Migrate Appointments
    console.log('📅 Migrating Appointments...');
    const appointments = sqliteDb.prepare('SELECT * FROM appointments').all();
    console.log(`   Found ${appointments.length} appointments`);
    
    for (const appointment of appointments) {
      await prisma.appointment.upsert({
        where: { id: appointment.id },
        update: {
          bookingReference: appointment.bookingReference,
          clientId: appointment.clientId,
          staffId: appointment.staffId,
          locationId: appointment.locationId,
          date: new Date(appointment.date),
          duration: appointment.duration,
          totalPrice: appointment.totalPrice,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        },
        create: {
          id: appointment.id,
          bookingReference: appointment.bookingReference,
          clientId: appointment.clientId,
          staffId: appointment.staffId,
          locationId: appointment.locationId,
          date: new Date(appointment.date),
          duration: appointment.duration,
          totalPrice: appointment.totalPrice,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${appointments.length} appointments\n`);

    // 6. Migrate Appointment Services
    console.log('🔗 Migrating Appointment-Service relationships...');
    const appointmentServices = sqliteDb.prepare('SELECT * FROM appointment_services').all();
    console.log(`   Found ${appointmentServices.length} relationships`);
    
    for (const as of appointmentServices) {
      await prisma.appointmentService.upsert({
        where: { id: as.id },
        update: {
          appointmentId: as.appointmentId,
          serviceId: as.serviceId,
          price: as.price,
          duration: as.duration,
          createdAt: new Date(as.createdAt),
        },
        create: {
          id: as.id,
          appointmentId: as.appointmentId,
          serviceId: as.serviceId,
          price: as.price,
          duration: as.duration,
          createdAt: new Date(as.createdAt),
        },
      });
    }
    console.log(`✅ Migrated ${appointmentServices.length} appointment-service relationships\n`);

    // 7. Migrate Appointment Products
    console.log('🔗 Migrating Appointment-Product relationships...');
    const appointmentProducts = sqliteDb.prepare('SELECT * FROM appointment_products').all();
    console.log(`   Found ${appointmentProducts.length} relationships`);
    
    for (const ap of appointmentProducts) {
      await prisma.appointmentProduct.upsert({
        where: { id: ap.id },
        update: {
          appointmentId: ap.appointmentId,
          productId: ap.productId,
          quantity: ap.quantity,
          price: ap.price,
          createdAt: new Date(ap.createdAt),
        },
        create: {
          id: ap.id,
          appointmentId: ap.appointmentId,
          productId: ap.productId,
          quantity: ap.quantity,
          price: ap.price,
          createdAt: new Date(ap.createdAt),
        },
      });
    }
    console.log(`✅ Migrated ${appointmentProducts.length} appointment-product relationships\n`);

    // 8. Migrate Transactions
    console.log('💰 Migrating Transactions...');
    const transactions = sqliteDb.prepare('SELECT * FROM transactions').all();
    console.log(`   Found ${transactions.length} transactions`);
    
    for (const transaction of transactions) {
      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: {
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          method: transaction.method,
          reference: transaction.reference,
          description: transaction.description,
          locationId: transaction.locationId,
          appointmentId: transaction.appointmentId,
          discountAmount: transaction.discountAmount,
          discountPercentage: transaction.discountPercentage,
          items: transaction.items,
          originalServiceAmount: transaction.originalServiceAmount,
          productAmount: transaction.productAmount,
          serviceAmount: transaction.serviceAmount,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt),
        },
        create: {
          id: transaction.id,
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          method: transaction.method,
          reference: transaction.reference,
          description: transaction.description,
          locationId: transaction.locationId,
          appointmentId: transaction.appointmentId,
          discountAmount: transaction.discountAmount,
          discountPercentage: transaction.discountPercentage,
          items: transaction.items,
          originalServiceAmount: transaction.originalServiceAmount,
          productAmount: transaction.productAmount,
          serviceAmount: transaction.serviceAmount,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${transactions.length} transactions\n`);

    console.log('🎉 Relationship migration completed successfully!');
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Staff-Location Relationships: ${staffLocations.length}`);
    console.log(`✅ Staff-Service Relationships: ${staffServices.length}`);
    console.log(`✅ Product-Location Relationships: ${productLocations.length}`);
    console.log(`✅ Location-Service Relationships: ${locationServices.length}`);
    console.log(`✅ Appointments: ${appointments.length}`);
    console.log(`✅ Appointment-Service Relationships: ${appointmentServices.length}`);
    console.log(`✅ Appointment-Product Relationships: ${appointmentProducts.length}`);
    console.log(`✅ Transactions: ${transactions.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await prisma.$disconnect();
  }
}

migrateRelationships()
  .then(() => {
    console.log('\n✅ All relationships migrated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

