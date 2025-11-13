import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicateLocations() {
  try {
    console.log('🔍 Checking for duplicate locations...\n')

    const locations = await prisma.location.findMany({
      orderBy: [
        { name: 'asc' },
        { city: 'asc' }
      ]
    })

    console.log(`📊 Total locations in database: ${locations.length}\n`)

    // Group by name and city
    const locationMap = new Map<string, any[]>()
    
    locations.forEach(location => {
      const key = `${location.name} - ${location.city}`
      if (!locationMap.has(key)) {
        locationMap.set(key, [])
      }
      locationMap.get(key)!.push(location)
    })

    // Find duplicates
    const duplicates: any[] = []
    locationMap.forEach((locs, key) => {
      if (locs.length > 1) {
        duplicates.push({ key, locations: locs })
      }
    })

    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate location groups:\n`)
      duplicates.forEach(({ key, locations }) => {
        console.log(`\n🔴 Duplicate: ${key}`)
        locations.forEach(loc => {
          console.log(`   - ID: ${loc.id}`)
          console.log(`     Name: ${loc.name}`)
          console.log(`     City: ${loc.city}`)
          console.log(`     Active: ${loc.isActive}`)
          console.log(`     Created: ${loc.createdAt}`)
        })
      })
    } else {
      console.log('✅ No duplicate locations found!')
    }

    console.log('\n📋 All locations:')
    locations.forEach(loc => {
      console.log(`   - ${loc.name} - ${loc.city} (ID: ${loc.id}, Active: ${loc.isActive})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateLocations()

