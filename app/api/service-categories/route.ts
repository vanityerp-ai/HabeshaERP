import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔄 Fetching service categories...")

    // Check database connection first
    try {
      await prisma.$connect();
    } catch (error: any) {
      console.error('Database connection error:', error);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error.message 
      }, { status: 503 });
    }

    // Set a reasonable timeout for the query
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 15000)
    );

    const queryPromise = prisma.service.findMany({
      where: {
        isActive: true
      },
      select: {
        category: true
      }
    });

    // Execute query with timeout
    const services = await Promise.race([
      queryPromise,
      timeoutPromise
    ]).catch(error => {
      if (error.message === 'Database query timeout') {
        throw new Error('Service categories query timed out');
      }
      throw error;
    });

    // Extract unique categories and count services for each
    const categoryMap = new Map<string, number>()

    services.forEach((service: { category: string | null }) => {
      const category = (service.category || "Uncategorized").trim();
      // Ensure we don't have empty categories
      if (category && category !== "") {
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });

    // Convert to the expected format with consistent ID generation
    const categories = Array.from(categoryMap.entries()).map(([name, count], index) => {
      // Ensure consistent ID generation - trim whitespace and normalize
      const normalizedName = name.trim()
      const id = normalizedName.toLowerCase().replace(/\s+/g, '-')

      return {
        id: id,
        name: normalizedName,
        description: `${normalizedName} services`,
        serviceCount: count,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // Sort by name and remove any potential duplicates by ID
    const uniqueCategories = categories.reduce((acc, category) => {
      const existingIndex = acc.findIndex(c => c.id === category.id)
      if (existingIndex === -1) {
        acc.push(category)
      } else {
        // If duplicate found, merge service counts
        acc[existingIndex].serviceCount += category.serviceCount
      }
      return acc
    }, [] as typeof categories)

    uniqueCategories.sort((a, b) => a.name.localeCompare(b.name))

    console.log(`✅ Successfully fetched ${uniqueCategories.length} categories`)
    console.log('Categories:', uniqueCategories.map(c => `${c.name} (${c.id})`).join(', '))
    return NextResponse.json({ categories: uniqueCategories })
  } catch (error) {
    console.error("❌ Error fetching service categories:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Service categories query timed out') {
        return NextResponse.json({ 
          error: 'Database query timed out',
          details: 'The request took too long to process'
        }, { status: 504 });
      }

      if ('code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
        return NextResponse.json({ 
          error: 'Database error occurred',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: 'Failed to fetch service categories',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch service categories',
      details: 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("🔄 Creating service category...")
    const data = await request.json()

    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Since we're using string categories in the service model,
    // we don't actually create a separate category record.
    // Categories are created implicitly when services are created with them.
    const category = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      description: data.description || `${data.name} services`,
      serviceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log(`✅ Category "${data.name}" will be available when services are created with this category`)
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("❌ Error creating service category:", error)
    return NextResponse.json({ error: "Failed to create service category" }, { status: 500 })
  }
}
