import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromHeaders } from "@/lib/auth-server";

/**
 * GET /api/time-off
 * 
 * Get all time-off requests with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromHeaders(request);
    
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    const timeOffRequests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ 
      timeOffRequests,
      total: timeOffRequests.length
    });
  } catch (error) {
    console.error("Error fetching time-off requests:", error);
    return NextResponse.json({ error: "Failed to fetch time-off requests" }, { status: 500 });
  }
}

/**
 * POST /api/time-off
 * 
 * Create a new time-off request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      staffId,
      startDate,
      endDate,
      reason,
      status = "pending",
      notes,
      updatedBy,
    } = body;

    // Validate required fields
    if (!staffId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: staffId, startDate, endDate, reason" },
        { status: 400 }
      );
    }

    // Create time-off request
    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        staffId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status,
        notes,
        updatedBy,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ timeOffRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating time-off request:", error);
    return NextResponse.json({ error: "Failed to create time-off request" }, { status: 500 });
  }
}

/**
 * PUT /api/time-off
 * 
 * Update a time-off request
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Time-off request ID is required" }, { status: 400 });
    }

    // Convert date strings to Date objects if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const timeOffRequest = await prisma.timeOffRequest.update({
      where: { id },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ timeOffRequest });
  } catch (error) {
    console.error("Error updating time-off request:", error);
    return NextResponse.json({ error: "Failed to update time-off request" }, { status: 500 });
  }
}

/**
 * DELETE /api/time-off
 * 
 * Delete a time-off request
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Time-off request ID is required" }, { status: 400 });
    }

    await prisma.timeOffRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time-off request:", error);
    return NextResponse.json({ error: "Failed to delete time-off request" }, { status: 500 });
  }
}

