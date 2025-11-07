/**
 * Fix Staff Passwords Script
 * 
 * This script re-hashes all staff passwords that were hashed with SHA256
 * to use bcrypt instead, ensuring consistency with the login system.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixStaffPasswords() {
  try {
    console.log('🔄 Starting password fix for all staff members...\n')

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        staffProfile: true
      }
    })

    console.log(`📊 Found ${users.length} users in the database\n`)

    let fixedCount = 0
    let skippedCount = 0

    for (const user of users) {
      const staffName = user.staffProfile?.name || user.email

      // Check if password is SHA256 hash (64 characters hex) or bcrypt hash (starts with $2)
      const isSHA256 = user.password.length === 64 && /^[a-f0-9]+$/.test(user.password)
      const isBcrypt = user.password.startsWith('$2')

      if (isBcrypt) {
        console.log(`✅ ${staffName} - Already using bcrypt, skipping`)
        skippedCount++
        continue
      }

      if (isSHA256) {
        console.log(`🔧 ${staffName} - Converting from SHA256 to bcrypt...`)
        
        // Reset to a temporary password that they'll need to change
        const tempPassword = 'Temp123!'
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })

        console.log(`   ✅ Password reset to: ${tempPassword}`)
        fixedCount++
      } else {
        console.log(`⚠️  ${staffName} - Unknown password format, resetting...`)
        
        // Reset to a temporary password
        const tempPassword = 'Temp123!'
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })

        console.log(`   ✅ Password reset to: ${tempPassword}`)
        fixedCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`   ✅ Fixed: ${fixedCount} users`)
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already using bcrypt)`)
    console.log(`   📝 Total: ${users.length} users`)
    console.log('='.repeat(60))

    if (fixedCount > 0) {
      console.log('\n⚠️  IMPORTANT: All affected staff members need to login with:')
      console.log('   Password: Temp123!')
      console.log('   They should change this password immediately after login.\n')
    }

  } catch (error) {
    console.error('❌ Error fixing passwords:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixStaffPasswords()
  .then(() => {
    console.log('✅ Password fix completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Password fix failed:', error)
    process.exit(1)
  })

