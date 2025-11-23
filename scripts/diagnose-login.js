const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseLogin() {
  console.log('🔍 ADMIN LOGIN DIAGNOSTIC REPORT\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Check database connection
    console.log('\n1️⃣  DATABASE CONNECTION');
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    // 2. Check admin user exists
    console.log('\n2️⃣  ADMIN USER EXISTENCE');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' },
      include: { staffProfile: true }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user NOT found');
      console.log('   Creating admin user...');
      const hashedPassword = await bcrypt.hash('Admin33#', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@vanityhub.com',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log('✅ Admin user created');
      console.log('   ID:', newAdmin.id);
    } else {
      console.log('✅ Admin user found');
      console.log('   ID:', adminUser.id);
    }
    
    // 3. Check user properties
    console.log('\n3️⃣  USER PROPERTIES');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' }
    });
    
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Password hash length:', user.password.length);
    console.log('   Password hash prefix:', user.password.substring(0, 15) + '...');
    
    // 4. Test password
    console.log('\n4️⃣  PASSWORD VERIFICATION');
    const passwordMatch = await bcrypt.compare('Admin33#', user.password);
    console.log('   Password "Admin33#" matches:', passwordMatch ? '✅ YES' : '❌ NO');
    
    if (!passwordMatch) {
      console.log('   ⚠️  Fixing password...');
      const hashedPassword = await bcrypt.hash('Admin33#', 10);
      await prisma.user.update({
        where: { email: 'admin@vanityhub.com' },
        data: { password: hashedPassword }
      });
      console.log('   ✅ Password fixed');
    }
    
    // 5. Check environment variables
    console.log('\n5️⃣  ENVIRONMENT VARIABLES');
    console.log('   NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set');
    console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Not set');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    
    // 6. Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ DIAGNOSTIC COMPLETE\n');
    console.log('🎯 LOGIN CREDENTIALS:');
    console.log('   Email: admin@vanityhub.com');
    console.log('   Password: Admin33#');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Go to http://localhost:3000/login');
    console.log('   3. Enter the credentials above');
    console.log('   4. You should be redirected to /dashboard');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseLogin();

