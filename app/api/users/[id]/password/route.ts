import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * PUT /api/users/[id]/password - Update user password
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    const { newPassword } = data

    // Validate required fields
    if (!newPassword) {
      return NextResponse.json({
        error: "New password is required"
      }, { status: 400 })
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json({
        error: "Password must be at least 8 characters long"
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({
        error: "User not found"
      }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    console.log(`✅ Password updated for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    })

  } catch (error) {
    console.error("❌ Error updating password:", error)

    let errorMessage = "Failed to update password"
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

