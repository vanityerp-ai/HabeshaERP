/**
 * Migrate data from SQLite to Neon PostgreSQL
 * This script reads from SQLite directly and writes to Neon using Prisma
 */

const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// SQLite database
const sqliteDb = new Database(path.join(__dirname, '..', 'prisma', 'prisma', 'dev.db'), { readonly: true });

// Neon PostgreSQL (using current DATABASE_URL from .env)
const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to Neon PostgreSQL...\n');

  try {
    // 1. Migrate Users
    console.log('👥 Migrating Users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    console.log(`   Found ${users.length} users`);
    
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          password: user.password,
          role: user.role,
          isActive: Boolean(user.isActive),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
        },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          role: user.role,
          isActive: Boolean(user.isActive),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
        },
      });
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // 2. Migrate Locations
    console.log('📍 Migrating Locations...');
    const locations = sqliteDb.prepare('SELECT * FROM locations').all();
    console.log(`   Found ${locations.length} locations`);

    for (const location of locations) {
      await prisma.location.upsert({
        where: { id: location.id },
        update: {
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          country: location.country,
          phone: location.phone,
          email: location.email,
          coordinates: location.coordinates,
          isActive: Boolean(location.isActive),
          createdAt: new Date(location.createdAt),
          updatedAt: new Date(location.updatedAt),
        },
        create: {
          id: location.id,
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          country: location.country,
          phone: location.phone,
          email: location.email,
          coordinates: location.coordinates,
          isActive: Boolean(location.isActive),
          createdAt: new Date(location.createdAt),
          updatedAt: new Date(location.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${locations.length} locations\n`);

    // 3. Migrate Staff Members
    console.log('👨‍💼 Migrating Staff Members...');
    const staff = sqliteDb.prepare('SELECT * FROM staff_members').all();
    console.log(`   Found ${staff.length} staff members`);
    
    for (const member of staff) {
      await prisma.staffMember.upsert({
        where: { id: member.id },
        update: {
          userId: member.userId,
          name: member.name,
          phone: member.phone,
          avatar: member.avatar,
          color: member.color,
          jobRole: member.jobRole,
          dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
          homeService: Boolean(member.homeService),
          status: member.status,
          employeeNumber: member.employeeNumber,
          qidNumber: member.qidNumber,
          passportNumber: member.passportNumber,
          qidValidity: member.qidValidity,
          passportValidity: member.passportValidity,
          medicalValidity: member.medicalValidity,
          profileImage: member.profileImage,
          profileImageType: member.profileImageType,
          specialties: member.specialties,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        },
        create: {
          id: member.id,
          userId: member.userId,
          name: member.name,
          phone: member.phone,
          avatar: member.avatar,
          color: member.color,
          jobRole: member.jobRole,
          dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
          homeService: Boolean(member.homeService),
          status: member.status,
          employeeNumber: member.employeeNumber,
          qidNumber: member.qidNumber,
          passportNumber: member.passportNumber,
          qidValidity: member.qidValidity,
          passportValidity: member.passportValidity,
          medicalValidity: member.medicalValidity,
          profileImage: member.profileImage,
          profileImageType: member.profileImageType,
          specialties: member.specialties,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${staff.length} staff members\n`);

    // 4. Migrate Services
    console.log('💇 Migrating Services...');
    const services = sqliteDb.prepare('SELECT * FROM services').all();
    console.log(`   Found ${services.length} services`);

    let serviceCount = 0;
    for (const service of services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          description: service.description,
          category: service.category,
          price: service.price,
          duration: service.duration,
          showPricesToClients: Boolean(service.showPricesToClients),
          isActive: Boolean(service.isActive),
          createdAt: new Date(service.createdAt),
          updatedAt: new Date(service.updatedAt),
        },
        create: {
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          price: service.price,
          duration: service.duration,
          showPricesToClients: Boolean(service.showPricesToClients),
          isActive: Boolean(service.isActive),
          createdAt: new Date(service.createdAt),
          updatedAt: new Date(service.updatedAt),
        },
      });
      serviceCount++;
      if (serviceCount % 50 === 0) {
        console.log(`   Progress: ${serviceCount}/${services.length}`);
      }
    }
    console.log(`✅ Migrated ${services.length} services\n`);

    // 5. Migrate Products
    console.log('🛍️ Migrating Products...');
    const products = sqliteDb.prepare('SELECT * FROM products').all();
    console.log(`   Found ${products.length} products`);
    
    for (const product of products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          cost: product.cost,
          type: product.type,
          brand: product.brand,
          sku: product.sku,
          barcode: product.barcode,
          image: product.image,
          images: product.images,
          isActive: Boolean(product.isActive),
          isRetail: Boolean(product.isRetail),
          isFeatured: Boolean(product.isFeatured),
          isNew: Boolean(product.isNew),
          isBestSeller: Boolean(product.isBestSeller),
          isSale: Boolean(product.isSale),
          salePrice: product.salePrice,
          rating: product.rating,
          reviewCount: product.reviewCount,
          features: product.features,
          ingredients: product.ingredients,
          howToUse: product.howToUse,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          cost: product.cost,
          type: product.type,
          brand: product.brand,
          sku: product.sku,
          barcode: product.barcode,
          image: product.image,
          images: product.images,
          isActive: Boolean(product.isActive),
          isRetail: Boolean(product.isRetail),
          isFeatured: Boolean(product.isFeatured),
          isNew: Boolean(product.isNew),
          isBestSeller: Boolean(product.isBestSeller),
          isSale: Boolean(product.isSale),
          salePrice: product.salePrice,
          rating: product.rating,
          reviewCount: product.reviewCount,
          features: product.features,
          ingredients: product.ingredients,
          howToUse: product.howToUse,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${products.length} products\n`);

    // 6. Migrate Clients
    console.log('👤 Migrating Clients...');
    const clients = sqliteDb.prepare('SELECT * FROM clients').all();
    console.log(`   Found ${clients.length} clients`);
    
    for (const client of clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          userId: client.userId,
          name: client.name,
          phone: client.phone,
          dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth) : null,
          preferences: client.preferences,
          notes: client.notes,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt),
        },
        create: {
          id: client.id,
          userId: client.userId,
          name: client.name,
          phone: client.phone,
          dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth) : null,
          preferences: client.preferences,
          notes: client.notes,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${clients.length} clients\n`);

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Locations: ${locations.length}`);
    console.log(`✅ Staff Members: ${staff.length}`);
    console.log(`✅ Services: ${services.length}`);
    console.log(`✅ Products: ${products.length}`);
    console.log(`✅ Clients: ${clients.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await prisma.$disconnect();
  }
}

migrateData()
  .then(() => {
    console.log('\n✅ All data migrated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

