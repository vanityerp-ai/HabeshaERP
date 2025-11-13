import { prisma } from '../lib/prisma'

async function checkSamrawitRole() {
  try {
    console.log('🔍 Checking Samrawit\'s user account...')
    
    const user = await prisma.user.findUnique({
      where: { email: 'samrawit@habeshasalon.com' },
      include: {
        staffProfile: true
      }
    })
    
    if (!user) {
      console.log('❌ User not found: samrawit@habeshasalon.com')
      console.log('💡 Run "npm run db:seed" to create the user')
      return
    }
    
    console.log('✅ User found!')
    console.log('📧 Email:', user.email)
    console.log('👤 Role:', user.role)
    console.log('🔓 Active:', user.isActive)
    
    if (user.staffProfile) {
      console.log('👔 Staff Profile:')
      console.log('   Name:', user.staffProfile.name)
      console.log('   Job Role:', user.staffProfile.jobRole)
      console.log('   Status:', user.staffProfile.status)
    } else {
      console.log('⚠️  No staff profile found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSamrawitRole()

