import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/settings
 * Retrieve all application settings
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.setting.findMany()
    
    // Convert to key-value object
    const settingsMap: Record<string, any> = {}
    settings.forEach(setting => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value)
      } catch {
        settingsMap[setting.key] = setting.value
      }
    })
    
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings
 * Create or update a setting
 */
export async function POST(request: NextRequest) {
  try {
    const { key, value, category } = await request.json()
    
    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }
    
    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        category: category || 'general'
      },
      create: {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        category: category || 'general'
      }
    })
    
    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/:key
 * Update a specific setting
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }
    
    const { value, category } = await request.json()
    
    const setting = await prisma.setting.update({
      where: { key },
      data: {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        category: category || 'general'
      }
    })
    
    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/:key
 * Delete a specific setting
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }
    
    await prisma.setting.delete({
      where: { key }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    )
  }
}

