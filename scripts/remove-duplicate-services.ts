import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeDuplicateServices() {
  try {
    console.log('🔍 Checking for duplicate services...\n')

    // Find all services
    const allServices = await prisma.service.findMany({
      orderBy: [
        { name: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    console.log(`📊 Total services in database: ${allServices.length}`)

    // Group services by name and category
    const serviceGroups = new Map<string, typeof allServices>()
    
    for (const service of allServices) {
      const key = `${service.name.toLowerCase()}-${service.category.toLowerCase()}`
      if (!serviceGroups.has(key)) {
        serviceGroups.set(key, [])
      }
      serviceGroups.get(key)!.push(service)
    }

    // Find duplicates
    const duplicates = Array.from(serviceGroups.entries())
      .filter(([_, services]) => services.length > 1)

    if (duplicates.length === 0) {
      console.log('✅ No duplicate services found!')
      return
    }

    console.log(`\n⚠️  Found ${duplicates.length} sets of duplicate services:\n`)

    let totalDuplicatesToRemove = 0

    for (const [key, services] of duplicates) {
      console.log(`📋 "${services[0].name}" (${services[0].category}):`)
      console.log(`   Found ${services.length} duplicates`)
      
      // Keep the oldest one (first created)
      const [keep, ...remove] = services
      
      console.log(`   ✅ Keeping: ID ${keep.id} (created ${keep.createdAt.toISOString()})`)
      console.log(`   🗑️  Removing ${remove.length} duplicate(s):`)
      
      for (const dup of remove) {
        console.log(`      - ID ${dup.id} (created ${dup.createdAt.toISOString()})`)
        totalDuplicatesToRemove++
      }
      console.log()
    }

    console.log(`\n📊 Summary:`)
    console.log(`   - Total duplicate sets: ${duplicates.length}`)
    console.log(`   - Total services to remove: ${totalDuplicatesToRemove}`)
    console.log(`   - Services to keep: ${duplicates.length}`)

    // Ask for confirmation
    console.log('\n⚠️  This will permanently delete duplicate services!')
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('🗑️  Removing duplicates...\n')

    let removedCount = 0

    for (const [key, services] of duplicates) {
      const [keep, ...remove] = services
      
      for (const dup of remove) {
        try {
          // First, delete related records
          await prisma.appointmentService.deleteMany({
            where: { serviceId: dup.id }
          })
          
          await prisma.locationService.deleteMany({
            where: { serviceId: dup.id }
          })
          
          await prisma.staffService.deleteMany({
            where: { serviceId: dup.id }
          })
          
          // Then delete the service
          await prisma.service.delete({
            where: { id: dup.id }
          })
          
          console.log(`   ✅ Removed duplicate service: ${dup.name} (ID: ${dup.id})`)
          removedCount++
        } catch (error) {
          console.error(`   ❌ Failed to remove service ${dup.id}:`, error)
        }
      }
    }

    console.log(`\n✅ Successfully removed ${removedCount} duplicate services!`)
    
    // Verify final count
    const finalCount = await prisma.service.count()
    console.log(`📊 Final service count: ${finalCount}`)

  } catch (error) {
    console.error('❌ Error removing duplicates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
removeDuplicateServices()
  .then(() => {
    console.log('\n🎉 Duplicate removal completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Duplicate removal failed:', error)
    process.exit(1)
  })

