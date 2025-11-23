const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    console.log('🔍 Checking admin user...');
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' },
      include: { staffProfile: true }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found! Creating...');
      const hashedPassword = await bcrypt.hash('Admin33#', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@vanityhub.com',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log('✅ Admin user created!');
      console.log('📧 Email: admin@vanityhub.com');
      console.log('🔐 Password: Admin33#');
      console.log('🆔 ID:', newAdmin.id);
    } else {
      console.log('✅ Admin user found!');
      console.log('📧 Email:', adminUser.email);
      console.log('🔐 Role:', adminUser.role);
      console.log('✓ Active:', adminUser.isActive);
      
      // Test password
      const passwordMatch = await bcrypt.compare('Admin33#', adminUser.password);
      console.log('🔐 Password verification:', passwordMatch ? '✅ CORRECT' : '❌ INCORRECT');
      
      if (!passwordMatch) {
        console.log('\n⚠️  Password mismatch! Updating...');
        const hashedPassword = await bcrypt.hash('Admin33#', 10);
        await prisma.user.update({
          where: { email: 'admin@vanityhub.com' },
          data: { password: hashedPassword }
        });
        console.log('✅ Password updated!');
      }
      
      if (!adminUser.isActive) {
        console.log('\n⚠️  User is inactive! Activating...');
        await prisma.user.update({
          where: { email: 'admin@vanityhub.com' },
          data: { isActive: true }
        });
        console.log('✅ User activated!');
      }
    }
    
    console.log('\n✅ Admin setup complete!');
    console.log('\n🎯 Login with:');
    console.log('Email: admin@vanityhub.com');
    console.log('Password: Admin33#');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();

