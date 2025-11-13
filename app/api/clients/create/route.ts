import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log('📝 /api/clients/create - Received data:', {
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.registrationSource,
      isAutoRegistered: data.isAutoRegistered
    })

    // Validate required fields
    if (!data.name || !data.phone) {
      console.error('❌ /api/clients/create - Missing required fields:', { name: data.name, phone: data.phone })
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      )
    }

    // Normalize phone number for comparison
    const normalizedPhone = normalizePhoneNumber(data.phone)
    
    // Normalize name for comparison (case-insensitive)
    const normalizedName = data.name.trim().toLowerCase()

    // Check for duplicates
    const existingClients = await prisma.client.findMany({
      include: {
        user: true
      }
    })

    // Check for phone number duplicate
    const phoneExists = existingClients.find(client => 
      normalizePhoneNumber(client.phone || '') === normalizedPhone
    )

    // Check for name duplicate (case-insensitive)
    const nameExists = existingClients.find(client => 
      client.name.trim().toLowerCase() === normalizedName
    )

    if (phoneExists || nameExists) {
      const duplicateType = phoneExists ? 'phone' : 'name'
      const existingClient = phoneExists || nameExists

      console.log('⚠️ /api/clients/create - Duplicate found:', {
        type: duplicateType,
        existingClientId: existingClient?.id,
        existingClientUserId: existingClient?.userId
      })

      // For auto-registration, return the existing client instead of an error
      if (data.isAutoRegistered) {
        console.log('✅ /api/clients/create - Returning existing client for auto-registration')

        // Parse existing preferences
        const existingPreferences = existingClient?.preferences ? JSON.parse(existingClient.preferences) : {}

        // Get preferredLocation from stored preferences, or use the new one if not set
        const preferredLocation = existingPreferences.preferredLocation || data.preferredLocation || ''

        const responseClient = {
          id: existingClient?.userId, // Return the User ID, not the Client ID
          name: existingClient?.name,
          email: existingClient?.user?.email || data.email || '',
          phone: existingClient?.phone || '',
          address: '',
          city: '',
          state: '',
          birthday: existingClient?.dateOfBirth?.toISOString() || '',
          preferredLocation: preferredLocation,
          locations: [preferredLocation],
          totalSpent: 0,
          referredBy: '',
          preferences: {
            ...existingPreferences,
            preferredLocation: preferredLocation,
            preferredStylists: existingPreferences.preferredStylists || [],
            preferredServices: existingPreferences.preferredServices || [],
            allergies: existingPreferences.allergies || [],
            notes: existingPreferences.notes || ''
          },
          notes: existingClient?.notes || '',
          registrationSource: 'existing',
          isAutoRegistered: false,
          currency: data.currency || 'QAR',
          createdAt: existingClient?.createdAt.toISOString(),
          updatedAt: existingClient?.updatedAt.toISOString()
        }

        return NextResponse.json({
          client: responseClient,
          message: "Existing client found"
        })
      }

      return NextResponse.json({
        error: "Duplicate client found",
        duplicateType,
        existingClient: {
          id: existingClient?.userId, // Return the User ID
          name: existingClient?.name,
          phone: existingClient?.phone,
          email: existingClient?.user?.email
        },
        message: duplicateType === 'phone'
          ? `A client with phone number ${data.phone} already exists.`
          : `A client with the name "${data.name}" already exists.`
      }, { status: 409 })
    }

    // Generate a default password for the user account
    const defaultPassword = await bcrypt.hash('client123', 10)

    // Create user first
    const user = await prisma.user.create({
      data: {
        email: data.email || `${normalizedPhone}@temp.local`,
        password: defaultPassword,
        role: 'CLIENT',
        isActive: true
      }
    })

    // Prepare preferences object with preferredLocation
    const preferencesData = {
      ...(data.preferences || {}),
      preferredLocation: data.preferredLocation || '',
      preferredStylists: data.preferences?.preferredStylists || [],
      preferredServices: data.preferences?.preferredServices || [],
      allergies: data.preferences?.allergies || [],
      notes: data.preferences?.notes || ''
    }

    // Create client profile
    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: data.name.trim(),
        phone: data.phone,
        dateOfBirth: data.birthday ? new Date(data.birthday) : null,
        preferences: JSON.stringify(preferencesData),
        notes: data.notes || null
      },
      include: {
        user: true
      }
    })

    console.log('✅ /api/clients/create - Created client:', {
      clientId: client.id,
      userId: user.id,
      name: client.name
    })

    // Create loyalty program for the client
    await prisma.loyaltyProgram.create({
      data: {
        clientId: client.id,
        points: 0,
        tier: 'Bronze',
        totalSpent: 0,
        isActive: true
      }
    })

    // Transform the response to match the expected client format
    // IMPORTANT: Return user.id (not client.id) because Appointment.clientId references User.id
    const responseClient = {
      id: user.id, // Return User ID for appointment creation
      name: client.name,
      email: user.email,
      phone: client.phone,
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      birthday: client.dateOfBirth?.toISOString().split('T')[0] || '',
      preferredLocation: data.preferredLocation || '',
      locations: data.locations || [],
      status: 'Active' as const,
      avatar: generateInitials(client.name),
      segment: 'New' as const,
      totalSpent: 0,
      referredBy: data.referredBy || '',
      preferences: data.preferences || {
        preferredStylists: [],
        preferredServices: [],
        allergies: [],
        notes: ''
      },
      notes: client.notes || '',
      registrationSource: data.registrationSource || 'manual',
      isAutoRegistered: data.isAutoRegistered || false,
      currency: data.currency || 'QAR',
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      client: responseClient,
      message: "Client created successfully"
    })

  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Failed to create client" },
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
