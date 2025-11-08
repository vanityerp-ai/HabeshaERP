import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromHeaders } from "@/lib/auth-server";

/**
 * GET /api/orders
 * 
 * Get all orders with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromHeaders(request);
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
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

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON fields
    const ordersWithParsedData = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : [],
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      appliedPromo: order.appliedPromo ? JSON.parse(order.appliedPromo) : null,
      tracking: order.tracking ? JSON.parse(order.tracking) : null,
    }));

    return NextResponse.json({ 
      orders: ordersWithParsedData,
      total: ordersWithParsedData.length
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * 
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      clientId,
      clientName,
      items,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      shippingAddress,
      status = "pending",
      appliedPromo,
      tracking,
      notes,
      transactionId,
    } = body;

    // Validate required fields
    if (!clientId || !clientName || !items || !total || !paymentMethod || !shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        clientId,
        clientName,
        items: JSON.stringify(items),
        subtotal,
        tax,
        shipping,
        total,
        paymentMethod,
        shippingAddress: JSON.stringify(shippingAddress),
        status,
        appliedPromo: appliedPromo ? JSON.stringify(appliedPromo) : null,
        tracking: tracking ? JSON.stringify(tracking) : null,
        notes,
        transactionId,
      },
    });

    // Parse JSON fields for response
    const orderWithParsedData = {
      ...order,
      items: JSON.parse(order.items),
      shippingAddress: JSON.parse(order.shippingAddress),
      appliedPromo: order.appliedPromo ? JSON.parse(order.appliedPromo) : null,
      tracking: order.tracking ? JSON.parse(order.tracking) : null,
    };

    return NextResponse.json({ order: orderWithParsedData }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

/**
 * PUT /api/orders
 * 
 * Update an order
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Stringify JSON fields if provided
    if (updateData.items) {
      updateData.items = JSON.stringify(updateData.items);
    }
    if (updateData.shippingAddress) {
      updateData.shippingAddress = JSON.stringify(updateData.shippingAddress);
    }
    if (updateData.appliedPromo) {
      updateData.appliedPromo = JSON.stringify(updateData.appliedPromo);
    }
    if (updateData.tracking) {
      updateData.tracking = JSON.stringify(updateData.tracking);
    }

    // Set timestamp fields based on status
    if (updateData.status) {
      const now = new Date();
      switch (updateData.status) {
        case 'processing':
          updateData.processedAt = now;
          break;
        case 'shipped':
          updateData.shippedAt = now;
          break;
        case 'delivered':
          updateData.deliveredAt = now;
          break;
        case 'cancelled':
          updateData.cancelledAt = now;
          break;
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields for response
    const orderWithParsedData = {
      ...order,
      items: JSON.parse(order.items),
      shippingAddress: JSON.parse(order.shippingAddress),
      appliedPromo: order.appliedPromo ? JSON.parse(order.appliedPromo) : null,
      tracking: order.tracking ? JSON.parse(order.tracking) : null,
    };

    return NextResponse.json({ order: orderWithParsedData });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders
 * 
 * Delete an order
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

