import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromHeaders } from "@/lib/auth-server";

/**
 * GET /api/transactions
 * 
 * Get all transactions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromHeaders(request);
    
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    // Apply location-based access control
    if (currentUser && currentUser.locations.length > 0 && !currentUser.locations.includes("all")) {
      where.locationId = { in: currentUser.locations };
    }

    // Apply additional filters
    if (locationId) {
      where.locationId = locationId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            clientProfile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ 
      transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

/**
 * POST /api/transactions
 * 
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      amount,
      type,
      status = "COMPLETED",
      method,
      reference,
      description,
      locationId,
      appointmentId,
      serviceAmount,
      productAmount,
      originalServiceAmount,
      discountPercentage,
      discountAmount,
      items,
    } = body;

    // Validate required fields
    if (!userId || !amount || !type || !method) {
      return NextResponse.json(
        { error: "Missing required fields: userId, amount, type, method" },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type,
        status,
        method,
        reference,
        description,
        locationId,
        appointmentId,
        serviceAmount,
        productAmount,
        originalServiceAmount,
        discountPercentage,
        discountAmount,
        items: items ? JSON.stringify(items) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            clientProfile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

/**
 * PUT /api/transactions
 * 
 * Update a transaction
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // If items is provided, stringify it
    if (updateData.items) {
      updateData.items = JSON.stringify(updateData.items);
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            clientProfile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

/**
 * DELETE /api/transactions
 * 
 * Delete a transaction
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

