import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json()

    if (!name && !phone) {
      return NextResponse.json(
        { error: "Name or phone is required" },
        { status: 400 }
      )
    }

    // Normalize inputs for comparison
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : null
    const normalizedName = name ? name.trim().toLowerCase() : null

    // Get all clients to check for duplicates
    const existingClients = await prisma.client.findMany({
      include: {
        user: true
      }
    })

    const duplicates = []

    // Check for phone number duplicate
    if (normalizedPhone) {
      const phoneMatch = existingClients.find(client =>
        normalizePhoneNumber(client.phone || '') === normalizedPhone
      )

      if (phoneMatch) {
        duplicates.push({
          type: 'phone',
          client: {
            id: phoneMatch.userId, // Return User ID (not Client ID) for appointment creation
            name: phoneMatch.name,
            phone: phoneMatch.phone,
            email: phoneMatch.user?.email,
            address: '',
            city: '',
            state: '',
            birthday: phoneMatch.dateOfBirth?.toISOString().split('T')[0] || '',
            preferredLocation: '',
            locations: [],
            status: 'Active' as const,
            avatar: generateInitials(phoneMatch.name),
            segment: 'Regular' as const,
            totalSpent: 0,
            referredBy: '',
            preferences: {
              preferredStylists: [],
              preferredServices: [],
              allergies: [],
              notes: ''
            },
            notes: phoneMatch.notes || '',
            registrationSource: 'existing',
            isAutoRegistered: false,
            createdAt: phoneMatch.createdAt.toISOString(),
            updatedAt: phoneMatch.updatedAt.toISOString()
          }
        })
      }
    }

    // Check for name duplicate (case-insensitive)
    if (normalizedName) {
      const nameMatch = existingClients.find(client =>
        client.name.trim().toLowerCase() === normalizedName
      )

      if (nameMatch && (!normalizedPhone || normalizePhoneNumber(nameMatch.phone || '') !== normalizedPhone)) {
        duplicates.push({
          type: 'name',
          client: {
            id: nameMatch.userId, // Return User ID (not Client ID) for appointment creation
            name: nameMatch.name,
            phone: nameMatch.phone,
            email: nameMatch.user?.email,
            address: '',
            city: '',
            state: '',
            birthday: nameMatch.dateOfBirth?.toISOString().split('T')[0] || '',
            preferredLocation: '',
            locations: [],
            status: 'Active' as const,
            avatar: generateInitials(nameMatch.name),
            segment: 'Regular' as const,
            totalSpent: 0,
            referredBy: '',
            preferences: {
              preferredStylists: [],
              preferredServices: [],
              allergies: [],
              notes: ''
            },
            notes: nameMatch.notes || '',
            registrationSource: 'existing',
            isAutoRegistered: false,
            createdAt: nameMatch.createdAt.toISOString(),
            updatedAt: nameMatch.updatedAt.toISOString()
          }
        })
      }
    }

    return NextResponse.json({
      hasDuplicates: duplicates.length > 0,
      duplicates
    })

  } catch (error) {
    console.error("Error checking for duplicates:", error)
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    )
  }
}

// Helper function to normalize phone numbers for comparison
function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  // Remove all non-digit characters and normalize
  return phone.replace(/\D/g, '')
}

// Helper function to generate initials
function generateInitials(name: string): string {
  const nameParts = name.trim().split(' ')
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
  }
  return nameParts[0].substring(0, 2).toUpperCase()
}
