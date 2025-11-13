import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicateLocations() {
  try {
    console.log('🔍 Starting duplicate location cleanup...\n')

    // Get all locations
    const allLocations = await prisma.location.findMany({
      orderBy: [
        { name: 'asc' },
        { createdAt: 'asc' } // Oldest first
      ]
    })

    console.log(`📊 Total locations in database: ${allLocations.length}\n`)

    // Define the locations we want to keep (oldest record for each unique name-city combination)
    const locationsToKeep = new Map<string, any>()
    
    // Priority: Keep locations with fixed IDs (home, online)
    const fixedIdLocations = allLocations.filter(loc => loc.id === 'home' || loc.id === 'online')
    fixedIdLocations.forEach(loc => {
      const key = `${loc.name.toLowerCase()} - ${loc.city.toLowerCase()}`
      locationsToKeep.set(key, loc)
    })

    // For other locations, keep the oldest record
    allLocations.forEach(loc => {
      const key = `${loc.name.toLowerCase()} - ${loc.city.toLowerCase()}`
      if (!locationsToKeep.has(key)) {
        locationsToKeep.set(key, loc)
      }
    })

    console.log(`✅ Locations to keep (${locationsToKeep.size}):`)
    locationsToKeep.forEach(loc => {
      console.log(`   - ${loc.name} - ${loc.city} (ID: ${loc.id})`)
    })

    // Find locations to delete
    const idsToKeep = Array.from(locationsToKeep.values()).map(loc => loc.id)
    const locationsToDelete = allLocations.filter(loc => !idsToKeep.includes(loc.id))

    console.log(`\n🗑️  Locations to delete (${locationsToDelete.length}):`)
    locationsToDelete.forEach(loc => {
      console.log(`   - ${loc.name} - ${loc.city} (ID: ${loc.id})`)
    })

    if (locationsToDelete.length === 0) {
      console.log('\n✅ No duplicate locations to delete!')
      return
    }

    // Before deleting, we need to update any references to these locations
    console.log('\n🔄 Updating references to duplicate locations...')

    // Group locations by name-city to map old IDs to new IDs
    const locationMapping = new Map<string, string>()
    allLocations.forEach(loc => {
      const key = `${loc.name.toLowerCase()} - ${loc.city.toLowerCase()}`
      const keepLoc = locationsToKeep.get(key)
      if (keepLoc && loc.id !== keepLoc.id) {
        locationMapping.set(loc.id, keepLoc.id)
      }
    })

    console.log(`\n📋 Location ID mappings (${locationMapping.size}):`)
    locationMapping.forEach((newId, oldId) => {
      console.log(`   ${oldId} → ${newId}`)
    })

    // Update all references
    for (const [oldId, newId] of locationMapping.entries()) {
      console.log(`\n🔄 Updating references from ${oldId} to ${newId}...`)

      // Update appointments
      const appointmentCount = await prisma.appointment.updateMany({
        where: { locationId: oldId },
        data: { locationId: newId }
      })
      console.log(`   ✅ Updated ${appointmentCount.count} appointments`)

      // Handle staff locations - delete duplicates instead of updating
      // because of unique constraint on (staffId, locationId)
      const staffLocationsToDelete = await prisma.staffLocation.findMany({
        where: { locationId: oldId }
      })

      if (staffLocationsToDelete.length > 0) {
        const staffLocationDeleteCount = await prisma.staffLocation.deleteMany({
          where: { locationId: oldId }
        })
        console.log(`   ✅ Deleted ${staffLocationDeleteCount.count} staff locations (duplicates)`)
      } else {
        console.log(`   ✅ No staff locations to update`)
      }

      // Handle location services - delete duplicates instead of updating
      // because of unique constraint on (locationId, serviceId)
      const locationServicesToDelete = await prisma.locationService.findMany({
        where: { locationId: oldId }
      })

      if (locationServicesToDelete.length > 0) {
        const locationServiceDeleteCount = await prisma.locationService.deleteMany({
          where: { locationId: oldId }
        })
        console.log(`   ✅ Deleted ${locationServiceDeleteCount.count} location services (duplicates)`)
      } else {
        console.log(`   ✅ No location services to update`)
      }

      // Handle product locations - delete duplicates instead of updating
      // because of unique constraint on (productId, locationId)
      const productLocationsToDelete = await prisma.productLocation.findMany({
        where: { locationId: oldId }
      })

      if (productLocationsToDelete.length > 0) {
        // Delete the product locations with old location ID
        const productLocationDeleteCount = await prisma.productLocation.deleteMany({
          where: { locationId: oldId }
        })
        console.log(`   ✅ Deleted ${productLocationDeleteCount.count} product locations (duplicates)`)
      } else {
        console.log(`   ✅ No product locations to update`)
      }

      // Update product batches
      const batchCount = await prisma.productBatch.updateMany({
        where: { locationId: oldId },
        data: { locationId: newId }
      })
      console.log(`   ✅ Updated ${batchCount.count} product batches`)

      // Update transfers (from location)
      const transferFromCount = await prisma.transfer.updateMany({
        where: { fromLocationId: oldId },
        data: { fromLocationId: newId }
      })
      console.log(`   ✅ Updated ${transferFromCount.count} transfers (from location)`)

      // Update transfers (to location)
      const transferToCount = await prisma.transfer.updateMany({
        where: { toLocationId: oldId },
        data: { toLocationId: newId }
      })
      console.log(`   ✅ Updated ${transferToCount.count} transfers (to location)`)

      // Update inventory audits
      const inventoryAuditCount = await prisma.inventoryAudit.updateMany({
        where: { locationId: oldId },
        data: { locationId: newId }
      })
      console.log(`   ✅ Updated ${inventoryAuditCount.count} inventory audits`)

      // Update transactions
      const transactionCount = await prisma.transaction.updateMany({
        where: { locationId: oldId },
        data: { locationId: newId }
      })
      console.log(`   ✅ Updated ${transactionCount.count} transactions`)
    }

    // Now delete the duplicate locations
    console.log('\n🗑️  Deleting duplicate locations...')
    const deleteResult = await prisma.location.deleteMany({
      where: {
        id: {
          in: locationsToDelete.map(loc => loc.id)
        }
      }
    })

    console.log(`\n✅ Successfully deleted ${deleteResult.count} duplicate locations!`)

    // Verify final state
    const finalLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    console.log(`\n📊 Final location count: ${finalLocations.length}`)
    console.log('\n📋 Final locations:')
    finalLocations.forEach(loc => {
      console.log(`   - ${loc.name} - ${loc.city} (ID: ${loc.id})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateLocations()

