import { prisma } from '../lib/prisma'

/**
 * Script to standardize the receptionist role naming convention
 * Updates all users with lowercase "receptionist" role to uppercase "RECEPTIONIST"
 */
async function standardizeReceptionistRole() {
  try {
    console.log('🔧 Standardizing receptionist role naming convention...')
    
    // Find all users with receptionist role (case-insensitive search)
    const receptionistUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'receptionist' },
          { role: 'Receptionist' },
          { role: 'RECEPTIONIST' }
        ]
      },
      include: {
        staffProfile: true
      }
    })
    
    console.log(`📍 Found ${receptionistUsers.length} receptionist user(s)`)
    
    if (receptionistUsers.length === 0) {
      console.log('✅ No receptionist users found to update')
      return
    }
    
    // Update each receptionist user to use uppercase "RECEPTIONIST"
    let updatedCount = 0
    for (const user of receptionistUsers) {
      if (user.role !== 'RECEPTIONIST') {
        console.log(`📝 Updating user: ${user.email}`)
        console.log(`   Current role: ${user.role}`)
        
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'RECEPTIONIST' }
        })
        
        console.log(`   ✅ Updated to: RECEPTIONIST`)
        updatedCount++
      } else {
        console.log(`ℹ️  User ${user.email} already has correct role: RECEPTIONIST`)
      }
    }
    
    console.log('')
    console.log('=' .repeat(60))
    console.log(`✅ Standardization complete!`)
    console.log(`   Total receptionist users: ${receptionistUsers.length}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Already correct: ${receptionistUsers.length - updatedCount}`)
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ Error standardizing receptionist role:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
standardizeReceptionistRole()
  .then(() => {
    console.log('🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })

