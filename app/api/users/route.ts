import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * POST /api/users - Create a new user with password
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, email, password, role, isActive } = data

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({
        error: "Missing required fields: name, email, password, and role are required"
      }, { status: 400 })
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({
        error: "Invalid email format"
      }, { status: 400 })
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({
        error: "Password must be at least 8 characters long"
      }, { status: 400 })
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({
        error: "A user with this email already exists"
      }, { status: 409 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role.toUpperCase(),
        isActive: isActive !== undefined ? isActive : true
      }
    })

    console.log(`✅ User created: ${user.email} with role ${user.role}`)

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error("❌ Error creating user:", error)

    let errorMessage = "Failed to create user"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: statusCode })
  }
}

/**
 * GET /api/users - Get all users
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users
    })

  } catch (error) {
    console.error("❌ Error fetching users:", error)

    return NextResponse.json({
      error: "Failed to fetch users",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

