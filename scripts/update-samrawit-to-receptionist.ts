import { prisma } from '../lib/prisma'

async function updateSamrawitToReceptionist() {
  try {
    console.log('🔧 Updating Samrawit to RECEPTIONIST role...')
    
    // Find Samrawit's user account
    const user = await prisma.user.findUnique({
      where: { email: 'samrawit@habeshasalon.com' }
    })
    
    if (!user) {
      console.log('❌ User not found: samrawit@habeshasalon.com')
      console.log('💡 The user may not have been created yet. Run "npm run db:seed" first.')
      return
    }
    
    console.log('✅ User found!')
    console.log('📧 Email:', user.email)
    console.log('👤 Current role:', user.role)
    
    if (user.role === 'RECEPTIONIST') {
      console.log('ℹ️  User already has RECEPTIONIST role')
      return
    }
    
    // Update to RECEPTIONIST role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'RECEPTIONIST' }
    })
    
    console.log('✅ Successfully updated!')
    console.log('👤 New role:', updatedUser.role)
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateSamrawitToReceptionist()
  .then(() => {
    console.log('🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })

