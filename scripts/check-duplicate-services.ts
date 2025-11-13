import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicateServices() {
  console.log('🔍 Checking for duplicate services...\n')

  try {
    // Get all services
    const allServices = await prisma.service.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        duration: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log(`📊 Total services in database: ${allServices.length}`)
    console.log(`📊 Expected services: 144\n`)

    // Group services by name to find duplicates
    const servicesByName = new Map<string, typeof allServices>()
    
    for (const service of allServices) {
      const existing = servicesByName.get(service.name) || []
      existing.push(service)
      servicesByName.set(service.name, existing)
    }

    // Find duplicates
    const duplicates: Array<{ name: string; count: number; services: typeof allServices }> = []
    
    for (const [name, services] of servicesByName.entries()) {
      if (services.length > 1) {
        duplicates.push({
          name,
          count: services.length,
          services
        })
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicate services found!')
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate service names:\n`)
      
      let totalDuplicateCount = 0
      for (const dup of duplicates) {
        console.log(`📌 "${dup.name}" - ${dup.count} copies:`)
        for (const service of dup.services) {
          console.log(`   - ID: ${service.id}`)
          console.log(`     Category: ${service.category}`)
          console.log(`     Price: QAR ${service.price}`)
          console.log(`     Duration: ${service.duration} min`)
          console.log(`     Active: ${service.isActive}`)
          console.log(`     Created: ${service.createdAt.toISOString()}`)
          console.log('')
        }
        totalDuplicateCount += (dup.count - 1) // Count extras only
      }
      
      console.log(`\n📊 Summary:`)
      console.log(`   Total services: ${allServices.length}`)
      console.log(`   Unique service names: ${servicesByName.size}`)
      console.log(`   Duplicate entries: ${totalDuplicateCount}`)
      console.log(`   After removing duplicates: ${allServices.length - totalDuplicateCount}`)
    }

    // Group by category to see distribution
    console.log('\n📊 Services by Category:')
    const servicesByCategory = new Map<string, number>()
    
    for (const service of allServices) {
      const count = servicesByCategory.get(service.category) || 0
      servicesByCategory.set(service.category, count + 1)
    }

    const sortedCategories = Array.from(servicesByCategory.entries()).sort((a, b) => b[1] - a[1])
    for (const [category, count] of sortedCategories) {
      console.log(`   ${category}: ${count} services`)
    }

  } catch (error) {
    console.error('❌ Error checking for duplicates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateServices()
  .then(() => {
    console.log('\n✅ Check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Check failed:', error)
    process.exit(1)
  })

