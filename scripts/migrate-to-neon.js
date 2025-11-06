/**
 * Migration Script: SQLite to Neon PostgreSQL
 * This script migrates all data from the local SQLite database to Neon PostgreSQL
 */

const { PrismaClient: PrismaClientSQLite } = require('@prisma/client');
const { PrismaClient: PrismaClientPostgres } = require('@prisma/client');

// Source database (SQLite)
const sqliteClient = new PrismaClientSQLite({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

// Target database (Neon PostgreSQL)
const postgresClient = new PrismaClientPostgres({
  datasources: {
    db: {
      url: process.env.NEON_DATABASE_URL
    }
  }
});

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to Neon PostgreSQL...\n');

  try {
    // Test connections
    console.log('📡 Testing database connections...');
    await sqliteClient.$connect();
    console.log('✅ Connected to SQLite database');
    await postgresClient.$connect();
    console.log('✅ Connected to Neon PostgreSQL database\n');

    // 1. Migrate Users
    console.log('👥 Migrating Users...');
    const users = await sqliteClient.user.findMany();
    console.log(`   Found ${users.length} users to migrate`);
    
    for (const user of users) {
      await postgresClient.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // 2. Migrate Locations
    console.log('📍 Migrating Locations...');
    const locations = await sqliteClient.location.findMany();
    console.log(`   Found ${locations.length} locations to migrate`);
    
    for (const location of locations) {
      await postgresClient.location.upsert({
        where: { id: location.id },
        update: location,
        create: location,
      });
    }
    console.log(`✅ Migrated ${locations.length} locations\n`);

    // 3. Migrate Staff Members
    console.log('👨‍💼 Migrating Staff Members...');
    const staff = await sqliteClient.staffMember.findMany();
    console.log(`   Found ${staff.length} staff members to migrate`);
    
    for (const member of staff) {
      await postgresClient.staffMember.upsert({
        where: { id: member.id },
        update: member,
        create: member,
      });
    }
    console.log(`✅ Migrated ${staff.length} staff members\n`);

    // 4. Migrate Services
    console.log('💇 Migrating Services...');
    const services = await sqliteClient.service.findMany();
    console.log(`   Found ${services.length} services to migrate`);
    
    let serviceCount = 0;
    for (const service of services) {
      await postgresClient.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
      serviceCount++;
      if (serviceCount % 50 === 0) {
        console.log(`   Progress: ${serviceCount}/${services.length} services migrated`);
      }
    }
    console.log(`✅ Migrated ${services.length} services\n`);

    // 5. Migrate Products
    console.log('🛍️ Migrating Products...');
    const products = await sqliteClient.product.findMany();
    console.log(`   Found ${products.length} products to migrate`);
    
    for (const product of products) {
      await postgresClient.product.upsert({
        where: { id: product.id },
        update: product,
        create: product,
      });
    }
    console.log(`✅ Migrated ${products.length} products\n`);

    // 6. Migrate Clients
    console.log('👤 Migrating Clients...');
    const clients = await sqliteClient.client.findMany();
    console.log(`   Found ${clients.length} clients to migrate`);
    
    for (const client of clients) {
      await postgresClient.client.upsert({
        where: { id: client.id },
        update: client,
        create: client,
      });
    }
    console.log(`✅ Migrated ${clients.length} clients\n`);

    // 7. Migrate Staff Locations (junction table)
    console.log('🔗 Migrating Staff-Location relationships...');
    const staffLocations = await sqliteClient.staffLocation.findMany();
    console.log(`   Found ${staffLocations.length} relationships to migrate`);
    
    for (const sl of staffLocations) {
      await postgresClient.staffLocation.upsert({
        where: { id: sl.id },
        update: sl,
        create: sl,
      });
    }
    console.log(`✅ Migrated ${staffLocations.length} staff-location relationships\n`);

    // 8. Migrate Staff Services (junction table)
    console.log('🔗 Migrating Staff-Service relationships...');
    const staffServices = await sqliteClient.staffService.findMany();
    console.log(`   Found ${staffServices.length} relationships to migrate`);
    
    for (const ss of staffServices) {
      await postgresClient.staffService.upsert({
        where: { id: ss.id },
        update: ss,
        create: ss,
      });
    }
    console.log(`✅ Migrated ${staffServices.length} staff-service relationships\n`);

    // 9. Migrate Product Locations (junction table)
    console.log('🔗 Migrating Product-Location relationships...');
    const productLocations = await sqliteClient.productLocation.findMany();
    console.log(`   Found ${productLocations.length} relationships to migrate`);
    
    for (const pl of productLocations) {
      await postgresClient.productLocation.upsert({
        where: { id: pl.id },
        update: pl,
        create: pl,
      });
    }
    console.log(`✅ Migrated ${productLocations.length} product-location relationships\n`);

    // 10. Migrate Appointments
    console.log('📅 Migrating Appointments...');
    const appointments = await sqliteClient.appointment.findMany();
    console.log(`   Found ${appointments.length} appointments to migrate`);
    
    for (const appointment of appointments) {
      await postgresClient.appointment.upsert({
        where: { id: appointment.id },
        update: appointment,
        create: appointment,
      });
    }
    console.log(`✅ Migrated ${appointments.length} appointments\n`);

    // 11. Migrate Transactions
    console.log('💰 Migrating Transactions...');
    const transactions = await sqliteClient.transaction.findMany();
    console.log(`   Found ${transactions.length} transactions to migrate`);
    
    for (const transaction of transactions) {
      await postgresClient.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction,
      });
    }
    console.log(`✅ Migrated ${transactions.length} transactions\n`);

    // Summary
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Locations: ${locations.length}`);
    console.log(`✅ Staff Members: ${staff.length}`);
    console.log(`✅ Services: ${services.length}`);
    console.log(`✅ Products: ${products.length}`);
    console.log(`✅ Clients: ${clients.length}`);
    console.log(`✅ Staff-Location Relationships: ${staffLocations.length}`);
    console.log(`✅ Staff-Service Relationships: ${staffServices.length}`);
    console.log(`✅ Product-Location Relationships: ${productLocations.length}`);
    console.log(`✅ Appointments: ${appointments.length}`);
    console.log(`✅ Transactions: ${transactions.length}`);
    console.log('='.repeat(50));
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n✅ All data migrated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

