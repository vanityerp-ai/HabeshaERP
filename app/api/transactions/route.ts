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

    // Transform Decimal fields to numbers and parse JSON fields for JSON serialization
    const transformedTransactions = transactions.map(tx => ({
      ...tx,
      amount: Number(tx.amount),
      serviceAmount: tx.serviceAmount ? Number(tx.serviceAmount) : undefined,
      productAmount: tx.productAmount ? Number(tx.productAmount) : undefined,
      originalServiceAmount: tx.originalServiceAmount ? Number(tx.originalServiceAmount) : undefined,
      discountPercentage: tx.discountPercentage ? Number(tx.discountPercentage) : undefined,
      discountAmount: tx.discountAmount ? Number(tx.discountAmount) : undefined,
      items: tx.items ? JSON.parse(tx.items) : undefined,
      // Add location name for frontend display
      location: tx.locationId || undefined,
      locationName: tx.location?.name || 'Unknown Location',
      // Add client name and phone for frontend display
      clientName: tx.user?.clientProfile?.name || undefined,
      clientPhone: tx.user?.clientProfile?.phone || undefined,
    }));

    return NextResponse.json({
      transactions: transformedTransactions,
      total: transformedTransactions.length
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
      source,
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

    // Generate sequential transaction number (5 digits)
    // Get the latest transaction number
    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        transactionNumber: { not: null }
      },
      orderBy: {
        transactionNumber: 'desc'
      },
      select: {
        transactionNumber: true
      }
    });

    const nextTransactionNumber = latestTransaction?.transactionNumber
      ? latestTransaction.transactionNumber + 1
      : 10000; // Start from 10000 for 5-digit numbers

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type,
        status,
        method,
        source,
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
        transactionNumber: nextTransactionNumber,
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

    // Transform Decimal fields to numbers and parse JSON fields for JSON serialization
    const transformedTransaction = {
      ...transaction,
      amount: Number(transaction.amount),
      serviceAmount: transaction.serviceAmount ? Number(transaction.serviceAmount) : undefined,
      productAmount: transaction.productAmount ? Number(transaction.productAmount) : undefined,
      originalServiceAmount: transaction.originalServiceAmount ? Number(transaction.originalServiceAmount) : undefined,
      discountPercentage: transaction.discountPercentage ? Number(transaction.discountPercentage) : undefined,
      discountAmount: transaction.discountAmount ? Number(transaction.discountAmount) : undefined,
      items: transaction.items ? JSON.parse(transaction.items) : undefined,
      // Add location name for frontend display
      location: transaction.locationId || undefined,
      locationName: transaction.location?.name || 'Unknown Location',
      // Add client name and phone for frontend display
      clientName: transaction.user?.clientProfile?.name || undefined,
      clientPhone: transaction.user?.clientProfile?.phone || undefined,
    };

    return NextResponse.json({ transaction: transformedTransaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: "Failed to create transaction",
      details: errorMessage,
      type: error?.constructor?.name
    }, { status: 500 });
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

    // Transform Decimal fields to numbers and parse JSON fields for JSON serialization
    const transformedTransaction = {
      ...transaction,
      amount: Number(transaction.amount),
      serviceAmount: transaction.serviceAmount ? Number(transaction.serviceAmount) : undefined,
      productAmount: transaction.productAmount ? Number(transaction.productAmount) : undefined,
      originalServiceAmount: transaction.originalServiceAmount ? Number(transaction.originalServiceAmount) : undefined,
      discountPercentage: transaction.discountPercentage ? Number(transaction.discountPercentage) : undefined,
      discountAmount: transaction.discountAmount ? Number(transaction.discountAmount) : undefined,
      items: transaction.items ? JSON.parse(transaction.items) : undefined,
      // Add location name for frontend display
      location: transaction.locationId || undefined,
      locationName: transaction.location?.name || 'Unknown Location',
      // Add client name and phone for frontend display
      clientName: transaction.user?.clientProfile?.name || undefined,
      clientPhone: transaction.user?.clientProfile?.phone || undefined,
    };

    return NextResponse.json({ transaction: transformedTransaction });
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

