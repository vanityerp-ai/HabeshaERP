import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/inventory/transactions
 * Retrieve inventory transactions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const locationId = searchParams.get('locationId')
    const transactionType = searchParams.get('transactionType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter
    const where: any = {}
    if (productId) where.productId = productId
    if (locationId) where.locationId = locationId
    if (transactionType) where.transactionType = transactionType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true }
          },
          location: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.inventoryTransaction.count({ where })
    ])

    return NextResponse.json({
      data: transactions,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/transactions
 * Create a new inventory transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const transaction = await prisma.inventoryTransaction.create({
      data: {
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        product: true,
        location: true
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory transaction' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/transactions/:id
 * Update an inventory transaction
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const transaction = await prisma.inventoryTransaction.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        product: true,
        location: true
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating inventory transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory transaction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inventory/transactions/:id
 * Delete an inventory transaction
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    await prisma.inventoryTransaction.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory transaction' },
      { status: 500 }
    )
  }
}

